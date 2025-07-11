"""
User API endpoints for managing API keys and prompt history.
"""

from typing import List, Optional
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field

from app.database import get_db
from app.db.db_models import User, UserAPIKey, PromptHistory
from app.models import ModelProvider
from app.auth import encrypt_api_key, decrypt_api_key
from app.dependencies import get_current_user
from app.validators import APIKeyValidator
from app.logging_config import logger

router = APIRouter(prefix="/api/user", tags=["user"])


class SaveAPIKeyRequest(BaseModel):
    """Request to save an API key."""
    provider: ModelProvider
    api_key: str
    key_name: str = Field(..., min_length=1, max_length=100)


class APIKeyResponse(BaseModel):
    """Response for saved API key."""
    id: str
    provider: ModelProvider
    key_name: str
    created_at: datetime


class PromptHistoryResponse(BaseModel):
    """Response for prompt history item."""
    id: str
    prompt: str
    enhanced_prompt: Optional[str]
    domain: Optional[str]
    model_used: str
    overall_score: Optional[float]
    is_favorite: bool
    created_at: datetime
    execution_time: Optional[float]


class PromptHistoryDetail(PromptHistoryResponse):
    """Detailed prompt history with full results."""
    test_results: Optional[dict]
    improvements: Optional[List[str]]
    token_usage: Optional[dict]


@router.get("/api-keys", response_model=List[APIKeyResponse])
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user's saved API keys."""
    result = await db.execute(
        select(UserAPIKey)
        .where(UserAPIKey.user_id == current_user.id)
        .order_by(UserAPIKey.created_at.desc())
    )
    
    keys = result.scalars().all()
    
    return [
        APIKeyResponse(
            id=str(key.id),
            provider=key.provider,
            key_name=key.key_name,
            created_at=key.created_at
        )
        for key in keys
    ]


@router.post("/api-keys", response_model=APIKeyResponse)
async def save_api_key(
    request: SaveAPIKeyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save an encrypted API key."""
    # Validate API key format
    try:
        validated_key = APIKeyValidator.validate_api_key(
            request.api_key,
            request.provider.value
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Check if user already has a key for this provider
    result = await db.execute(
        select(UserAPIKey).where(
            UserAPIKey.user_id == current_user.id,
            UserAPIKey.provider == request.provider
        )
    )
    
    existing_key = result.scalar_one_or_none()
    
    if existing_key:
        # Update existing key
        existing_key.encrypted_key = encrypt_api_key(validated_key)
        existing_key.key_name = request.key_name
        api_key = existing_key
    else:
        # Create new key
        api_key = UserAPIKey(
            user_id=current_user.id,
            provider=request.provider,
            encrypted_key=encrypt_api_key(validated_key),
            key_name=request.key_name
        )
        db.add(api_key)
    
    await db.commit()
    await db.refresh(api_key)
    
    logger.info("API key saved", user_id=str(current_user.id), provider=request.provider.value)
    
    return APIKeyResponse(
        id=str(api_key.id),
        provider=api_key.provider,
        key_name=api_key.key_name,
        created_at=api_key.created_at
    )


@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a saved API key."""
    result = await db.execute(
        select(UserAPIKey).where(
            UserAPIKey.id == key_id,
            UserAPIKey.user_id == current_user.id
        )
    )
    
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    await db.delete(api_key)
    await db.commit()
    
    return {"message": "API key deleted"}


@router.get("/history", response_model=List[PromptHistoryResponse])
async def get_prompt_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    favorites_only: bool = Query(False),
    model: Optional[ModelProvider] = Query(None)
):
    """Get user's prompt history."""
    query = select(PromptHistory).where(PromptHistory.user_id == current_user.id)
    
    if favorites_only:
        query = query.where(PromptHistory.is_favorite == True)
    
    if model:
        query = query.where(PromptHistory.model_used == model.value)
    
    query = query.order_by(PromptHistory.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    history_items = result.scalars().all()
    
    return [
        PromptHistoryResponse(
            id=str(item.id),
            prompt=item.prompt,
            enhanced_prompt=item.enhanced_prompt,
            domain=item.domain,
            model_used=item.model_used,
            overall_score=item.overall_score,
            is_favorite=item.is_favorite,
            created_at=item.created_at,
            execution_time=item.execution_time
        )
        for item in history_items
    ]


@router.get("/history/{history_id}", response_model=PromptHistoryDetail)
async def get_prompt_history_detail(
    history_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed prompt history item."""
    result = await db.execute(
        select(PromptHistory).where(
            PromptHistory.id == history_id,
            PromptHistory.user_id == current_user.id
        )
    )
    
    history_item = result.scalar_one_or_none()
    
    if not history_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History item not found"
        )
    
    return PromptHistoryDetail(
        id=str(history_item.id),
        prompt=history_item.prompt,
        enhanced_prompt=history_item.enhanced_prompt,
        domain=history_item.domain,
        model_used=history_item.model_used,
        overall_score=history_item.overall_score,
        is_favorite=history_item.is_favorite,
        created_at=history_item.created_at,
        execution_time=history_item.execution_time,
        test_results=history_item.test_results,
        improvements=history_item.improvements,
        token_usage=history_item.token_usage
    )


@router.put("/history/{history_id}/favorite")
async def toggle_favorite(
    history_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle favorite status of a history item."""
    result = await db.execute(
        select(PromptHistory).where(
            PromptHistory.id == history_id,
            PromptHistory.user_id == current_user.id
        )
    )
    
    history_item = result.scalar_one_or_none()
    
    if not history_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History item not found"
        )
    
    history_item.is_favorite = not history_item.is_favorite
    await db.commit()
    
    return {"is_favorite": history_item.is_favorite}


@router.delete("/history/{history_id}")
async def delete_history_item(
    history_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a history item."""
    result = await db.execute(
        select(PromptHistory).where(
            PromptHistory.id == history_id,
            PromptHistory.user_id == current_user.id
        )
    )
    
    history_item = result.scalar_one_or_none()
    
    if not history_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History item not found"
        )
    
    await db.delete(history_item)
    await db.commit()
    
    return {"message": "History item deleted"}