# PromptEval-Lite Deployment Guide

## Quick Start (Full Stack)

1. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your GOOGLE_API_KEY
   ```

2. **Install backend dependencies**:
   ```bash
   python3 -m pip install -r requirements.txt
   ```

3. **Build and deploy frontend**:
   ```bash
   cd frontend
   ./build.sh
   cd ..
   ```

4. **Start the server**:
   ```bash
   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

5. **Access the application**:
   - Open browser to `http://localhost:8000`
   - API docs available at `http://localhost:8000/docs`

## Development Mode

### Backend Development
```bash
# Terminal 1: Backend with hot reload
python3 -m uvicorn app.main:app --reload
```

### Frontend Development
```bash
# Terminal 2: Frontend with hot reload
cd frontend
./start-dev.sh
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
```

## Production Deployment

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up --build

# Or build image manually
docker build -t prompteval-lite .
docker run -p 8000:8000 -e GOOGLE_API_KEY=your_key prompteval-lite
```

### Manual Production Setup
```bash
# 1. Install production dependencies
python3 -m pip install -r requirements.txt

# 2. Build frontend for production
cd frontend
npm install
npm run build
cp -r dist/* ../static/
cd ..

# 3. Run with production server
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Environment Variables

### Required
- `GOOGLE_API_KEY`: Your Gemini API key from Google AI Studio

### Optional
- `LOG_LEVEL`: Logging level (default: INFO)
- `RATE_LIMIT_REQUESTS`: Requests per window (default: 10)
- `RATE_LIMIT_WINDOW`: Rate limit window in seconds (default: 60)
- `MAX_SYNTHETIC_CASES`: Maximum test cases (default: 10)
- `REQUEST_TIMEOUT`: Request timeout in seconds (default: 30)

## System Requirements

### Backend
- Python 3.8+
- FastAPI, LangChain, Gemini API access

### Frontend
- Node.js 18+ (tested with 18.20.8)
- npm 8+

## Troubleshooting

### Common Issues

1. **Node.js compatibility error** (`crypto.hash is not a function`):
   - Upgrade to Node.js 18+ or use the provided `./start-dev.sh` script

2. **API key not working**:
   - Verify your API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Check the `.env` file is properly configured

3. **Frontend not loading**:
   - Make sure frontend is built: `cd frontend && ./build.sh`
   - Check that `static/` directory exists

4. **Rate limiting issues**:
   - Adjust `RATE_LIMIT_REQUESTS` and `RATE_LIMIT_WINDOW` in `.env`

5. **Memory issues**:
   - The app is stateless but LLM calls use memory
   - Consider adjusting `MAX_SYNTHETIC_CASES` for lower memory usage

## Monitoring

The application provides:
- Health check endpoint: `/health`
- Structured JSON logging
- Request timing and token usage tracking
- API status monitoring in frontend

## Security Considerations

- API keys are loaded from environment variables only
- No persistent storage - all data in memory only
- Rate limiting prevents abuse
- CORS configured for development (adjust for production)
- Input validation on all endpoints

## Scaling

For production scaling:
- Use multiple uvicorn workers: `--workers 4`
- Place behind reverse proxy (nginx/Apache)
- Consider container orchestration (Kubernetes/Docker Swarm)
- Monitor memory usage with multiple concurrent requests