import os
from typing import Optional
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API Keys
    google_api_key: str = Field(..., env="GOOGLE_API_KEY")
    openai_api_key: Optional[str] = Field(None, env="OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = Field(None, env="ANTHROPIC_API_KEY")
    
    # Model Configuration
    default_model: str = Field("gemini-2.5-flash", env="DEFAULT_MODEL")
    evaluator_model: str = Field("gemini-2.5-flash", env="EVALUATOR_MODEL")
    
    # Application Settings
    log_level: str = Field("INFO", env="LOG_LEVEL")
    rate_limit_requests: int = Field(10, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(60, env="RATE_LIMIT_WINDOW")
    max_synthetic_cases: int = Field(10, env="MAX_SYNTHETIC_CASES")
    request_timeout: int = Field(30, env="REQUEST_TIMEOUT")
    
    # Database Configuration
    enable_database: bool = Field(False, env="ENABLE_DATABASE")
    database_url: Optional[str] = Field(None, env="DATABASE_URL")
    
    # Authentication Settings
    jwt_secret_key: Optional[str] = Field(None, env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field("HS256", env="JWT_ALGORITHM")
    jwt_expiration_hours: int = Field(24, env="JWT_EXPIRATION_HOURS")
    
    # Encryption Settings
    encryption_key: Optional[str] = Field(None, env="ENCRYPTION_KEY")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()