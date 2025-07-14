FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including Node.js
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Create requirements.txt inline to avoid corruption issues
RUN echo "fastapi==0.104.1" > requirements.txt && \
    echo "uvicorn[standard]==0.24.0" >> requirements.txt && \
    echo "pydantic==2.5.0" >> requirements.txt && \
    echo "pydantic-settings==2.1.0" >> requirements.txt && \
    echo "langchain==0.0.340" >> requirements.txt && \
    echo "langchain-google-genai==0.0.5" >> requirements.txt && \
    echo "python-dotenv==1.0.0" >> requirements.txt && \
    echo "structlog==23.2.0" >> requirements.txt && \
    echo "python-multipart==0.0.6" >> requirements.txt && \
    echo "httpx==0.25.2" >> requirements.txt && \
    echo "requests==2.31.0" >> requirements.txt && \
    echo "bleach==6.1.0" >> requirements.txt && \
    echo "sqlalchemy[asyncio]==2.0.23" >> requirements.txt && \
    echo "asyncpg==0.29.0" >> requirements.txt && \
    echo "aiosqlite==0.19.0" >> requirements.txt && \
    echo "alembic==1.13.0" >> requirements.txt && \
    echo "python-jose[cryptography]==3.3.0" >> requirements.txt && \
    echo "passlib[bcrypt]==1.7.4" >> requirements.txt && \
    echo "cryptography==41.0.7" >> requirements.txt && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY scripts/ ./scripts/

# Copy entrypoint
COPY railway-entrypoint.sh .
RUN chmod +x railway-entrypoint.sh

# Build frontend
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build || npx vite build

# Move built files to static directory
WORKDIR /app
RUN mkdir -p /app/static && cp -r frontend/dist/* /app/static/

# Expose port
EXPOSE 8000

# Use entrypoint script
CMD ["./railway-entrypoint.sh"]