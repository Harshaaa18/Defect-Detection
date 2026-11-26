"""
Training pipeline for Convolutional Autoencoder baseline on MVTec AD defect-free images.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from src.data.mvtec_dataset import MVTecDataset
from src.models.autoencoder import ConvAutoencoder

def train_autoencoder(
    category: str,
    epochs: int = 15,
    batch_size: int = 8,
    lr: float = 1e-3,
    output_dir: str = "experiments"
):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training Autoencoder baseline for category '{category}' on {device}...")

    train_dataset = MVTecDataset(category=category, split="train")
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, drop_last=False)

    model = ConvAutoencoder().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.MSELoss()

    model.train()
    for epoch in range(epochs):
        running_loss = 0.0
        for batch in train_loader:
            imgs = batch["image"].to(device)
            optimizer.zero_grad()
            recs = model(imgs)
            loss = criterion(recs, imgs)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * imgs.size(0)

        epoch_loss = running_loss / len(train_dataset)
        if (epoch + 1) % 5 == 0 or epoch == epochs - 1:
            print(f"Epoch [{epoch+1}/{epochs}] Loss: {epoch_loss:.6f}")

    save_dir = os.path.join(output_dir, f"{category}_autoencoder")
    os.makedirs(save_dir, exist_ok=True)
    model_path = os.path.join(save_dir, "model.pth")
    torch.save(model.state_dict(), model_path)
    print(f"Saved trained autoencoder model to {model_path}")
    return model

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", type=str, default="bottle")
    parser.add_argument("--epochs", type=int, default=10)
    args = parser.parse_args()
    train_autoencoder(args.category, epochs=args.epochs)
