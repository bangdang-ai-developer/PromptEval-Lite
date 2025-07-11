#!/usr/bin/env python3
"""
Initialize the database with Alembic migrations.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parents[1]))

from alembic.config import Config
from alembic import command
from app.config import settings
from app.database import init_database, close_database


async def main():
    """Initialize database and run migrations."""
    if not settings.enable_database:
        print("Database is disabled. Set ENABLE_DATABASE=true to enable.")
        return
    
    print("Initializing database...")
    
    try:
        # Initialize database connection
        await init_database()
        
        # Run Alembic migrations
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        
        print("Database initialized successfully!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        sys.exit(1)
    
    finally:
        await close_database()


if __name__ == "__main__":
    asyncio.run(main())