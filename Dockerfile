# Build frontend first
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Install Python dependencies directly without requirements.txt
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    'uvicorn[standard]==0.24.0' \
    pydantic==2.5.0 \
    pydantic-settings==2.1.0 \
    langchain==0.0.340 \
    langchain-google-genai==0.0.5 \
    langchain-openai==0.0.5 \
    langchain-anthropic==0.1.1 \
    python-dotenv==1.0.0 \
    structlog==23.2.0 \
    python-multipart==0.0.6 \
    httpx==0.25.2 \
    requests==2.31.0 \
    bleach==6.1.0 \
    'sqlalchemy[asyncio]==2.0.23' \
    asyncpg==0.29.0 \
    aiosqlite==0.19.0 \
    alembic==1.13.0 \
    'python-jose[cryptography]==3.3.0' \
    'passlib[bcrypt]==1.7.4' \
    cryptography==41.0.7 \
    'pydantic[email]==2.5.0'

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY scripts/ ./scripts/

# Copy and prepare entrypoint
COPY railway-entrypoint.sh .
RUN chmod +x railway-entrypoint.sh

# Copy frontend build from the first stage
COPY --from=frontend-builder /app/frontend/dist ./static

# Expose port
EXPOSE 8000

# Run the application
CMD ["./railway-entrypoint.sh"]