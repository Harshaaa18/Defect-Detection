"""
Phase 5 Ablation Study runner:
Sweeps backbone architectures, coreset subsampling ratios, and feature layer combinations.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import pandas as pd
import torch
from torch.utils.data import DataLoader
from src.data.mvtec_dataset import MVTecDataset
from src.models.backbone import BackboneFeatureExtractor
from src.models.patchcore import PatchCore
from src.evaluation.metrics import compute_image_auroc, compute_pixel_auroc

def run_ablation_sweep(target_category: str = "bottle", experiments_dir: str = "experiments/ablations"):
    os.makedirs(experiments_dir, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"=== Running Phase 5 Ablation Sweeps on Category '{target_category}' ===")

    train_dataset = MVTecDataset(category=target_category, split="train")
    train_loader = DataLoader(train_dataset, batch_size=8, shuffle=False)

    test_dataset = MVTecDataset(category=target_category, split="test")
    test_loader = DataLoader(test_dataset, batch_size=1, shuffle=False)

    ablation_results = []

    # 1. Backbone Ablation: ResNet18 vs WideResNet50_2
    backbones = ["resnet18", "wide_resnet50_2"]
    coreset_ratios = [0.01, 0.05, 0.10, 0.25]
    layer_configs = [
        ["layer2"],
        ["layer2", "layer3"],
        ["layer2", "layer3", "layer4"]
    ]

    for bb_name in backbones:
        for ratio in coreset_ratios:
            for layers in layer_configs:
                config_name = f"{bb_name}_ratio{int(ratio*100)}pct_layers{len(layers)}"
                print(f"Testing Config: {config_name}...")

                try:
                    backbone = BackboneFeatureExtractor(backbone_name=bb_name, layer_names=layers)
                    patchcore = PatchCore(backbone=backbone, target_layers=layers, coreset_sampling_ratio=ratio)
                    
                    # Fit memory bank
                    patchcore.fit(train_loader, device=device)

                    # Predict
                    labels, scores, gt_masks, pred_heatmaps = [], [], [], []
                    for batch in test_loader:
                        img = batch["image"]
                        label = int(batch["label"].item())
                        mask = batch["mask"].squeeze(0).squeeze(0).numpy()

                        res = patchcore.predict(img, device=device)
                        labels.append(label)
                        scores.append(res["image_score"])
                        gt_masks.append(mask)
                        pred_heatmaps.append(res["anomaly_map"])

                    img_auroc = compute_image_auroc(labels, scores)
                    pix_auroc = compute_pixel_auroc(gt_masks, pred_heatmaps)

                    res_entry = {
                        "category": target_category,
                        "backbone": bb_name,
                        "coreset_ratio": ratio,
                        "num_layers": len(layers),
                        "layers": "-".join(layers),
                        "memory_bank_size": int(patchcore.memory_bank.shape[0]),
                        "image_auroc": round(img_auroc, 4),
                        "pixel_auroc": round(pix_auroc, 4)
                    }
                    ablation_results.append(res_entry)

                    # Close hooks
                    backbone.close()

                except Exception as e:
                    print(f"Error in ablation config {config_name}: {e}")

    df_ablation = pd.DataFrame(ablation_results)
    csv_path = os.path.join(experiments_dir, "ablation_summary.csv")
    json_path = os.path.join(experiments_dir, "ablation_summary.json")

    df_ablation.to_csv(csv_path, index=False)
    with open(json_path, "w") as f:
        json.dump(ablation_results, f, indent=2)

    print("\n" + "="*70)
    print("ABLATION STUDY SUMMARY")
    print("="*70)
    print(df_ablation.to_string(index=False))
    print("="*70)
    print(f"Saved ablation results to {csv_path}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", type=str, default="bottle")
    args = parser.parse_args()
    run_ablation_sweep(args.category)
