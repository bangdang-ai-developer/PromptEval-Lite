from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from enum import Enum


class ScoreMethod(str, Enum):
    EXACT_MATCH = "exact_match"  # Semantic similarity with strict evaluation
    GPT_JUDGE = "gpt_judge"  # Semantic similarity with flexible evaluation
    HYBRID = "hybrid"  # Optimized semantic evaluation using gemini-2.5-flash


class ModelProvider(str, Enum):
    # Google Gemini models
    GEMINI_25_PRO = "gemini-2.5-pro"
    GEMINI_25_FLASH = "gemini-2.5-flash"
    GEMINI_20_FLASH = "gemini-2.0-flash"
    
    # OpenAI models
    GPT_41 = "gpt-4.1"
    GPT_41_MINI = "gpt-4.1-mini"
    GPT_41_NANO = "gpt-4.1-nano"
    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"
    O3 = "o3"
    O4_MINI = "o4-mini"
    
    # Anthropic Claude models
    CLAUDE_OPUS_4 = "claude-opus-4"
    CLAUDE_SONNET_4 = "claude-sonnet-4"
    CLAUDE_35_SONNET = "claude-3.5-sonnet"
    CLAUDE_3_OPUS = "claude-3-opus"
    CLAUDE_3_SONNET = "claude-3-sonnet"


class TestCase(BaseModel):
    input: str = Field(..., description="Input text for the test case")
    expected: str = Field(..., description="Expected output for the test case")


class TestRequest(BaseModel):
    prompt: str = Field(..., description="The prompt to test", min_length=1)
    domain: Optional[str] = Field(None, description="Domain/topic for synthetic test cases")
    num_cases: int = Field(5, description="Number of test cases to generate", ge=1, le=10)
    score_method: ScoreMethod = Field(ScoreMethod.HYBRID, description="Scoring method - all methods evaluate semantic meaning, not exact text matching")
    example_expected: Optional[str] = Field(None, description="Optional example of expected output format to guide test case generation")
    model: Optional[ModelProvider] = Field(None, description="AI model to use for testing (defaults to Gemini 2.5 Flash)")
    api_key: Optional[str] = Field(None, description="API key for the selected model (optional, uses server key if not provided)")
    
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
    model_used: Optional[str] = Field(None, description="The AI model used for testing")


class EnhanceRequest(BaseModel):
    prompt: str = Field(..., description="The prompt to enhance", min_length=1)
    domain: Optional[str] = Field(None, description="Domain/topic context")
    auto_retest: bool = Field(False, description="Automatically test the enhanced prompt")
    model: Optional[ModelProvider] = Field(None, description="AI model to use for enhancement (defaults to Gemini 2.5 Flash)")
    api_key: Optional[str] = Field(None, description="API key for the selected model (optional, uses server key if not provided)")
    
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