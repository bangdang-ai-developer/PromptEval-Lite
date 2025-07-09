import time
import uuid
from datetime import datetime
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from app.models import (
    TestRequest, TestResponse, EnhanceRequest, EnhanceResponse, 
    ErrorResponse, HealthResponse, TestResult
)
from app.llm_service import GeminiService
from app.logging_config import configure_logging, logger
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("PromptEval-Lite starting up")
    yield
    logger.info("PromptEval-Lite shutting down")


app = FastAPI(
    title="PromptEval-Lite",
    description="Zero-Storage Prompt Tester & Enhancer",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Note: Static files mounting moved to end of file to prevent API route conflicts

# Simple in-memory rate limiting
rate_limit_store: Dict[str, Dict[str, Any]] = {}


def check_rate_limit(client_ip: str) -> bool:
    current_time = time.time()
    
    if client_ip not in rate_limit_store:
        rate_limit_store[client_ip] = {"requests": 1, "window_start": current_time}
        return True
    
    client_data = rate_limit_store[client_ip]
    
    if current_time - client_data["window_start"] > settings.rate_limit_window:
        client_data["requests"] = 1
        client_data["window_start"] = current_time
        return True
    
    if client_data["requests"] >= settings.rate_limit_requests:
        return False
    
    client_data["requests"] += 1
    return True


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    
    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded", "message": "Too many requests"}
        )
    
    response = await call_next(request)
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            message="An unexpected error occurred"
        ).dict()
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0"
    )


@app.post("/test", response_model=TestResponse)
async def test_prompt(request: TestRequest):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    logger.info("Test request received", request_id=request_id, prompt_length=len(request.prompt))
    
    try:
        # Validate number of cases
        if request.num_cases > settings.max_synthetic_cases:
            raise HTTPException(
                status_code=400,
                detail=f"Number of cases cannot exceed {settings.max_synthetic_cases}"
            )
        
        gemini_service = GeminiService()
        
        # Generate test cases
        test_cases = await gemini_service.generate_test_cases(
            request.prompt, 
            request.domain, 
            request.num_cases,
            request.example_expected
        )
        
        # Run test suite
        test_results = await gemini_service.run_test_suite(
            request.prompt, 
            test_cases, 
            request.score_method
        )
        
        # Calculate overall score
        total_score = sum(result.score for result in test_results)
        overall_score = total_score / len(test_results) if test_results else 0.0
        passed_cases = sum(1 for result in test_results if result.score >= 0.8)
        
        execution_time = time.time() - start_time
        
        logger.info(
            "Test completed", 
            request_id=request_id,
            overall_score=overall_score,
            passed_cases=passed_cases,
            execution_time=execution_time
        )
        
        return TestResponse(
            request_id=request_id,
            prompt=request.prompt,
            test_results=test_results,
            overall_score=overall_score,
            total_cases=len(test_results),
            passed_cases=passed_cases,
            execution_time=execution_time,
            token_usage=gemini_service.token_usage
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Test failed", request_id=request_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Test execution failed: {str(e)}"
        )


@app.post("/enhance", response_model=EnhanceResponse)
async def enhance_prompt(request: EnhanceRequest):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    logger.info("Enhance request received", request_id=request_id, prompt_length=len(request.prompt))
    
    try:
        gemini_service = GeminiService()
        
        # Enhance the prompt
        enhanced_prompt, improvements = await gemini_service.enhance_prompt(
            request.prompt, 
            request.domain
        )
        
        test_results = None
        if request.auto_retest:
            # Generate test cases for comparison
            test_cases = await gemini_service.generate_test_cases(
                request.prompt, 
                request.domain, 
                5  # Default number for auto-retest
            )
            
            # Test enhanced prompt
            enhanced_test_results = await gemini_service.run_test_suite(
                enhanced_prompt, 
                test_cases, 
                "exact_match"
            )
            
            # Calculate scores
            total_score = sum(result.score for result in enhanced_test_results)
            overall_score = total_score / len(enhanced_test_results) if enhanced_test_results else 0.0
            passed_cases = sum(1 for result in enhanced_test_results if result.score >= 0.8)
            
            test_results = TestResponse(
                request_id=request_id,
                prompt=enhanced_prompt,
                test_results=enhanced_test_results,
                overall_score=overall_score,
                total_cases=len(enhanced_test_results),
                passed_cases=passed_cases,
                execution_time=time.time() - start_time,
                token_usage=gemini_service.token_usage
            )
        
        execution_time = time.time() - start_time
        
        logger.info(
            "Enhancement completed", 
            request_id=request_id,
            auto_retest=request.auto_retest,
            execution_time=execution_time
        )
        
        return EnhanceResponse(
            request_id=request_id,
            original_prompt=request.prompt,
            enhanced_prompt=enhanced_prompt,
            improvements=improvements,
            execution_time=execution_time,
            token_usage=gemini_service.token_usage,
            test_results=test_results
        )
        
    except Exception as e:
        logger.error("Enhancement failed", request_id=request_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Enhancement failed: {str(e)}"
        )


# Mount static files after all API routes to prevent conflicts
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)