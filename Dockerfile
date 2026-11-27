# ==========================================
# Stage 1: Build React Frontend (Vite)
# ==========================================
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Python Backend & UI Server
# ==========================================
FROM python:3.10-slim
WORKDIR /app

# Install minimal OS libraries for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install CPU-only PyTorch via pinned wheel URLs (avoids --extra-index-url network issues)
# torch 2.1.0+cpu and torchvision 0.16.0+cpu (~150MB total)
RUN pip install --no-cache-dir \
    "torch==2.1.0+cpu" \
    "torchvision==0.16.0+cpu" \
    --find-links https://download.pytorch.org/whl/torch_stable.html

# Install remaining backend dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files and memory banks
COPY . .

# Copy built frontend assets into dist
COPY --from=frontend-builder /app/dist /app/dist

EXPOSE 5000

ENV PORT=5000
ENV PYTHONUNBUFFERED=1

CMD ["python", "scripts/api_server.py"]
