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

# Upgrade pip and install CPU-only PyTorch with extra-index-url
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir torch torchvision --extra-index-url https://download.pytorch.org/whl/cpu

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
