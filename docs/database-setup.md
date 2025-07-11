# Database Setup for PromptEval-Lite

This guide explains how to set up PostgreSQL for self-hosted deployments with user authentication and data persistence.

## Overview

PromptEval-Lite now supports optional PostgreSQL database integration for:
- User authentication (registration/login)
- Secure API key storage
- Prompt history tracking
- User favorites and analytics

The database is **completely optional** - the app continues to work in zero-storage mode when `ENABLE_DATABASE=false`.

## Quick Start

### 1. Generate Encryption Key

First, generate an encryption key for secure API key storage:

```bash
python scripts/generate_encryption_key.py
```

### 2. Configure Environment

Copy the example environment file and update it:

```bash
cp .env.example .env
```

Edit `.env` and set:
```env
# Enable database features
ENABLE_DATABASE=true

# Database connection (Docker Compose will use postgres service)
DATABASE_URL=postgresql+asyncpg://prompteval:yourpassword@localhost:5432/prompteval

# Set a secure JWT secret (generate with: openssl rand -hex 32)
JWT_SECRET_KEY=your-secure-jwt-secret-here

# Set the encryption key from step 1
ENCRYPTION_KEY=your-generated-fernet-key-here

# Set a secure database password
DB_PASSWORD=yourpassword
```

### 3. Run with Docker Compose

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Run database migrations automatically
- Start the PromptEval-Lite application

### 4. Create Your First User

Register via the API:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "myusername",
    "password": "MySecurePassword123"
  }'
```

## Manual Setup (Without Docker)

### 1. Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS with Homebrew
brew install postgresql
```

### 2. Create Database

```bash
sudo -u postgres psql
CREATE DATABASE prompteval;
CREATE USER prompteval WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE prompteval TO prompteval;
\q
```

### 3. Run Migrations

```bash
# Set database URL
export DATABASE_URL=postgresql+asyncpg://prompteval:yourpassword@localhost:5432/prompteval

# Run migrations
alembic upgrade head
```

### 4. Start Application

```bash
python -m uvicorn app.main:app --reload
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/auth/me` - Get current user info

### User Features

- `GET /api/user/api-keys` - List saved API keys
- `POST /api/user/api-keys` - Save an API key
- `DELETE /api/user/api-keys/{id}` - Delete an API key
- `GET /api/user/history` - Get prompt history
- `GET /api/user/history/{id}` - Get specific history item
- `PUT /api/user/history/{id}/favorite` - Toggle favorite
- `DELETE /api/user/history/{id}` - Delete history item

## Security Features

1. **Password Security**
   - Bcrypt hashing
   - Minimum 8 characters
   - Must contain uppercase, lowercase, and digits

2. **API Key Encryption**
   - Fernet symmetric encryption
   - Keys never stored in plaintext
   - Decrypted only when used

3. **JWT Authentication**
   - Configurable expiration (default 24 hours)
   - Secure token generation
   - Optional authentication for all endpoints

## Database Schema

### Users Table
- `id` (UUID) - Primary key
- `email` (String) - Unique email
- `username` (String) - Unique username
- `hashed_password` (String) - Bcrypt hash
- `is_active` (Boolean) - Account status
- `created_at` (DateTime)
- `updated_at` (DateTime)

### User API Keys Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `provider` (Enum) - gemini/gpt4/gpt35/claude
- `encrypted_key` (Text) - Fernet encrypted
- `key_name` (String) - User-friendly name
- `created_at` (DateTime)

### Prompt History Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `prompt` (Text) - Original prompt
- `enhanced_prompt` (Text) - Enhanced version
- `domain` (String) - Optional domain
- `model_used` (String) - AI model used
- `test_results` (JSON) - Test case results
- `overall_score` (Float) - Average score
- `improvements` (JSON) - Enhancement improvements
- `is_favorite` (Boolean) - Favorite flag
- `execution_time` (Float) - Processing time
- `token_usage` (JSON) - Token statistics
- `created_at` (DateTime)

## Backup and Restore

### Backup Database

```bash
# Using Docker
docker-compose exec postgres pg_dump -U prompteval prompteval > backup.sql

# Without Docker
pg_dump -U prompteval -h localhost prompteval > backup.sql
```

### Restore Database

```bash
# Using Docker
docker-compose exec -T postgres psql -U prompteval prompteval < backup.sql

# Without Docker
psql -U prompteval -h localhost prompteval < backup.sql
```

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check connection string format
- Verify firewall allows port 5432

### Migration Issues
- Check Alembic configuration: `alembic.ini`
- Verify DATABASE_URL is set correctly
- Run `alembic history` to see migration status

### Performance
- Add indexes for common queries (already included)
- Consider connection pooling for high load
- Monitor with `pg_stat_activity`

## Zero-Storage Mode

To disable database features and run in zero-storage mode:

```env
ENABLE_DATABASE=false
```

This will:
- Disable all authentication endpoints
- Skip database initialization
- Run as stateless microservice
- No data persistence

## Development Tips

### Generate New Migration

```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Reset Database

```bash
# Drop all tables
alembic downgrade base

# Recreate tables
alembic upgrade head
```

### Test Authentication

```python
# Generate test token
from app.auth import create_access_token
token = create_access_token({"sub": "user-id"})
print(f"Bearer {token}")
```

## Production Considerations

1. **Use strong passwords** for database and JWT secret
2. **Enable SSL/TLS** for database connections
3. **Regular backups** with automated scheduling
4. **Monitor disk usage** for database growth
5. **Set up connection pooling** for better performance
6. **Use environment-specific** configurations
7. **Enable query logging** for debugging (disable in production)