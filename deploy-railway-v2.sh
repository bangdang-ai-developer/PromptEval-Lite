#!/bin/bash

# Railway Deployment Script for PromptEval-Lite (v2)

set -e

echo "🚂 Railway Deployment Script for PromptEval-Lite"
echo "=============================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed."
    echo "Please install it first:"
    echo "  curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway."
    echo "Please run: railway login"
    exit 1
fi

echo "✅ Railway CLI is installed and authenticated"

# Quick deployment for existing project
if [ -f ".railway/config.json" ]; then
    echo "✅ Railway project already linked"
    echo ""
    echo "🚀 Deploying to Railway..."
    railway up
    echo ""
    echo "✅ Deployment complete!"
    echo "🌐 Run 'railway open' to view your app"
    exit 0
fi

# New project setup
echo ""
echo "📁 Creating new Railway project..."
echo ""
echo "Choose deployment method:"
echo "1) Quick deploy (set environment variables in Railway dashboard)"
echo "2) Interactive setup (set environment variables now)"
read -p "Enter choice (1 or 2): " deploy_choice

case $deploy_choice in
    1)
        # Quick deploy
        echo ""
        read -p "Enter project name: " project_name
        railway init -n "$project_name"
        
        echo ""
        echo "🚀 Deploying to Railway..."
        railway up
        
        echo ""
        echo "✅ Deployment initiated!"
        echo ""
        echo "⚠️  IMPORTANT: Set your GOOGLE_API_KEY in the Railway dashboard:"
        echo "1. Run: railway open"
        echo "2. Go to 'Variables' tab"
        echo "3. Add GOOGLE_API_KEY with your API key"
        echo "4. Redeploy from the dashboard"
        ;;
        
    2)
        # Interactive setup
        echo ""
        read -p "Enter project name: " project_name
        
        # Collect environment variables first
        echo ""
        echo "🔐 Environment Variables Setup"
        read -p "Enter your Google API Key: " google_api_key
        
        read -p "Do you want to add OpenAI API Key? (y/n): " add_openai
        if [ "$add_openai" = "y" ]; then
            read -p "Enter OpenAI API Key: " openai_api_key
        fi
        
        read -p "Do you want to add Anthropic API Key? (y/n): " add_anthropic
        if [ "$add_anthropic" = "y" ]; then
            read -p "Enter Anthropic API Key: " anthropic_api_key
        fi
        
        # Create project
        railway init -n "$project_name"
        
        # Deploy first to create service
        echo ""
        echo "🚀 Initial deployment to create service..."
        railway up --detach
        
        # Wait a moment for service creation
        echo "Waiting for service creation..."
        sleep 5
        
        # Now set environment variables
        echo ""
        echo "🔐 Setting environment variables..."
        railway variables --set GOOGLE_API_KEY="$google_api_key"
        
        if [ ! -z "$openai_api_key" ]; then
            railway variables --set OPENAI_API_KEY="$openai_api_key"
        fi
        
        if [ ! -z "$anthropic_api_key" ]; then
            railway variables --set ANTHROPIC_API_KEY="$anthropic_api_key"
        fi
        
        # Set other default variables
        railway variables --set ENABLE_DATABASE=false
        railway variables --set DEFAULT_MODEL=gemini-2.5-flash
        railway variables --set EVALUATOR_MODEL=gemini-2.5-flash
        
        # Redeploy with environment variables
        echo ""
        echo "🚀 Redeploying with environment variables..."
        railway up
        
        echo ""
        echo "✅ Deployment complete!"
        ;;
        
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📊 Useful Railway commands:"
echo "  railway logs        - View application logs"
echo "  railway open        - Open app in browser"
echo "  railway status      - Check deployment status"
echo "  railway variables   - Manage environment variables"
echo "  railway domains     - Manage custom domains"

# Optional: Add PostgreSQL
echo ""
read -p "Do you want to add a PostgreSQL database? (y/n): " add_db
if [ "$add_db" = "y" ]; then
    echo "Adding PostgreSQL database..."
    railway add --database postgres
    railway variables --set ENABLE_DATABASE=true
    echo "✅ PostgreSQL database added"
    echo "Redeploying with database..."
    railway up
fi

echo ""
echo "🎉 Railway deployment complete!"