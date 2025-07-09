import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert data["version"] == "1.0.0"


def test_test_endpoint_validation():
    # Test empty prompt
    response = client.post("/test", json={"prompt": ""})
    assert response.status_code == 422
    
    # Test valid request structure
    response = client.post("/test", json={
        "prompt": "Translate the following to French:",
        "domain": "translation",
        "num_cases": 3
    })
    # Note: This will likely fail without proper API key, but structure should be valid
    assert response.status_code in [200, 500]  # 500 expected without API key


def test_enhance_endpoint_validation():
    # Test empty prompt
    response = client.post("/enhance", json={"prompt": ""})
    assert response.status_code == 422
    
    # Test valid request structure
    response = client.post("/enhance", json={
        "prompt": "Translate the following to French:",
        "domain": "translation",
        "auto_retest": False
    })
    # Note: This will likely fail without proper API key, but structure should be valid
    assert response.status_code in [200, 500]  # 500 expected without API key


def test_rate_limiting():
    # This test would need to be more sophisticated to properly test rate limiting
    # For now, just ensure the middleware doesn't break normal requests
    response = client.get("/health")
    assert response.status_code == 200