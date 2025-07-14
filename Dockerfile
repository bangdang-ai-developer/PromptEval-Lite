FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for frontend build
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY scripts/ ./scripts/
COPY railway-entrypoint.sh .
RUN chmod +x railway-entrypoint.sh

# Build frontend
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Move built files to static directory
WORKDIR /app
RUN mkdir -p static && cp -r frontend/dist/* static/

# Clean up frontend source to reduce image size
RUN rm -rf frontend/node_modules frontend/src

# Expose port
EXPOSE 8000

# Use entrypoint script
CMD ["./railway-entrypoint.sh"]