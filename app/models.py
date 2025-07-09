from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from enum import Enum


class ScoreMethod(str, Enum):
    EXACT_MATCH = "exact_match"  # Semantic similarity with strict evaluation
    GPT_JUDGE = "gpt_judge"  # Semantic similarity with flexible evaluation
    HYBRID = "hybrid"  # Optimized semantic evaluation using gemini-2.0-flash


class TestCase(BaseModel):
    input: str = Field(..., description="Input text for the test case")
    expected: str = Field(..., description="Expected output for the test case")


class TestRequest(BaseModel):
    prompt: str = Field(..., description="The prompt to test", min_length=1)
    domain: Optional[str] = Field(None, description="Domain/topic for synthetic test cases")
    num_cases: int = Field(5, description="Number of test cases to generate", ge=1, le=10)
    score_method: ScoreMethod = Field(ScoreMethod.HYBRID, description="Scoring method - all methods evaluate semantic meaning, not exact text matching")
    example_expected: Optional[str] = Field(None, description="Optional example of expected output format to guide test case generation")
    
    @validator('prompt')
    def validate_prompt(cls, v):
        if len(v.strip()) == 0:
            raise ValueError('Prompt cannot be empty')
        return v.strip()


class TestResult(BaseModel):
    test_case: TestCase
    actual_output: str
    score: float = Field(..., ge=0.0, le=1.0)
    reasoning: Optional[str] = None


class TestResponse(BaseModel):
    request_id: str
    prompt: str
    test_results: List[TestResult]
    overall_score: float = Field(..., ge=0.0, le=1.0)
    total_cases: int
    passed_cases: int
    execution_time: float
    token_usage: Dict[str, int]


class EnhanceRequest(BaseModel):
    prompt: str = Field(..., description="The prompt to enhance", min_length=1)
    domain: Optional[str] = Field(None, description="Domain/topic context")
    auto_retest: bool = Field(False, description="Automatically test the enhanced prompt")
    
    @validator('prompt')
    def validate_prompt(cls, v):
        if len(v.strip()) == 0:
            raise ValueError('Prompt cannot be empty')
        return v.strip()


class EnhanceResponse(BaseModel):
    request_id: str
    original_prompt: str
    enhanced_prompt: str
    improvements: List[str]
    execution_time: float
    token_usage: Dict[str, int]
    test_results: Optional[TestResponse] = None


class ErrorResponse(BaseModel):
    error: str
    message: str
    request_id: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str = "1.0.0"