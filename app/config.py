import os
from typing import Optional
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    google_api_key: str = Field(..., env="GOOGLE_API_KEY")
    log_level: str = Field("INFO", env="LOG_LEVEL")
    rate_limit_requests: int = Field(10, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(60, env="RATE_LIMIT_WINDOW")
    max_synthetic_cases: int = Field(10, env="MAX_SYNTHETIC_CASES")
    request_timeout: int = Field(30, env="REQUEST_TIMEOUT")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()