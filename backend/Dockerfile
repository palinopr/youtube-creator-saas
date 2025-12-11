FROM python:3.12-slim

# Install system dependencies including FFmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better caching
# When built from repo root with RAILWAY_DOCKERFILE_PATH=backend/Dockerfile
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code from backend directory
COPY backend/ .

# Create temp directory for clips
RUN mkdir -p /tmp/clip_renders

EXPOSE 8000

# Run without reload for production
# Railway provides PORT env var, defaults to 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

