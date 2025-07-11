#!/usr/bin/env python3
"""
Generate all required keys for Render deployment.
"""

import secrets
from cryptography.fernet import Fernet


def main():
    print("=" * 60)
    print("RENDER DEPLOYMENT KEY GENERATOR")
    print("=" * 60)
    print()
    
    # Generate Fernet key
    fernet_key = Fernet.generate_key().decode()
    
    # Generate JWT secret
    jwt_secret = secrets.token_urlsafe(32)
    
    print("Copy these environment variables to your Render dashboard:")
    print()
    print("# For full deployment with database:")
    print(f"ENCRYPTION_KEY={fernet_key}")
    print(f"JWT_SECRET_KEY={jwt_secret}")
    print()
    print("# For stateless deployment (no database):")
    print("ENABLE_DATABASE=false")
    print("ENCRYPTION_KEY=gAAAAABhZ0123456789012345678901234567890-_aaaaaaaaa=")
    print("JWT_SECRET_KEY=stateless-mode-placeholder-key-not-used")
    print()
    print("=" * 60)
    print("IMPORTANT: Don't forget to add your GOOGLE_API_KEY!")
    print("Get it from: https://makersuite.google.com/app/apikey")
    print("=" * 60)


if __name__ == "__main__":
    main()