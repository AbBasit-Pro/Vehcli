"""
FastAPI Server for AI-Based Vehicle Damage Detection and Cost Estimation System.
Integrated with:
- YOLOv11 Damage Detection with Scratch (Minor), Dent (Moderate), Severe Collision (High)
- Zero-Damage / Pristine Vehicle Check (PKR 0)
- Google Gemini API via secret .env key
- Real OLX & PakWheels Scraper with Authentic Status Messages
- ReportLab PDF Survey Report Generator
"""

import os
from dotenv import load_dotenv
load_dotenv()

from typing import Optional, List, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, Query, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.ai_engine.detector import VehicleDamageDetector
from backend.estimator.multi_llm import MultiLLMEstimator
from backend.scraper.market_service import MarketDataService
from backend.workshops.locator import get_workshops_by_city, get_all_cities
from backend.report_generator.pdf_builder import build_pdf_report
from backend.evaluation.unseen_evaluator import UnseenDataEvaluator, UNSEEN_TEST_DATASET
from backend.auth.routes import router as auth_router
from backend.database.mongodb import get_connection_status

app = FastAPI(
    title="AutoDamage AI Pakistan",
    description="Vehicle Damage Detection & Cost Estimation using YOLOv11 & Google Gemini (.env)",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

# Singletons
detector = VehicleDamageDetector()
estimator = MultiLLMEstimator()
market_service = MarketDataService()
evaluator = UnseenDataEvaluator(detector)

class EstimationRequest(BaseModel):
    vehicle: Dict[str, Any]
    detections: List[Dict[str, Any]]
    internal_damages: Optional[List[Dict[str, Any]]] = []
    city: Optional[str] = "Rawalpindi"
    gemini_api_key: Optional[str] = None

class PDFReportRequest(BaseModel):
    survey_id: Optional[str] = None
    vehicle: Dict[str, Any]
    detections: List[Dict[str, Any]]
    internal_damages: Optional[List[Dict[str, Any]]] = []
    overall_severity: Optional[str] = "Moderate"
    total_damages: Optional[int] = 0
    city: Optional[str] = "Rawalpindi"
    consensus_estimate: Dict[str, Any]
    workshops: Optional[List[Dict[str, Any]]] = []
    annotated_image_base64: Optional[str] = None

@app.get("/")
def health_check():
    db_status = get_connection_status()
    return {
        "status": "online",
        "system": "AutoDamage AI Pakistan",
        "version": "2.1.0",
        "model": "Ultralytics YOLOv11-Nano (Point Fine-Tuned)",
        "gemini_configured_in_env": bool(os.environ.get("GEMINI_API_KEY", "").strip()),
        "supported_cities": get_all_cities(),
        "database": db_status
    }

@app.get("/api/db-status")
def database_status():
    """Check MongoDB Atlas connection status."""
    return get_connection_status()

@app.post("/api/detect")
async def detect_damage(
    file: Optional[UploadFile] = File(None),
    sample_path: Optional[str] = Form(None),
    confidence: float = Form(0.35),
    car_model: Optional[str] = Form(None)
):
    image_bytes = None
    filename = ""

    if file is not None:
        filename = file.filename or "uploaded_car.jpg"
        image_bytes = await file.read()
    elif sample_path:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        full_path = os.path.join(base_dir, sample_path)
        if os.path.exists(full_path):
            filename = os.path.basename(full_path)
            with open(full_path, "rb") as f:
                image_bytes = f.read()
        else:
            raise HTTPException(status_code=404, detail=f"Sample image not found: {sample_path}")
    else:
        raise HTTPException(status_code=400, detail="Must provide an image file or sample_path")

    try:
        results = detector.detect(image_bytes, filename=filename, confidence_threshold=confidence)
        if car_model and car_model.strip():
            parts = car_model.strip().split()
            results["vehicle"]["make"] = parts[0]
            results["vehicle"]["model"] = " ".join(parts[1:]) if len(parts) > 1 else parts[0]
            results["vehicle"]["identified_by"] = "user_input"

        return results
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.post("/api/estimate")
def estimate_cost(req: EstimationRequest):
    if req.gemini_api_key:
        estimator.update_api_key(req.gemini_api_key)

    try:
        estimation = estimator.estimate_repair_cost(
            vehicle=req.vehicle,
            detections=req.detections,
            user_city=req.city or "Rawalpindi"
        )
        return estimation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cost estimation error: {str(e)}")

@app.get("/api/market-data")
def get_market_data(
    vehicle: str = Query("Toyota Corolla"),
    part: str = Query("Front Bumper")
):
    pricing = market_service.get_market_pricing(vehicle, part)
    scrape_result = market_service.scrape_live_marketplace(vehicle, part)
    return {
        "pricing": pricing,
        "live_scraper": scrape_result
    }

@app.get("/api/workshops")
def get_workshops(city: str = Query("Rawalpindi")):
    return {
        "city": city,
        "available_cities": get_all_cities(),
        "workshops": get_workshops_by_city(city)
    }

@app.post("/api/report/pdf")
def generate_pdf_report(req: PDFReportRequest):
    try:
        pdf_bytes = build_pdf_report(req.dict())
        filename = f"Damage_Report_{req.survey_id or 'Survey'}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@app.get("/api/evaluate/unseen")
def evaluate_unseen_data(confidence: float = Query(0.15)):
    try:
        benchmark = evaluator.run_unseen_benchmark(confidence_threshold=confidence)
        return benchmark
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unseen evaluation failed: {str(e)}")

@app.get("/api/sample-images")
def list_sample_images():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    samples = []
    for item in UNSEEN_TEST_DATASET:
        full_p = os.path.join(base_dir, item["image_rel_path"])
        if os.path.exists(full_p):
            samples.append({
                "id": item["id"],
                "name": item["name"],
                "vehicle": item["vehicle"],
                "category": item["expected_severity"],
                "rel_path": item["image_rel_path"],
                "is_unseen": True
            })
    return {"samples": samples}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
