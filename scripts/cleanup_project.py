#!/usr/bin/env python3
"""
Project cleanup script to remove unnecessary files and organize structure.
"""
import os
import shutil
import json
from pathlib import Path

# Define files and directories to remove
REMOVE_PATTERNS = {
    # Python cache files
    "__pycache__": "dir",
    "*.pyc": "file",
    "*.pyo": "file",
    "*.pyd": "file",
    ".pytest_cache": "dir",
    "*.egg-info": "dir",
    ".coverage": "file",
    ".coverage.*": "file",
    "htmlcov": "dir",
    ".hypothesis": "dir",
    
    # IDE and OS files
    ".DS_Store": "file",
    "Thumbs.db": "file",
    ".idea": "dir",
    "*.swp": "file",
    "*.swo": "file",
    "*~": "file",
    
    # Log files
    "*.log": "file",
    "logs": "dir",
    
    # Virtual environment (if you want to recreate it)
    # "venv": "dir",  # Uncomment to remove venv
    
    # Node modules (if you want to reinstall)
    # "node_modules": "dir",  # Uncomment to remove node_modules
    
    # Build artifacts
    "dist": "dir",
    "build": "dir",
    "*.egg": "file",
    ".eggs": "dir",
    
    # Temporary files
    "*.tmp": "file",
    "*.temp": "file",
    "*.bak": "file",
    "*.old": "file",
}

# Files to specifically remove
SPECIFIC_FILES_TO_REMOVE = [
    "test_api.py",  # Old test file
    "test_endpoints.py",  # Old test file
    "run.py",  # Not needed with uvicorn
    "package-lock.json",  # In root, should be in frontend
    "static/index.html",  # Old static file
    "static/vite.svg",  # Old static file
    "static/assets",  # Old static directory
    "api_key_feature_summary.md",  # Old documentation
    "ux_improvements_summary.md",  # Old documentation
    "UI_ENHANCEMENT_SUMMARY.md",  # Old documentation
    "FRONTEND_AUTH_SUMMARY.md",  # Old documentation
    ".vscode/PythonImportHelper-v2-Completion.json",  # VSCode cache
]

# Directories to ensure exist
ENSURE_DIRS = [
    "app/api",
    "app/db",
    "app/utils",
    "scripts",
    "tests",
    "docs",
    "alembic/versions",
]

def remove_pattern_files(base_path: Path):
    """Remove files matching patterns."""
    removed_count = 0
    
    for pattern, file_type in REMOVE_PATTERNS.items():
        if file_type == "dir":
            # Remove directories
            for path in base_path.rglob(pattern):
                if path.is_dir():
                    print(f"Removing directory: {path}")
                    shutil.rmtree(path)
                    removed_count += 1
        else:
            # Remove files
            for path in base_path.rglob(pattern):
                if path.is_file():
                    print(f"Removing file: {path}")
                    path.unlink()
                    removed_count += 1
    
    return removed_count

def remove_specific_files(base_path: Path):
    """Remove specific files from the list."""
    removed_count = 0
    
    for file_path in SPECIFIC_FILES_TO_REMOVE:
        full_path = base_path / file_path
        if full_path.exists():
            if full_path.is_dir():
                print(f"Removing directory: {full_path}")
                shutil.rmtree(full_path)
            else:
                print(f"Removing file: {full_path}")
                full_path.unlink()
            removed_count += 1
    
    return removed_count

def ensure_directories(base_path: Path):
    """Ensure required directories exist."""
    created_count = 0
    
    for dir_path in ENSURE_DIRS:
        full_path = base_path / dir_path
        if not full_path.exists():
            print(f"Creating directory: {full_path}")
            full_path.mkdir(parents=True, exist_ok=True)
            created_count += 1
    
    return created_count

def create_docs_structure(base_path: Path):
    """Create organized documentation structure."""
    docs_path = base_path / "docs"
    docs_path.mkdir(exist_ok=True)
    
    # Move documentation files to docs directory
    doc_files = {
        "DATABASE_SETUP.md": "docs/database-setup.md",
        "DEPLOYMENT.md": "docs/deployment.md",
        "project_plan.md": "docs/project-plan.md",
    }
    
    moved_count = 0
    for src, dst in doc_files.items():
        src_path = base_path / src
        dst_path = base_path / dst
        if src_path.exists() and not dst_path.exists():
            print(f"Moving {src} to {dst}")
            dst_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src_path), str(dst_path))
            moved_count += 1
    
    return moved_count

def clean_static_directory(base_path: Path):
    """Clean up the static directory."""
    static_path = base_path / "static"
    if static_path.exists() and not any(static_path.iterdir()):
        print("Removing empty static directory")
        static_path.rmdir()
        return 1
    return 0

def update_gitignore(base_path: Path):
    """Update .gitignore with comprehensive patterns."""
    gitignore_content = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
env.bak/
venv.bak/
.pytest_cache/
.coverage
.coverage.*
htmlcov/
.hypothesis/
*.log

# Virtual environments
bin/
include/
lib/
lib64/
share/
pyvenv.cfg

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# IDEs
.idea/
.vscode/
*.swp
*.swo
*~
.project
.pydevproject

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Environment variables
.env
.env.local
.env.*.local

# Database
*.db
*.sqlite
*.sqlite3

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Frontend build
frontend/dist/
frontend/build/
frontend/.next/
frontend/.nuxt/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Testing
.coverage
.coverage.*
htmlcov/
.tox/
.nox/

# Jupyter Notebook
.ipynb_checkpoints

# pyenv
.python-version

# Secrets
*.pem
*.key
*.crt
*.pfx

# Temporary files
*.tmp
*.temp
*.bak
*.old
*~

# Project specific
static/
uploads/
downloads/
"""
    
    gitignore_path = base_path / ".gitignore"
    print("Updating .gitignore")
    gitignore_path.write_text(gitignore_content)
    return 1

def create_project_structure_doc(base_path: Path):
    """Create a document showing the clean project structure."""
    structure = """# Project Structure

```
PromptEval-Lite/
├── app/                      # Main application code
│   ├── api/                  # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   └── user.py          # User management endpoints
│   ├── db/                   # Database models
│   │   ├── __init__.py
│   │   └── db_models.py     # SQLAlchemy models
│   ├── utils/                # Utility functions
│   ├── __init__.py
│   ├── auth.py              # Authentication utilities
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection
│   ├── dependencies.py      # FastAPI dependencies
│   ├── json_utils.py        # JSON parsing utilities
│   ├── llm_service.py       # LLM service (Gemini)
│   ├── logging_config.py    # Logging configuration
│   ├── main.py              # FastAPI application
│   ├── models.py            # Pydantic models
│   ├── multi_model_service.py # Multi-model support
│   └── validators.py        # Input validators
├── frontend/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Frontend utilities
│   ├── package.json
│   └── vite.config.ts
├── alembic/                  # Database migrations
│   ├── versions/
│   └── env.py
├── docs/                     # Documentation
│   ├── database-setup.md
│   ├── deployment.md
│   └── project-plan.md
├── scripts/                  # Utility scripts
│   ├── cleanup_project.py
│   ├── test_api_keys.py
│   ├── test_auth.py
│   ├── verify_db.py
│   └── run_migrations.sh
├── tests/                    # Test files
│   └── test_validators.py
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore patterns
├── alembic.ini              # Alembic configuration
├── docker-compose.yml       # Docker composition
├── Dockerfile               # Docker image definition
├── README.md                # Project documentation
├── requirements.txt         # Python dependencies
└── setup.sh                 # Setup script
```

## Key Directories

- **app/**: Core backend application with FastAPI
- **frontend/**: React-based web interface
- **alembic/**: Database migration management
- **docs/**: Project documentation
- **scripts/**: Utility and maintenance scripts
- **tests/**: Test suite

## Clean Code Practices

1. All Python cache files removed (__pycache__, *.pyc)
2. IDE-specific files excluded (.vscode, .idea)
3. Environment files protected (.env)
4. Clear separation of concerns
5. Organized documentation in docs/
"""
    
    structure_path = base_path / "docs" / "project-structure.md"
    structure_path.parent.mkdir(parents=True, exist_ok=True)
    print("Creating project structure documentation")
    structure_path.write_text(structure)
    return 1

def main():
    """Run the cleanup process."""
    base_path = Path.cwd()
    
    print("Starting project cleanup...")
    print("=" * 50)
    
    # Remove pattern-based files
    removed_patterns = remove_pattern_files(base_path)
    print(f"\nRemoved {removed_patterns} files/directories matching patterns")
    
    # Remove specific files
    removed_specific = remove_specific_files(base_path)
    print(f"Removed {removed_specific} specific files/directories")
    
    # Ensure directories exist
    created_dirs = ensure_directories(base_path)
    print(f"\nCreated {created_dirs} required directories")
    
    # Organize documentation
    moved_docs = create_docs_structure(base_path)
    print(f"Moved {moved_docs} documentation files")
    
    # Clean static directory
    cleaned_static = clean_static_directory(base_path)
    if cleaned_static:
        print("Cleaned static directory")
    
    # Update .gitignore
    update_gitignore(base_path)
    
    # Create project structure documentation
    create_project_structure_doc(base_path)
    
    print("\n" + "=" * 50)
    print("Cleanup complete!")
    print("\nNext steps:")
    print("1. Review the changes")
    print("2. Run 'git add -A' to stage all changes")
    print("3. Run 'git commit -m \"Clean up project structure\"'")
    print("4. If you removed venv, recreate it with: python -m venv venv")
    print("5. If you removed node_modules, reinstall with: cd frontend && npm install")

if __name__ == "__main__":
    main()