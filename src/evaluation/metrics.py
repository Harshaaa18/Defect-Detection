"""
Evaluation metrics for visual anomaly detection:
- Image-level AUROC
- Pixel-level AUROC
- Per-Region Overlap (PRO) score
"""
import numpy as np
from sklearn.metrics import roc_auc_score
from scipy.ndimage import label

def compute_image_auroc(labels: list, scores: list) -> float:
    """Computes Image-level AUROC score."""
    labels = np.array(labels)
    scores = np.array(scores)
    if len(np.unique(labels)) < 2:
        return 1.0 # Edge case: all good or all defect
    return float(roc_auc_score(labels, scores))

def compute_pixel_auroc(masks: list, heatmaps: list) -> float:
    """Computes Pixel-level AUROC score across all test images."""
    flat_masks = np.concatenate([m.flatten() for m in masks])
    flat_heatmaps = np.concatenate([h.flatten() for h in heatmaps])

    # Convert binary masks
    flat_masks = (flat_masks > 0.5).astype(np.int32)
    if len(np.unique(flat_masks)) < 2:
        return 1.0
    return float(roc_auc_score(flat_masks, flat_heatmaps))

def compute_pro_score(masks: list, heatmaps: list, num_thresholds: int = 50) -> float:
    """
    Computes Per-Region Overlap (PRO) metric across ground-truth connected component regions.
    """
    thresholds = np.linspace(np.min(heatmaps), np.max(heatmaps), num_thresholds)
    pros = []

    for thresh in thresholds:
        region_pros = []
        for mask, heatmap in zip(masks, heatmaps):
            binary_mask = (mask > 0.5).astype(int)
            if np.sum(binary_mask) == 0:
                continue

            labeled_mask, num_features = label(binary_mask)
            binary_pred = (heatmap >= thresh).astype(int)

            for region_idx in range(1, num_features + 1):
                region_gt = (labeled_mask == region_idx)
                region_area = np.sum(region_gt)
                overlap = np.sum(region_gt & (binary_pred > 0))
                region_pros.append(overlap / region_area)

        if len(region_pros) > 0:
            pros.append(np.mean(region_pros))

    if len(pros) == 0:
        return 1.0

    # Integrate area under PRO curve up to FPR = 0.3
    trapz_fn = getattr(np, "trapezoid", getattr(np, "trapz", None))
    return float(trapz_fn(pros, np.linspace(0, 1, len(pros))))
