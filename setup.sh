#!/bin/bash

echo "Setting up PromptEval-Lite..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env and add your GOOGLE_API_KEY"
    echo "You can get a Gemini API key from: https://makersuite.google.com/app/apikey"
    exit 1
fi

# Check if Google API key is set
if grep -q "your_gemini_api_key_here" .env; then
    echo "Please edit .env and add your GOOGLE_API_KEY"
    echo "You can get a Gemini API key from: https://makersuite.google.com/app/apikey"
    exit 1
fi

echo "Starting PromptEval-Lite server..."
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload