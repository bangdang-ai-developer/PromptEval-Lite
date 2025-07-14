# PromptEval-Lite Project Structure

## Overview
PromptEval-Lite is a full-stack application for testing and enhancing prompts using various LLM models.

## Directory Structure

```
PromptEval-Lite/
├── app/                      # Backend FastAPI application
│   ├── api/                  # API endpoints
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── prompts.py       # Prompt management endpoints
│   │   └── user.py          # User management endpoints
│   ├── db/                  # Database models
│   │   └── db_models.py     # SQLAlchemy models
│   ├── auth.py              # Authentication logic
│   ├── config.py            # Application configuration
│   ├── database.py          # Database connection setup
│   ├── dependencies.py      # FastAPI dependencies
│   ├── llm_service.py       # LLM service implementation
│   ├── logging_config.py    # Logging configuration
│   ├── main.py              # FastAPI application entry point
│   ├── models.py            # Pydantic models
│   ├── multi_model_service.py # Multi-model support
│   └── validators.py        # Input validators
│
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts (Auth, Config)
│   │   ├── services/        # API service layer
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── package.json         # Frontend dependencies
│   └── vite.config.ts       # Vite configuration
│
├── alembic/                 # Database migrations
│   └── versions/            # Migration files
│
├── scripts/                 # Utility scripts
│   ├── init_db.py          # Database initialization
│   ├── verify_db.py        # Database verification
│   └── generate_*.py       # Key generation scripts
│
├── docs/                    # Documentation
│   ├── railway-deployment.md # Railway deployment guide
│   └── features/           # Feature documentation
│
├── tests/                   # Test files
│
├── Dockerfile              # Production Docker configuration
├── docker-compose.yml      # Local development setup
├── railway.json            # Railway deployment config
├── railway.toml            # Railway environment config
├── railway-entrypoint.sh   # Docker entrypoint script
├── requirements.txt        # Python dependencies
├── alembic.ini            # Alembic configuration
└── README.md              # Project documentation
```

## Key Files

### Backend
- `app/main.py` - FastAPI application with CORS, static file serving, and API routes
- `app/config.py` - Environment-based configuration using Pydantic
- `app/llm_service.py` - Integration with Google Gemini, OpenAI, and Anthropic

### Frontend
- `frontend/src/App.tsx` - Main application component
- `frontend/src/components/TestPrompt.tsx` - Prompt testing interface
- `frontend/src/components/EnhancePrompt.tsx` - Prompt enhancement interface
- `frontend/src/components/PromptLibrary.tsx` - Saved prompts management

### Deployment
- `Dockerfile` - Multi-stage build for production deployment
- `railway-entrypoint.sh` - Handles database migrations and app startup
- `railway.json` - Railway platform configuration

## Environment Variables

Required:
- `GOOGLE_API_KEY` - Google Gemini API key

Optional:
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `ENABLE_DATABASE` - Enable PostgreSQL database (true/false)
- `DATABASE_URL` - PostgreSQL connection string (if database enabled)
- `JWT_SECRET_KEY` - JWT secret for authentication
- `ENCRYPTION_KEY` - Fernet key for API key encryption

## Deployment

The application is configured for deployment on Railway with:
- Automatic frontend build during Docker image creation
- Database migration support
- Environment-based configuration
- Health check endpoint at `/health`