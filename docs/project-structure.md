# Project Structure

## Clean Project Layout

```
PromptEval-Lite/
├── app/                        # Backend application (FastAPI)
│   ├── api/                    # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py            # Authentication endpoints
│   │   └── user.py            # User management endpoints
│   ├── db/                     # Database models and schemas
│   │   ├── __init__.py
│   │   └── db_models.py       # SQLAlchemy ORM models
│   ├── utils/                  # Utility modules (if needed)
│   ├── __init__.py
│   ├── auth.py                # Authentication utilities (JWT, password hashing)
│   ├── config.py              # Application configuration
│   ├── database.py            # Database connection and session management
│   ├── dependencies.py        # FastAPI dependencies
│   ├── json_utils.py          # JSON parsing utilities
│   ├── llm_service.py         # LLM service implementation
│   ├── logging_config.py      # Logging configuration
│   ├── main.py                # FastAPI app entry point
│   ├── models.py              # Pydantic models for API
│   ├── multi_model_service.py # Multi-model AI support
│   └── validators.py          # Input validators and sanitizers
│
├── frontend/                   # React frontend application
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── APIKeyManager.tsx
│   │   │   ├── DiffView.tsx
│   │   │   ├── EnhancePrompt.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── PromptHistory.tsx
│   │   │   ├── TestPrompt.tsx
│   │   │   └── TestResults.tsx
│   │   ├── contexts/          # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── services/          # API service layer
│   │   │   └── api.ts
│   │   ├── types/             # TypeScript type definitions
│   │   │   └── api.ts
│   │   ├── utils/             # Frontend utilities
│   │   │   └── storage.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── ...
│
├── alembic/                    # Database migrations
│   ├── versions/              # Migration files
│   ├── alembic.ini           # Alembic configuration
│   ├── env.py                # Migration environment
│   └── script.py.mako        # Migration template
│
├── docs/                       # Project documentation
│   ├── database-setup.md      # Database setup guide
│   ├── deployment.md          # Deployment instructions
│   ├── project-plan.md        # Original project plan
│   └── project-structure.md   # This file
│
├── scripts/                    # Utility scripts
│   ├── cleanup_project.py     # Project cleanup script
│   ├── run_migrations.sh      # Database migration runner
│   ├── test_api_keys.py       # API key validation
│   ├── test_auth.py           # Authentication testing
│   └── verify_db.py           # Database verification
│
├── tests/                      # Test suite
│   └── test_validators.py     # Validator unit tests
│
├── .dockerignore              # Docker ignore patterns
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore patterns
├── Dockerfile                 # Docker image definition
├── README.md                  # Project documentation
├── alembic.ini                # Alembic configuration
├── docker-compose.yml         # Docker Compose setup
├── requirements.txt           # Python dependencies
└── setup.sh                   # Initial setup script
```

## Key Components

### Backend (`/app`)
- **FastAPI** application with async support
- **SQLAlchemy** with async PostgreSQL support
- **JWT** authentication with secure password hashing
- **Multi-model AI support** (Gemini, GPT-4, GPT-3.5, Claude)
- **Input validation** and sanitization
- **Structured logging** with contextual information

### Frontend (`/frontend`)
- **React** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Context** for state management
- **Axios** for API communication

### Database (`/alembic`)
- **PostgreSQL** as the primary database
- **Alembic** for database migrations
- **Async SQLAlchemy** for ORM

### Infrastructure
- **Docker** and **Docker Compose** for containerization
- **Environment-based** configuration
- **CORS** enabled for frontend-backend communication

## Clean Code Practices

1. **Separation of Concerns**: Clear separation between API endpoints, business logic, and data models
2. **Type Safety**: TypeScript in frontend, Pydantic models in backend
3. **Security**: Input validation, SQL injection prevention, XSS protection
4. **Async/Await**: Fully async backend for better performance
5. **Environment Variables**: Sensitive data kept in `.env` files
6. **Logging**: Structured logging for debugging and monitoring
7. **Testing**: Unit tests for critical components
8. **Documentation**: Comprehensive docs in the `/docs` directory

## Development Workflow

1. **Backend Development**:
   ```bash
   source venv/bin/activate
   python -m uvicorn app.main:app --reload
   ```

2. **Frontend Development**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Database Migrations**:
   ```bash
   alembic upgrade head
   ```

4. **Docker Development**:
   ```bash
   docker-compose up
   ```

## Removed Files

The following unnecessary files have been removed:
- Old test files (`test_api.py`, `test_endpoints.py`)
- Redundant runner (`run.py`)
- Old static files directory
- Python cache files (`__pycache__`, `*.pyc`)
- Old documentation summaries
- IDE-specific files