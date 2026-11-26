"""
EDA visualization script: Visualizes train images and test images with defect ground-truth masks overlaid.
Saves visual samples to experiments/eda_visualizations/
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import torch
import cv2
import numpy as np
import matplotlib.pyplot as plt
from src.data.mvtec_dataset import MVTecDataset
from src.data.category_registry import CATEGORIES

def visualize_dataset_samples(output_dir="experiments/eda_visualizations"):
    os.makedirs(output_dir, exist_ok=True)
    print(f"Generating EDA visual overlays in {output_dir}...")

    for category in CATEGORIES:
        try:
            train_ds = MVTecDataset(category=category, split="train")
            test_ds = MVTecDataset(category=category, split="test")

            if len(train_ds) == 0 or len(test_ds) == 0:
                continue

            fig, axes = plt.subplots(2, 3, figsize=(12, 8))
            fig.suptitle(f"Category: {category} ({CATEGORIES[category]['type'].upper()})", fontsize=16)

            # Row 1: Train Good images (3 samples)
            for i in range(min(3, len(train_ds))):
                sample = train_ds[i]
                img = train_ds.unnormalize(sample["image"]).permute(1, 2, 0).numpy()
                img = np.clip(img, 0, 1)
                axes[0, i].imshow(img)
                axes[0, i].set_title(f"Train Good #{i+1}")
                axes[0, i].axis("off")

            # Row 2: Test Defective images + Mask overlay (3 samples)
            defect_idx = 0
            for i in range(len(test_ds)):
                if test_ds.labels[i] == 1: # Defective sample
                    sample = test_ds[i]
                    img = test_ds.unnormalize(sample["image"]).permute(1, 2, 0).numpy()
                    img = np.clip(img, 0, 1)
                    mask = sample["mask"].squeeze(0).numpy()

                    # Overlay red mask on image
                    overlay = img.copy()
                    overlay[mask > 0.5] = [1.0, 0.2, 0.2]

                    axes[1, defect_idx].imshow(overlay)
                    axes[1, defect_idx].set_title(f"Test Defect: {sample['defect_type']}")
                    axes[1, defect_idx].axis("off")

                    defect_idx += 1
                    if defect_idx >= 3:
                        break
            
            # If fewer than 3 defect samples, turn off remaining axes
            for idx in range(defect_idx, 3):
                axes[1, idx].axis("off")

            plt.tight_layout()
            plt.savefig(os.path.join(output_dir, f"{category}_eda.png"))
            plt.close()
            print(f"Saved EDA visualization for '{category}'")

        except Exception as e:
            print(f"Skipping visualization for {category}: {e}")

if __name__ == "__main__":
    visualize_dataset_samples()
