"""
Auto Dataset Splitter for AutoDamage AI
Splits raw images (and matching .txt labels if available) into:
- 70% Train
- 20% Val
- 10% Test
"""

import os
import shutil
import random

def split_raw_images(
    raw_dir: str = "custom_dataset/raw_images",
    dataset_dir: str = "custom_dataset",
    train_ratio: float = 0.70,
    val_ratio: float = 0.20
):
    valid_exts = (".jpg", ".jpeg", ".png", ".webp", ".bmp")
    all_files = [f for f in os.listdir(raw_dir) if f.lower().endswith(valid_exts)]

    if not all_files:
        print(f"⚠️ No images found in '{raw_dir}'!")
        print("Please place your car damage images in this folder first.")
        return

    random.seed(42)
    random.shuffle(all_files)

    total = len(all_files)
    train_count = int(total * train_ratio)
    val_count = int(total * val_ratio)

    splits = {
        "train": all_files[:train_count],
        "val": all_files[train_count:train_count + val_count],
        "test": all_files[train_count + val_count:]
    }

    print(f"📊 Total Images Found: {total}")
    print(f"   - Train (70%): {len(splits['train'])}")
    print(f"   - Val   (20%): {len(splits['val'])}")
    print(f"   - Test  (10%): {len(splits['test'])}")

    for split_name, files in splits.items():
        img_dest = os.path.join(dataset_dir, split_name, "images")
        lbl_dest = os.path.join(dataset_dir, split_name, "labels")
        os.makedirs(img_dest, exist_ok=True)
        os.makedirs(lbl_dest, exist_ok=True)

        for filename in files:
            src_img = os.path.join(raw_dir, filename)
            dst_img = os.path.join(img_dest, filename)
            shutil.copyfile(src_img, dst_img)

            # Check if matching .txt label exists
            base_name, _ = os.path.splitext(filename)
            label_file = f"{base_name}.txt"
            src_lbl = os.path.join(raw_dir, label_file)
            if os.path.exists(src_lbl):
                dst_lbl = os.path.join(lbl_dest, label_file)
                shutil.copyfile(src_lbl, dst_lbl)

    print("\n✅ Successfully copied & split all images into train/val/test folders!")

if __name__ == "__main__":
    split_raw_images()
