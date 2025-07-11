"""
Database configuration and session management.
"""

from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from app.config import settings
from app.logging_config import logger

# Create base class for models
Base = declarative_base()

# Global engine and session maker
engine: Optional[AsyncSession] = None
async_session_maker: Optional[async_sessionmaker] = None


def get_database_url() -> str:
    """Get the database URL from settings."""
    if not settings.database_url:
        raise ValueError("DATABASE_URL not configured")
    return settings.database_url


async def init_database():
    """Initialize the database engine and session maker."""
    global engine, async_session_maker
    
    if not settings.enable_database:
        logger.info("Database is disabled")
        return
    
    try:
        database_url = get_database_url()
        
        # Create async engine
        engine = create_async_engine(
            database_url,
            echo=False,  # Set to True for SQL logging
            poolclass=NullPool,  # Disable connection pooling for SQLite
            future=True
        )
        
        # Create async session maker
        async_session_maker = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        logger.info("Database initialized successfully")
        
        # Create tables (for development)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
    except Exception as e:
        logger.error("Failed to initialize database", error=str(e))
        raise


async def close_database():
    """Close the database engine."""
    global engine
    
    if engine:
        await engine.dispose()
        logger.info("Database connection closed")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get database session.
    
    Yields:
        Database session
    """
    if not async_session_maker:
        raise RuntimeError("Database not initialized")
    
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_optional_db():
    """
    Optional database dependency.
    Returns None if database is disabled.
    """
    if not settings.enable_database or not async_session_maker:
        yield None
        return
    
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()