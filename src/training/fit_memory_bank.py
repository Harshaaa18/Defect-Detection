"""
Fits PatchCore memory bank for a given MVTec AD category on defect-free train images.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import torch
import yaml
from torch.utils.data import DataLoader
from src.data.mvtec_dataset import MVTecDataset
from src.models.backbone import BackboneFeatureExtractor
from src.models.patchcore import PatchCore

def fit_category_memory_bank(
    category: str,
    backbone_name: str = "resnet18", # default resnet18 for speed, wideresnet50_2 optional
    coreset_sampling_ratio: float = 0.10,
    batch_size: int = 8,
    output_dir: str = "experiments"
):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"--- Fitting PatchCore Memory Bank for Category: '{category}' ---")

    train_dataset = MVTecDataset(category=category, split="train")
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=False)

    backbone = BackboneFeatureExtractor(backbone_name=backbone_name)
    patchcore = PatchCore(backbone=backbone, coreset_sampling_ratio=coreset_sampling_ratio)

    patchcore.fit(train_loader, device=device)

    exp_dir = os.path.join(output_dir, f"{category}_patchcore")
    os.makedirs(exp_dir, exist_ok=True)
    mb_path = os.path.join(exp_dir, "memory_bank.npy")
    patchcore.save_memory_bank(mb_path)

    # Save run configuration
    config = {
        "category": category,
        "backbone_name": backbone_name,
        "coreset_sampling_ratio": coreset_sampling_ratio,
        "batch_size": batch_size,
        "num_train_images": len(train_dataset),
        "memory_bank_size": int(patchcore.memory_bank.shape[0])
    }
    with open(os.path.join(exp_dir, "config_used.yaml"), "w") as f:
        yaml.dump(config, f)

    return patchcore

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", type=str, default="bottle")
    parser.add_argument("--backbone", type=str, default="resnet18")
    parser.add_argument("--coreset_ratio", type=float, default=0.10)
    args = parser.parse_args()

    fit_category_memory_bank(category=args.category, backbone_name=args.backbone, coreset_sampling_ratio=args.coreset_ratio)
