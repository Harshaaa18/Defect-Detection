"""
Flask REST API for MVTec AD Anomaly Detection Studio.
Provides real-time PatchCore inference, dataset browsing, image uploading, and GPU status diagnostics.
"""
import os
import sys
import io
import time
import base64
import json
import glob
import numpy as np
import cv2
import torch
from PIL import Image
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS

# Add project root to sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from src.data.category_registry import CATEGORIES, get_category_config
from src.data.transforms import get_data_transforms
from src.models.backbone import BackboneFeatureExtractor
from src.models.patchcore import PatchCore
from src.training.fit_memory_bank import fit_category_memory_bank

# MongoDB & Audit Logging Initialization
MONGO_CLIENT = None
MONGO_DB = None
MONGODB_URI = os.environ.get("MONGODB_URI")
LOCAL_HISTORY_PATH = os.path.join(PROJECT_ROOT, "experiments", "inspection_history.json")

def init_mongodb(uri=None):
    global MONGO_CLIENT, MONGO_DB, MONGODB_URI
    target_uri = uri or MONGODB_URI
    if not target_uri:
        return False, "No MONGODB_URI provided (using local audit log)"
    try:
        import pymongo
        client = pymongo.MongoClient(target_uri, serverSelectionTimeoutMS=3000)
        client.admin.command('ping')
        MONGO_CLIENT = client
        MONGO_DB = client.get_default_database() or client["mvtec_qc"]
        MONGODB_URI = target_uri
        return True, "Connected to MongoDB Atlas successfully"
    except Exception as e:
        MONGO_CLIENT = None
        MONGO_DB = None
        return False, f"MongoDB connection error: {str(e)}"

# Attempt initial connection
init_mongodb()

def record_inspection_log(log_entry):
    """Store inspection entry into MongoDB Atlas or fallback to local JSON history."""
    log_entry["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    # 1. Try MongoDB Atlas if connected
    if MONGO_DB is not None:
        try:
            MONGO_DB["inspections"].insert_one(dict(log_entry))
            return "mongodb"
        except Exception as e:
            print(f"[Audit Log] MongoDB insert error: {e}")

    # 2. Fallback to local JSON audit trail
    try:
        os.makedirs(os.path.dirname(LOCAL_HISTORY_PATH), exist_ok=True)
        history = []
        if os.path.exists(LOCAL_HISTORY_PATH):
            with open(LOCAL_HISTORY_PATH, "r") as f:
                history = json.load(f)
        history.insert(0, log_entry)
        history = history[:100] # keep latest 100
        with open(LOCAL_HISTORY_PATH, "w") as f:
            json.dump(history, f, indent=2)
        return "local_json"
    except Exception as e:
        print(f"[Audit Log] Failed to write local history: {e}")
        return "none"

app = Flask(__name__)
CORS(app)

DATASET_CANDIDATES = [
    os.path.join(PROJECT_ROOT, "DATASET"),
    os.path.join(PROJECT_ROOT, "data", "raw", "mvtec_ad"),
    os.path.join(PROJECT_ROOT, "data")
]

DEFAULT_THRESHOLDS = {
    "bottle": 2.70,
    "cable": 2.80,
    "capsule": 2.80,
    "carpet": 2.50,
    "grid": 2.60,
    "hazelnut": 2.75,
    "leather": 2.50,
    "metal_nut": 2.80,
    "pill": 2.80,
    "screw": 2.90,
    "tile": 2.60,
    "toothbrush": 2.70,
    "transistor": 2.80,
    "wood": 2.60,
    "zipper": 2.80
}

# Cache models & memory banks in memory for sub-30ms repeated inference
MODEL_CACHE = {}

def get_data_root_for_category(category: str):
    for root in DATASET_CANDIDATES:
        cat_path = os.path.join(root, category)
        if os.path.exists(cat_path):
            return root
    return DATASET_CANDIDATES[0]

def get_loaded_patchcore(category: str, backbone_name: str = "resnet18"):
    cache_key = f"{category}_{backbone_name}"
    if cache_key in MODEL_CACHE:
        return MODEL_CACHE[cache_key]

    mb_path = os.path.join(PROJECT_ROOT, "experiments", f"{category}_patchcore", "memory_bank.npy")
    if not os.path.exists(mb_path):
        # Auto-train / fit memory bank if missing
        print(f"[API Server] Memory bank missing for '{category}'. Fitting now...")
        fit_category_memory_bank(category=category, backbone_name=backbone_name)

    backbone = BackboneFeatureExtractor(backbone_name=backbone_name)
    patchcore = PatchCore(backbone=backbone)
    patchcore.load_memory_bank(mb_path)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    patchcore.backbone.to(device)

    MODEL_CACHE[cache_key] = patchcore
    return patchcore

@app.route("/api/status", methods=["GET"])
def get_system_status():
    has_cuda = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if has_cuda else "CPU"
    device_count = torch.cuda.device_count() if has_cuda else 0

    exp_dir = os.path.join(PROJECT_ROOT, "experiments")
    fitted = []
    if os.path.exists(exp_dir):
        for name in os.listdir(exp_dir):
            if name.endswith("_patchcore"):
                cat = name.replace("_patchcore", "")
                fitted.append(cat)

    return jsonify({
        "status": "healthy",
        "has_cuda": has_cuda,
        "device_name": device_name,
        "device_count": device_count,
        "torch_version": torch.__version__,
        "total_categories": len(CATEGORIES),
        "fitted_categories": sorted(fitted),
        "experiments_dir": exp_dir,
        "database": {
            "type": "mongodb_atlas" if MONGO_DB is not None else "local_json",
            "connected": MONGO_DB is not None,
            "status_message": "Connected to MongoDB Atlas" if MONGO_DB is not None else "Local JSON Audit Trail Active"
        }
    })

@app.route("/api/categories", methods=["GET"])
def list_categories():
    result = []
    for cat_name, cat_info in CATEGORIES.items():
        data_root = get_data_root_for_category(cat_name)
        cat_dir = os.path.join(data_root, cat_name)
        mb_path = os.path.join(PROJECT_ROOT, "experiments", f"{cat_name}_patchcore", "memory_bank.npy")
        
        train_count = 0
        train_good = os.path.join(cat_dir, "train", "good")
        if os.path.exists(train_good):
            train_count = len(os.listdir(train_good))

        test_count = 0
        test_dir = os.path.join(cat_dir, "test")
        defect_types = []
        if os.path.exists(test_dir):
            for d in os.listdir(test_dir):
                d_path = os.path.join(test_dir, d)
                if os.path.isdir(d_path):
                    defect_types.append(d)
                    test_count += len(glob.glob(os.path.join(d_path, "*.png")))

        result.append({
            "name": cat_name,
            "type": cat_info.get("type", "object"),
            "augment": cat_info.get("augment", False),
            "is_fitted": os.path.exists(mb_path),
            "default_threshold": DEFAULT_THRESHOLDS.get(cat_name, 0.50),
            "train_images": train_count,
            "test_images": test_count,
            "defect_types": defect_types
        })

    return jsonify({"categories": result})

@app.route("/api/dataset/browse", methods=["GET"])
def browse_dataset():
    category = request.args.get("category", "bottle")
    split = request.args.get("split", "test")
    data_root = get_data_root_for_category(category)
    split_dir = os.path.join(data_root, category, split)

    if not os.path.exists(split_dir):
        # Fallback to public/samples for cloud environments
        cat_samples_dir = os.path.join(PROJECT_ROOT, "public", "samples", category)
        if os.path.exists(cat_samples_dir):
            sample_imgs = []
            for img_file in sorted(os.listdir(cat_samples_dir)):
                if img_file.lower().endswith((".png", ".jpg", ".jpeg")):
                    sample_imgs.append({
                        "filename": img_file,
                        "rel_path": f"public/samples/{category}/{img_file}",
                        "url": f"/samples/{category}/{img_file}"
                    })
            return jsonify({
                "category": category,
                "split": "samples",
                "folders": [{
                    "defect_type": "curated_samples",
                    "count": len(sample_imgs),
                    "images": sample_imgs
                }]
            })
        return jsonify({"category": category, "split": split, "folders": []}), 200

    folders = []
    for defect_name in sorted(os.listdir(split_dir)):
        defect_path = os.path.join(split_dir, defect_name)
        if not os.path.isdir(defect_path):
            continue

        images = []
        for img_file in sorted(os.listdir(defect_path)):
            if img_file.lower().endswith((".png", ".jpg", ".jpeg")):
                rel_path = f"{category}/{split}/{defect_name}/{img_file}"
                images.append({
                    "filename": img_file,
                    "rel_path": rel_path,
                    "url": f"/api/dataset/image?path={rel_path}"
                })

        folders.append({
            "defect_type": defect_name,
            "count": len(images),
            "images": images
        })

    return jsonify({
        "category": category,
        "split": split,
        "folders": folders
    })

@app.route("/api/dataset/image", methods=["GET"])
def serve_dataset_image():
    rel_path = request.args.get("path")
    as_mask = request.args.get("mask", "0") == "1"

    if not rel_path:
        return jsonify({"error": "Missing path parameter"}), 400

    parts = rel_path.replace("\\", "/").strip("/").split("/")
    if len(parts) < 4:
        return jsonify({"error": "Invalid relative path format"}), 400

    category, split, defect, filename = parts[0], parts[1], parts[2], parts[3]
    data_root = get_data_root_for_category(category)

    if as_mask:
        # Ground truth mask naming convention: xxx_mask.png
        base_name, _ = os.path.splitext(filename)
        mask_candidates = [
            os.path.join(data_root, category, "ground_truth", defect, f"{base_name}_mask.png"),
            os.path.join(data_root, category, "ground_truth", defect, f"{base_name}.png")
        ]
        for m_path in mask_candidates:
            if os.path.exists(m_path):
                return send_file(m_path, mimetype="image/png")
        # Return empty 1x1 png if no mask (e.g. good)
        img = Image.new("L", (224, 224), 0)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return send_file(buf, mimetype="image/png")

    target_path = os.path.join(data_root, category, split, defect, filename)
    if not os.path.exists(target_path):
        return jsonify({"error": f"Image file not found: {target_path}"}), 404

    return send_file(target_path, mimetype="image/png")

@app.route("/api/predict", methods=["POST"])
def run_prediction():
    start_time = time.time()
    json_data = request.get_json(silent=True) or {}
    category = request.form.get("category") or json_data.get("category") or "bottle"
    threshold = float(request.form.get("threshold") or json_data.get("threshold") or DEFAULT_THRESHOLDS.get(category, 2.70))
    backbone_name = request.form.get("backbone") or json_data.get("backbone") or "resnet18"

    raw_pil_img = None
    defect_label = "unknown"
    dataset_rel_path = None
    mask_pil_img = None

    if "file" in request.files:
        uploaded_file = request.files["file"]
        raw_pil_img = Image.open(uploaded_file.stream).convert("RGB")
        fname = uploaded_file.filename or "user_upload"
        # Extract defect label if uploaded from bundled sample name like bottle_broken_large_000.png
        if fname.startswith(f"{category}_"):
            stripped = os.path.splitext(fname[len(category) + 1:])[0]
            parts_f = stripped.rsplit("_", 1)
            defect_label = parts_f[0] if len(parts_f) == 2 and parts_f[1].isdigit() else stripped
        else:
            defect_label = "user_upload"
    elif json_data.get("dataset_path"):
        dataset_rel_path = json_data.get("dataset_path")
        parts = dataset_rel_path.replace("\\", "/").strip("/").split("/")
        if len(parts) >= 4:
            category, split, defect, filename = parts[0], parts[1], parts[2], parts[3]
            defect_label = defect
            data_root = get_data_root_for_category(category)
            full_img_path = os.path.join(data_root, category, split, defect, filename)
            if os.path.exists(full_img_path):
                raw_pil_img = Image.open(full_img_path).convert("RGB")
                
                # Check ground truth mask
                base_name, _ = os.path.splitext(filename)
                mask_candidate = os.path.join(data_root, category, "ground_truth", defect, f"{base_name}_mask.png")
                if os.path.exists(mask_candidate):
                    mask_pil_img = Image.open(mask_candidate).convert("L")

        # Fallback to public/samples (for cloud deployments where DATASET/ is excluded)
        if raw_pil_img is None:
            clean_rel = dataset_rel_path.replace("\\", "/").lstrip("/")
            # Check exact file candidate in public/
            candidates = [
                os.path.join(PROJECT_ROOT, "public", clean_rel),
                os.path.join(PROJECT_ROOT, clean_rel),
                os.path.join(PROJECT_ROOT, "public", "samples", category, os.path.basename(clean_rel))
            ]
            # Try to match defect name if available
            if len(parts) >= 3:
                if parts[0] == "samples":
                    fname_base = os.path.splitext(parts[-1])[0]
                    if fname_base.startswith(f"{category}_"):
                        stripped = fname_base[len(category) + 1:]
                        parts_f = stripped.rsplit("_", 1)
                        defect_label = parts_f[0] if len(parts_f) == 2 and parts_f[1].isdigit() else stripped
                    else:
                        defect_label = fname_base
                else:
                    defect_label = parts[2] if len(parts) >= 4 else parts[1]
                candidates.append(os.path.join(PROJECT_ROOT, "public", "samples", category, f"{category}_{defect_label}_{parts[-1]}"))
            
            for cand in candidates:
                if os.path.exists(cand):
                    raw_pil_img = Image.open(cand).convert("RGB")
                    break
            
            # If still None, pick any sample image for this category
            if raw_pil_img is None:
                cat_sample_dir = os.path.join(PROJECT_ROOT, "public", "samples", category)
                if os.path.exists(cat_sample_dir):
                    sample_files = [f for f in sorted(os.listdir(cat_sample_dir)) if f.lower().endswith((".png", ".jpg"))]
                    if sample_files:
                        chosen = sample_files[0]
                        raw_pil_img = Image.open(os.path.join(cat_sample_dir, chosen)).convert("RGB")
                        defect_label = "sample"

    if raw_pil_img is None:
        return jsonify({"error": "No image provided via file upload or dataset_path"}), 400

    # Preprocessing
    img_transform, mask_transform, unnormalize = get_data_transforms(img_size=256, crop_size=224)
    img_tensor = img_transform(raw_pil_img).unsqueeze(0) # (1, 3, 224, 224)

    # Load model & predict
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    patchcore = get_loaded_patchcore(category, backbone_name=backbone_name)
    
    pred_res = patchcore.predict(img_tensor, device=device)
    score = float(pred_res["image_score"])
    heatmap = pred_res["anomaly_map"]
    
    is_anomalous = bool(score >= threshold)
    latency_ms = round((time.time() - start_time) * 1000, 1)

    # Generate visualizations
    img_unnorm = unnormalize(img_tensor.squeeze(0)).permute(1, 2, 0).numpy()
    img_unnorm = np.clip(img_unnorm, 0, 1)

    norm_map = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min() + 1e-8)
    colored_map = cv2.applyColorMap(np.uint8(255 * norm_map), cv2.COLORMAP_JET)
    colored_map = cv2.cvtColor(colored_map, cv2.COLOR_BGR2RGB) / 255.0
    blended = 0.5 * img_unnorm + 0.5 * colored_map
    blended_u8 = np.uint8(255 * blended)

    # Convert images to base64
    def pil_to_base64(img):
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

    input_b64 = pil_to_base64(Image.fromarray(np.uint8(255 * img_unnorm)))
    heatmap_b64 = pil_to_base64(Image.fromarray(blended_u8))
    raw_heatmap_b64 = pil_to_base64(Image.fromarray(np.uint8(255 * norm_map)))
    
    mask_b64 = None
    if mask_pil_img is not None:
        mask_resized = mask_pil_img.resize((224, 224))
        mask_b64 = pil_to_base64(mask_resized)

    # Record inspection log in MongoDB Atlas or local JSON audit trail
    audit_storage = record_inspection_log({
        "category": category,
        "defect_type": defect_label,
        "score": round(score, 4),
        "threshold": round(threshold, 4),
        "is_anomalous": is_anomalous,
        "status_label": "DEFECT DETECTED" if is_anomalous else "NORMAL (PASS)",
        "confidence": round(min(1.0, max(0.5, (score / threshold) * 0.7 if is_anomalous else (1.0 - (score / threshold)) * 0.7)), 3),
        "device": f"{'CUDA (' + torch.cuda.get_device_name(0) + ')' if device.type == 'cuda' else 'CPU'}",
        "latency_ms": latency_ms
    })

    return jsonify({
        "success": True,
        "category": category,
        "defect_type": defect_label,
        "score": round(score, 4),
        "threshold": round(threshold, 4),
        "is_anomalous": is_anomalous,
        "status_label": "DEFECT DETECTED" if is_anomalous else "NORMAL (PASS)",
        "confidence": round(min(1.0, max(0.5, (score / threshold) * 0.7 if is_anomalous else (1.0 - (score / threshold)) * 0.7)), 3),
        "device": f"{'CUDA (' + torch.cuda.get_device_name(0) + ')' if device.type == 'cuda' else 'CPU'}",
        "latency_ms": latency_ms,
        "audit_storage": audit_storage,
        "input_image": input_b64,
        "heatmap_image": heatmap_b64,
        "raw_heatmap_image": raw_heatmap_b64,
        "mask_image": mask_b64
    })

@app.route("/api/train_category", methods=["POST"])
def train_category():
    start_time = time.time()
    category = request.json.get("category", "zipper")
    backbone = request.json.get("backbone", "resnet18")
    coreset_ratio = float(request.json.get("coreset_ratio", 0.10))
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[API Server] Training memory bank for '{category}' on {device}...")
    
    patchcore = fit_category_memory_bank(
        category=category,
        backbone_name=backbone,
        coreset_sampling_ratio=coreset_ratio
    )
    
    # Update cache
    cache_key = f"{category}_{backbone}"
    MODEL_CACHE[cache_key] = patchcore

    duration = round(time.time() - start_time, 2)
    return jsonify({
        "success": True,
        "category": category,
        "training_time_seconds": duration,
        "memory_bank_size": int(patchcore.memory_bank.shape[0]),
        "device": str(device)
    })

@app.route("/api/benchmark", methods=["GET"])
def get_benchmark_results():
    """Return live benchmark results from the experiments directory JSON, if available."""
    json_path = os.path.join(PROJECT_ROOT, "experiments", "all_categories_benchmark.json")
    if not os.path.exists(json_path):
        return jsonify({"error": "Benchmark not yet run. Execute scripts/run_all_categories.py first.", "data": []}), 404
    with open(json_path, "r") as f:
        import json as _json
        data = _json.load(f)
    return jsonify({"data": data, "source": json_path})

@app.route("/api/inspections", methods=["GET"])
def get_inspections():
    """Fetch latest inspection logs from MongoDB Atlas or local JSON."""
    limit = int(request.args.get("limit", 20))
    if MONGO_DB is not None:
        try:
            records = list(MONGO_DB["inspections"].find({}, {"_id": 0}).sort("timestamp", -1).limit(limit))
            return jsonify({
                "source": "mongodb_atlas",
                "count": len(records),
                "inspections": records
            })
        except Exception as e:
            print(f"[API] Error reading MongoDB inspections: {e}")

    # Fallback to local file
    records = []
    if os.path.exists(LOCAL_HISTORY_PATH):
        try:
            with open(LOCAL_HISTORY_PATH, "r") as f:
                records = json.load(f)[:limit]
        except Exception:
            records = []
    return jsonify({
        "source": "local_json",
        "count": len(records),
        "inspections": records
    })

@app.route("/api/config/mongodb", methods=["POST"])
def configure_mongodb():
    """Configure or test a new MongoDB connection URI dynamically."""
    data = request.json or {}
    uri = data.get("uri")
    if not uri:
        return jsonify({"success": False, "error": "No URI provided"}), 400
    
    success, message = init_mongodb(uri=uri)
    return jsonify({
        "success": success,
        "connected": success,
        "message": message,
        "database": "mongodb_atlas" if success else "local_json"
    })

# Serve Built React Frontend from dist/
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend_ui(path):
    if path.startswith("api/"):
        return jsonify({"error": "Endpoint not found"}), 404
    # Check for direct file in dist
    if path != "" and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    # Check public folder (e.g. /samples/...)
    public_file = os.path.join(PROJECT_ROOT, "public", path)
    if path != "" and os.path.exists(public_file):
        return send_from_directory(os.path.join(PROJECT_ROOT, "public"), path)
    # Fallback to SPA index.html
    index_file = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_file):
        return send_from_directory(DIST_DIR, "index.html")
    return jsonify({
        "status": "healthy",
        "message": "Flask API running. Build frontend with 'npm run build' to view UI here."
    }), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting MVTec Anomaly Detection API Server on http://localhost:{port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
