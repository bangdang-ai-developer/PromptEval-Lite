#!/usr/bin/env python3
"""Generate a valid Fernet encryption key."""

from cryptography.fernet import Fernet

def generate_fernet_key():
    """Generate a new Fernet key."""
    key = Fernet.generate_key()
    print("Generated Fernet Key:")
    print(key.decode())
    print("\nAdd this to your .env file:")
    print(f"ENCRYPTION_KEY={key.decode()}")

if __name__ == "__main__":
    generate_fernet_key()