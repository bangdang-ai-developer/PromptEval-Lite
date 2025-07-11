# 🚀 Quick Start - Deploy in 5 Minutes

## Fastest Deployment: Render.com (Free)

### 1. Get Your API Key (1 minute)
- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Click "Create API Key"
- Copy the key (starts with `AIza...`)

### 2. Deploy to Render (4 minutes)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. **Fork this repository** to your GitHub account
2. **Sign up** at [render.com](https://render.com) (free, no credit card)
3. **Create New** → **Web Service**
4. **Connect** your forked repository
5. **Configure**:
   - Name: `prompteval-lite`
   - Build Command: `chmod +x build.sh && ./build.sh && pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. **Add Environment Variables**:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ENABLE_DATABASE=false
   ```
7. **Create Web Service** 🎉

Your app will be live at: `https://prompteval-lite.onrender.com`

## Alternative: Local Deployment (2 minutes)

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/PromptEval-Lite.git
cd PromptEval-Lite

# 2. Setup
cp .env.stateless .env
# Edit .env and add your GOOGLE_API_KEY

# 3. Install & Run
pip install -r requirements.txt
cd frontend && npm install && npm run build && cd ..
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open: http://localhost:8000

## Features Available in Free Deployment

✅ Test prompts with AI evaluation  
✅ Enhance prompts with AI suggestions  
✅ Multi-model support (Gemini)  
✅ Beautiful responsive UI  
✅ API documentation  

## Want More Features?

Enable database for:
- 🔐 User authentication
- 💾 Save prompts to library
- 📊 Track prompt history
- 🏷️ Organize with tags
- 📈 Version control

See [FREE_DEPLOYMENT_GUIDE.md](docs/FREE_DEPLOYMENT_GUIDE.md) for database setup.

## Troubleshooting

**"Application failed to respond"**
- Check if GOOGLE_API_KEY is set correctly
- View logs in Render dashboard

**"API key invalid"**
- Ensure API key has Gemini API enabled
- Get new key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Support

- 📖 [Full Documentation](docs/README.md)
- 🐛 [Report Issues](https://github.com/YOUR_USERNAME/PromptEval-Lite/issues)
- 💬 [Discussions](https://github.com/YOUR_USERNAME/PromptEval-Lite/discussions)