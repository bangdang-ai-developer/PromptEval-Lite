#!/usr/bin/env python3
"""
Script to verify database setup and show table information.
"""
import asyncio
from sqlalchemy import text
from app.database import async_session_maker, init_database
from app.config import settings

async def verify_database():
    """Verify database connection and show tables."""
    print(f"Database enabled: {settings.enable_database}")
    print(f"Database URL: {settings.database_url.replace(settings.database_url.split('@')[0].split('://')[-1].split(':')[-1], '***')}")
    
    # Initialize database
    await init_database()
    
    # Import here after init
    from app.database import async_session_maker
    
    # Check tables
    async with async_session_maker() as session:
        # List all tables
        result = await session.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        )
        tables = result.fetchall()
        
        print("\nDatabase tables:")
        for table in tables:
            print(f"  - {table[0]}")
            
        # Count records in each table
        print("\nRecord counts:")
        for table in tables:
            if table[0] != 'alembic_version':
                count_result = await session.execute(
                    text(f"SELECT COUNT(*) FROM {table[0]}")
                )
                count = count_result.scalar()
                print(f"  - {table[0]}: {count} records")

if __name__ == "__main__":
    asyncio.run(verify_database())