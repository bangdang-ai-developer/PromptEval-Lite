"""
Database models for user authentication and data persistence.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Boolean, DateTime, Float, Text, ForeignKey, Enum as SQLEnum, JSON, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models import ModelProvider


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    api_keys = relationship("UserAPIKey", back_populates="user", cascade="all, delete-orphan")
    prompt_history = relationship("PromptHistory", back_populates="user", cascade="all, delete-orphan")


class UserAPIKey(Base):
    """Encrypted API keys storage for users."""
    __tablename__ = "user_api_keys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    provider = Column(SQLEnum(ModelProvider), nullable=False)
    encrypted_key = Column(Text, nullable=False)  # Fernet encrypted
    key_name = Column(String(100), nullable=False)  # User-friendly name
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="api_keys")
    
    # Unique constraint: one key per provider per user
    __table_args__ = (
        {"postgresql_partition_by": "LIST (provider)"},
    )


class PromptHistory(Base):
    """History of user's prompt tests and enhancements."""
    __tablename__ = "prompt_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Prompt data
    prompt = Column(Text, nullable=False)
    enhanced_prompt = Column(Text, nullable=True)
    domain = Column(String(100), nullable=True)
    model_used = Column(String(50), nullable=False)
    
    # Enhanced prompt management fields
    name = Column(String(255), nullable=True)  # User-friendly name
    description = Column(Text, nullable=True)  # Notes about the prompt
    category = Column(String(50), nullable=True)  # Category for organization
    tags = Column(JSON, nullable=True)  # Array of tags
    is_template = Column(Boolean, default=False, nullable=False)  # Template flag
    template_variables = Column(JSON, nullable=True)  # Variables for templates
    usage_count = Column(Integer, default=0, nullable=False)  # Usage tracking
    average_score = Column(Float, nullable=True)  # Average test score
    last_used_at = Column(DateTime, nullable=True)  # Last usage timestamp
    is_public = Column(Boolean, default=False, nullable=False)  # Sharing flag
    
    # Version tracking
    current_version = Column(Integer, default=1, nullable=False)
    version_count = Column(Integer, default=1, nullable=False)
    last_modified_at = Column(DateTime, nullable=True)
    
    # Test results (stored as JSON)
    test_results = Column(JSON, nullable=True)
    overall_score = Column(Float, nullable=True)
    improvements = Column(JSON, nullable=True)  # List of improvements for enhanced prompts
    
    # Metadata
    is_favorite = Column(Boolean, default=False, nullable=False)
    execution_time = Column(Float, nullable=True)
    token_usage = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="prompt_history")
    usage_stats = relationship("PromptUsageStats", back_populates="prompt", cascade="all, delete-orphan")
    versions = relationship("PromptVersion", back_populates="prompt_history", cascade="all, delete-orphan", order_by="PromptVersion.version_number.desc()")


class PromptUsageStats(Base):
    """Track usage statistics for saved prompts."""
    __tablename__ = "prompt_usage_stats"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompt_history.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    test_score = Column(Float, nullable=True)
    model_used = Column(String(50), nullable=False)
    used_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    prompt = relationship("PromptHistory", back_populates="usage_stats")
    user = relationship("User")


class PromptVersion(Base):
    """Track versions of prompts."""
    __tablename__ = "prompt_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompt_history.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    prompt = Column(Text, nullable=False)
    enhanced_prompt = Column(Text, nullable=True)
    name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)
    tags = Column(JSON, nullable=True)
    domain = Column(String(100), nullable=True)
    model_used = Column(String(100), nullable=False)
    test_results = Column(JSON, nullable=True)
    overall_score = Column(Float, nullable=True)
    improvements = Column(JSON, nullable=True)
    execution_time = Column(Float, nullable=True)
    token_usage = Column(JSON, nullable=True)
    is_template = Column(Boolean, default=False, nullable=False)
    template_variables = Column(JSON, nullable=True)
    change_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    
    # Relationships
    prompt_history = relationship("PromptHistory", back_populates="versions")
    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('prompt_id', 'version_number', name='uq_prompt_version'),
    )