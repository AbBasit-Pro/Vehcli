"""
Unseen Dataset Generalization & Evaluation Benchmark Suite.
Tests the trained YOLO damage detection model on unseen vehicle crash images.

Notes:
- Missing image files are reported as skipped cases rather than causing a 500 error.
- Per-image detector errors are reported in the response so one bad sample does not
  crash the complete benchmark.
- Precision/recall/F1 are approximate because matching is based on part names, not
  bounding-box IoU. map_50 below preserves the original approximation and is NOT a
  true YOLO mAP@0.5 evaluation.
"""

import os
import time
from typing import Optional, Dict, Any, List

from backend.ai_engine.detector import VehicleDamageDetector


# Ground-truth annotations for the unseen real-crash test suite.
UNSEEN_TEST_DATASET = [
    {
        "id": "test_01",
        "name": "Real Suzuki Alto 660cc Severe Head-on Crash",
        "filename": "real_suzuki_alto_heavy_crash.jpg",
        "image_rel_path": "sample_images/severe/real_suzuki_alto_heavy_crash.jpg",
        "vehicle": "Suzuki Alto (660cc)",
        "ground_truth_parts": ["Bonnet (Hood)", "Front Fender", "Front Bumper", "Headlight"],
        "expected_severity": "High",
    },
    {
        "id": "test_02",
        "name": "Toyota Corolla Altis Heavy Frontal Collision",
        "filename": "severe_corolla_front_crash.jpg",
        "image_rel_path": "sample_images/severe/severe_corolla_front_crash.jpg",
        "vehicle": "Toyota Corolla (Altis 1.6)",
        "ground_truth_parts": ["Front Bumper", "Bonnet (Hood)", "Headlight", "Front Fender"],
        "expected_severity": "High",
    },
    {
        "id": "test_03",
        "name": "Honda Civic Side T-Bone Door Collision",
        "filename": "severe_civic_side_collision.jpg",
        "image_rel_path": "sample_images/severe/severe_civic_side_collision.jpg",
        "vehicle": "Honda Civic (Turbo / Oriel)",
        "ground_truth_parts": ["Door Outer Panel", "Running Board / Side Skirt", "Quarter Panel"],
        "expected_severity": "High",
    },
    {
        "id": "test_04",
        "name": "Toyota Hilux Revo Offroad Front Crush",
        "filename": "severe_hilux_front_crush.jpg",
        "image_rel_path": "sample_images/severe/severe_hilux_front_crush.jpg",
        "vehicle": "Toyota Hilux (Revo)",
        "ground_truth_parts": ["Front Bumper", "Bonnet (Hood)", "Headlight", "Front Fender"],
        "expected_severity": "High",
    },
    {
        "id": "test_05",
        "name": "Suzuki Mehran Fender Dent & Paint Scuff",
        "filename": "suzuki_mehran_fender_dent.jpg",
        "image_rel_path": "sample_images/suzuki_mehran_fender_dent.jpg",
        "vehicle": "Suzuki Mehran (VX/VXR)",
        "ground_truth_parts": ["Front Fender", "Front Bumper"],
        "expected_severity": "Moderate",
    },
    {
        "id": "test_06",
        "name": "Honda Civic Door Scrape & Parking Ding",
        "filename": "honda_civic_door_damage.jpg",
        "image_rel_path": "sample_images/honda_civic_door_damage.jpg",
        "vehicle": "Honda Civic",
        "ground_truth_parts": ["Door Outer Panel"],
        "expected_severity": "Minor",
    },
]


class UnseenDataEvaluator:
    def __init__(self, detector: Optional[VehicleDamageDetector] = None):
        self.detector = detector or VehicleDamageDetector()
        # This file is expected to live under the project's backend package.
        # Three dirname calls from .../backend/<subfolder>/<file>.py resolve to project root.
        self.base_dir = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )

    def run_unseen_benchmark(self, confidence_threshold: float = 0.15) -> Dict[str, Any]:
        """Run inference for available samples and return metrics plus skipped/errors."""
        try:
            confidence_threshold = float(confidence_threshold)
        except (TypeError, ValueError) as exc:
            raise ValueError("confidence_threshold must be a number between 0 and 1") from exc

        if not 0.0 <= confidence_threshold <= 1.0:
            raise ValueError("confidence_threshold must be between 0 and 1")

        total_ground_truth = 0
        total_true_positives = 0
        total_false_positives = 0
        total_false_negatives = 0
        confidences: List[float] = []
        latencies: List[float] = []
        image_results: List[Dict[str, Any]] = []
        skipped_cases: List[Dict[str, str]] = []

        for item in UNSEEN_TEST_DATASET:
            # Keep image_rel_path relative to the project root, independent of current working directory.
            img_path = os.path.normpath(os.path.join(self.base_dir, item["image_rel_path"]))

            if not os.path.isfile(img_path):
                skipped_cases.append({
                    "test_id": item["id"],
                    "name": item["name"],
                    "reason": f"Image file not found: {img_path}",
                })
                continue

            try:
                with open(img_path, "rb") as image_file:
                    img_bytes = image_file.read()
                if not img_bytes:
                    skipped_cases.append({
                        "test_id": item["id"],
                        "name": item["name"],
                        "reason": f"Image file is empty: {img_path}",
                    })
                    continue

                start_time = time.perf_counter()
                det_res = self.detector.detect(
                    img_bytes,
                    filename=item["filename"],
                    confidence_threshold=confidence_threshold,
                )
                latency_ms = (time.perf_counter() - start_time) * 1000.0

                if not isinstance(det_res, dict):
                    raise TypeError("detector.detect() must return a dictionary")

                detections = det_res.get("detections", [])
                if not isinstance(detections, list):
                    raise TypeError("detector response 'detections' must be a list")

                # Ignore malformed detection entries rather than crashing the whole run.
                valid_detections = [d for d in detections if isinstance(d, dict)]
                predicted_parts = [
                    str(d.get("part", "Unknown part")) for d in valid_detections
                ]
                gt_parts = item["ground_truth_parts"]
                total_ground_truth += len(gt_parts)
                latencies.append(latency_ms)

                # Greedy one-to-one matching prevents one prediction from matching multiple labels.
                unmatched_gt = list(gt_parts)
                tp = 0
                fp = 0
                for pred in predicted_parts:
                    pred_norm = pred.strip().lower()
                    match_index = next(
                        (
                            idx for idx, gt in enumerate(unmatched_gt)
                            if gt.strip().lower() in pred_norm or pred_norm in gt.strip().lower()
                        ),
                        None,
                    )
                    if match_index is not None and pred_norm:
                        tp += 1
                        unmatched_gt.pop(match_index)
                    else:
                        fp += 1

                total_true_positives += tp
                total_false_positives += fp
                fn = len(unmatched_gt)
                total_false_negatives += fn

                for detection in valid_detections:
                    confidence = detection.get("confidence")
                    try:
                        if confidence is not None:
                            confidences.append(float(confidence))
                    except (TypeError, ValueError):
                        pass

                image_results.append({
                    "test_id": item["id"],
                    "name": item["name"],
                    "vehicle": item["vehicle"],
                    "expected_severity": item["expected_severity"],
                    "ground_truth_parts": gt_parts,
                    "detected_parts": predicted_parts,
                    "overall_severity": det_res.get("overall_severity", "Unknown"),
                    "total_detected": len(predicted_parts),
                    "true_positives": tp,
                    "false_positives": fp,
                    "false_negatives": fn,
                    "inference_time_ms": round(latency_ms, 1),
                    "annotated_image_base64": det_res.get("annotated_image_base64"),
                })

            except Exception as exc:
                # Include the actual per-image error in the API response for diagnosis.
                skipped_cases.append({
                    "test_id": item["id"],
                    "name": item["name"],
                    "reason": f"Evaluation failed: {type(exc).__name__}: {exc}",
                })

        denominator_precision = total_true_positives + total_false_positives
        denominator_recall = total_true_positives + total_false_negatives
        precision = total_true_positives / denominator_precision if denominator_precision else 0.0
        recall = total_true_positives / denominator_recall if denominator_recall else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0

        # Preserved from the original code for compatibility; this is only an approximation,
        # not a true mAP@0.5 calculation. Use YOLO validation with box IoU for true mAP.
        map50 = precision * 0.96
        avg_confidence = (sum(confidences) / len(confidences) * 100.0) if confidences else 0.0
        avg_latency = sum(latencies) / len(latencies) if latencies else 0.0

        return {
            "summary_metrics": {
                "precision": round(precision * 100, 1),
                "recall": round(recall * 100, 1),
                "f1_score": round(f1 * 100, 1),
                "map_50": round(map50 * 100, 1),
                "avg_confidence": round(avg_confidence, 1),
                "avg_inference_latency_ms": round(avg_latency, 1),
                "total_test_images": len(image_results),
                "total_ground_truth_labels": total_ground_truth,
                "total_correct_detections": total_true_positives,
                "skipped_or_failed_images": len(skipped_cases),
            },
            "unseen_test_cases": image_results,
            "skipped_cases": skipped_cases,
        }
