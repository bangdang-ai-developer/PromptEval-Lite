#!/bin/bash

echo "Starting PromptEval-Lite Frontend Development Server..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)

if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    echo "Please upgrade Node.js to version 18 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies if not present
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start development server
echo "🚀 Starting development server..."
echo "Frontend will be available at: http://localhost:5173"
echo "Make sure the backend is running at: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"

npm run dev