"""
Authentication API endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from pydantic import BaseModel, EmailStr, Field, validator

from app.database import get_db
from app.db.db_models import User
from app.auth import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    validate_password
)
from app.dependencies import get_current_user
from app.config import settings
from app.logging_config import logger

router = APIRouter(prefix="/api/auth", tags=["authentication"])


class UserRegister(BaseModel):
    """User registration request."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    
    @validator('username')
    def validate_username(cls, v):
        # Only allow alphanumeric and underscore
        if not v.replace('_', '').isalnum():
            raise ValueError('Username must be alphanumeric with underscores only')
        return v
    
    @validator('password')
    def validate_password_strength(cls, v):
        if not validate_password(v):
            raise ValueError('Password must be at least 8 characters with uppercase, lowercase, and digits')
        return v


class UserLogin(BaseModel):
    """User login request."""
    username_or_email: str
    password: str


class TokenResponse(BaseModel):
    """Token response."""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User response."""
    id: str
    email: str
    username: str
    is_active: bool


@router.post("/register", response_model=TokenResponse)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user."""
    if not settings.enable_database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Registration is not available"
        )
    
    # Check if user already exists
    result = await db.execute(
        select(User).where(
            or_(
                User.email == user_data.email,
                User.username == user_data.username
            )
        )
    )
    
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    logger.info("New user registered", user_id=str(user.id), username=user.username)
    
    return TokenResponse(access_token=access_token)


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login with username or email."""
    if not settings.enable_database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Login is not available"
        )
    
    # Find user by username or email
    result = await db.execute(
        select(User).where(
            or_(
                User.email == credentials.username_or_email,
                User.username == credentials.username_or_email
            )
        )
    )
    
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    logger.info("User logged in", user_id=str(user.id))
    
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        is_active=current_user.is_active
    )