"""
Severity Classification Engine for Vehicle Damage Detection.
Rules specified by user:
1. Scratch / Paint Scuff / Surface marks -> Minor
2. Dent / Panel Crease / Moderate deformation -> Moderate
3. Severe Collision / Shattered Glass or Light / Heavy Crush / Frame Damage -> High / Severe
4. No Damage -> Handled at detector level as Pristine (PKR 0)
"""

from typing import Dict, Any, Optional
import cv2
import numpy as np

from backend.damage_levels import DamageLevel

# Mapping from legacy string keys to the new enum for backward compatibility
_STRING_TO_ENUM = {
    "Minor": DamageLevel.MINOR,
    "Moderate": DamageLevel.MODERATE,
    "High": DamageLevel.SEVERE,
}

# Centralized metadata dictionary keyed by DamageLevel enum
SEVERITY_LEVELS = {
    DamageLevel.MINOR: {
        "color": "#10B981",
        "badge": "Minor Damage (Scratch / Scuff)",
        "damage_type": "Scratch / Surface Scuff",
        "description": "Surface-level scratch or paint scuff. Metal integrity is intact.",
        "action": "Paintless Dent Removal (PDR), Buffing, or Spot Touchup",
        "labor_multiplier": 1.0,
        "part_replacement_likely": False,
    },
    DamageLevel.MODERATE: {
        "color": "#F59E0B",
        "badge": "Moderate Damage (Dent / Crease)",
        "damage_type": "Dent / Panel Crease",
        "description": "Visible dent or crease in panel. Requires panel beating and oven painting.",
        "action": "Panel Beating, Dent Pulling & Multi-Coat Painting",
        "labor_multiplier": 1.8,
        "part_replacement_likely": False,
    },
    DamageLevel.SEVERE: {
        "color": "#EF4444",
        "badge": "Severe Damage (Heavy Collision / Broken)",
        "damage_type": "Severe Collision / Shattered",
        "description": "Heavy collision impact, shattered light/windscreen, or crushed structure.",
        "action": "Complete Component Replacement + Frame Realignment",
        "labor_multiplier": 3.0,
        "part_replacement_likely": True,
    },
}

SHATTERED_REPLACE_PARTS = [
    "windscreen", "windshield", "headlight", "taillight"
]

def is_scratch_abrasion(box_crop: Optional[np.ndarray], filename: str = "") -> bool:
    """
    Checks if region is predominantly surface scratches/scuffs rather than deep metal deformation.
    Uses OpenCV edge analysis to detect linear scratch patterns vs volumetric dents.
    """
    if box_crop is None or box_crop.size == 0:
        return False
    try:
        gray = cv2.cvtColor(box_crop, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 40, 120)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=25, minLineLength=30, maxLineGap=10)
        line_count = len(lines) if lines is not None else 0
        # High horizontal line density + low brightness variation = surface scratches
        return (line_count > 60 and np.std(gray) < 48)
    except Exception:
        return False

def classify_damage(
    part_name: str,
    damage_area_ratio: float = 0.05,
    confidence: float = 0.5,
    raw_class: str = "",
    aspect_ratio: float = 1.0,
    box_crop: Optional[np.ndarray] = None,
    filename: str = ""
) -> Dict[str, Any]:
    cleaned_name = (part_name or raw_class).lower()

    # 1. Broken / Shattered Glass or Light -> Severe / High
    if any(k in cleaned_name for k in SHATTERED_REPLACE_PARTS):
        if damage_area_ratio > 0.02 or confidence > 0.40:
            level = "High"
        else:
            level = "Moderate"

    # 2. Surface Scratch / Scuff -> Minor (User Rule 1)
    elif "scratch" in cleaned_name or "scuff" in cleaned_name or is_scratch_abrasion(box_crop, filename):
        level = "Minor"

    # 3. Severe Collision / Crushed Panel / Broken side mirror housing -> High (User Rule 3)
    elif damage_area_ratio >= 0.20 or ("crush" in cleaned_name and damage_area_ratio > 0.08):
        level = "High"

    # 4. Standard Dent / Crease -> Moderate (User Rule 2)
    elif "dent" in cleaned_name or "crease" in cleaned_name or damage_area_ratio >= 0.035:
        level = "Moderate"

    # 5. Default fallback
    else:
        level = "Minor" if damage_area_ratio < 0.04 else "Moderate"

    # Convert legacy string level to enum for metadata access
    enum_level = _STRING_TO_ENUM.get(level, DamageLevel.MINOR)
    details = SEVERITY_LEVELS[enum_level]
    return {
        "level": level,
        "badge": details["badge"],
        "damage_type": details["damage_type"],
        "color": details["color"],
        "description": details["description"],
        "action": details["action"],
        "labor_multiplier": details["labor_multiplier"],
        "part_replacement_likely": details["part_replacement_likely"],
        "area_ratio": round(damage_area_ratio, 4)
    }
