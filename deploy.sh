#!/bin/bash
# Quick deployment helper script

echo "PromptEval-Lite Deployment Helper"
echo "================================="
echo ""
echo "Choose your deployment platform:"
echo "1) Render.com (Recommended - Full features)"
echo "2) Railway.app (Quick start with $5 credit)"
echo "3) Vercel (Frontend only)"
echo "4) Netlify (Frontend only)"
echo "5) Local with Docker"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "Render.com Deployment Steps:"
        echo "1. Ensure you have forked this repo to your GitHub"
        echo "2. Sign up at https://render.com"
        echo "3. Create new Web Service from your GitHub repo"
        echo "4. The render.yaml file will configure everything"
        echo ""
        echo "Required environment variables:"
        echo "- GOOGLE_API_KEY (get from Google AI Studio)"
        echo "- ENCRYPTION_KEY (generate with: python scripts/generate_fernet_key.py)"
        echo ""
        echo "Press Enter to generate an encryption key..."
        read
        python scripts/generate_fernet_key.py
        ;;
        
    2)
        echo ""
        echo "Railway Deployment Steps:"
        echo "1. Sign up at https://railway.app"
        echo "2. Click 'Deploy from GitHub repo'"
        echo "3. Select your forked repository"
        echo "4. Railway will auto-detect the Python app"
        echo "5. Add PostgreSQL from the plugin marketplace"
        echo "6. Set your environment variables"
        ;;
        
    3)
        echo ""
        echo "Vercel Deployment (Frontend Only):"
        echo "1. Install Vercel CLI: npm i -g vercel"
        echo "2. Run: vercel"
        echo "3. Follow the prompts"
        echo "4. Set ENABLE_DATABASE=false for backend"
        echo ""
        echo "Note: You'll need to deploy the backend separately"
        ;;
        
    4)
        echo ""
        echo "Netlify Deployment (Frontend Only):"
        echo "1. Push your code to GitHub"
        echo "2. Sign up at https://netlify.com"
        echo "3. Import project from GitHub"
        echo "4. Build settings are in netlify.toml"
        echo "5. Update API URL in netlify.toml"
        ;;
        
    5)
        echo ""
        echo "Local Docker Deployment:"
        echo "1. Copy .env.example to .env"
        echo "2. Add your GOOGLE_API_KEY to .env"
        echo "3. Run: docker-compose up --build"
        echo "4. Access at http://localhost:8000"
        ;;
        
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "For detailed instructions, see docs/FREE_DEPLOYMENT_GUIDE.md"