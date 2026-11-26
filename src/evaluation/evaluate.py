"""
Evaluation script: Runs fitted PatchCore memory bank over category test set.
Calculates Image-level AUROC, Pixel-level AUROC, PRO score, and saves qualitative visual heatmaps.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import json
import torch
import numpy as np
import cv2
import matplotlib.pyplot as plt
from torch.utils.data import DataLoader
from src.data.mvtec_dataset import MVTecDataset
from src.models.backbone import BackboneFeatureExtractor
from src.models.patchcore import PatchCore
from src.evaluation.metrics import compute_image_auroc, compute_pixel_auroc, compute_pro_score

def evaluate_patchcore_category(
    category: str,
    backbone_name: str = "resnet18",
    experiments_dir: str = "experiments"
) -> dict:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"=== Evaluating PatchCore on Category: '{category}' ===")

    test_dataset = MVTecDataset(category=category, split="test")
    test_loader = DataLoader(test_dataset, batch_size=1, shuffle=False)

    exp_dir = os.path.join(experiments_dir, f"{category}_patchcore")
    mb_path = os.path.join(exp_dir, "memory_bank.npy")

    if not os.path.exists(mb_path):
        raise FileNotFoundError(f"Memory bank not found at {mb_path}. Fit memory bank first!")

    backbone = BackboneFeatureExtractor(backbone_name=backbone_name)
    patchcore = PatchCore(backbone=backbone)
    patchcore.load_memory_bank(mb_path)

    image_labels = []
    image_scores = []
    gt_masks = []
    pred_heatmaps = []
    saved_samples = []

    for batch in test_loader:
        img_tensor = batch["image"] # (1, 3, 224, 224)
        label = int(batch["label"].item())
        gt_mask = batch["mask"].squeeze(0).squeeze(0).numpy() # (224, 224)
        img_path = batch["img_path"][0]
        defect_type = batch["defect_type"][0]

        res = patchcore.predict(img_tensor, device=device)
        score = res["image_score"]
        heatmap = res["anomaly_map"]

        image_labels.append(label)
        image_scores.append(score)
        gt_masks.append(gt_mask)
        pred_heatmaps.append(heatmap)

        saved_samples.append({
            "score": score,
            "label": label,
            "defect_type": defect_type,
            "img_tensor": img_tensor,
            "gt_mask": gt_mask,
            "heatmap": heatmap,
            "img_path": img_path
        })

    # Compute metrics
    img_auroc = compute_image_auroc(image_labels, image_scores)
    pix_auroc = compute_pixel_auroc(gt_masks, pred_heatmaps)
    pro_score = compute_pro_score(gt_masks, pred_heatmaps)

    print(f"Results for '{category}':")
    print(f"  - Image-level AUROC: {img_auroc:.4f}")
    print(f"  - Pixel-level AUROC: {pix_auroc:.4f}")
    print(f"  - PRO Score:         {pro_score:.4f}")

    # Save qualitative visual heatmaps
    maps_dir = os.path.join(exp_dir, "anomaly_maps")
    os.makedirs(maps_dir, exist_ok=True)

    # Sort samples by anomaly score
    saved_samples = sorted(saved_samples, key=lambda x: x["score"], reverse=True)
    
    # Save top 3 highest anomaly score samples and top 3 lowest
    top_samples = saved_samples[:3] + saved_samples[-3:]
    for idx, sample in enumerate(top_samples):
        fig, axes = plt.subplots(1, 3, figsize=(12, 4))
        fig.suptitle(f"{category} | Label: {'DEFECT' if sample['label']==1 else 'GOOD'} | Type: {sample['defect_type']} | Score: {sample['score']:.3f}")

        # Unnormalize RGB image
        img_unnorm = test_dataset.unnormalize(sample["img_tensor"].squeeze(0)).permute(1, 2, 0).numpy()
        img_unnorm = np.clip(img_unnorm, 0, 1)

        axes[0].imshow(img_unnorm)
        axes[0].set_title("Input Image")
        axes[0].axis("off")

        axes[1].imshow(sample["gt_mask"], cmap="gray")
        axes[1].set_title("Ground Truth Mask")
        axes[1].axis("off")

        # Heatmap overlay
        overlay = img_unnorm.copy()
        norm_map = (sample["heatmap"] - sample["heatmap"].min()) / (sample["heatmap"].max() - sample["heatmap"].min() + 1e-8)
        colored_map = cv2.applyColorMap(np.uint8(255 * norm_map), cv2.COLORMAP_JET)
        colored_map = cv2.cvtColor(colored_map, cv2.COLOR_BGR2RGB) / 255.0

        blended = 0.5 * overlay + 0.5 * colored_map
        axes[2].imshow(blended)
        axes[2].set_title("Anomaly Heatmap Overlay")
        axes[2].axis("off")

        plt.tight_layout()
        plt.savefig(os.path.join(maps_dir, f"sample_{idx+1}_{sample['defect_type']}_score_{sample['score']:.2f}.png"))
        plt.close()

    metrics_res = {
        "category": category,
        "image_auroc": img_auroc,
        "pixel_auroc": pix_auroc,
        "pro_score": pro_score,
        "num_test_images": len(test_dataset)
    }

    with open(os.path.join(exp_dir, "metrics.json"), "w") as f:
        json.dump(metrics_res, f, indent=2)

    return metrics_res

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", type=str, default="bottle")
    parser.add_argument("--backbone", type=str, default="resnet18")
    args = parser.parse_args()

    evaluate_patchcore_category(category=args.category, backbone_name=args.backbone)
