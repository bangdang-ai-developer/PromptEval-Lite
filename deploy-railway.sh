#!/bin/bash

# Railway Deployment Script for PromptEval-Lite

set -e

echo "🚂 Railway Deployment Script for PromptEval-Lite"
echo "=============================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed."
    echo "Please install it first:"
    echo "  npm install -g @railway/cli"
    echo "or"
    echo "  brew install railway"
    exit 1
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway."
    echo "Please run: railway login"
    exit 1
fi

echo "✅ Railway CLI is installed and authenticated"

# Function to create or link project
setup_project() {
    echo ""
    echo "📁 Setting up Railway project..."
    
    if [ -f ".railway/config.json" ]; then
        echo "✅ Railway project already linked"
    else
        echo "Choose an option:"
        echo "1) Link to existing Railway project"
        echo "2) Create new Railway project"
        read -p "Enter choice (1 or 2): " choice
        
        case $choice in
            1)
                railway link
                ;;
            2)
                read -p "Enter project name: " project_name
                railway init -n "$project_name"
                ;;
            *)
                echo "Invalid choice"
                exit 1
                ;;
        esac
    fi
}

# Function to set environment variables
setup_env_vars() {
    echo ""
    echo "🔐 Setting up environment variables..."
    
    # First, ensure a service is linked
    echo "Linking service..."
    railway service || railway link
    
    # Check if GOOGLE_API_KEY is already set
    if railway variables --json | grep -q "GOOGLE_API_KEY"; then
        echo "✅ GOOGLE_API_KEY already set"
    else
        echo "❌ GOOGLE_API_KEY not set"
        read -p "Enter your Google API Key: " google_api_key
        railway variables --set GOOGLE_API_KEY="$google_api_key"
    fi
    
    # Optional: Set up database
    read -p "Do you want to add a PostgreSQL database? (y/n): " add_db
    if [ "$add_db" = "y" ]; then
        echo "Adding PostgreSQL database..."
        railway add --database postgres
        railway variables --set ENABLE_DATABASE=true
        echo "✅ PostgreSQL database added"
    fi
}

# Function to deploy
deploy() {
    echo ""
    echo "🚀 Deploying to Railway..."
    
    # Deploy using Railway
    railway up
    
    echo ""
    echo "✅ Deployment initiated!"
    echo ""
    echo "📊 View deployment status:"
    echo "  railway logs"
    echo ""
    echo "🌐 Open your app:"
    echo "  railway open"
    echo ""
    echo "⚙️  Manage environment variables:"
    echo "  railway variables"
}

# Main execution
setup_project
setup_env_vars
deploy

echo ""
echo "🎉 Railway deployment script completed!"
echo ""
echo "Useful Railway commands:"
echo "  railway logs        - View application logs"
echo "  railway open        - Open app in browser"
echo "  railway status      - Check deployment status"
echo "  railway variables   - Manage environment variables"
echo "  railway domains     - Manage custom domains"