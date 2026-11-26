"""
Pretrained CNN feature extraction backbone for PatchCore.
Supports WideResNet50_2 and ResNet18 backbones with hook registration on target feature layers.
"""
import torch
import torch.nn as nn
import torchvision.models as models

class BackboneFeatureExtractor(nn.Module):
    def __init__(self, backbone_name: str = "wide_resnet50_2", layer_names: list = None):
        super().__init__()
        self.backbone_name = backbone_name
        if layer_names is None:
            layer_names = ["layer2", "layer3"]
        self.layer_names = layer_names

        # Load pretrained backbone
        if backbone_name == "wide_resnet50_2":
            weights = models.Wide_ResNet50_2_Weights.DEFAULT
            self.model = models.wide_resnet50_2(weights=weights)
        elif backbone_name == "resnet18":
            weights = models.ResNet18_Weights.DEFAULT
            self.model = models.resnet18(weights=weights)
        else:
            raise ValueError(f"Unsupported backbone: {backbone_name}")

        # Freeze weights
        self.model.eval()
        for param in self.model.parameters():
            param.requires_grad = False

        self.feature_maps = {}
        self.hooks = []
        self._register_hooks()

    def _register_hooks(self):
        def get_hook(name):
            def hook(module, input, output):
                self.feature_maps[name] = output
            return hook

        for name, module in self.model.named_children():
            if name in self.layer_names:
                hook_handle = module.register_forward_hook(get_hook(name))
                self.hooks.append(hook_handle)

    def forward(self, x: torch.Tensor) -> dict:
        self.feature_maps.clear()
        _ = self.model(x)
        return {layer: self.feature_maps[layer] for layer in self.layer_names}

    def close(self):
        for hook in self.hooks:
            hook.remove()
