# PromptEval-Lite

A comprehensive prompt testing and enhancement platform with multi-model AI support, user authentication, and a beautiful web interface.

## 🚀 Quick Deploy (Free)

**Deploy to Render in 5 minutes:** See [QUICK_START.md](QUICK_START.md)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## 🚀 Features

### Core Capabilities
- **Multi-Model Testing**: Support for latest AI models (June 2025):
  - Google Gemini (2.5 Pro/Flash thinking models, 2.0 Flash)
  - OpenAI (GPT-4.1 family with 1M context, GPT-4o, O3/O4 reasoning models)
  - Anthropic (Claude 4 Opus/Sonnet - best coding models, Claude 3.5/3)
- **Prompt Enhancement**: AI-powered suggestions to improve prompt effectiveness
- **Advanced Scoring**: Multiple evaluation methods including semantic similarity
- **Domain-Specific Testing**: Tailored test cases for different use cases
- **Real-time Validation**: Instant feedback on prompt quality and structure

### User Features
- **Authentication System**: Secure user registration and login
- **API Key Management**: Save and manage API keys for different providers
- **Prompt History**: Track and review all your prompt tests
- **Visual Diff View**: Compare original and enhanced prompts side-by-side
- **Export Capabilities**: Download results in various formats

### Technical Features
- **Zero-storage Option**: Can run without database for privacy
- **Rate Limiting**: Built-in request throttling
- **Input Sanitization**: XSS and injection protection
- **Async Architecture**: High-performance async/await throughout
- **Docker Support**: Easy deployment with Docker Compose

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python 3.11+) with async support
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Database**: PostgreSQL with async SQLAlchemy (optional)
- **AI/LLM**: LangChain with multiple model providers
- **Authentication**: JWT tokens with bcrypt password hashing
- **Infrastructure**: Docker + Docker Compose

## 📋 Prerequisites

- Python 3.11 or higher
- Node.js 16+ and npm 8+
- PostgreSQL 13+ (optional, for user features)
- At least one AI provider API key:
  - [Google AI Studio](https://makersuite.google.com/app/apikey) (Gemini)
  - [OpenAI](https://platform.openai.com/api-keys) (GPT models)
  - [Anthropic](https://console.anthropic.com/) (Claude)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/prompteval-lite.git
cd prompteval-lite
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API keys and settings

# Generate encryption key for API key storage (if using database)
python scripts/generate_fernet_key.py
# Add the generated key to your .env file
```

### 3. Database Setup (Optional)

For user authentication and data persistence:

```bash
# Using Docker
docker-compose up -d postgres

# Run migrations
alembic upgrade head

# Or use the setup script
./scripts/run_migrations.sh
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

### 5. Run the Application

**Backend** (from root directory):
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend** (in new terminal):
```bash
cd frontend
npm run dev
```

Access the application at http://localhost:5173

## 🐳 Docker Deployment

```bash
# Build and run everything
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📝 Configuration

Create a `.env` file with:

```env
# Required: At least one API key
GOOGLE_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database (for authentication features)
ENABLE_DATABASE=true
DATABASE_URL=postgresql+asyncpg://prompteval:changeme@localhost:5433/prompteval

# Security
JWT_SECRET_KEY=your-secret-key-change-in-production
ENCRYPTION_KEY=generate-with-fernet

# Application
LOG_LEVEL=INFO
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60
MAX_SYNTHETIC_CASES=10
REQUEST_TIMEOUT=30
```

## 📁 Project Structure

```
PromptEval-Lite/
├── app/                    # FastAPI backend
│   ├── api/               # API endpoints
│   ├── db/                # Database models
│   ├── main.py            # Application entry
│   └── ...                # Services and utilities
├── frontend/              # React frontend
│   ├── src/              # Source code
│   └── ...               # Config files
├── alembic/              # Database migrations
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── tests/                # Test suite
└── docker-compose.yml    # Docker setup
```

## 🧪 Testing

```bash
# Test API keys
python scripts/test_api_keys.py

# Run backend tests
pytest

# Test authentication flow
python scripts/test_auth.py

# Verify database
python scripts/verify_db.py
```

## 📚 API Documentation

When running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

- `POST /api/test` - Test a prompt
- `POST /api/enhance` - Enhance a prompt
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/user/history` - Get prompt history

## 🔧 Development

### Backend Development
```bash
# Run with auto-reload
python -m uvicorn app.main:app --reload

# Run specific port
python -m uvicorn app.main:app --port 8001
```

### Frontend Development
```bash
cd frontend
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
```

### Database Operations
```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🚀 Deployment Options

### Free Hosting
- **[Quick Start Guide](QUICK_START.md)** - Deploy in 5 minutes
- **[Free Deployment Guide](docs/FREE_DEPLOYMENT_GUIDE.md)** - All free hosting options
- **[Render.com](render.yaml)** - Recommended free tier
- **[Vercel](vercel.json)** - Serverless deployment
- **[Netlify](netlify.toml)** - Static frontend hosting

### Production Deployment
- **[Docker Compose](docker-compose.yml)** - Full stack with database
- **[Deployment Guide](docs/deployment.md)** - Detailed instructions

## 🔗 Resources

- [Project Documentation](docs/)
- [Database Setup Guide](docs/database-setup.md)
- [Deployment Guide](docs/deployment.md)
- [Project Structure](docs/project-structure.md)

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI components from [Heroicons](https://heroicons.com/)
- AI models from Google, OpenAI, and Anthropic