#!/bin/bash

# Railway Database Setup Script

echo "🗄️  Setting up PostgreSQL for PromptEval-Lite"
echo "==========================================="

# Check if already in a Railway project
if [ ! -f ".railway/config.json" ]; then
    echo "❌ No Railway project found. Please run deployment script first."
    exit 1
fi

# Add PostgreSQL
echo "📦 Adding PostgreSQL to your Railway project..."
railway add --database postgres

# Set database environment variables
echo "🔧 Configuring database environment..."
railway variables --set ENABLE_DATABASE=true

# Set JWT and encryption keys if not already set
echo "🔐 Setting security keys..."
railway variables --set JWT_SECRET_KEY=$(openssl rand -base64 32)
railway variables --set JWT_ALGORITHM=HS256
railway variables --set JWT_EXPIRATION_HOURS=24

# Generate a proper Fernet key for encryption
FERNET_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
railway variables --set ENCRYPTION_KEY=$FERNET_KEY

echo ""
echo "✅ Database configuration complete!"
echo ""
echo "📝 Next steps:"
echo "1. Deploy your application: railway up"
echo "2. Run database migrations after deployment"
echo ""
echo "To run migrations after deployment:"
echo "  railway run python scripts/init_db.py"
echo "  railway run alembic upgrade head"
echo ""
echo "🔍 To verify your database connection:"
echo "  railway run python scripts/verify_db.py"