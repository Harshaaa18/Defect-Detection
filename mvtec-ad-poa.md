# Plan of Action — Visual Anomaly Detection on MVTec AD
### PatchCore-based defect detection & localization

---

## 1. Objective

Build an unsupervised visual anomaly detection system trained only on defect-free ("good")
images, evaluated on its ability to (a) classify whether a test image is anomalous
(image-level) and (b) localize *where* the anomaly is (pixel-level), across all 15 MVTec AD
object/texture categories.

**Target benchmark**: mean image-level AUROC ≥ 0.98, mean pixel-level AUROC ≥ 0.97 across
categories (PatchCore-class performance on published leaderboards).

---

## 2. Scope & constraints

- Dataset: MVTec AD (15 categories, ~5,000 images total, official train/test split — do not
  reshuffle across the provided split).
- Training data is **good-only** per category — no negative examples, no fine-tuning labels.
- One model (memory bank / statistics) per category — not a single shared model.
- Primary method: **PatchCore**. PaDiM and a reconstruction-based autoencoder are built as
  baselines for comparison, not as the primary deliverable.

---

## 3. Phased plan

### Phase 0 — Setup (Day 1)
- [ ] Create repo from the agreed project structure.
- [ ] `pip install torch torchvision faiss-cpu scikit-learn opencv-python pillow pyyaml`
- [ ] Download MVTec AD, verify checksum, unzip into `data/raw/mvtec_ad/`.
- [ ] Write `tests/test_dataset_splits.py` first — assert `train/` contains zero defective
      images per category before writing anything else. This is the single most important
      guardrail in the whole project.

### Phase 1 — Data pipeline (Days 2–3)
- [ ] `src/data/mvtec_dataset.py`: `MVTecDataset(category, split)` returning
      `(image_tensor, label, mask_tensor)`; for `good` test images and all train images,
      `mask_tensor` = all-zero.
- [ ] `src/data/transforms.py`: resize to 256, center-crop to 224, ImageNet normalization
      (required if using an ImageNet-pretrained backbone).
- [ ] `src/data/category_registry.py`: list all 15 categories, flag texture vs. object
      (textures — carpet, grid, leather, tile, wood — often benefit from rotation/flip
      augmentation during memory-bank construction; objects usually don't, since orientation
      is meaningful).
- [ ] Sanity check: visualize a batch of train images + a batch of test images with masks
      overlaid, per category, in `01_eda_per_category.ipynb`.

### Phase 2 — Baseline: reconstruction autoencoder (Days 4–5)
- [ ] `src/models/autoencoder.py`: simple conv encoder/decoder.
- [ ] `src/training/train_reconstruction.py`: train on good-only images, MSE loss.
- [ ] Anomaly score = per-pixel reconstruction error map.
- [ ] Run on 2–3 categories only (e.g. bottle, hazelnut, carpet) to get a fast, rough
      performance floor before investing in PatchCore. Expect this baseline to underperform
      — that's expected and fine, it's a sanity checkpoint, not the deliverable.

### Phase 3 — Primary method: PatchCore (Days 6–9)
- [ ] `src/models/backbone.py`: load pretrained WideResNet50 (or ResNet18 for faster
      iteration), freeze weights, hook intermediate layers (typically layer2 + layer3).
- [ ] `src/models/patchcore.py`:
  - Extract locally-aware patch features from good-only training images.
  - Build the memory bank; apply **coreset subsampling** (greedy k-center) to keep it
    tractable (~1–10% of all patch features).
  - At inference: for each test patch, find nearest neighbour in memory bank (FAISS for
    speed) → per-patch anomaly score → upsample to full anomaly heatmap → image-level score
    = max (or top-k mean) of the heatmap.
- [ ] `src/training/fit_memory_bank.py`: no gradient descent — just feature extraction +
      coreset fitting; save the memory bank to `experiments/<category>_patchcore_<run_id>/`.
- [ ] Run on all 15 categories via `scripts/run_all_categories.sh`.

### Phase 4 — Evaluation (Days 10–11)
- [ ] `src/evaluation/metrics.py`: image-level AUROC, pixel-level AUROC, PRO score.
- [ ] `src/evaluation/evaluate.py`: run all fitted memory banks against their test sets,
      aggregate into a single results table (per-category + mean).
- [ ] Compare PatchCore vs. autoencoder baseline vs. (optional) PaDiM on the same categories.
- [ ] Save qualitative outputs: heatmap overlays for best-case and worst-case predictions per
      category, into `experiments/.../anomaly_maps/`.

### Phase 5 — Ablation & tuning (Days 12–13)
- [ ] Backbone choice: ResNet18 vs WideResNet50 — speed/accuracy trade-off.
- [ ] Coreset subsampling ratio: sweep 1%, 5%, 10%, 25% — memory bank size vs. AUROC.
- [ ] Feature layer choice: layer2 only vs layer2+layer3 vs layer2+layer3+layer4.
- [ ] Image resolution: 224 vs 256 vs 320.
- [ ] Record every run's config + result in `experiments/` so ablations are reproducible and
      comparable (this is why `config_used.yaml` gets saved alongside every run).

### Phase 6 — Packaging & report (Days 14–15)
- [ ] `scripts/infer_single_image.py`: CLI script — given an image path + category, output
      anomaly score + heatmap overlay PNG.
- [ ] Final results table + heatmap gallery + method comparison written up (per capstone
      report template, if applicable).
- [ ] README with setup instructions, reproduction steps, and final benchmark numbers.

---

## 4. Deliverables checklist

- [ ] Working PatchCore pipeline covering all 15 MVTec AD categories.
- [ ] Reproducible per-category results table (image-level AUROC, pixel-level AUROC, PRO).
- [ ] Baseline comparison (autoencoder vs. PatchCore, minimum).
- [ ] Qualitative heatmap gallery (best/worst cases per category).
- [ ] Single-image inference script.
- [ ] Ablation results (backbone, coreset ratio, feature layers).
- [ ] Final written report + README.

---

## 5. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Train/test leakage (defective image in training split) | Hard assertion in `test_dataset_splits.py`, run in CI before every training script. |
| Memory bank too large to fit in RAM / too slow for kNN at inference | Coreset subsampling (Phase 5) + FAISS approximate search instead of brute-force. |
| Category-specific augmentation hurting object categories | Keep texture vs. object flag in `category_registry.py`; don't apply rotation/flip blindly to all categories. |
| Overfitting hyperparameters to 1–2 "easy" categories | Always report the full 15-category mean, not cherry-picked categories, in every results table. |
| Reconstruction baseline eating too much time before PatchCore starts | Time-box Phase 2 to 2 days max; it's a floor check, not the deliverable. |

---

## 6. Tech stack recap

- **Framework**: PyTorch + torchvision (pretrained backbones)
- **Nearest-neighbour search**: FAISS
- **Metrics**: scikit-learn (`roc_auc_score`) + custom PRO implementation
- **Config**: YAML via `src/utils/config.py`
- **Visualization**: OpenCV/Matplotlib for heatmap overlays
