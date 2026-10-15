"""
Multi-LLM Repair Cost Estimation and Consensus Engine.
Loads GEMINI_API_KEY securely from .env file using python-dotenv.
Calls Google Gemini API (gemini-2.5-flash) to calculate real-world repair and spare parts prices in PKR.
"""

import os
import json
import re
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Load secret environment variables from .env
load_dotenv()

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

from backend.scraper.market_service import MarketDataService

# Pakistani Workshop Baseline Labor Rates (PKR per panel)
LABOR_RATES_PKR = {
    "Minor": {
        "denting": (1500, 3000),      # PDR / light pull / scratch touchup
        "painting": (2500, 4500),     # Spot paint / lacquer blend
        "fitting": (800, 1500)
    },
    "Moderate": {
        "denting": (4500, 7500),      # Panel beating / hammer-dolly / heat
        "painting": (5500, 8500),     # Full panel oven painting
        "fitting": (1500, 2500)
    },
    "High": {
        "denting": (8000, 14000),     # Heavy frame pulling / structural jig
        "painting": (8000, 12000),    # Full component prime & multi-coat
        "fitting": (3000, 5000)       # Complete disassembly & alignment
    }
}

class MultiLLMEstimator:
    def __init__(self, api_key: Optional[str] = None):
        # 1. First priority: api_key passed or from .env
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "").strip()
        self.market_service = MarketDataService()
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.api_key and HAS_GENAI:
            try:
                self.client = genai.Client(api_key=self.api_key)
                print("[Multi-LLM] Successfully initialized Google Gemini Client from .env key.")
            except Exception as e:
                print(f"[Multi-LLM] Failed to initialize Gemini Client: {e}")

    def update_api_key(self, api_key: str):
        self.api_key = api_key.strip()
        self._init_client()

    def estimate_repair_cost(
        self,
        vehicle: Dict[str, Any],
        detections: List[Dict[str, Any]],
        user_city: str = "Lahore"
    ) -> Dict[str, Any]:
        """
        Executes multi-persona estimation and consensus synthesis.
        Handles zero-damage case, live Gemini API, and calibrated fallback.
        """
        vehicle_str = f"{vehicle.get('make', 'Toyota')} {vehicle.get('model', 'Corolla')} ({vehicle.get('generation', '')})"

        # CASE 1: NO DAMAGE DETECTED
        if not detections:
            return {
                "vehicle": vehicle_str,
                "city": user_city,
                "total_damaged_parts": 0,
                "damage_status": "No Damage",
                "message": "✅ No Damage Detected — Vehicle body and panels appear in pristine condition.",
                "consensus_estimate": {
                  "cost_range_display": "PKR 0",
                  "min_cost_pkr": 0,
                  "max_cost_pkr": 0,
                  "recommended_cost_pkr": 0,
                  "message": "Vehicle is in pristine condition. No repairs or spare parts required.",
                  "labor_denting_total": 0,
                  "labor_painting_total": 0,
                  "labor_fitting_total": 0,
                  "parts_recommended_total": 0,
                  "confidence_score": 100.0
                },
                "itemized_breakdown": [],
                "personas": {
                  "ustad_rafiq": {"persona": "Ustad Rafiq", "estimated_cost_pkr": 0, "recommendation": "Gari bilkul saaf hai, koi denting painting ki zaroorat nahi."},
                  "engr_salman": {"persona": "Engr. Salman", "estimated_cost_pkr": 0, "recommendation": "Vehicle inspected. Zero damage noted. No claim applicable."},
                  "pakwheels_inspector": {"persona": "PakWheels Inspector", "estimated_cost_pkr": 0, "recommendation": "Pristine exterior condition. High resale rating (10/10)."}
                },
                "is_live_gemini": False
            }

        # CASE 2: DAMAGE DETECTED - Compute baseline
        baseline = self._compute_baseline(vehicle_str, detections)

        # Attempt Google Gemini LLM API Call
        llm_estimates = None
        is_live = False
        if self.client is not None:
            try:
                llm_estimates = self._query_gemini_pricing(vehicle_str, detections, user_city, baseline)
                is_live = True
            except Exception as e:
                print(f"[Multi-LLM] Gemini API query error: {e}")

        # If Gemini not available, use calibrated offline engine
        if not llm_estimates:
            llm_estimates = self._generate_simulated_personas(baseline, vehicle_str, user_city)

        consensus = self._synthesize_consensus(baseline, llm_estimates)

        return {
            "vehicle": vehicle_str,
            "city": user_city,
            "total_damaged_parts": len(detections),
            "damage_status": "Damaged",
            "consensus_estimate": consensus,
            "itemized_breakdown": baseline["itemized_parts"],
            "personas": llm_estimates,
            "is_live_gemini": is_live,
            "api_key_status": "Active (.env)" if self.api_key else "Missing in .env (Using Offline Calibration)"
        }

    def _compute_baseline(self, vehicle_str: str, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        itemized = []
        total_parts_min = 0
        total_parts_max = 0
        total_denting_min = 0
        total_denting_max = 0
        total_painting_min = 0
        total_painting_max = 0
        total_fitting = 0

        for d in detections:
            part = d["part"]
            sev = d.get("severity", "Moderate")
            sev_info = d.get("severity_info", {})
            replace_needed = sev_info.get("part_replacement_likely", False) or sev == "High"

            market = self.market_service.get_market_pricing(vehicle_str, part)
            tiers = market["tiers"]

            rates = LABOR_RATES_PKR.get(sev, LABOR_RATES_PKR["Moderate"])
            denting_cost = rates["denting"]
            painting_cost = rates["painting"]
            fitting_cost = (rates["fitting"][0] + rates["fitting"][1]) // 2

            if replace_needed:
                part_cost_min = tiers["aftermarket"]["min_pkr"]
                part_cost_max = tiers["oem_genuine"]["max_pkr"]
                part_cost_recommended = tiers["aftermarket"]["avg_pkr"]
                action_text = "Part Replacement Required"
            else:
                part_cost_min = 0
                part_cost_max = 0
                part_cost_recommended = 0
                if sev == "Minor":
                    action_text = "Minor Scratch Buffing & Spot Touchup"
                else:
                    action_text = "Moderate Dent Pulling & Panel Beating"

            total_parts_min += part_cost_min
            total_parts_max += part_cost_max
            total_denting_min += denting_cost[0]
            total_denting_max += denting_cost[1]
            total_painting_min += painting_cost[0]
            total_painting_max += painting_cost[1]
            total_fitting += fitting_cost

            itemized.append({
                "part": part,
                "severity": sev,
                "action": action_text,
                "replace_needed": replace_needed,
                "denting_labor_pkr": denting_cost[0],
                "painting_labor_pkr": painting_cost[0],
                "fitting_labor_pkr": fitting_cost,
                "part_cost_used": tiers["used_kabli"]["avg_pkr"],
                "part_cost_aftermarket": tiers["aftermarket"]["avg_pkr"],
                "part_cost_oem": tiers["oem_genuine"]["avg_pkr"],
                "part_cost_recommended": part_cost_recommended,
                "subtotal_pkr": part_cost_recommended + denting_cost[0] + painting_cost[0] + fitting_cost
            })

        min_total = total_parts_min + total_denting_min + total_painting_min + total_fitting
        max_total = total_parts_max + total_denting_max + total_painting_max + total_fitting
        recommended_total = sum(i["subtotal_pkr"] for i in itemized)

        return {
            "itemized_parts": itemized,
            "parts_total_range": (total_parts_min, total_parts_max),
            "denting_total_range": (total_denting_min, total_denting_max),
            "painting_total_range": (total_painting_min, total_painting_max),
            "fitting_total": total_fitting,
            "overall_min_pkr": min_total,
            "overall_max_pkr": max_total,
            "recommended_pkr": recommended_total
        }

    def _query_gemini_pricing(
        self,
        vehicle_str: str,
        detections: List[Dict[str, Any]],
        user_city: str,
        baseline: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prompts Google Gemini Flash to generate authentic Pakistani Rupees (PKR) repair prices.
        """
        damages_summary = []
        for d in detections:
            damages_summary.append(f"- {d['part']}: {d['severity']} ({d.get('damage_type', '')})")
        damages_text = "\n".join(damages_summary)

        prompt = f"""You are an expert Pakistani automotive repair pricing and survey specialist.
Vehicle: {vehicle_str}
Location: {user_city}, Pakistan

Detected Damages:
{damages_text}

Baseline Reference (PKR):
Min: PKR {baseline['overall_min_pkr']:,} | Max: PKR {baseline['overall_max_pkr']:,} | Recommended: PKR {baseline['recommended_pkr']:,}

Calculate authentic Pakistani repair bills in PKR for 3 expert viewpoints:
1. Ustad Rafiq (Local Workshop Master - Bilal Ganj / Shershah / Sultan Ka Khoo): Economical, practical Kabli / Aftermarket parts and denting.
2. Engr. Salman (Insurance Surveyor): Insurance survey schedule, depreciation, authorized workshop rates.
3. PakWheels Certified Inspector: High-end finish, paint meter compliance, resale value preservation.

Return strictly valid JSON:
{{
  "ustad_rafiq": {{
    "persona": "Ustad Rafiq (Master Collision Denter & Painter)",
    "market_view": "Local Workshop ({user_city})",
    "estimated_cost_pkr": <integer>,
    "parts_strategy": "<brief notes on spare parts>",
    "repair_duration_days": <integer>,
    "recommendation": "<practical advice>"
  }},
  "engr_salman": {{
    "persona": "Engr. Salman (Senior Motor Insurance Surveyor)",
    "market_view": "Insurance Claim Survey",
    "estimated_cost_pkr": <integer>,
    "parts_strategy": "<depreciation and OEM criteria>",
    "repair_duration_days": <integer>,
    "recommendation": "<insurance claim assessment>"
  }},
  "pakwheels_inspector": {{
    "persona": "PakWheels Certified Vehicle Inspector",
    "market_view": "Resale Value & Paint Inspection",
    "estimated_cost_pkr": <integer>,
    "parts_strategy": "<resale impact and fitment>",
    "repair_duration_days": <integer>,
    "recommendation": "<advice for vehicle owner>"
  }}
}}
"""
        candidate_models = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"]
        last_err = None

        for model_name in candidate_models:
            try:
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )
                clean_text = re.sub(r"```(?:json)?", "", response.text).strip().strip("`").strip()
                data = json.loads(clean_text)
                data["source"] = f"Google Gemini API ({model_name} from .env)"
                return data
            except Exception as e:
                last_err = e
                continue

        raise RuntimeError(f"All Gemini models failed: {last_err}")

    def _generate_simulated_personas(self, baseline: Dict[str, Any], vehicle_str: str, user_city: str) -> Dict[str, Any]:
        rec = baseline["recommended_pkr"]
        ustad_cost = int(rec * 0.88)
        surveyor_cost = int(rec * 1.05)
        inspector_cost = int(rec * 0.98)

        return {
            "source": "Pakistani Calibrated Offline Engine (Set GEMINI_API_KEY in .env for live AI)",
            "ustad_rafiq": {
                "persona": "Ustad Rafiq (Master Collision Denter & Painter)",
                "market_view": f"Local Collision Market ({user_city})",
                "estimated_cost_pkr": ustad_cost,
                "parts_strategy": "Sourcing clean Kabli / Aftermarket parts to save cost without compromising alignment.",
                "repair_duration_days": 3,
                "recommendation": "Preserve original factory paint where possible with paintless dent removal."
            },
            "engr_salman": {
                "persona": "Engr. Salman (Senior Motor Insurance Surveyor)",
                "market_view": "Formal Insurance Survey & Loss Assessment",
                "estimated_cost_pkr": surveyor_cost,
                "parts_strategy": "Depreciation applied per policy terms (30% on plastic, 10% on metal panels).",
                "repair_duration_days": 5,
                "recommendation": "Survey approved for authorized workshop repair with computerized color code matching."
            },
            "pakwheels_inspector": {
                "persona": "PakWheels Certified Vehicle Inspector",
                "market_view": "Resale Value & Paint Meter Inspection",
                "estimated_cost_pkr": inspector_cost,
                "parts_strategy": "Ensure correct panel gaps and oven-baked lacquer to avoid resale value drop.",
                "repair_duration_days": 4,
                "recommendation": "Maintain 110-130 micron clear-coat thickness to pass inspection."
            }
        }

    def _synthesize_consensus(self, baseline: Dict[str, Any], personas: Dict[str, Any]) -> Dict[str, Any]:
        costs = [
            personas["ustad_rafiq"]["estimated_cost_pkr"],
            personas["engr_salman"]["estimated_cost_pkr"],
            personas["pakwheels_inspector"]["estimated_cost_pkr"],
            baseline["recommended_pkr"]
        ]

        min_val = min(costs)
        max_val = max(costs)
        avg_val = sum(costs) // len(costs)

        min_pkr = (min_val // 500) * 500
        max_pkr = ((max_val + 499) // 500) * 500
        recommended_pkr = (avg_val // 500) * 500

        return {
            "cost_range_display": f"PKR {min_pkr:,} – {max_pkr:,}",
            "min_cost_pkr": min_pkr,
            "max_cost_pkr": max_pkr,
            "recommended_cost_pkr": recommended_pkr,
            "labor_denting_total": baseline["denting_total_range"][0],
            "labor_painting_total": baseline["painting_total_range"][0],
            "labor_fitting_total": baseline["fitting_total"],
            "parts_recommended_total": max(0, recommended_pkr - (baseline["denting_total_range"][0] + baseline["painting_total_range"][0] + baseline["fitting_total"])),
            "confidence_score": 94.5
        }
