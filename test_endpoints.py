#!/usr/bin/env python3
"""
Test the actual API endpoints
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health endpoint is working!")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Health endpoint failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health endpoint failed: {str(e)}")
        return False

def test_test_endpoint():
    """Test the /test endpoint"""
    try:
        test_data = {
            "prompt": "Translate the following text to French:",
            "domain": "translation",
            "num_cases": 3,
            "score_method": "exact_match"
        }
        
        response = requests.post(f"{BASE_URL}/test", json=test_data)
        if response.status_code == 200:
            result = response.json()
            print("✅ Test endpoint is working!")
            print(f"Overall score: {result['overall_score']}")
            print(f"Passed cases: {result['passed_cases']}/{result['total_cases']}")
            print(f"Execution time: {result['execution_time']:.2f}s")
            return True
        else:
            print(f"❌ Test endpoint failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Test endpoint failed: {str(e)}")
        return False

def test_enhance_endpoint():
    """Test the /enhance endpoint"""
    try:
        enhance_data = {
            "prompt": "Translate text to French",
            "domain": "translation",
            "auto_retest": False
        }
        
        response = requests.post(f"{BASE_URL}/enhance", json=enhance_data)
        if response.status_code == 200:
            result = response.json()
            print("✅ Enhance endpoint is working!")
            print(f"Enhanced prompt length: {len(result['enhanced_prompt'])}")
            print(f"Number of improvements: {len(result['improvements'])}")
            print(f"Execution time: {result['execution_time']:.2f}s")
            return True
        else:
            print(f"❌ Enhance endpoint failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Enhance endpoint failed: {str(e)}")
        return False

def main():
    print("Testing PromptEval-Lite API endpoints...")
    print("Make sure the server is running on http://localhost:8000")
    print()
    
    # Test health endpoint
    if not test_health():
        print("Server might not be running. Start it with: python3 -m uvicorn app.main:app --reload")
        return
    
    print()
    
    # Test /test endpoint
    if not test_test_endpoint():
        return
    
    print()
    
    # Test /enhance endpoint
    if not test_enhance_endpoint():
        return
    
    print()
    print("🎉 All API endpoints are working correctly!")

if __name__ == "__main__":
    main()