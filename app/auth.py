"""
Authentication utilities for JWT tokens and password hashing.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from app.config import settings
from app.logging_config import logger

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Fernet encryption for API keys
fernet: Optional[Fernet] = None
if settings.encryption_key and settings.enable_database:
    try:
        # Fernet key should already be base64 encoded
        fernet = Fernet(settings.encryption_key)
    except Exception as e:
        logger.error("Failed to initialize Fernet encryption", error=str(e))
        logger.info("Generate a valid key using: python scripts/generate_fernet_key.py")
elif settings.enable_database and not settings.encryption_key:
    logger.warning("Database enabled but ENCRYPTION_KEY not set - API key encryption disabled")


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token
    """
    if not settings.jwt_secret_key:
        raise ValueError("JWT_SECRET_KEY not configured")
    
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.jwt_secret_key, 
        algorithm=settings.jwt_algorithm
    )
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode a JWT access token.
    
    Args:
        token: JWT token to decode
        
    Returns:
        Decoded token data or None if invalid
    """
    if not settings.jwt_secret_key:
        raise ValueError("JWT_SECRET_KEY not configured")
    
    try:
        payload = jwt.decode(
            token, 
            settings.jwt_secret_key, 
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError as e:
        logger.warning("Invalid JWT token", error=str(e))
        return None


def encrypt_api_key(api_key: str) -> str:
    """
    Encrypt an API key for storage.
    
    Args:
        api_key: Plain text API key
        
    Returns:
        Encrypted API key
    """
    if not fernet:
        raise ValueError("Encryption not configured")
    
    return fernet.encrypt(api_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """
    Decrypt an API key from storage.
    
    Args:
        encrypted_key: Encrypted API key
        
    Returns:
        Decrypted API key
    """
    if not fernet:
        raise ValueError("Encryption not configured")
    
    return fernet.decrypt(encrypted_key.encode()).decode()


def generate_encryption_key() -> str:
    """
    Generate a new Fernet encryption key.
    
    Returns:
        Base64 encoded encryption key
    """
    return Fernet.generate_key().decode()


def validate_password(password: str) -> bool:
    """
    Validate password meets requirements.
    
    Args:
        password: Password to validate
        
    Returns:
        True if password is valid
    """
    if len(password) < 8:
        return False
    
    # Check for at least one uppercase, lowercase, and digit
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    
    return has_upper and has_lower and has_digit