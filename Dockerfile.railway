FROM node:18-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY scripts/ ./scripts/
COPY railway-entrypoint.sh .

# Copy frontend build from the previous stage
COPY --from=frontend-builder /frontend/dist ./static

# Create necessary directories
RUN mkdir -p /app/static

# Make entrypoint script executable
RUN chmod +x railway-entrypoint.sh

# Expose port (Railway will override this)
EXPOSE 8000

# Use entrypoint script to handle database initialization
CMD ["./railway-entrypoint.sh"]