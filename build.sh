#!/bin/bash
# Build script for production deployment

echo "Starting production build..."

# Build frontend
echo "Building frontend..."
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Copy to static directory
cd ..
mkdir -p static
cp -r frontend/dist/* static/

echo "Build complete! Static files are in the static/ directory"

# Ensure the static directory has the right structure
if [ -f "static/index.html" ]; then
    echo "✓ Frontend build successful"
else
    echo "✗ Frontend build failed - index.html not found"
    exit 1
fi