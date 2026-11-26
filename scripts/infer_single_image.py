"""
Phase 6 Single-Image CLI Inference Script:
Takes an input image path and category, loads fitted PatchCore memory bank,
and outputs anomaly classification, anomaly score, and exports heatmap overlay PNG.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import argparse
import torch
import cv2
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
from src.data.transforms import get_data_transforms
from src.models.backbone import BackboneFeatureExtractor
from src.models.patchcore import PatchCore

def infer_single_image(image_path: str, category: str, backbone_name: str = "resnet18", output_path: str = None, threshold: float = 0.5):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Input image not found: {image_path}")

    mb_path = os.path.join("experiments", f"{category}_patchcore", "memory_bank.npy")
    if not os.path.exists(mb_path):
        raise FileNotFoundError(f"Memory bank for category '{category}' not found at {mb_path}. Please train memory bank first.")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # 1. Load image & transforms
    img_transform, mask_transform, unnormalize = get_data_transforms(img_size=256, crop_size=224)
    raw_img = Image.open(image_path).convert("RGB")
    img_tensor = img_transform(raw_img).unsqueeze(0) # (1, 3, 224, 224)

    # 2. Load model & memory bank
    backbone = BackboneFeatureExtractor(backbone_name=backbone_name)
    patchcore = PatchCore(backbone=backbone)
    patchcore.load_memory_bank(mb_path)

    # 3. Predict anomaly score & heatmap
    res = patchcore.predict(img_tensor, device=device)
    score = res["image_score"]
    heatmap = res["anomaly_map"]

    is_anomalous = score > threshold

    print("\n" + "="*50)
    print("MVTEC AD PATCHCORE INFERENCE RESULT")
    print("="*50)
    print(f"Input Image:   {image_path}")
    print(f"Category:      {category}")
    print(f"Anomaly Score: {score:.4f}")
    print(f"Status:        {'ANOMALOUS (DEFECT DETECTED)' if is_anomalous else 'NORMAL (GOOD)'}")
    print("="*50)

    # 4. Generate visualization overlay
    img_unnorm = unnormalize(img_tensor.squeeze(0)).permute(1, 2, 0).numpy()
    img_unnorm = np.clip(img_unnorm, 0, 1)

    fig, axes = plt.subplots(1, 2, figsize=(10, 5))
    fig.suptitle(f"Category: {category} | Anomaly Score: {score:.4f} | Status: {'ANOMALOUS' if is_anomalous else 'NORMAL'}", fontsize=14)

    axes[0].imshow(img_unnorm)
    axes[0].set_title("Input Image")
    axes[0].axis("off")

    # Blend heatmap
    norm_map = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min() + 1e-8)
    colored_map = cv2.applyColorMap(np.uint8(255 * norm_map), cv2.COLORMAP_JET)
    colored_map = cv2.cvtColor(colored_map, cv2.COLOR_BGR2RGB) / 255.0
    blended = 0.5 * img_unnorm + 0.5 * colored_map

    axes[1].imshow(blended)
    axes[1].set_title("Anomaly Heatmap Overlay")
    axes[1].axis("off")

    if output_path is None:
        output_dir = os.path.join("experiments", "inference_outputs")
        os.makedirs(output_dir, exist_ok=True)
        base_name = os.path.splitext(os.path.basename(image_path))[0]
        output_path = os.path.join(output_dir, f"{category}_{base_name}_heatmap.png")

    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    print(f"Heatmap visualization exported to: {output_path}\n")

    return {
        "score": score,
        "is_anomalous": is_anomalous,
        "output_path": output_path
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=str, required=True, help="Path to input image")
    parser.add_argument("--category", type=str, required=True, help="Category name (e.g. bottle)")
    parser.add_argument("--backbone", type=str, default="resnet18")
    parser.add_argument("--output", type=str, default=None, help="Output PNG path")
    parser.add_argument("--threshold", type=float, default=3.0, help="Anomaly decision threshold")
    args = parser.parse_args()

    infer_single_image(
        image_path=args.image,
        category=args.category,
        backbone_name=args.backbone,
        output_path=args.output,
        threshold=args.threshold
    )
