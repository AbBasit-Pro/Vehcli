"""
DamageLevel Enum — Centralized severity levels for the AutoDamage AI Pakistan system.
Used by severity.py and any other module that needs standardized damage classification.
"""

from enum import Enum


class DamageLevel(str, Enum):
    MINOR = "Minor"
    MODERATE = "Moderate"
    SEVERE = "High"

    def __str__(self):
        return self.value
