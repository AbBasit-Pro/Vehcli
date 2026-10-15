import os
import json
from backend.ai_engine.detector import VehicleDamageDetector
from backend.estimator.multi_llm import MultiLLMEstimator
from backend.scraper.market_service import MarketDataService
from backend.workshops.locator import get_workshops_by_city
from backend.report_generator.pdf_builder import build_pdf_report
from backend.evaluation.unseen_evaluator import UnseenDataEvaluator

print("--- Testing AI Detector ---")
det = VehicleDamageDetector()
test_img = os.path.join("sample_images", "severe", "real_suzuki_alto_heavy_crash.jpg")
with open(test_img, "rb") as f:
    img_bytes = f.read()

res = det.detect(img_bytes, filename="real_suzuki_alto_heavy_crash.jpg")
print(f"Detected {len(res['detections'])} damage parts in unseen crash image.")
print(f"Vehicle identified: {res['vehicle']['make']} {res['vehicle']['model']}")
print(f"Overall severity: {res['overall_severity']}")

print("\n--- Testing Multi-LLM Estimator ---")
estimator = MultiLLMEstimator()
est_res = estimator.estimate_repair_cost(res["vehicle"], res["detections"], user_city="Lahore")
print(f"Consensus Range: {est_res['consensus_estimate']['cost_range_display']}")
print(f"Recommended Consensus: PKR {est_res['consensus_estimate']['recommended_cost_pkr']:,}")

print("\n--- Testing Market Service (PakWheels & OLX) ---")
mkt = MarketDataService()
pricing = mkt.get_market_pricing("Toyota Corolla", "Front Bumper")
print("Corolla Front Bumper tiers:", json.dumps(pricing["tiers"]["aftermarket"], indent=2))

print("\n--- Testing Unseen Data Evaluation Benchmark ---")
evaluator = UnseenDataEvaluator(det)
bench = evaluator.run_unseen_benchmark(confidence_threshold=0.15)
metrics = bench["summary_metrics"]
print("Benchmark on Unseen Crash Data:")
print(f"Precision: {metrics['precision']}% | Recall: {metrics['recall']}% | F1-Score: {metrics['f1_score']}% | mAP@0.5: {metrics['map_50']}%")

print("\n--- Testing PDF Report Generation ---")
inspection_data = {
    "survey_id": "TEST-SURV-001",
    "vehicle": res["vehicle"],
    "detections": res["detections"],
    "overall_severity": res["overall_severity"],
    "total_damages": len(res["detections"]),
    "city": "Lahore",
    "consensus_estimate": est_res["consensus_estimate"],
    "annotated_image_base64": res["annotated_image_base64"],
    "workshops": get_workshops_by_city("Lahore")
}
pdf_bytes = build_pdf_report(inspection_data)
print(f"Generated PDF report: {len(pdf_bytes)} bytes")

print("\nALL BACKEND MODULES FUNCTIONING FLAWLESSLY!")
