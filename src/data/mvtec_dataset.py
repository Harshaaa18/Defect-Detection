"""
MVTec AD Dataset class for PyTorch.
Loads official train/test splits, images, labels (0=good, 1=anomalous), and pixel-level masks.
"""
import os
import glob
import torch
from torch.utils.data import Dataset
from PIL import Image
from src.data.transforms import get_data_transforms
from src.data.category_registry import get_category_config

class MVTecDataset(Dataset):
    def __init__(
        self,
        category: str,
        split: str = "train",
        data_root: str = None,
        img_size: int = 256,
        crop_size: int = 224
    ):
        super().__init__()
        self.category = category
        self.split = split
        self.img_size = img_size
        self.crop_size = crop_size

        if data_root is None:
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            candidates = [
                os.path.join(project_root, "DATASET"),
                os.path.join(project_root, "data", "raw", "mvtec_ad"),
                os.path.join(project_root, "data")
            ]
            for candidate in candidates:
                if os.path.exists(os.path.join(candidate, category)):
                    data_root = candidate
                    break
            if data_root is None:
                data_root = os.path.join(project_root, "DATASET")
        
        self.data_root = data_root
        self.cat_dir = os.path.join(self.data_root, category)

        self.img_transform, self.mask_transform, self.unnormalize = get_data_transforms(img_size, crop_size)

        # Load file paths
        self.img_paths = []
        self.labels = []
        self.mask_paths = []
        self.defect_types = []

        self._load_dataset()

    def _load_dataset(self):
        split_dir = os.path.join(self.cat_dir, self.split)
        if not os.path.exists(split_dir):
            raise FileNotFoundError(f"Split directory does not exist: {split_dir}")

        defect_types = sorted(os.listdir(split_dir))

        # GUARDRAIL ALERT: For train split, defect_types MUST contain ONLY 'good'
        if self.split == "train":
            if defect_types != ["good"]:
                raise RuntimeError(f"Train split guardrail failed for category {self.category}! Found: {defect_types}")

        for defect in defect_types:
            defect_dir = os.path.join(split_dir, defect)
            if not os.path.isdir(defect_dir):
                continue

            img_files = sorted(glob.glob(os.path.join(defect_dir, "*.png")) + glob.glob(os.path.join(defect_dir, "*.jpg")))

            for img_path in img_files:
                self.img_paths.append(img_path)
                self.defect_types.append(defect)
                label = 0 if defect == "good" else 1
                self.labels.append(label)

                # Mask path logic
                if defect == "good":
                    self.mask_paths.append(None)
                else:
                    # Ground truth mask path is in cat_dir/ground_truth/defect/name_mask.png
                    base_name = os.path.splitext(os.path.basename(img_path))[0]
                    mask_name = f"{base_name}_mask.png"
                    mask_path = os.path.join(self.cat_dir, "ground_truth", defect, mask_name)
                    if not os.path.exists(mask_path):
                        # Fallback try direct matching
                        mask_path = os.path.join(self.cat_dir, "ground_truth", defect, os.path.basename(img_path))
                    self.mask_paths.append(mask_path if os.path.exists(mask_path) else None)

    def __len__(self):
        return len(self.img_paths)

    def __getitem__(self, idx):
        img_path = self.img_paths[idx]
        label = self.labels[idx]
        mask_path = self.mask_paths[idx]

        # Load RGB image
        img = Image.open(img_path).convert("RGB")
        img_tensor = self.img_transform(img)

        # Load or generate mask
        if label == 0 or mask_path is None:
            mask_tensor = torch.zeros((1, self.crop_size, self.crop_size), dtype=torch.float32)
        else:
            mask_img = Image.open(mask_path).convert("L")
            mask_tensor = self.mask_transform(mask_img)
            mask_tensor = (mask_tensor > 0.5).float()

        return {
            "image": img_tensor,
            "label": torch.tensor(label, dtype=torch.long),
            "mask": mask_tensor,
            "img_path": img_path,
            "defect_type": self.defect_types[idx]
        }
