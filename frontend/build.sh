#!/bin/bash

echo "Building PromptEval-Lite Frontend..."

# Install dependencies
npm install

# Build the project
npm run build

# Copy built files to backend static directory
if [ -d "dist" ]; then
    echo "Copying built files to backend..."
    mkdir -p ../static
    cp -r dist/* ../static/
    echo "✅ Build completed successfully!"
    echo "📁 Files copied to ../static/"
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi