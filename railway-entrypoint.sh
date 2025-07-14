#!/bin/bash

# Railway Entrypoint Script - Handles database initialization

echo "🚀 Starting PromptEval-Lite..."

# Check if database is enabled
if [ "$ENABLE_DATABASE" = "true" ]; then
    echo "🗄️  Database is enabled. Running migrations..."
    
    # Wait for database to be ready
    echo "Waiting for database connection..."
    python scripts/verify_db.py
    
    if [ $? -eq 0 ]; then
        echo "✅ Database connection successful"
        
        # Run Alembic migrations
        echo "Running database migrations..."
        alembic upgrade head
        
        if [ $? -eq 0 ]; then
            echo "✅ Database migrations completed"
        else
            echo "❌ Database migration failed"
            exit 1
        fi
    else
        echo "❌ Database connection failed"
        exit 1
    fi
else
    echo "📌 Running in stateless mode (no database)"
fi

# Start the application
echo "🌟 Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}