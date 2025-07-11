"""
API endpoints for enhanced prompt management.
"""

from typing import List, Optional, Union, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_, or_
from pydantic import BaseModel, Field
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.db.db_models import User, PromptHistory, PromptUsageStats, PromptVersion
from app.logging_config import logger
from app.models import ModelProvider

router = APIRouter()


# Request/Response models
class SavePromptRequest(BaseModel):
    """Request model for saving a prompt."""
    prompt: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = []
    domain: Optional[str] = None
    enhanced_prompt: Optional[str] = None
    model_used: str
    test_results: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None
    overall_score: Optional[float] = None
    improvements: Optional[List[str]] = None
    execution_time: Optional[float] = None
    token_usage: Optional[Dict[str, Any]] = None
    is_template: bool = False
    template_variables: Optional[List[str]] = None


class UpdatePromptRequest(BaseModel):
    """Request model for updating a prompt."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = None
    is_template: Optional[bool] = None
    template_variables: Optional[List[str]] = None
    is_public: Optional[bool] = None


class PromptResponse(BaseModel):
    """Response model for a saved prompt."""
    id: UUID
    user_id: UUID
    prompt: str
    enhanced_prompt: Optional[str]
    name: Optional[str]
    description: Optional[str]
    category: Optional[str]
    tags: Optional[List[str]]
    domain: Optional[str]
    model_used: str
    overall_score: Optional[float]
    is_favorite: bool
    is_template: bool
    template_variables: Optional[List[str]]
    usage_count: int
    average_score: Optional[float]
    last_used_at: Optional[datetime]
    is_public: bool
    created_at: datetime
    execution_time: Optional[float]
    test_results: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None
    improvements: Optional[List[str]] = None
    token_usage: Optional[Dict[str, Any]] = None
    
    # Version information
    current_version: int
    version_count: int
    last_modified_at: Optional[datetime]

    class Config:
        from_attributes = True


class PromptLibraryResponse(BaseModel):
    """Response model for prompt library listing."""
    prompts: List[PromptResponse]
    total: int
    page: int
    page_size: int


class PromptUsageResponse(BaseModel):
    """Response model for prompt usage tracking."""
    prompt_id: UUID
    usage_count: int
    average_score: float
    message: str


# Prompt categories enum
PROMPT_CATEGORIES = [
    "translation",
    "coding",
    "writing",
    "analysis",
    "summarization",
    "data_formatting",
    "creative",
    "educational",
    "business",
    "other"
]


@router.post("/prompts/save", response_model=PromptResponse)
async def save_prompt(
    request: SavePromptRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save a prompt with enhanced metadata."""
    try:
        # Create new prompt history entry
        prompt = PromptHistory(
            user_id=current_user.id,
            prompt=request.prompt,
            name=request.name,
            description=request.description,
            category=request.category,
            tags=request.tags,
            domain=request.domain,
            enhanced_prompt=request.enhanced_prompt,
            model_used=request.model_used,
            test_results=request.test_results,
            overall_score=request.overall_score,
            improvements=request.improvements,
            execution_time=request.execution_time,
            token_usage=request.token_usage,
            is_template=request.is_template,
            template_variables=request.template_variables,
            is_favorite=False,
            usage_count=0,
            average_score=request.overall_score,
            is_public=False
        )
        
        db.add(prompt)
        await db.commit()
        await db.refresh(prompt)
        
        logger.info("Saved prompt", user_id=str(current_user.id), prompt_id=str(prompt.id))
        return PromptResponse.model_validate(prompt)
        
    except Exception as e:
        logger.error("Failed to save prompt", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save prompt"
        )


@router.get("/prompts/library", response_model=PromptLibraryResponse)
async def get_prompt_library(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    is_template: Optional[bool] = None,
    is_favorite: Optional[bool] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|name|usage_count|average_score|last_used_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's prompt library with filtering and pagination."""
    try:
        # Build query
        query = select(PromptHistory).where(PromptHistory.user_id == current_user.id)
        
        # Apply filters
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    PromptHistory.name.ilike(search_pattern),
                    PromptHistory.prompt.ilike(search_pattern),
                    PromptHistory.description.ilike(search_pattern)
                )
            )
        
        if category:
            query = query.where(PromptHistory.category == category)
        
        if tags:
            # Filter by tags (any match)
            tag_conditions = []
            for tag in tags:
                tag_conditions.append(PromptHistory.tags.contains([tag]))
            query = query.where(or_(*tag_conditions))
        
        if is_template is not None:
            query = query.where(PromptHistory.is_template == is_template)
        
        if is_favorite is not None:
            query = query.where(PromptHistory.is_favorite == is_favorite)
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)
        
        # Apply sorting
        sort_column = getattr(PromptHistory, sort_by)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        # Execute query
        result = await db.execute(query)
        prompts = result.scalars().all()
        
        return PromptLibraryResponse(
            prompts=[PromptResponse.model_validate(p) for p in prompts],
            total=total or 0,
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        logger.error("Failed to get prompt library", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get prompt library"
        )


@router.get("/prompts/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific prompt by ID."""
    query = select(PromptHistory).where(
        and_(
            PromptHistory.id == prompt_id,
            PromptHistory.user_id == current_user.id
        )
    )
    result = await db.execute(query)
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    return PromptResponse.model_validate(prompt)




@router.delete("/prompts/{prompt_id}")
async def delete_prompt(
    prompt_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a prompt."""
    query = select(PromptHistory).where(
        and_(
            PromptHistory.id == prompt_id,
            PromptHistory.user_id == current_user.id
        )
    )
    result = await db.execute(query)
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    await db.delete(prompt)
    await db.commit()
    
    return {"message": "Prompt deleted successfully"}


@router.post("/prompts/{prompt_id}/use", response_model=PromptUsageResponse)
async def track_prompt_usage(
    prompt_id: UUID,
    test_score: Optional[float] = None,
    model_used: str = "gemini-2.5-flash",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Track when a saved prompt is used."""
    # Get the prompt
    query = select(PromptHistory).where(
        and_(
            PromptHistory.id == prompt_id,
            PromptHistory.user_id == current_user.id
        )
    )
    result = await db.execute(query)
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    # Create usage record
    usage_stat = PromptUsageStats(
        prompt_id=prompt_id,
        user_id=current_user.id,
        test_score=test_score,
        model_used=model_used,
        used_at=datetime.utcnow()
    )
    db.add(usage_stat)
    
    # Update prompt statistics
    prompt.usage_count += 1
    prompt.last_used_at = datetime.utcnow()
    
    # Update average score if test_score provided
    if test_score is not None:
        if prompt.average_score is None:
            prompt.average_score = test_score
        else:
            # Calculate new average
            total_score = prompt.average_score * (prompt.usage_count - 1) + test_score
            prompt.average_score = total_score / prompt.usage_count
    
    await db.commit()
    
    return PromptUsageResponse(
        prompt_id=prompt_id,
        usage_count=prompt.usage_count,
        average_score=prompt.average_score or 0.0,
        message="Usage tracked successfully"
    )


@router.get("/prompts/templates/public", response_model=List[PromptResponse])
async def get_public_templates(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get public prompt templates."""
    query = select(PromptHistory).where(
        and_(
            PromptHistory.is_template == True,
            PromptHistory.is_public == True
        )
    )
    
    if category:
        query = query.where(PromptHistory.category == category)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                PromptHistory.name.ilike(search_pattern),
                PromptHistory.prompt.ilike(search_pattern),
                PromptHistory.description.ilike(search_pattern)
            )
        )
    
    query = query.order_by(PromptHistory.usage_count.desc()).limit(50)
    
    result = await db.execute(query)
    templates = result.scalars().all()
    
    return [PromptResponse.model_validate(t) for t in templates]


@router.get("/prompts/categories", response_model=List[str])
async def get_prompt_categories():
    """Get available prompt categories."""
    return PROMPT_CATEGORIES


class BulkOperationRequest(BaseModel):
    """Request model for bulk operations."""
    prompt_ids: List[UUID] = Field(..., min_items=1)
    operation: str = Field(..., pattern="^(delete|export|update_category|toggle_favorite)$")
    category: Optional[str] = Field(None, max_length=50)  # For update_category operation


class BulkExportResponse(BaseModel):
    """Response model for bulk export."""
    prompts: List[PromptResponse]
    export_format: str = "json"
    total_count: int


@router.post("/prompts/bulk", response_model=Union[Dict[str, Any], BulkExportResponse])
async def bulk_prompt_operations(
    request: BulkOperationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Perform bulk operations on multiple prompts."""
    try:
        # Verify all prompts belong to the user
        query = select(PromptHistory).where(
            and_(
                PromptHistory.id.in_(request.prompt_ids),
                PromptHistory.user_id == current_user.id
            )
        )
        result = await db.execute(query)
        prompts = result.scalars().all()
        
        if len(prompts) != len(request.prompt_ids):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Some prompts not found or not owned by user"
            )
        
        if request.operation == "delete":
            # Bulk delete
            for prompt in prompts:
                await db.delete(prompt)
            await db.commit()
            return {
                "message": f"Successfully deleted {len(prompts)} prompts",
                "deleted_count": len(prompts)
            }
            
        elif request.operation == "export":
            # Bulk export
            return BulkExportResponse(
                prompts=[PromptResponse.model_validate(p) for p in prompts],
                export_format="json",
                total_count=len(prompts)
            )
            
        elif request.operation == "update_category":
            # Bulk update category
            if not request.category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category is required for update_category operation"
                )
            
            for prompt in prompts:
                prompt.category = request.category
            await db.commit()
            
            return {
                "message": f"Successfully updated category for {len(prompts)} prompts",
                "updated_count": len(prompts),
                "new_category": request.category
            }
            
        elif request.operation == "toggle_favorite":
            # Bulk toggle favorite
            toggled_count = 0
            for prompt in prompts:
                prompt.is_favorite = not prompt.is_favorite
                toggled_count += 1
            await db.commit()
            
            return {
                "message": f"Successfully toggled favorite status for {toggled_count} prompts",
                "toggled_count": toggled_count
            }
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid operation: {request.operation}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to perform bulk operation", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform bulk operation"
        )


class GenerateNameRequest(BaseModel):
    """Request model for generating prompt name."""
    prompt: str = Field(..., description="The prompt to generate a name for")


@router.post("/prompts/generate-name", response_model=dict)
async def generate_prompt_name(
    request: GenerateNameRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a descriptive name for a prompt using AI."""
    try:
        from app.multi_model_service import MultiModelService
        
        # Use AI to generate a descriptive name
        service = MultiModelService()
        
        # Create a specific prompt for name generation
        name_generation_prompt = f"""Given the following prompt, generate a short, descriptive name (3-6 words) that captures its main purpose:

Prompt: "{request.prompt}"

Requirements:
- The name should be concise and descriptive
- Use title case
- Focus on the main function or purpose
- Avoid generic terms like "prompt" or "template"
- Make it memorable and easy to understand

Respond with ONLY the generated name, nothing else."""

        # Use the model to generate the name
        generated_name = await service._generate_with_model(
            name_generation_prompt,
            ModelProvider.GEMINI_25_FLASH,  # Use fast model for quick generation
            None  # Use server API key
        )
        
        # Clean up the generated name
        name = generated_name.strip().strip('"').strip("'")
        
        # Ensure it's not too long
        if len(name) > 100:
            name = name[:97] + "..."
            
        logger.info("Generated prompt name", user_id=str(current_user.id), name=name)
        
        return {"name": name}
        
    except Exception as e:
        logger.error("Failed to generate prompt name", error=str(e))
        # Fallback to simple extraction
        first_line = request.prompt.split('\n')[0]
        words = first_line.split()[:5]
        fallback_name = ' '.join(words)
        return {"name": fallback_name or "My Prompt"}


class PromptVersionResponse(BaseModel):
    """Response model for prompt version."""
    id: UUID
    prompt_id: UUID
    version_number: int
    prompt: str
    enhanced_prompt: Optional[str]
    name: Optional[str]
    description: Optional[str]
    category: Optional[str]
    tags: Optional[List[str]]
    domain: Optional[str]
    model_used: str
    test_results: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]]
    overall_score: Optional[float]
    improvements: Optional[List[str]]
    execution_time: Optional[float]
    token_usage: Optional[Dict[str, Any]]
    is_template: bool
    template_variables: Optional[List[str]]
    change_summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CreateVersionRequest(BaseModel):
    """Request model for creating a new version."""
    change_summary: Optional[str] = None


@router.put("/prompts/{prompt_id}", response_model=PromptResponse)
async def update_prompt_with_versioning(
    prompt_id: UUID,
    request: UpdatePromptRequest,
    create_version: bool = Query(True, description="Whether to create a new version"),
    change_summary: Optional[str] = Query(None, description="Summary of changes for version history"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update prompt metadata with optional versioning."""
    # Get the prompt
    query = select(PromptHistory).where(
        and_(
            PromptHistory.id == prompt_id,
            PromptHistory.user_id == current_user.id
        )
    )
    result = await db.execute(query)
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    # Create version if requested and something substantial changed
    if create_version and any(
        getattr(prompt, field) != value 
        for field, value in request.model_dump(exclude_unset=True).items()
        if field in ['prompt', 'enhanced_prompt', 'name', 'description', 'category', 'tags']
    ):
        # Create a version snapshot before updating
        version = PromptVersion(
            prompt_id=prompt_id,
            user_id=current_user.id,
            version_number=prompt.current_version,
            prompt=prompt.prompt,
            enhanced_prompt=prompt.enhanced_prompt,
            name=prompt.name,
            description=prompt.description,
            category=prompt.category,
            tags=prompt.tags,
            domain=prompt.domain,
            model_used=prompt.model_used,
            test_results=prompt.test_results,
            overall_score=prompt.overall_score,
            improvements=prompt.improvements,
            execution_time=prompt.execution_time,
            token_usage=prompt.token_usage,
            is_template=prompt.is_template,
            template_variables=prompt.template_variables,
            change_summary=change_summary or "Manual update"
        )
        db.add(version)
        
        # Increment version number
        prompt.current_version += 1
        prompt.version_count += 1
        prompt.last_modified_at = datetime.utcnow()
    
    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prompt, field, value)
    
    await db.commit()
    await db.refresh(prompt)
    
    return PromptResponse.model_validate(prompt)


@router.get("/prompts/{prompt_id}/versions", response_model=List[PromptVersionResponse])
async def get_prompt_versions(
    prompt_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get version history for a prompt."""
    # Verify prompt ownership
    prompt_query = select(PromptHistory).where(
        and_(
            PromptHistory.id == prompt_id,
            PromptHistory.user_id == current_user.id
        )
    )
    result = await db.execute(prompt_query)
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    # Get versions
    query = select(PromptVersion).where(
        PromptVersion.prompt_id == prompt_id
    ).order_by(PromptVersion.version_number.desc())
    
    result = await db.execute(query)
    versions = result.scalars().all()
    
    return [PromptVersionResponse.model_validate(v) for v in versions]


@router.get("/prompts/{prompt_id}/versions/{version_number}", response_model=PromptVersionResponse)
async def get_prompt_version(
    prompt_id: UUID,
    version_number: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific version of a prompt."""
    # Verify prompt ownership
    prompt_query = select(PromptHistory).where(
        and_(
            PromptHistory.id == prompt_id,
            PromptHistory.user_id == current_user.id
        )
    )
    result = await db.execute(prompt_query)
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    # Get specific version
    query = select(PromptVersion).where(
        and_(
            PromptVersion.prompt_id == prompt_id,
            PromptVersion.version_number == version_number
        )
    )
    
    result = await db.execute(query)
    version = result.scalar_one_or_none()
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )
    
    return PromptVersionResponse.model_validate(version)


@router.post("/prompts/{prompt_id}/versions/{version_number}/restore", response_model=PromptResponse)
async def restore_prompt_version(
    prompt_id: UUID,
    version_number: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Restore a prompt to a specific version."""
    # Get the prompt
    prompt_query = select(PromptHistory).where(
        and_(
            PromptHistory.id == prompt_id,
            PromptHistory.user_id == current_user.id
        )
    )
    result = await db.execute(prompt_query)
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    # Get the version to restore
    version_query = select(PromptVersion).where(
        and_(
            PromptVersion.prompt_id == prompt_id,
            PromptVersion.version_number == version_number
        )
    )
    
    result = await db.execute(version_query)
    version = result.scalar_one_or_none()
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )
    
    # Create a new version with current state before restoring
    current_version = PromptVersion(
        prompt_id=prompt_id,
        user_id=current_user.id,
        version_number=prompt.current_version,
        prompt=prompt.prompt,
        enhanced_prompt=prompt.enhanced_prompt,
        name=prompt.name,
        description=prompt.description,
        category=prompt.category,
        tags=prompt.tags,
        domain=prompt.domain,
        model_used=prompt.model_used,
        test_results=prompt.test_results,
        overall_score=prompt.overall_score,
        improvements=prompt.improvements,
        execution_time=prompt.execution_time,
        token_usage=prompt.token_usage,
        is_template=prompt.is_template,
        template_variables=prompt.template_variables,
        change_summary=f"Before restoring to version {version_number}"
    )
    db.add(current_version)
    
    # Restore the prompt to the selected version
    prompt.prompt = version.prompt
    prompt.enhanced_prompt = version.enhanced_prompt
    prompt.name = version.name
    prompt.description = version.description
    prompt.category = version.category
    prompt.tags = version.tags
    prompt.domain = version.domain
    prompt.model_used = version.model_used
    prompt.test_results = version.test_results
    prompt.overall_score = version.overall_score
    prompt.improvements = version.improvements
    prompt.execution_time = version.execution_time
    prompt.token_usage = version.token_usage
    prompt.is_template = version.is_template
    prompt.template_variables = version.template_variables
    
    # Update version tracking
    prompt.current_version += 1
    prompt.version_count += 1
    prompt.last_modified_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(prompt)
    
    logger.info(
        "Restored prompt to version",
        user_id=str(current_user.id),
        prompt_id=str(prompt_id),
        restored_version=version_number,
        new_version=prompt.current_version
    )
    
    return PromptResponse.model_validate(prompt)