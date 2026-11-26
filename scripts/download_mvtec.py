"""
Script to download MVTec AD dataset or generate synthetic benchmark images for offline development.
"""
import os
import sys
import tarfile
import urllib.request
import numpy as np
from PIL import Image, ImageDraw
from src.data.category_registry import CATEGORIES

DATA_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw", "mvtec_ad")
BASE_URL = "https://www.dfki.uni-kl.de/mvtec/mvtec_anomaly_detection"

def download_category(category: str):
    os.makedirs(DATA_ROOT, exist_ok=True)
    cat_dir = os.path.join(DATA_ROOT, category)
    if os.path.exists(cat_dir):
        print(f"Category '{category}' already exists at {cat_dir}")
        return

    url = f"{BASE_URL}/{category}.tar.xz"
    tar_path = os.path.join(DATA_ROOT, f"{category}.tar.xz")
    print(f"Downloading {category} from {url}...")
    try:
        urllib.request.urlretrieve(url, tar_path)
        print(f"Extracting {tar_path}...")
        with tarfile.open(tar_path, "r:xz") as tar:
            tar.extractall(path=DATA_ROOT)
        os.remove(tar_path)
        print(f"Successfully downloaded and extracted '{category}'.")
    except Exception as e:
        print(f"Failed to download {category}: {e}")

def create_synthetic_dataset(categories=None, num_train=30, num_good_test=10, num_defect_test=10):
    """
    Creates a realistic synthetic dataset mimicking MVTec AD structure for rapid offline unit testing & verification.
    """
    if categories is None:
        categories = list(CATEGORIES.keys())

    os.makedirs(DATA_ROOT, exist_ok=True)
    print(f"Creating synthetic MVTec AD dataset in {DATA_ROOT}...")

    for category in categories:
        cat_dir = os.path.join(DATA_ROOT, category)
        train_good = os.path.join(cat_dir, "train", "good")
        test_good = os.path.join(cat_dir, "test", "good")
        test_defect = os.path.join(cat_dir, "test", "scratch")
        gt_defect = os.path.join(cat_dir, "ground_truth", "scratch")

        os.makedirs(train_good, exist_ok=True)
        os.makedirs(test_good, exist_ok=True)
        os.makedirs(test_defect, exist_ok=True)
        os.makedirs(gt_defect, exist_ok=True)

        is_texture = CATEGORIES[category]["type"] == "texture"

        # Helper to generate base image
        def gen_base_image(seed):
            np.random.seed(seed)
            if is_texture:
                # Texture pattern (e.g. grid or wood pattern)
                grid = np.zeros((256, 256, 3), dtype=np.uint8)
                grid += 180 + np.random.randint(-15, 15, size=(256, 256, 3), dtype=np.int16).astype(np.uint8)
                # Add horizontal/vertical lines
                grid[::20, :, :] = 80
                grid[:, ::20, :] = 80
                return Image.fromarray(grid)
            else:
                # Object pattern (centered circle/box on background)
                bg = np.ones((256, 256, 3), dtype=np.uint8) * 40
                img = Image.fromarray(bg)
                draw = ImageDraw.Draw(img)
                color = (200, 150, 100) if category in ["hazelnut", "wood"] else (180, 180, 210)
                draw.ellipse([60, 60, 196, 196], fill=color, outline=(240, 240, 240), width=4)
                return img

        # 1. Generate train images (GOOD ONLY - strict guardrail compliance)
        for i in range(num_train):
            img = gen_base_image(i)
            img.save(os.path.join(train_good, f"{i:03d}.png"))

        # 2. Generate test good images
        for i in range(num_good_test):
            img = gen_base_image(100 + i)
            img.save(os.path.join(test_good, f"{i:03d}.png"))

        # 3. Generate test defective images + ground truth masks
        for i in range(num_defect_test):
            img = gen_base_image(200 + i)
            mask = Image.new("L", (256, 256), 0)
            
            draw_img = ImageDraw.Draw(img)
            draw_mask = ImageDraw.Draw(mask)

            # Draw a simulated scratch defect
            x1, y1 = np.random.randint(80, 140), np.random.randint(80, 140)
            x2, y2 = x1 + np.random.randint(20, 50), y1 + np.random.randint(20, 50)
            draw_img.line([x1, y1, x2, y2], fill=(255, 0, 0), width=5)
            draw_mask.line([x1, y1, x2, y2], fill=255, width=5)

            img.save(os.path.join(test_defect, f"{i:03d}.png"))
            mask.save(os.path.join(gt_defect, f"{i:03d}_mask.png"))

    print("Synthetic dataset successfully created across all categories!")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", type=str, default="all", help="Category to download or 'all'")
    parser.add_argument("--synthetic", action="store_true", help="Generate synthetic dataset for offline verification")
    args = parser.parse_args()

    if args.synthetic:
        create_synthetic_dataset()
    else:
        if args.category == "all":
            for cat in CATEGORIES:
                download_category(cat)
        else:
            download_category(args.category)
