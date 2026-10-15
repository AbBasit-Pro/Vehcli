"""
Auto Dataset Builder & Labeler for AutoDamage AI Pakistan.
Supports:
1. Custom User Images in 'custom_dataset/raw_images'.
2. Preserves Manual Labels: If user provides .txt label file, it uses it directly.
3. Clean Auto-Labeling: Uses high confidence (conf=0.40) to prevent false damage noise on clean cars.
4. Negative Background Samples: Clean cars get empty .txt labels, explicitly teaching YOLO to NOT predict damage on clean vehicles!
5. Strict MD5 Deduplication.
"""

import os
import shutil
import hashlib
import random
from ultralytics import YOLO

def get_file_hash(filepath: str) -> str:
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

def build_clean_dataset():
    print("=" * 65)
    print("🧹 AutoDamage AI — Clean Dataset Builder & Memory-Safe Labeler")
    print("=" * 65)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    sample_dir = os.path.join(base_dir, "sample_images")
    output_dir = os.path.join(base_dir, "custom_dataset")
    raw_images_dir = os.path.join(output_dir, "raw_images")
    model_path = os.path.join(base_dir, "models", "yolov11n-car-damage.pt")

    if not os.path.exists(model_path):
        model_path = os.path.join(base_dir, "models", "car-damage.pt")

    print(f"📦 Loading Teacher Model for Auto-Labeling: {model_path}")
    teacher_model = YOLO(model_path) if os.path.exists(model_path) else None

    valid_exts = (".jpg", ".jpeg", ".png", ".webp")
    candidates = []

    # 1. Custom User Images (Primary source from custom_dataset/raw_images)
    if os.path.exists(raw_images_dir):
        for f in os.listdir(raw_images_dir):
            if f.lower().endswith(valid_exts):
                candidates.append(os.path.join(raw_images_dir, f))

    # 2. Sample crash images
    if os.path.exists(sample_dir):
        for root, _, files in os.walk(sample_dir):
            for f in files:
                if f.lower().endswith(valid_exts):
                    candidates.append(os.path.join(root, f))

    # Strict Deduplication using MD5 hash
    unique_images = {}
    duplicates_removed = 0

    for path in candidates:
        try:
            h = get_file_hash(path)
            if h in unique_images:
                duplicates_removed += 1
            else:
                unique_images[h] = path
        except Exception as e:
            print(f"   [Error reading] {path}: {e}")

    unique_list = list(unique_images.values())
    print(f"\n📊 Image Discovery:")
    print(f"   - Total files found : {len(candidates)}")
    print(f"   - Duplicates removed: {duplicates_removed}")
    print(f"   - Unique images kept: {len(unique_list)}")

    if not unique_list:
        print("⚠️ No images found in custom_dataset/raw_images or sample_images!")
        return

    # Clean old train/val/test folders
    for split_name in ["train", "val", "test"]:
        split_path = os.path.join(output_dir, split_name)
        if os.path.exists(split_path):
            shutil.rmtree(split_path)
        os.makedirs(os.path.join(split_path, "images"), exist_ok=True)
        os.makedirs(os.path.join(split_path, "labels"), exist_ok=True)

    # Label generation:
    labeled_pairs = []
    print(f"\n🏷️ Processing labels for {len(unique_list)} images (conf >= 0.40)...")

    for img_path in unique_list:
        base_name, _ = os.path.splitext(img_path)
        manual_label_file = f"{base_name}.txt"

        # Check if user already provided a manual YOLO label file
        if os.path.exists(manual_label_file):
            with open(manual_label_file, "r") as f:
                boxes_txt_lines = [line.strip() for line in f.readlines() if line.strip()]
            labeled_pairs.append((img_path, "\n".join(boxes_txt_lines)))
        elif teacher_model is not None:
            # Teacher model with confidence >= 0.40 (prevents noise on clean cars)
            results = teacher_model.predict(img_path, conf=0.40, verbose=False)
            boxes_txt_lines = []
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0].item())
                    xywhn = box.xywhn[0].tolist()
                    x_center, y_center, width, height = xywhn
                    boxes_txt_lines.append(f"{cls_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")

            # Note: If image has 0 boxes, empty text represents a negative background sample!
            labeled_pairs.append((img_path, "\n".join(boxes_txt_lines)))
        else:
            labeled_pairs.append((img_path, ""))

    # Split into Train (70%), Val (20%), Test (10%)
    random.seed(42)
    random.shuffle(labeled_pairs)

    total = len(labeled_pairs)
    train_n = max(1, int(total * 0.70))
    val_n = max(1, int(total * 0.20))

    splits = {
        "train": labeled_pairs[:train_n],
        "val": labeled_pairs[train_n:train_n + val_n],
        "test": labeled_pairs[train_n + val_n:]
    }

    for split_name, items in splits.items():
        img_dest = os.path.join(output_dir, split_name, "images")
        lbl_dest = os.path.join(output_dir, split_name, "labels")

        for idx, (src_img, label_content) in enumerate(items):
            base_filename = os.path.basename(src_img)
            dst_img = os.path.join(img_dest, base_filename)
            shutil.copyfile(src_img, dst_img)

            b_name, _ = os.path.splitext(base_filename)
            dst_lbl = os.path.join(lbl_dest, f"{b_name}.txt")
            with open(dst_lbl, "w") as f:
                f.write(label_content + "\n" if label_content else "")

    print("\n✅ Dataset Built Successfully (Negative Samples Preserved to Prevent False Positives):")
    print(f"   🟢 Train set : {len(splits['train'])} images")
    print(f"   🟡 Val set   : {len(splits['val'])} images")
    print(f"   🔵 Test set  : {len(splits['test'])} images")
    print("=" * 65)

if __name__ == "__main__":
    build_clean_dataset()
