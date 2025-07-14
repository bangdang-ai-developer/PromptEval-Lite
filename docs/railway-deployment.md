# Railway Deployment Guide for PromptEval-Lite

This guide walks you through deploying PromptEval-Lite to Railway, a modern platform-as-a-service that makes deployment simple and scalable.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. Railway CLI installed
3. Git repository with your PromptEval-Lite code
4. Google API Key for Gemini models

## Installation

### Install Railway CLI

Choose one of the following methods:

```bash
# Using npm
npm install -g @railway/cli

# Using Homebrew (macOS/Linux)
brew install railway

# Using curl (Linux/macOS)
curl -fsSL https://railway.app/install.sh | sh

# Using PowerShell (Windows)
iwr -useb https://railway.app/install.ps1 | iex
```

### Login to Railway

```bash
railway login
```

## Quick Deployment

We've created a deployment script that handles everything for you:

```bash
# Make the script executable (Unix/Linux/macOS)
chmod +x deploy-railway.sh

# Run the deployment script
./deploy-railway.sh
```

The script will:
1. Check Railway CLI installation
2. Create or link a Railway project
3. Set up required environment variables
4. Deploy your application

## Manual Deployment

If you prefer to deploy manually:

### 1. Initialize Railway Project

```bash
# Create a new project
railway init

# Or link to existing project
railway link
```

### 2. Set Environment Variables

Required variables:
```bash
railway variables --set GOOGLE_API_KEY=your-google-api-key-here
```

Optional variables:
```bash
railway variables --set OPENAI_API_KEY=your-openai-key
railway variables --set ANTHROPIC_API_KEY=your-anthropic-key
railway variables --set DEFAULT_MODEL=gemini-2.5-flash
railway variables --set EVALUATOR_MODEL=gemini-2.5-flash
```

### 3. Add PostgreSQL Database (Optional)

If you want to enable database features:
```bash
# Add PostgreSQL service
railway add --database postgres

# Enable database in your app
railway variables --set ENABLE_DATABASE=true
```

### 4. Deploy

```bash
railway up
```

## Configuration Files

### railway.json
Defines build and deployment configuration:
- Build command for frontend
- Start command for backend
- Replica settings

### railway.toml
Alternative configuration format with:
- Environment variables
- Service definitions
- Health check settings

### Dockerfile.railway
Optimized Dockerfile that:
- Builds frontend in a separate stage
- Installs all dependencies
- Serves static files
- Uses Railway's PORT variable

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| GOOGLE_API_KEY | Yes | - | Google API key for Gemini models |
| ENABLE_DATABASE | No | false | Enable PostgreSQL database |
| DEFAULT_MODEL | No | gemini-2.5-flash | Default LLM model |
| EVALUATOR_MODEL | No | gemini-2.5-flash | Model for evaluation |
| OPENAI_API_KEY | No | - | OpenAI API key |
| ANTHROPIC_API_KEY | No | - | Anthropic API key |
| LOG_LEVEL | No | INFO | Logging level |
| RATE_LIMIT_REQUESTS | No | 100 | Rate limit requests per window |
| RATE_LIMIT_WINDOW | No | 60 | Rate limit window in seconds |

## Managing Your Deployment

### View Logs
```bash
railway logs
```

### Open Application
```bash
railway open
```

### Check Status
```bash
railway status
```

### Update Environment Variables
```bash
# List all variables
railway variables

# Set a variable
railway variables --set KEY=value

# Remove a variable
railway variables --remove KEY
```

### Custom Domains
```bash
# Add custom domain
railway domain add yourdomain.com

# List domains
railway domains
```

## Deployment Features

### Automatic Features
- **SSL/TLS**: Automatic HTTPS certificates
- **Auto-scaling**: Scales based on traffic
- **Zero-downtime deploys**: Rolling updates
- **GitHub integration**: Auto-deploy on push
- **Monitoring**: Built-in metrics and logs

### Database Management
If you added PostgreSQL:
- Connection string available as DATABASE_URL
- Automatic backups
- Easy scaling
- Connection pooling

## Troubleshooting

### Build Failures
1. Check logs: `railway logs`
2. Verify package.json and requirements.txt
3. Ensure Dockerfile.railway is used

### Environment Variables
1. Verify all required variables are set
2. Use `railway variables` to check
3. Restart after changing variables

### Port Issues
Railway automatically assigns a PORT variable. Ensure your app uses:
```python
port = int(os.environ.get("PORT", 8000))
```

### Database Connection
If using PostgreSQL:
1. Check DATABASE_URL is set
2. Verify ENABLE_DATABASE=true
3. Run migrations if needed

## Cost Optimization

Railway offers:
- $5 free credit monthly
- Pay-as-you-go pricing
- Resource-based billing

Tips to optimize costs:
1. Use appropriate resource limits
2. Enable auto-sleep for dev environments
3. Monitor usage in Railway dashboard
4. Use caching where possible

## CI/CD Integration

### GitHub Integration
1. Connect GitHub in Railway dashboard
2. Select repository and branch
3. Enable automatic deploys

### Manual Deployment
```bash
# Deploy specific branch
git checkout feature-branch
railway up

# Deploy with custom name
railway up -e staging
```

## Security Best Practices

1. **Never commit secrets**: Use environment variables
2. **Rotate API keys regularly**: Update in Railway dashboard
3. **Use read-only database users**: When possible
4. **Enable 2FA**: On your Railway account
5. **Monitor access logs**: Check for unusual activity

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Community: [discord.gg/railway](https://discord.gg/railway)
- PromptEval-Lite Issues: Create issue in your repository

## Next Steps

1. Set up custom domain
2. Configure monitoring alerts
3. Set up staging environment
4. Implement CI/CD pipeline
5. Add health checks

Your PromptEval-Lite app is now deployed on Railway! 🚂