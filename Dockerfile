FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY scripts/ ./scripts/

# Copy entrypoint
COPY railway-entrypoint.sh .
RUN chmod +x railway-entrypoint.sh

# Create static directory
RUN mkdir -p /app/static

# Copy only the built frontend files (not source)
COPY frontend/dist/ ./static/

# Expose port
EXPOSE 8000

# Use entrypoint script
CMD ["./railway-entrypoint.sh"]