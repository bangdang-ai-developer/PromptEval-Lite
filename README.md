# PromptEval-Lite

A zero-storage prompt testing and enhancement microservice with a beautiful web interface, built with FastAPI, LangChain, and Gemini 1.5 Flash.

## Features

### Core Features
- **Test prompts** against synthetic test cases generated on-the-fly
- **Enhance prompts** using AI-powered optimization
- **Zero persistence** - all data exists only in memory during request lifetime
- **Rate limiting** and structured logging
- **Docker support** for easy deployment

### Web Interface Features
- 🎨 **Modern UI**: Clean, responsive design with smooth animations
- 🔄 **Real-time Testing**: Interactive prompt testing with live results
- ⚡ **Instant Enhancement**: AI-powered prompt improvement with before/after comparison
- 📊 **Detailed Analytics**: Score breakdown, token usage, and execution time
- 📱 **Mobile Friendly**: Works seamlessly on all devices
- 🎯 **Type Safety**: Full TypeScript support for robust development

## API Endpoints

### POST `/test`
Test a prompt against synthetic test cases.

```json
{
  "prompt": "Translate the following to French:",
  "domain": "translation",
  "num_cases": 5,
  "score_method": "exact_match"
}
```

### POST `/enhance`
Enhance a prompt with best practices.

```json
{
  "prompt": "Translate the following to French:",
  "domain": "translation", 
  "auto_retest": true
}
```

### GET `/health`
Health check endpoint.

## Setup

### Backend Setup

1. Clone the repository
2. Install dependencies: `python3 -m pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and set your `GOOGLE_API_KEY`
4. Run the server: `python3 -m uvicorn app.main:app --reload`

**Quick Start:**
```bash
# Automated setup
./setup.sh

# Manual setup
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Get Gemini API Key:**
Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to get your free API key.

### Frontend Setup

The project includes a beautiful React frontend built with TypeScript and Tailwind CSS.

**Requirements**: Node.js 18+ and npm 8+

```bash
# Build and serve frontend with backend
cd frontend
./build.sh

# Or develop frontend separately
cd frontend
./start-dev.sh  # Recommended - handles compatibility
# OR manually:
npm install
npm run dev  # Runs on http://localhost:5173
```

The frontend will be automatically served by the backend at `http://localhost:8000` when built.

## Docker

```bash
docker-compose up --build
```

## Development

Run tests:
```bash
pytest tests/
```

The application will be available at `http://localhost:8000`

## Testing

Test your API key and core functionality:
```bash
python3 test_api.py
```

Test the API endpoints (requires server to be running):
```bash
# In one terminal, start the server:
python3 -m uvicorn app.main:app --reload

# In another terminal, test the endpoints:
python3 test_endpoints.py
```

## Troubleshooting

### Common Issues

1. **JSON parsing error**: The LLM response format may vary. The service now handles multiple response formats automatically.

2. **API key issues**: Make sure your GOOGLE_API_KEY is set correctly in the .env file. Get one from [Google AI Studio](https://makersuite.google.com/app/apikey).

3. **pip installation issues**: Use `python3 -m pip` instead of `pip` if you encounter OpenSSL errors.

4. **Empty responses**: Check the logs for detailed error messages. The service will log raw responses for debugging.

## Configuration

Environment variables:
- `GOOGLE_API_KEY`: Required Gemini API key
- `LOG_LEVEL`: Logging level (default: INFO)
- `RATE_LIMIT_REQUESTS`: Requests per window (default: 10)
- `RATE_LIMIT_WINDOW`: Rate limit window in seconds (default: 60)
- `MAX_SYNTHETIC_CASES`: Maximum test cases (default: 10)
- `REQUEST_TIMEOUT`: Request timeout in seconds (default: 30)