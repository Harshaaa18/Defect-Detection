"""
Image transforms and normalization pipelines for MVTec AD anomaly detection.
"""
from torchvision import transforms
from PIL import Image

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

def get_data_transforms(img_size: int = 256, crop_size: int = 224):
    """
    Returns image transform and mask transform pipelines.
    Image transform: Resize -> CenterCrop -> ToTensor -> Normalize (ImageNet)
    Mask transform: Resize -> CenterCrop -> ToTensor (Binary 0 or 1)
    """
    img_transform = transforms.Compose([
        transforms.Resize((img_size, img_size), interpolation=transforms.InterpolationMode.BICUBIC),
        transforms.CenterCrop(crop_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])

    mask_transform = transforms.Compose([
        transforms.Resize((img_size, img_size), interpolation=transforms.InterpolationMode.NEAREST),
        transforms.CenterCrop(crop_size),
        transforms.ToTensor()
    ])

    # Unnormalize transform for visualization
    unnormalize = transforms.Compose([
        transforms.Normalize(
            mean=[-m / s for m, s in zip(IMAGENET_MEAN, IMAGENET_STD)],
            std=[1.0 / s for s in IMAGENET_STD]
        )
    ])

    return img_transform, mask_transform, unnormalize
