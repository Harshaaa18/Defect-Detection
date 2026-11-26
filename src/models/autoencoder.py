"""
Convolutional Autoencoder baseline model for visual anomaly detection.
Trained on defect-free ('good') images. Anomaly score is computed from reconstruction residual map.
"""
import torch
import torch.nn as nn

class ConvAutoencoder(nn.Module):
    def __init__(self, in_channels: int = 3, latent_dim: int = 128):
        super().__init__()

        # Encoder: (3, 224, 224) -> (latent_dim, 14, 14)
        self.encoder = nn.Sequential(
            nn.Conv2d(in_channels, 32, kernel_size=4, stride=2, padding=1), # 112x112
            nn.BatchNorm2d(32),
            nn.LeakyReLU(0.2, inplace=True),

            nn.Conv2d(32, 64, kernel_size=4, stride=2, padding=1), # 56x56
            nn.BatchNorm2d(64),
            nn.LeakyReLU(0.2, inplace=True),

            nn.Conv2d(64, 128, kernel_size=4, stride=2, padding=1), # 28x28
            nn.BatchNorm2d(128),
            nn.LeakyReLU(0.2, inplace=True),

            nn.Conv2d(128, latent_dim, kernel_size=4, stride=2, padding=1), # 14x14
            nn.BatchNorm2d(latent_dim),
            nn.LeakyReLU(0.2, inplace=True)
        )

        # Decoder: (latent_dim, 14, 14) -> (3, 224, 224)
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(latent_dim, 128, kernel_size=4, stride=2, padding=1), # 28x28
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),

            nn.ConvTranspose2d(128, 64, kernel_size=4, stride=2, padding=1), # 56x56
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),

            nn.ConvTranspose2d(64, 32, kernel_size=4, stride=2, padding=1), # 112x112
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),

            nn.ConvTranspose2d(32, in_channels, kernel_size=4, stride=2, padding=1), # 224x224
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        latent = self.encoder(x)
        reconstruction = self.decoder(latent)
        return reconstruction

    def compute_anomaly_map(self, x: torch.Tensor) -> torch.Tensor:
        """
        Computes per-pixel reconstruction squared error map: shape (B, 1, H, W)
        """
        rec = self.forward(x)
        diff = (x - rec) ** 2
        anomaly_map = torch.mean(diff, dim=1, keepdim=True)
        return anomaly_map
