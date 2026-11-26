import os
import glob
import unittest
from src.data.category_registry import CATEGORIES

DATA_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw", "mvtec_ad")

class TestDatasetSplits(unittest.TestCase):
    def test_train_split_contains_zero_defective_images(self):
        """
        CRITICAL GUARDRAIL:
        Assert that train/ directory for every category contains ONLY 'good' images,
        and zero defective images/folders.
        """
        if not os.path.exists(DATA_ROOT):
            self.skipTest(f"Data root {DATA_ROOT} does not exist yet.")

        for category in CATEGORIES:
            cat_train_dir = os.path.join(DATA_ROOT, category, "train")
            if not os.path.exists(cat_train_dir):
                continue
            
            subdirs = [d for d in os.listdir(cat_train_dir) if os.path.isdir(os.path.join(cat_train_dir, d))]
            
            # Enforce that the ONLY directory inside train/ is 'good'
            self.assertEqual(
                subdirs, ["good"],
                f"Leakage detected in category '{category}'! "
                f"train/ should ONLY contain 'good', but found subdirectories: {subdirs}"
            )
            
            # Double check no image file is directly in train/ root or outside 'good'
            files_outside_good = [
                f for f in os.listdir(cat_train_dir) 
                if os.path.isfile(os.path.join(cat_train_dir, f))
            ]
            self.assertEqual(
                len(files_outside_good), 0,
                f"Unexpected files directly inside train/ for '{category}': {files_outside_good}"
            )

    def test_category_registry_completeness(self):
        """Verify that all 15 official MVTec AD categories are registered."""
        expected_categories = {
            "bottle", "cable", "capsule", "carpet", "grid",
            "hazelnut", "leather", "metal_nut", "pill", "screw",
            "tile", "toothbrush", "transistor", "wood", "zipper"
        }
        self.assertEqual(set(CATEGORIES.keys()), expected_categories)

if __name__ == "__main__":
    unittest.main()

