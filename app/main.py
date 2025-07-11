import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, Depends
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
from app.multi_model_service import MultiModelService
from app.logging_config import configure_logging, logger
from app.config import settings
from app.validators import PromptValidator, RateLimitValidator, APIKeyValidator
from app.database import init_database, close_database, get_optional_db
from app.dependencies import get_current_user_optional
from app.db.db_models import User, PromptHistory
from sqlalchemy.ext.asyncio import AsyncSession


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("PromptEval-Lite starting up")
    
    # Initialize database if enabled
    if settings.enable_database:
        await init_database()
        logger.info("Database initialized")
    
    yield
    
    # Close database if enabled
    if settings.enable_database:
        await close_database()
    
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
    try:
        # Validate IP address
        client_ip = RateLimitValidator.validate_ip(client_ip)
    except ValueError:
        # If IP validation fails, use a default identifier
        client_ip = "unknown"
    
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
async def test_prompt(
    request: TestRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Optional[AsyncSession] = Depends(get_optional_db)
):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    logger.info("Test request received", request_id=request_id, prompt_length=len(request.prompt))
    
    try:
        # Validate and sanitize inputs
        try:
            validated_data = PromptValidator.validate_test_request({
                'prompt': request.prompt,
                'domain': request.domain,
                'num_cases': request.num_cases,
                'score_method': request.score_method,
                'example_expected': request.example_expected,
                'max_allowed_cases': settings.max_synthetic_cases
            })
        except ValueError as e:
            logger.warning("Invalid test request", request_id=request_id, error=str(e))
            raise HTTPException(status_code=400, detail=str(e))
        
        # Handle saved API keys
        if request.api_key and request.api_key.startswith("saved:"):
            key_id = request.api_key[6:]  # Remove "saved:" prefix
            if current_user and db:
                from sqlalchemy import select
                from app.db import UserAPIKey
                from app.auth import decrypt_api_key
                
                # Fetch and decrypt the saved key
                result = await db.execute(
                    select(UserAPIKey).where(
                        UserAPIKey.id == key_id,
                        UserAPIKey.user_id == current_user.id
                    )
                )
                saved_key = result.scalar_one_or_none()
                if saved_key:
                    request.api_key = decrypt_api_key(saved_key.encrypted_key)
                else:
                    raise HTTPException(status_code=400, detail="Saved API key not found")
            else:
                raise HTTPException(status_code=401, detail="Authentication required for saved API keys")
        
        # Validate API key if provided
        validated_api_key = None
        if request.api_key:
            try:
                validated_api_key = APIKeyValidator.validate_api_key(
                    request.api_key, 
                    request.model.value if request.model else None
                )
            except ValueError as e:
                logger.warning("Invalid API key", request_id=request_id, error=str(e))
                raise HTTPException(status_code=400, detail=str(e))
        
        # Use multi-model service
        multi_model_service = MultiModelService()
        
        # Generate test cases using validated data
        test_cases = await multi_model_service.generate_test_cases(
            validated_data['prompt'], 
            validated_data['domain'], 
            validated_data['num_cases'],
            validated_data['example_expected'],
            request.model,  # Use the model specified in request
            validated_api_key  # Pass validated API key
        )
        
        # Run test suite
        test_results = await multi_model_service.run_test_suite(
            validated_data['prompt'], 
            test_cases, 
            validated_data['score_method'],
            request.model,  # Use the model specified in request
            validated_api_key  # Pass validated API key
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
        
        response = TestResponse(
            request_id=request_id,
            prompt=request.prompt,
            test_results=test_results,
            overall_score=overall_score,
            total_cases=len(test_results),
            passed_cases=passed_cases,
            execution_time=execution_time,
            token_usage=multi_model_service.token_usage,
            model_used=request.model or "gemini"
        )
        
        # Save to history if user is authenticated
        if current_user and db:
            try:
                history = PromptHistory(
                    user_id=current_user.id,
                    prompt=request.prompt,
                    domain=request.domain,
                    model_used=request.model.value if request.model else "gemini",
                    test_results=[result.dict() for result in test_results],
                    overall_score=overall_score,
                    execution_time=execution_time,
                    token_usage=multi_model_service.token_usage
                )
                db.add(history)
                await db.commit()
                logger.info("Test saved to history", user_id=str(current_user.id), history_id=str(history.id))
            except Exception as e:
                logger.error("Failed to save history", error=str(e))
                # Don't fail the request if history save fails
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Test failed", request_id=request_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Test execution failed: {str(e)}"
        )


@app.post("/enhance", response_model=EnhanceResponse)
async def enhance_prompt(
    request: EnhanceRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Optional[AsyncSession] = Depends(get_optional_db)
):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    logger.info("Enhance request received", request_id=request_id, prompt_length=len(request.prompt))
    
    try:
        # Validate and sanitize inputs
        try:
            validated_prompt = PromptValidator.validate_prompt(request.prompt)
            validated_domain = PromptValidator.validate_domain(request.domain)
        except ValueError as e:
            logger.warning("Invalid enhance request", request_id=request_id, error=str(e))
            raise HTTPException(status_code=400, detail=str(e))
        
        # Handle saved API keys
        if request.api_key and request.api_key.startswith("saved:"):
            key_id = request.api_key[6:]  # Remove "saved:" prefix
            if current_user and db:
                from sqlalchemy import select
                from app.db import UserAPIKey
                from app.auth import decrypt_api_key
                
                # Fetch and decrypt the saved key
                result = await db.execute(
                    select(UserAPIKey).where(
                        UserAPIKey.id == key_id,
                        UserAPIKey.user_id == current_user.id
                    )
                )
                saved_key = result.scalar_one_or_none()
                if saved_key:
                    request.api_key = decrypt_api_key(saved_key.encrypted_key)
                else:
                    raise HTTPException(status_code=400, detail="Saved API key not found")
            else:
                raise HTTPException(status_code=401, detail="Authentication required for saved API keys")
        
        # Validate API key if provided
        validated_api_key = None
        if request.api_key:
            try:
                validated_api_key = APIKeyValidator.validate_api_key(
                    request.api_key, 
                    request.model.value if request.model else None
                )
            except ValueError as e:
                logger.warning("Invalid API key", request_id=request_id, error=str(e))
                raise HTTPException(status_code=400, detail=str(e))
        
        # Use multi-model service for enhancement too
        multi_model_service = MultiModelService()
        
        # Enhance the prompt
        enhanced_prompt, improvements = await multi_model_service.enhance_prompt(
            validated_prompt, 
            validated_domain,
            request.model,  # Use the model specified in request
            validated_api_key  # Pass validated API key
        )
        
        test_results = None
        if request.auto_retest:
            # Generate test cases for comparison
            test_cases = await multi_model_service.generate_test_cases(
                request.prompt, 
                request.domain, 
                5,  # Default number for auto-retest
                None,  # No example expected for auto-retest
                request.model,
                validated_api_key
            )
            
            # Test enhanced prompt
            enhanced_test_results = await multi_model_service.run_test_suite(
                enhanced_prompt, 
                test_cases, 
                "exact_match",
                request.model,
                validated_api_key
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
                token_usage=multi_model_service.token_usage
            )
        
        execution_time = time.time() - start_time
        
        logger.info(
            "Enhancement completed", 
            request_id=request_id,
            auto_retest=request.auto_retest,
            execution_time=execution_time
        )
        
        response = EnhanceResponse(
            request_id=request_id,
            original_prompt=request.prompt,
            enhanced_prompt=enhanced_prompt,
            improvements=improvements,
            execution_time=execution_time,
            token_usage=multi_model_service.token_usage,
            test_results=test_results
        )
        
        # Save to history if user is authenticated
        if current_user and db:
            try:
                history = PromptHistory(
                    user_id=current_user.id,
                    prompt=request.prompt,
                    enhanced_prompt=enhanced_prompt,
                    domain=request.domain,
                    model_used=request.model.value if request.model else "gemini",
                    improvements=improvements,
                    overall_score=test_results.overall_score if test_results else None,
                    test_results=[result.dict() for result in test_results.test_results] if test_results else None,
                    execution_time=execution_time,
                    token_usage=multi_model_service.token_usage
                )
                db.add(history)
                await db.commit()
                logger.info("Enhancement saved to history", user_id=str(current_user.id), history_id=str(history.id))
            except Exception as e:
                logger.error("Failed to save history", error=str(e))
                # Don't fail the request if history save fails
        
        return response
        
    except Exception as e:
        logger.error("Enhancement failed", request_id=request_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Enhancement failed: {str(e)}"
        )


# Include API routers if database is enabled
if settings.enable_database:
    from app.api import auth, user, prompts
    app.include_router(auth.router)
    app.include_router(user.router)
    app.include_router(prompts.router, prefix="/api", tags=["prompts"])

# Mount static files after all API routes to prevent conflicts
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)