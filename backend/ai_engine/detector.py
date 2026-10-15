"""
AI Damage Detector using Ultralytics YOLOv11 and OpenCV.
Supports:
1. Scratch Detection -> Minor Severity
2. Dent Detection -> Moderate Severity
3. Heavy Collision / Shattered Parts -> High / Severe
4. No Damage Detection -> Pristine Condition (PKR 0)
5. Gemini Vision Car Identification (Make / Model / Year from Image)
"""

import os
import cv2
import base64
import json
import re
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from ultralytics import YOLO

from .severity import classify_damage

CLASS_MAPPINGS = {
    "Front-windscreen-damage": "Windshield Glass (Shattered)",
    "Headlight-damage": "Headlight (Broken/Cracked)",
    "Rear-windscreen-Damage": "Rear Windscreen (Shattered)",
    "Runningboard-Damage": "Running Board / Side Skirt",
    "Sidemirror-Damage": "Side Mirror (Broken)",
    "Taillight-Damage": "Taillight (Broken/Cracked)",
    "bonnet-dent": "Bonnet (Hood Dent)",
    "boot-dent": "Trunk (Boot Lid Dent)",
    "doorouter-dent": "Door Panel (Dent/Crease)",
    "fender-dent": "Front Fender (Dent)",
    "front-bumper-dent": "Front Bumper (Dent/Crush)",
    "quaterpanel-dent": "Quarter Panel (Dent)",
    "rear-bumper-dent": "Rear Bumper (Dent/Crush)",
    "roof-dent": "Roof Panel (Dent)"
}

PAKISTANI_VEHICLES = [

    # =====================================================
    # TOYOTA
    # =====================================================

    {
        "make": "Toyota",
        "model": "Corolla",
        "generation": "10th Gen",
        "year_start": 2008,
        "year_end": 2014,
        "keywords": [
            "corolla", "xli", "gli", "altis"
        ]
    },

    {
        "make": "Toyota",
        "model": "Corolla",
        "generation": "11th Gen",
        "year_start": 2014,
        "year_end": 2023,
        "keywords": [
            "corolla", "xli", "gli", "altis",
            "grande", "corolla grande"
        ]
    },

    {
        "make": "Toyota",
        "model": "Yaris",
        "generation": "Pakistani Generation",
        "year_start": 2020,
        "year_end": 2025,
        "keywords": [
            "yaris", "ativ", "ativ x",
            "yaris ativ", "yaris ativ x"
        ]
    },

    {
        "make": "Toyota",
        "model": "Vitz",
        "generation": "2nd / 3rd Gen",
        "year_start": 2005,
        "year_end": 2020,
        "keywords": [
            "vitz", "vitz 1000", "vitz 1300",
            "vitz 1.0", "vitz 1.3"
        ]
    },

    {
        "make": "Toyota",
        "model": "Aqua",
        "generation": "1st / 2nd Gen",
        "year_start": 2012,
        "year_end": 2025,
        "keywords": [
            "aqua", "aqua hybrid",
            "toyota aqua"
        ]
    },

    {
        "make": "Toyota",
        "model": "Prius",
        "generation": "3rd / 4th Gen",
        "year_start": 2009,
        "year_end": 2025,
        "keywords": [
            "prius", "prius hybrid",
            "toyota prius"
        ]
    },

    {
        "make": "Toyota",
        "model": "Hilux",
        "generation": "Revo / Rocco",
        "year_start": 2016,
        "year_end": 2025,
        "keywords": [
            "hilux", "revo", "rocco",
            "hilux revo", "hilux rocco"
        ]
    },

    {
        "make": "Toyota",
        "model": "Fortuner",
        "generation": "2nd Gen",
        "year_start": 2016,
        "year_end": 2025,
        "keywords": [
            "fortuner", "fortuner legender",
            "toyota fortuner"
        ]
    },

    {
        "make": "Toyota",
        "model": "Land Cruiser",
        "generation": "LC200 / LC300",
        "year_start": 2008,
        "year_end": 2025,
        "keywords": [
            "land cruiser", "lc200", "lc300",
            "land cruiser v8"
        ]
    },

    # =====================================================
    # SUZUKI
    # =====================================================

    {
        "make": "Suzuki",
        "model": "Alto",
        "generation": "8th Gen Pakistani",
        "year_start": 2019,
        "year_end": 2025,
        "keywords": [
            "alto", "alto 660",
            "alto vx", "alto vxl",
            "alto vxl ags", "660cc"
        ]
    },

    {
        "make": "Suzuki",
        "model": "Mehran",
        "generation": "VX / VXR",
        "year_start": 1989,
        "year_end": 2019,
        "keywords": [
            "mehran", "mehran vx",
            "mehran vxr", "mehran euro ii"
        ]
    },

    {
        "make": "Suzuki",
        "model": "Cultus",
        "generation": "Old Cultus",
        "year_start": 2000,
        "year_end": 2017,
        "keywords": [
            "cultus", "old cultus",
            "cultus vxr", "cultus vxl"
        ]
    },

    {
        "make": "Suzuki",
        "model": "Cultus",
        "generation": "New Cultus",
        "year_start": 2017,
        "year_end": 2025,
        "keywords": [
            "cultus", "new cultus",
            "cultus vxl", "cultus vxr",
            "cultus ags"
        ]
    },

    {
        "make": "Suzuki",
        "model": "Wagon R",
        "generation": "Pakistani",
        "year_start": 2014,
        "year_end": 2025,
        "keywords": [
            "wagon r", "wagonr",
            "wagon r vxr", "wagon r vxl"
        ]
    },

    {
        "make": "Suzuki",
        "model": "Swift",
        "generation": "1st Pakistani Generation",
        "year_start": 2010,
        "year_end": 2021,
        "keywords": [
            "swift", "swift dlx",
            "swift 1.3"
        ]
    },

    {
        "make": "Suzuki",
        "model": "Swift",
        "generation": "New Generation",
        "year_start": 2022,
        "year_end": 2025,
        "keywords": [
            "swift", "new swift",
            "swift gl", "swift glx"
        ]
    },

    {
        "make": "Suzuki",
        "model": "Bolan",
        "generation": "Carry / Van",
        "year_start": 1991,
        "year_end": 2025,
        "keywords": [
            "bolan", "suzuki bolan",
            "carry", "suzuki carry"
        ]
    },

    {
        "make": "Suzuki",
        "model": "Ravi",
        "generation": "Pickup",
        "year_start": 1982,
        "year_end": 2025,
        "keywords": [
            "ravi", "suzuki ravi",
            "ravi pickup"
        ]
    },

    # =====================================================
    # HONDA
    # =====================================================

    {
        "make": "Honda",
        "model": "Civic",
        "generation": "7th Gen",
        "year_start": 2001,
        "year_end": 2006,
        "keywords": [
            "civic", "civic exi",
            "civic vti"
        ]
    },

    {
        "make": "Honda",
        "model": "Civic",
        "generation": "8th Gen Reborn",
        "year_start": 2006,
        "year_end": 2012,
        "keywords": [
            "civic reborn", "reborn",
            "civic vti oriel"
        ]
    },

    {
        "make": "Honda",
        "model": "Civic",
        "generation": "9th Gen Rebirth",
        "year_start": 2012,
        "year_end": 2016,
        "keywords": [
            "civic rebirth", "rebirth"
        ]
    },

    {
        "make": "Honda",
        "model": "Civic",
        "generation": "10th Gen",
        "year_start": 2016,
        "year_end": 2021,
        "keywords": [
            "civic x", "civic turbo",
            "civic oriel", "civic 10th gen"
        ]
    },

    {
        "make": "Honda",
        "model": "Civic",
        "generation": "11th Gen",
        "year_start": 2022,
        "year_end": 2025,
        "keywords": [
            "civic xi", "civic 11th gen",
            "civic rs", "civic 2022"
        ]
    },

    {
        "make": "Honda",
        "model": "City",
        "generation": "4th / 5th Gen",
        "year_start": 2003,
        "year_end": 2020,
        "keywords": [
            "city", "city idsi",
            "city ivtec", "city aspire"
        ]
    },

    {
        "make": "Honda",
        "model": "City",
        "generation": "6th Gen",
        "year_start": 2021,
        "year_end": 2025,
        "keywords": [
            "city", "new city",
            "city aspire", "city 1.2",
            "city 1.5"
        ]
    },

    {
        "make": "Honda",
        "model": "BR-V",
        "generation": "1st Gen",
        "year_start": 2017,
        "year_end": 2025,
        "keywords": [
            "brv", "br-v",
            "honda brv", "honda br-v"
        ]
    },

    {
        "make": "Honda",
        "model": "Vezel",
        "generation": "1st / 2nd Gen",
        "year_start": 2014,
        "year_end": 2025,
        "keywords": [
            "vezel", "honda vezel",
            "vezel hybrid"
        ]
    },

    # =====================================================
    # KIA
    # =====================================================

    {
        "make": "Kia",
        "model": "Sportage",
        "generation": "4th Gen",
        "year_start": 2019,
        "year_end": 2021,
        "keywords": [
            "sportage", "kia sportage",
            "sportage fwd", "sportage awd"
        ]
    },

    {
        "make": "Kia",
        "model": "Sportage",
        "generation": "5th Gen",
        "year_start": 2022,
        "year_end": 2025,
        "keywords": [
            "sportage", "new sportage",
            "sportage 2022", "sportage 2023",
            "sportage 2024", "sportage 2025"
        ]
    },

    {
        "make": "Kia",
        "model": "Picanto",
        "generation": "3rd Gen",
        "year_start": 2019,
        "year_end": 2025,
        "keywords": [
            "picanto", "kia picanto",
            "picanto automatic", "picanto manual"
        ]
    },

    {
        "make": "Kia",
        "model": "Stonic",
        "generation": "1st Gen",
        "year_start": 2021,
        "year_end": 2025,
        "keywords": [
            "stonic", "kia stonic"
        ]
    },

    {
        "make": "Kia",
        "model": "Sorento",
        "generation": "3rd / 4th Gen",
        "year_start": 2020,
        "year_end": 2025,
        "keywords": [
            "sorento", "kia sorento"
        ]
    },

    {
        "make": "Kia",
        "model": "Carnival",
        "generation": "4th Gen",
        "year_start": 2021,
        "year_end": 2025,
        "keywords": [
            "carnival", "kia carnival",
            "grand carnival"
        ]
    }
]

class VehicleDamageDetector:
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_path = os.path.join(base_dir, "models", "yolov11n-car-damage.pt")
            if not os.path.exists(model_path):
                alt_path = os.path.join(base_dir, "models", "car-damage.pt")
                if os.path.exists(alt_path):
                    model_path = alt_path

        self.model_path = model_path
        self.model = None
        self.validator_model = None
        self._load_model()

    def _load_model(self):
        try:
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
                print(f"[AI Detector] Successfully loaded YOLO damage model: {self.model_path}")
            else:
                print(f"[AI Detector] Warning: Damage model weights not found at {self.model_path}")
        except Exception as e:
            print(f"[AI Detector] Error loading YOLO damage model: {e}")

        # Load standard COCO validator model for vehicle vs human/non-car validation
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            coco_path = os.path.join(base_dir, "yolo11n.pt")
            if os.path.exists(coco_path):
                self.validator_model = YOLO(coco_path)
                print(f"[AI Detector] Successfully loaded vehicle validator model: {coco_path}")
            elif os.path.exists("yolo11n.pt"):
                self.validator_model = YOLO("yolo11n.pt")
                print("[AI Detector] Successfully loaded vehicle validator model from root")
        except Exception as e:
            print(f"[AI Detector] Validator model load notice: {e}")

    def _call_gemini_api(self, prompt: str, img_b64: str, max_tokens: int = 250) -> Optional[str]:
        """Resilient Gemini Vision API caller supporting latest 2026 model versions."""
        gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not gemini_key:
            return None

        import urllib.request
        import urllib.error

        candidate_models = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"]
        payload = json.dumps({
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}}
                ]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": max_tokens
            }
        }).encode("utf-8")

        for model_name in candidate_models:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
                req = urllib.request.Request(
                    url,
                    data=payload,
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    raw = resp.read().decode("utf-8")
                resp_json = json.loads(raw)
                candidates = resp_json.get("candidates", [])
                if candidates:
                    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                    if text:
                        return text
            except Exception as e:
                continue
        return None

    def _identify_vehicle_via_gemini(self, image_np: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        Use Google Gemini Vision API to identify car make, model and year,
        and determine if the car is visibly damaged or in clean/pristine condition.
        """
        try:
            _, buf = cv2.imencode(".jpg", image_np, [cv2.IMWRITE_JPEG_QUALITY, 85])
            img_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

            prompt = (
                "You are an expert Pakistani automotive specialist and vehicle damage inspector. "
                "Look at this vehicle image carefully and evaluate both vehicle identity and condition. "
                "Reply ONLY with a valid JSON object (no markdown, no extra text) in this exact format:\n"
                '{"make": "Toyota", "model": "Corolla", "year": "2019", "generation": "Altis 1.6 GLi", "confidence": 88, "has_visible_damage": false}\n'
                "Rules:\n"
                "- make: brand name (Toyota, Honda, Suzuki, Hyundai, KIA, Changan, etc.)\n"
                "- model: model name (Corolla, Civic, Alto, Cultus, Mehran, Yaris, Sportage, etc.)\n"
                "- year: best guess year or range like '2018-2020'\n"
                "- generation: variant/trim common in Pakistan\n"
                "- confidence: integer 0-100\n"
                "- has_visible_damage: boolean (true or false). Set to false if the car body is clean, undamaged, in pristine condition, or if visible streaks are merely light reflections/sun glare. Set to true ONLY if there is clear, genuine physical collision damage, dent, crushed bumper, broken glass, or deep scrape."
            )

            text = self._call_gemini_api(prompt, img_b64, max_tokens=250)
            if not text:
                return None

            text = re.sub(r"```(?:json)?", "", text).strip().strip("`").strip()
            car_data = json.loads(text)

            if "make" not in car_data:
                return None

            return {
                "make": str(car_data.get("make", "Toyota")).strip(),
                "model": str(car_data.get("model", "Corolla")).strip(),
                "year": str(car_data.get("year", "")).strip(),
                "generation": str(car_data.get("generation", "")).strip(),
                "confidence": float(car_data.get("confidence", 85)),
                "has_visible_damage": bool(car_data.get("has_visible_damage", True)),
                "identified_by": "gemini_vision"
            }

        except Exception as e:
            print(f"[AI Detector] Gemini Vision car ID notice: {e}")
            return None

    def _validate_is_vehicle(self, image_np: np.ndarray) -> dict:
        """
        Validates if the image contains a vehicle (car, motorcycle, bus, truck).
        Uses both local YOLO (COCO) and Gemini Vision (if configured).
        Rejects human/animal/food/random non-vehicle uploads cleanly.
        """
        # Step 1: Local offline YOLO COCO check
        if self.validator_model is not None:
            try:
                coco_res = self.validator_model.predict(image_np, conf=0.30, verbose=False)
                has_vehicle = False
                has_person = False
                other_objects = []

                VEHICLE_CLASSES = {"car", "motorcycle", "bus", "truck"}
                for r in coco_res:
                    for box in r.boxes:
                        cls_name = r.names.get(int(box.cls[0].item()), "")
                        conf = float(box.conf[0].item())
                        if cls_name in VEHICLE_CLASSES:
                            has_vehicle = True
                        elif cls_name == "person" and conf > 0.40:
                            has_person = True
                        elif conf > 0.50:
                            other_objects.append(cls_name)

                # Strict rejection if person/human is detected without any vehicle
                if has_person and not has_vehicle:
                    return {
                        "is_vehicle": False,
                        "type": "person",
                        "reason": "Human / person image detected. Please upload an image of a vehicle (car, truck, bike)."
                    }

                # Strict rejection if non-vehicle objects (cat, dog, laptop, food) detected without vehicle
                if not has_vehicle and other_objects:
                    return {
                        "is_vehicle": False,
                        "type": other_objects[0],
                        "reason": f"Non-vehicle object ({other_objects[0]}) detected. Please upload a clear photo of a vehicle."
                    }
                if has_vehicle:
                    return {"is_vehicle": True, "type": "vehicle", "reason": "Local vehicle check passed"}
            except Exception as e:
                print(f"[AI Detector] Local validator notice: {e}")

        # Step 2: Gemini Vision validation if API key available
        gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if gemini_key:
            try:
                _, buf = cv2.imencode(".jpg", image_np, [cv2.IMWRITE_JPEG_QUALITY, 85])
                img_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

                prompt = (
                    "Look at this image very carefully. "
                    "Answer ONLY with a JSON object in this exact format (no extra text, no markdown):\n"
                    '{"is_vehicle": true, "type": "car", "reason": "Vehicle visible clearly"}\n'
                    "Rules:\n"
                    "- is_vehicle: true if image shows a car, truck, motorcycle, rickshaw, van, SUV, bus. false for everything else.\n"
                    "- type: 'car', 'motorcycle', 'truck', 'bus', 'van', 'rickshaw', 'person', 'animal', 'food', or 'not_vehicle'\n"
                    "- reason: very short description of what you see\n"
                    "Important: humans, animals, buildings, food, nature, indoor rooms without cars = is_vehicle: false"
                )

                text = self._call_gemini_api(prompt, img_b64, max_tokens=120)
                if text:
                    text = re.sub(r"```(?:json)?", "", text).strip().strip("`").strip()
                    data = json.loads(text)
                    return {
                        "is_vehicle": bool(data.get("is_vehicle", True)),
                        "type": data.get("type", "unclear"),
                        "reason": data.get("reason", "")
                    }
            except Exception as e:
                print(f"[AI Detector] Gemini vehicle validation notice: {e}")

        return {"is_vehicle": True, "type": "vehicle", "reason": "Vehicle check passed"}

    def identify_vehicle(self, filename: str = "", image_np: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """
        Identify vehicle from image using:
        1. Gemini Vision API (if key available) — reads actual image pixels
        2. Filename keyword fallback — if Gemini not configured / fails
        """
        # --- Try Gemini Vision first ---
        if image_np is not None:
            gemini_result = self._identify_vehicle_via_gemini(image_np)
            if gemini_result:
                print(f"[AI Detector] Gemini identified car: {gemini_result['make']} {gemini_result['model']} {gemini_result.get('year', '')}")
                return gemini_result

        # --- Fallback: filename keyword matching ---
        name_lower = filename.lower()
        for v in PAKISTANI_VEHICLES:
            for kw in v["keywords"]:
                if kw in name_lower:
                    return {
                        "make": v["make"],
                        "model": v["model"],
                        "year": "",
                        "generation": v["generation"],
                        "confidence": 92.5,
                        "has_visible_damage": True,
                        "identified_by": "filename_keyword"
                    }
        return {
            "make": "Unknown",
            "model": "Vehicle",
            "year": "",
            "generation": "Please enter car model manually",
            "confidence": 0.0,
            "has_visible_damage": True,
            "identified_by": "fallback"
        }

    def assess_internal_damages(self, detections: List[Dict[str, Any]], overall_severity: str) -> List[Dict[str, Any]]:
        """
        Assesses high-probability internal damages based on external collision impact points.
        Essential Pakistani collision items: Radiator, Condenser, Airbags, Subframe, Suspension.
        """
        internals = []
        parts_detected = [d["part"].lower() for d in detections]
        is_heavy = overall_severity in ("High", "Moderate")

        # 1. Front collision -> Radiator & AC Condenser
        has_front_impact = any("bumper" in p or "bonnet" in p or "hood" in p or "headlight" in p for p in parts_detected)
        if has_front_impact and is_heavy:
            internals.append({
                "id": "int_01",
                "part": "Radiator & AC Condenser Assembly",
                "system": "Cooling & Air Conditioning",
                "damage_nature": "Coolant Core Puncture / Fins Crushed / AC Condenser Leak",
                "severity": "Moderate" if overall_severity == "Moderate" else "High",
                "replacement_likely": True,
                "urgency": "Immediate (Do Not Drive - Engine Overheating Risk)",
                "est_labor_hours": 3.0,
                "description": "Frontal impact drives the bumper beam into the cooling stack, causing radiator puncture and AC condenser gas loss."
            })

        # 2. Heavy frontal / apron impact -> Front Subframe / Chassis Crossmember
        if any("bumper" in p or "fender" in p or "bonnet" in p for p in parts_detected) and overall_severity == "High":
            internals.append({
                "id": "int_02",
                "part": "Front Subframe / Chassis Crossmember",
                "system": "Structural Chassis & Frame",
                "damage_nature": "Chassis Rail Misalignment / Apron Buckling",
                "severity": "High",
                "replacement_likely": False,
                "urgency": "Requires Computerized Laser Alignment Jig",
                "est_labor_hours": 6.0,
                "description": "High-velocity collision bends front chassis horns and subframe. Requires hydraulic pulling and laser chassis alignment."
            })

        # 3. Severe collision -> Airbag Deployment
        if overall_severity == "High":
            internals.append({
                "id": "int_03",
                "part": "Airbag Module (Driver & Passenger) & SRS Sensors",
                "system": "Safety & SRS Electrical",
                "damage_nature": "Steering Wheel & Passenger Dash Airbag Deployed",
                "severity": "High",
                "replacement_likely": True,
                "urgency": "Mandatory Safety Replacement",
                "est_labor_hours": 4.5,
                "description": "Collision deceleration sensors triggered front SRS airbag inflators. Requires bag replacement, clock spring, and sensor reset."
            })

        # 4. Wheel arch or side impact -> Suspension Control Arm & Tie Rod
        if any("fender" in p or "running board" in p or "wheel" in p for p in parts_detected) and (is_heavy or overall_severity == "Minor"):
            internals.append({
                "id": "int_04",
                "part": "Suspension Control Arm & Tie Rod",
                "system": "Steering & Suspension Assembly",
                "damage_nature": "Bent Lower Control Arm / Tie Rod Misalignment / Bush Damage",
                "severity": "Moderate",
                "replacement_likely": True,
                "urgency": "Alignment Critical (Tire Wear & Pulling Hazard)",
                "est_labor_hours": 2.5,
                "description": "Impact near the wheel arch transmits kinetic force directly into lower control arms, tie rods, and hub bearings."
            })

        return internals

    def detect(
        self,
        image_bytes: bytes,
        filename: str = "",
        confidence_threshold: float = 0.25
    ) -> Dict[str, Any]:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Invalid image file or format")

        h, w, _ = img_bgr.shape

        # ---------------------------------------------------------------
        # STEP 0: VALIDATE THIS IS A VEHICLE IMAGE
        # If user uploads a human/animal/food photo -> reject cleanly
        # ---------------------------------------------------------------
        validation = self._validate_is_vehicle(img_bgr)
        if not validation.get("is_vehicle", True):
            reason_msg = validation.get("reason", "non-vehicle image")
            raise ValueError(
                f"❌ Image Rejected: Insaan ya ghair-mutaliqa image detect hui hai ({reason_msg}). "
                f"Barahe karam sirf gari (car, truck, bike) ki tasweer upload karein."
            )

        img_area = float(w * h)

        # ---------------------------------------------------------------
        # STEP 1: VEHICLE IDENTITY & CONDITION VIA GEMINI VISION
        # ---------------------------------------------------------------
        vehicle_info = self.identify_vehicle(filename, img_bgr)
        gemini_says_clean = bool(vehicle_info.get("has_visible_damage") is False)
        if gemini_says_clean:
            print("[AI Detector] Gemini Vision indicates vehicle is in PRISTINE / UNDAMAGED condition.")

        # ---------------------------------------------------------------
        # REAL DAMAGE CONFIDENCE GATE & GLARE FILTER
        # Only detections with confidence >= 0.38 are treated as real damage.
        # Below 0.38 = lighting glare, reflections, or model noise.
        # ---------------------------------------------------------------
        REAL_DAMAGE_MIN_CONFIDENCE = max(confidence_threshold, 0.38)

        detections = []
        annotated_bgr = img_bgr.copy()
        overlay = img_bgr.copy()

        if self.model is not None:
            results = self.model.predict(img_bgr, conf=0.15, verbose=False)
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    raw_name = r.names.get(cls_id, f"damage_part_{cls_id}")
                    clean_name = CLASS_MAPPINGS.get(raw_name, raw_name.replace("-", " ").title())
                    conf = float(box.conf[0].item())

                    # If Gemini explicitly verified vehicle is clean and pristine, suppress all false reflection boxes
                    if gemini_says_clean and conf < 0.72:
                        print(f"[AI Detector] Suppressed false reflection on clean vehicle: {clean_name} ({conf:.2f})")
                        continue

                    # Dents often falsely trigger on body curves & reflection lines: require higher threshold
                    min_conf_for_part = max(REAL_DAMAGE_MIN_CONFIDENCE, 0.42) if "dent" in raw_name.lower() else REAL_DAMAGE_MIN_CONFIDENCE
                    if conf < min_conf_for_part:
                        continue

                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    x1, y1, x2, y2 = int(max(0, x1)), int(max(0, y1)), int(min(w, x2)), int(min(h, y2))

                    box_w = max(1, x2 - x1)
                    box_h = max(1, y2 - y1)
                    box_area = float(box_w * box_h)
                    area_ratio = box_area / img_area if img_area > 0 else 0.05
                    aspect_ratio = float(box_w) / float(box_h)

                    box_crop = img_bgr[y1:y2, x1:x2]

                    # Specular glare / sunlight overexposure check
                    if box_crop is not None and box_crop.size > 0:
                        gray_crop = cv2.cvtColor(box_crop, cv2.COLOR_BGR2GRAY)
                        if np.mean(gray_crop > 238) > 0.40 and np.std(gray_crop) < 36:
                            print(f"[AI Detector] Skipped specular reflection on {clean_name} (glare conf {conf:.2f})")
                            continue

                    severity = classify_damage(
                        part_name=clean_name,
                        damage_area_ratio=area_ratio,
                        confidence=conf,
                        raw_class=raw_name,
                        aspect_ratio=aspect_ratio,
                        box_crop=box_crop,
                        filename=filename
                    )

                    norm_coords = [
                        round(y1 / h, 4),
                        round(x1 / w, 4),
                        round(y2 / h, 4),
                        round(x2 / w, 4)
                    ]

                    detections.append({
                        "id": f"det_{len(detections)+1}",
                        "part": clean_name,
                        "raw_class": raw_name,
                        "confidence": round(conf * 100, 1),
                        "damage_type": severity["damage_type"],
                        "box_pixels": [x1, y1, x2, y2],
                        "box_normalized": norm_coords,
                        "severity": severity["level"],
                        "severity_info": severity
                    })

                    color_hex = severity["color"].lstrip("#")
                    color_bgr = tuple(int(color_hex[i:i+2], 16) for i in (4, 2, 0))

                    cv2.rectangle(overlay, (x1, y1), (x2, y2), color_bgr, -1)
                    cv2.rectangle(annotated_bgr, (x1, y1), (x2, y2), color_bgr, 3)

                    label = f"{clean_name}: {severity['damage_type']} ({conf*100:.0f}%)"
                    font = cv2.FONT_HERSHEY_SIMPLEX
                    font_scale = max(0.45, min(0.75, w / 1100.0))
                    thickness = 2
                    (text_w, text_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)

                    badge_y1 = max(0, y1 - text_h - 10)
                    badge_y2 = y1
                    badge_x1 = x1
                    badge_x2 = min(w, x1 + text_w + 10)
                    cv2.rectangle(annotated_bgr, (badge_x1, badge_y1), (badge_x2, badge_y2), color_bgr, -1)
                    cv2.putText(
                        annotated_bgr,
                        label,
                        (badge_x1 + 5, badge_y2 - 5),
                        font,
                        font_scale,
                        (255, 255, 255),
                        thickness,
                        cv2.LINE_AA
                    )

        if detections:
            cv2.addWeighted(overlay, 0.20, annotated_bgr, 0.80, 0, annotated_bgr)
        else:
            banner_text = "PASSED: NO DAMAGE DETECTED - PRISTINE CONDITION"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = max(0.6, min(1.0, w / 900.0))
            (tw, th), _ = cv2.getTextSize(banner_text, font, font_scale, 2)
            cv2.rectangle(annotated_bgr, (0, 0), (w, th + 25), (16, 185, 129), -1)
            cv2.putText(annotated_bgr, banner_text, (20, th + 15), font, font_scale, (255, 255, 255), 2, cv2.LINE_AA)

        _, buffer = cv2.imencode(".jpg", annotated_bgr, [cv2.IMWRITE_JPEG_QUALITY, 90])
        annotated_base64 = base64.b64encode(buffer).decode("utf-8")

        severity_counts = {"Minor": 0, "Moderate": 0, "High": 0}
        for d in detections:
            severity_counts[d["severity"]] += 1

        if not detections:
            overall_severity = "None"
            status_message = "✅ No Damage Detected — Vehicle body and panels appear in pristine condition."
            has_damage = False
        else:
            has_damage = True
            if severity_counts["High"] > 0:
                overall_severity = "High"
                status_message = "⚠️ Severe Collision / Structural Damage Detected."
            elif severity_counts["Moderate"] > 0:
                overall_severity = "Moderate"
                status_message = "⚠️ Moderate Dents / Creases Detected."
            else:
                overall_severity = "Minor"
                status_message = "ℹ️ Minor Surface Scratches / Scuffs Detected."

        # Compute internal / mechanical damages assessment
        internal_damages = self.assess_internal_damages(detections, overall_severity) if has_damage else []

        return {
            "has_damage": has_damage,
            "damage_status": "No Damage" if not has_damage else "Damaged",
            "status_message": status_message,
            "vehicle": vehicle_info,
            "overall_severity": overall_severity,
            "total_damages": len(detections),
            "severity_summary": severity_counts,
            "detections": detections,
            "internal_damages": internal_damages,
            "image_dimensions": {"width": w, "height": h},
            "annotated_image_base64": f"data:image/jpeg;base64,{annotated_base64}"
        }
