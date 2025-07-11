#!/bin/bash
# Script to run database migrations

# Check if docker-compose is running
if ! docker-compose ps | grep -q "prompteval-lite-postgres-1.*Up"; then
    echo "Starting PostgreSQL container..."
    docker-compose up -d postgres
    sleep 5
fi

# Run migrations
echo "Running database migrations..."
docker run --rm \
    --network prompteval-lite_default \
    -e DATABASE_URL=postgresql+asyncpg://prompteval:changeme@postgres:5432/prompteval \
    -e ENABLE_DATABASE=true \
    -v $(pwd):/app \
    -w /app \
    prompteval-lite-prompteval-lite \
    alembic upgrade head

echo "Migrations completed!"

# Show tables
echo "Database tables:"
docker exec prompteval-lite-postgres-1 psql -U prompteval -d prompteval -c '\dt'