"""
Orchestration script: Fits memory banks and runs evaluations across all 15 MVTec AD categories.
Outputs aggregate results table with per-category and mean Image AUROC, Pixel AUROC, and PRO scores.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import pandas as pd
from src.data.category_registry import CATEGORIES
from src.training.fit_memory_bank import fit_category_memory_bank
from src.evaluation.evaluate import evaluate_patchcore_category

def run_all(backbone_name: str = "resnet18", coreset_ratio: float = 0.10, experiments_dir: str = "experiments", skip_fit_if_exists: bool = True):
    print(f"=== Starting PatchCore End-to-End Pipeline across {len(CATEGORIES)} Categories ===")
    results = []

    for idx, category in enumerate(CATEGORIES, 1):
        print(f"\n[{idx}/{len(CATEGORIES)}] Processing category: '{category}'...")
        try:
            mb_path = os.path.join(experiments_dir, f"{category}_patchcore", "memory_bank.npy")
            if not os.path.exists(mb_path) or not skip_fit_if_exists:
                print(f"Fitting memory bank for '{category}'...")
                fit_category_memory_bank(
                    category=category,
                    backbone_name=backbone_name,
                    coreset_sampling_ratio=coreset_ratio,
                    output_dir=experiments_dir
                )
            else:
                print(f"Using existing fitted memory bank at {mb_path}")

            # 2. Evaluate against test set
            res = evaluate_patchcore_category(
                category=category,
                backbone_name=backbone_name,
                experiments_dir=experiments_dir
            )
            results.append(res)
        except Exception as e:
            print(f"Error processing category '{category}': {e}")

    if not results:
        print("No category results were generated.")
        return

    # Convert results to pandas DataFrame
    df = pd.DataFrame(results)
    
    # Calculate Mean Benchmark metrics
    mean_row = {
        "category": "MEAN",
        "image_auroc": df["image_auroc"].mean(),
        "pixel_auroc": df["pixel_auroc"].mean(),
        "pro_score": df["pro_score"].mean(),
        "num_test_images": df["num_test_images"].sum()
    }
    
    df_with_mean = pd.concat([df, pd.DataFrame([mean_row])], ignore_index=True)

    os.makedirs(experiments_dir, exist_ok=True)
    csv_path = os.path.join(experiments_dir, "all_categories_benchmark.csv")
    json_path = os.path.join(experiments_dir, "all_categories_benchmark.json")

    df_with_mean.to_csv(csv_path, index=False)
    with open(json_path, "w") as f:
        json.dump(df_with_mean.to_dict(orient="records"), f, indent=2)

    print("\n" + "="*70)
    print("MVTEC AD PATCHCORE BENCHMARK RESULTS")
    print("="*70)
    print(df_with_mean.to_string(index=False))
    print("="*70)
    print(f"Saved benchmark CSV to {csv_path}")
    print(f"Saved benchmark JSON to {json_path}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--backbone", type=str, default="resnet18")
    parser.add_argument("--coreset_ratio", type=float, default=0.10)
    parser.add_argument("--force_retrain", action="store_true", help="Force refitting existing memory banks")
    args = parser.parse_args()

    run_all(backbone_name=args.backbone, coreset_ratio=args.coreset_ratio, skip_fit_if_exists=not args.force_retrain)
