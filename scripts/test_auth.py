#!/usr/bin/env python3
"""
Test script for authentication flow.
"""
import asyncio
import httpx
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

async def test_auth_flow():
    """Test the complete authentication flow."""
    async with httpx.AsyncClient() as client:
        # Test data
        test_user = {
            "email": f"test_{datetime.now().timestamp()}@example.com",
            "username": f"testuser_{int(datetime.now().timestamp())}",
            "password": "TestPassword123!"
        }
        
        print("1. Testing unauthenticated access...")
        response = await client.get(f"{BASE_URL}/api/auth/me")
        print(f"   Status: {response.status_code} (Expected: 401)")
        print(f"   Response: {response.json()}\n")
        
        print("2. Registering new user...")
        response = await client.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user
        )
        if response.status_code == 200:
            token_data = response.json()
            token = token_data["access_token"]
            print(f"   Status: {response.status_code}")
            print(f"   Token received: {token[:20]}...\n")
        else:
            print(f"   Registration failed: {response.status_code}")
            print(f"   Error: {response.json()}")
            return
        
        print("3. Testing authenticated access...")
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get(f"{BASE_URL}/api/auth/me", headers=headers)
        print(f"   Status: {response.status_code}")
        print(f"   User info: {json.dumps(response.json(), indent=2)}\n")
        
        print("4. Testing login with username...")
        login_data = {
            "username_or_email": test_user["username"],
            "password": test_user["password"]
        }
        response = await client.post(
            f"{BASE_URL}/api/auth/login",
            json=login_data
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   Login successful!\n")
        
        print("5. Testing login with email...")
        login_data["username_or_email"] = test_user["email"]
        response = await client.post(
            f"{BASE_URL}/api/auth/login",
            json=login_data
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   Login successful!\n")
        
        print("6. Testing invalid credentials...")
        login_data["password"] = "WrongPassword"
        response = await client.post(
            f"{BASE_URL}/api/auth/login",
            json=login_data
        )
        print(f"   Status: {response.status_code} (Expected: 401)")
        print(f"   Error: {response.json()}")

if __name__ == "__main__":
    print("Testing Authentication Flow\n" + "="*40 + "\n")
    asyncio.run(test_auth_flow())