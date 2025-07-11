# Render Deployment Fix Guide

## Quick Fix for Render Deployment Errors

The errors you're encountering are common when deploying to Render. Here's how to fix them:

### Error 1: Fernet Key Error
```
Failed to initialize Fernet encryption error='Fernet key must be 32 url-safe base64-encoded bytes.'
```

### Error 2: Database Connection Error
```
ConnectionRefusedError: [Errno 111] Connection refused
```

## Solution 1: Stateless Deployment (Recommended for Free Tier)

This disables database features but keeps all core functionality:

### 1. Set Environment Variables in Render Dashboard

Go to your Render service → Environment → Add these variables:

```env
# Required
GOOGLE_API_KEY=your_actual_gemini_api_key_here

# Disable database for stateless mode
ENABLE_DATABASE=false

# Model settings
DEFAULT_MODEL=gemini-2.5-flash
EVALUATOR_MODEL=gemini-2.5-flash

# App settings
LOG_LEVEL=INFO
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
MAX_SYNTHETIC_CASES=10
REQUEST_TIMEOUT=60

# Required but not used in stateless mode
JWT_SECRET_KEY=stateless-mode-placeholder-key-123456
ENCRYPTION_KEY=gAAAAABhZ0123456789012345678901234567890-_aaaaaaaaa=
```

### 2. Update Build Command

In Render dashboard → Settings → Build Command:
```bash
cd frontend && npm install && npm run build && cd .. && mkdir -p static && cp -r frontend/dist/* static/
```

### 3. Update Start Command

In Render dashboard → Settings → Start Command:
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 4. Redeploy

Click "Manual Deploy" → "Deploy latest commit"

## Solution 2: Full Deployment with Database

If you want all features including authentication and prompt history:

### 1. Add PostgreSQL Database

1. In Render Dashboard → New → PostgreSQL
2. Choose Free tier
3. Connect it to your web service

### 2. Generate Proper Keys

On your local machine:

```bash
# Generate Fernet key
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Generate JWT secret
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Set Environment Variables

```env
# Required
GOOGLE_API_KEY=your_actual_gemini_api_key_here

# Enable database
ENABLE_DATABASE=true
DATABASE_URL=provided_by_render_automatically

# Security keys (use generated values)
JWT_SECRET_KEY=your_generated_jwt_secret_here
ENCRYPTION_KEY=your_generated_fernet_key_here

# Model settings
DEFAULT_MODEL=gemini-2.5-flash
EVALUATOR_MODEL=gemini-2.5-flash

# App settings
LOG_LEVEL=INFO
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
MAX_SYNTHETIC_CASES=10
REQUEST_TIMEOUT=60
```

### 4. Update Start Command

```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Verification Steps

After deployment:

1. Check Logs in Render dashboard
2. Look for: "PromptEval-Lite starting up"
3. Verify no error messages
4. Visit your app URL

## Common Issues

### "Build failed"
- Check if Node.js is being installed
- Verify frontend build completes

### "Service is not live"
- Check environment variables are set
- Verify GOOGLE_API_KEY is valid
- Check logs for specific errors

### "502 Bad Gateway"
- App may still be starting (wait 2-3 minutes)
- Check if PORT variable is used correctly

## Testing Your Deployment

Once deployed, test:
1. Visit: `https://your-app.onrender.com`
2. Try the Test Prompt feature
3. Verify AI responses work

## Need More Help?

- Check full logs in Render dashboard
- Ensure all environment variables are set
- Try stateless mode first (simpler)
- Join Render's Discord for support