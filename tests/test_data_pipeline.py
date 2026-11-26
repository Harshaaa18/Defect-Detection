import os
import unittest
from src.data.category_registry import CATEGORIES, get_category_config
from src.data.transforms import get_data_transforms

class TestDataPipeline(unittest.TestCase):
    def test_category_configs(self):
        for cat in CATEGORIES:
            cfg = get_category_config(cat)
            self.assertIn("type", cfg)
            self.assertIn("augment", cfg)
            self.assertIn(cfg["type"], ["texture", "object"])

    def test_transforms_dimensions(self):
        img_transform, mask_transform, unnorm = get_data_transforms(img_size=256, crop_size=224)
        self.assertIsNotNone(img_transform)
        self.assertIsNotNone(mask_transform)
        self.assertIsNotNone(unnorm)

if __name__ == "__main__":
    unittest.main()
