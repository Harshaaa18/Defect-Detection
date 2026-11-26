import os
import shutil
import json

project_root = r"d:\CAPSTONE-PROJECT"
dataset_dir = os.path.join(project_root, "DATASET")
samples_dir = os.path.join(project_root, "public", "samples")
os.makedirs(samples_dir, exist_ok=True)

manifest = []
categories = [
    "bottle", "cable", "capsule", "carpet", "grid", 
    "hazelnut", "leather", "metal_nut", "pill", "screw", 
    "tile", "toothbrush", "transistor", "wood", "zipper"
]

for cat in categories:
    cat_dir = os.path.join(dataset_dir, cat, "test")
    if not os.path.exists(cat_dir):
        continue
    out_cat_dir = os.path.join(samples_dir, cat)
    os.makedirs(out_cat_dir, exist_ok=True)
    
    # 1. Good sample
    good_dir = os.path.join(cat_dir, "good")
    if os.path.exists(good_dir):
        good_files = sorted(os.listdir(good_dir))
        if good_files:
            src = os.path.join(good_dir, good_files[0])
            dst_name = f"{cat}_good_{good_files[0]}"
            shutil.copy2(src, os.path.join(out_cat_dir, dst_name))
            manifest.append({
                "category": cat,
                "defect_type": "good",
                "is_defect": False,
                "filename": dst_name,
                "url": f"/samples/{cat}/{dst_name}",
                "label": f"{cat.title()}: Good (Nominal)"
            })
            
    # 2. Defect samples
    defect_dirs = [d for d in sorted(os.listdir(cat_dir)) if d != "good" and os.path.isdir(os.path.join(cat_dir, d))]
    for d in defect_dirs[:2]:
        d_path = os.path.join(cat_dir, d)
        files = sorted(os.listdir(d_path))
        if files:
            src = os.path.join(d_path, files[0])
            dst_name = f"{cat}_{d}_{files[0]}"
            shutil.copy2(src, os.path.join(out_cat_dir, dst_name))
            manifest.append({
                "category": cat,
                "defect_type": d,
                "is_defect": True,
                "filename": dst_name,
                "url": f"/samples/{cat}/{dst_name}",
                "label": f"{cat.title()}: {d.replace('_', ' ').title()}"
            })

manifest_path = os.path.join(samples_dir, "manifest.json")
with open(manifest_path, "w") as f:
    json.dump(manifest, f, indent=2)

print(f"Successfully generated {len(manifest)} sample images in {samples_dir}")
