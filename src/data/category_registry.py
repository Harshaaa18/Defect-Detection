"""
Category registry for 15 MVTec AD categories.
Categorizes textures vs objects for augmentation flags during memory bank fitting.
"""

CATEGORIES = {
    # Textures (benefit from rotation / flip augmentations)
    "carpet": {"type": "texture", "augment": True},
    "grid": {"type": "texture", "augment": True},
    "leather": {"type": "texture", "augment": True},
    "tile": {"type": "texture", "augment": True},
    "wood": {"type": "texture", "augment": True},

    # Objects (fixed orientation, no random rotation/flip)
    "bottle": {"type": "object", "augment": False},
    "cable": {"type": "object", "augment": False},
    "capsule": {"type": "object", "augment": False},
    "hazelnut": {"type": "object", "augment": False},
    "metal_nut": {"type": "object", "augment": False},
    "pill": {"type": "object", "augment": False},
    "screw": {"type": "object", "augment": False},
    "toothbrush": {"type": "object", "augment": False},
    "transistor": {"type": "object", "augment": False},
    "zipper": {"type": "object", "augment": False},
}

TEXTURE_CATEGORIES = [k for k, v in CATEGORIES.items() if v["type"] == "texture"]
OBJECT_CATEGORIES = [k for k, v in CATEGORIES.items() if v["type"] == "object"]

def get_category_config(category: str) -> dict:
    if category not in CATEGORIES:
        raise ValueError(f"Unknown MVTec AD category: '{category}'. Valid: {list(CATEGORIES.keys())}")
    return CATEGORIES[category]
