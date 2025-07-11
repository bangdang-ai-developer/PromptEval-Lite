# Free Deployment Guide for PromptEval-Lite

This guide covers multiple free deployment options for PromptEval-Lite.

## Prerequisites

1. **Google Gemini API Key** (Free)
   - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - No credit card required
   - Free tier: 60 requests per minute

2. **GitHub Account**
   - Fork this repository to your account
   - Required for most deployment platforms

## Option 1: Render.com (Recommended) 🌟

### Pros:
- Free tier includes web service + PostgreSQL
- Automatic deployments from GitHub
- Environment variable management
- Custom domains supported

### Cons:
- Spins down after 15 min inactivity (free tier)
- PostgreSQL free for 90 days only
- 512MB RAM limit

### Deployment Steps:

1. **Fork and Prepare Repository**
   ```bash
   # Fork this repo to your GitHub account
   # Clone your fork locally
   git clone https://github.com/YOUR_USERNAME/PromptEval-Lite.git
   cd PromptEval-Lite
   ```

2. **Generate Required Keys**
   ```bash
   # Generate encryption key
   python scripts/generate_fernet_key.py
   # Save the output for later
   ```

3. **Create Render Account**
   - Sign up at [render.com](https://render.com)
   - Connect your GitHub account

4. **Deploy from Dashboard**
   - Click "New +" → "Web Service"
   - Connect your forked repository
   - Use these settings:
     - **Name**: prompteval-lite (or your choice)
     - **Region**: Choose nearest to you
     - **Branch**: main
     - **Runtime**: Python 3
     - **Build Command**: `chmod +x build.sh && ./build.sh && pip install -r requirements.txt`
     - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. **Add PostgreSQL Database**
   - In Render dashboard → "New +" → "PostgreSQL"
   - Choose free tier
   - Connect to your web service

6. **Configure Environment Variables**
   In your web service settings → Environment:
   ```
   GOOGLE_API_KEY=your_gemini_api_key
   ENCRYPTION_KEY=your_generated_fernet_key
   DATABASE_URL=auto_filled_by_render
   ENABLE_DATABASE=true
   ```

7. **Deploy**
   - Render will automatically deploy
   - Access at: `https://your-app.onrender.com`

## Option 2: Railway.app (Quick Start)

### Pros:
- One-click deploy from GitHub
- $5 free credit monthly
- Better performance than Render free tier

### Cons:
- Credit runs out (~500 hours)
- Requires credit card after trial

### Deployment:
1. Go to [railway.app](https://railway.app)
2. "Deploy from GitHub repo"
3. Select your fork
4. Add PostgreSQL plugin
5. Set environment variables
6. Deploy!

## Option 3: Vercel (Serverless)

### Pros:
- Truly free (no time limits)
- Great for frontend
- Serverless functions for API

### Cons:
- Requires code changes for serverless
- 10-second function timeout
- No built-in database

### Deployment Steps:

1. **Modify for Serverless**
   Create `api/index.py`:
   ```python
   from app.main import app
   
   # Vercel serverless handler
   handler = app
   ```

2. **Create vercel.json**
   ```json
   {
     "builds": [
       {"src": "api/index.py", "use": "@vercel/python"},
       {"src": "frontend/package.json", "use": "@vercel/static-build"}
     ],
     "routes": [
       {"src": "/api/(.*)", "dest": "api/index.py"},
       {"src": "/(.*)", "dest": "frontend/$1"}
     ]
   }
   ```

3. **Deploy**
   ```bash
   npm i -g vercel
   vercel
   ```

## Option 4: GitHub Pages + Netlify Functions

### For Minimal Deployment (No Database)

1. **Disable Database Features**
   ```env
   ENABLE_DATABASE=false
   ```

2. **Deploy Frontend to GitHub Pages**
   ```bash
   cd frontend
   npm run build
   # Push dist/ to gh-pages branch
   ```

3. **Deploy API to Netlify Functions**
   - Create netlify functions
   - Deploy backend as serverless

## Option 5: Local Deployment + Ngrok

### For Testing/Demo Purposes

1. **Run Locally**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. **Expose with Ngrok**
   ```bash
   ngrok http 8000
   ```

## Cost Optimization Tips

1. **Disable Database**: Set `ENABLE_DATABASE=false` for stateless operation
2. **Use CDN**: Serve frontend from CDN (Cloudflare Pages, Netlify)
3. **Optimize API Calls**: Implement caching for repeated prompts
4. **Monitor Usage**: Track API calls to stay within limits

## Environment Variables Reference

### Required:
- `GOOGLE_API_KEY`: Your Gemini API key
- `JWT_SECRET_KEY`: For authentication (auto-generated on Render)
- `ENCRYPTION_KEY`: For API key encryption

### Optional:
- `ENABLE_DATABASE`: Set to `false` for stateless mode
- `RATE_LIMIT_REQUESTS`: Requests per window (default: 10)
- `LOG_LEVEL`: INFO, DEBUG, ERROR

## Troubleshooting

### "Application failed to respond"
- Check logs for missing environment variables
- Ensure frontend build completed
- Verify PORT variable is used

### "Database connection failed"
- Check DATABASE_URL is set correctly
- For SQLite: Use `sqlite+aiosqlite:///./prompteval.db`
- Run migrations: `alembic upgrade head`

### "API key not working"
- Verify GOOGLE_API_KEY is set
- Check API key has Gemini API enabled
- Monitor quota at Google AI Studio

## Migration Commands

If you need to run migrations manually:
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Run migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Support

- Issues: Create issue on GitHub
- Documentation: Check `/docs` folder
- API Docs: Visit `/docs` endpoint when deployed