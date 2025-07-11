"""
Multi-model service for supporting different AI providers.
"""

import asyncio
from typing import List, Dict, Any, Optional, Union
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.schema import HumanMessage, SystemMessage, BaseMessage
from app.models import TestCase, TestResult, ScoreMethod, ModelProvider
from app.config import settings
from app.logging_config import logger
from app.json_utils import extract_json_array, extract_json_object
from app.validators import PromptValidator


class MultiModelService:
    """Service that supports multiple AI model providers."""
    
    def __init__(self):
        self.token_usage = {"input_tokens": 0, "output_tokens": 0}
        self._models_cache = {}
    
    def _is_placeholder_key(self, api_key: str) -> bool:
        """Check if API key is a placeholder value."""
        if not api_key:
            return True
        placeholders = ["your_", "_here", "xxx", "placeholder", "change_me", "your-secret-key"]
        return any(p in api_key.lower() for p in placeholders)
    
    def _get_model(self, provider: Optional[ModelProvider] = None, is_evaluator: bool = False, api_key: Optional[str] = None):
        """Get the appropriate model based on provider and purpose."""
        
        # Default to Gemini 2.5 Flash if no provider specified
        if provider is None:
            provider = ModelProvider.GEMINI_25_FLASH
        
        # Don't cache models with user-provided API keys
        if api_key is None:
            # Use cache key to avoid recreating models with server keys
            cache_key = f"{provider}_{is_evaluator}"
            if cache_key in self._models_cache:
                return self._models_cache[cache_key]
        
        model = None
        
        # Google Gemini models
        if provider in [ModelProvider.GEMINI_25_PRO, ModelProvider.GEMINI_25_FLASH, ModelProvider.GEMINI_20_FLASH]:
            # Use user-provided key first, fall back to server key
            google_api_key = api_key if api_key else settings.google_api_key
            if not google_api_key or self._is_placeholder_key(google_api_key):
                raise ValueError("Valid Gemini API key required - please provide your own key or configure server with a valid key")
            
            # Map provider to actual model name
            model_map = {
                ModelProvider.GEMINI_25_PRO: "gemini-2.5-pro",
                ModelProvider.GEMINI_25_FLASH: "gemini-2.5-flash",
                ModelProvider.GEMINI_20_FLASH: "gemini-2.0-flash-exp"
            }
            
            # Use evaluator model for evaluation, otherwise use selected model
            if is_evaluator:
                # Use Gemini 2.5 Flash for evaluation (cost-efficient)
                model_name = "gemini-2.5-flash"
            else:
                model_name = model_map.get(provider, "gemini-2.5-flash")
            
            temperature = 0.1 if is_evaluator else 0.7
            
            model = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=google_api_key,
                temperature=temperature,
                timeout=settings.request_timeout
            )
        
        # OpenAI models
        elif provider in [ModelProvider.GPT_41, ModelProvider.GPT_41_MINI, ModelProvider.GPT_41_NANO,
                         ModelProvider.GPT_4O, ModelProvider.GPT_4O_MINI, ModelProvider.O3, ModelProvider.O4_MINI]:
            # Use user-provided key first, fall back to server key
            openai_api_key = api_key if api_key else settings.openai_api_key
            if not openai_api_key or self._is_placeholder_key(openai_api_key):
                raise ValueError("Valid OpenAI API key required - please provide your own key or configure server with a valid key")
            
            # Map provider to actual model name
            model_map = {
                ModelProvider.GPT_41: "gpt-4.1",
                ModelProvider.GPT_41_MINI: "gpt-4.1-mini",
                ModelProvider.GPT_41_NANO: "gpt-4.1-nano",
                ModelProvider.GPT_4O: "gpt-4o",
                ModelProvider.GPT_4O_MINI: "gpt-4o-mini",
                ModelProvider.O3: "o3",
                ModelProvider.O4_MINI: "o4-mini"
            }
            
            model_name = model_map.get(provider, "gpt-4o")
            temperature = 0.1 if is_evaluator else 0.7
            
            model = ChatOpenAI(
                model=model_name,
                openai_api_key=openai_api_key,
                temperature=temperature,
                timeout=settings.request_timeout
            )
        
        # Anthropic Claude models
        elif provider in [ModelProvider.CLAUDE_OPUS_4, ModelProvider.CLAUDE_SONNET_4,
                         ModelProvider.CLAUDE_35_SONNET, ModelProvider.CLAUDE_3_OPUS, ModelProvider.CLAUDE_3_SONNET]:
            # Use user-provided key first, fall back to server key
            anthropic_api_key = api_key if api_key else settings.anthropic_api_key
            if not anthropic_api_key or self._is_placeholder_key(anthropic_api_key):
                raise ValueError("Valid Anthropic API key required - please provide your own key or configure server with a valid key")
            
            # Map provider to actual model name
            model_map = {
                ModelProvider.CLAUDE_OPUS_4: "claude-opus-4-20250514",
                ModelProvider.CLAUDE_SONNET_4: "claude-sonnet-4-20250514",
                ModelProvider.CLAUDE_35_SONNET: "claude-3-5-sonnet-20241022",
                ModelProvider.CLAUDE_3_OPUS: "claude-3-opus-20240229",
                ModelProvider.CLAUDE_3_SONNET: "claude-3-sonnet-20240229"
            }
            
            model_name = model_map.get(provider, "claude-3-5-sonnet-20241022")
            temperature = 0.1 if is_evaluator else 0.7
            
            model = ChatAnthropic(
                model=model_name,
                anthropic_api_key=anthropic_api_key,
                temperature=temperature,
                timeout=settings.request_timeout
            )
        
        else:
            raise ValueError(f"Unsupported model provider: {provider}")
        
        # Only cache models using server keys
        if api_key is None:
            cache_key = f"{provider}_{is_evaluator}"
            self._models_cache[cache_key] = model
            
        return model
    
    async def generate_test_cases(
        self, 
        prompt: str, 
        domain: Optional[str], 
        num_cases: int, 
        example_expected: Optional[str] = None,
        provider: Optional[ModelProvider] = None,
        api_key: Optional[str] = None
    ) -> List[TestCase]:
        """Generate test cases using the specified model provider."""
        
        model = self._get_model(provider, is_evaluator=False, api_key=api_key)
        domain_context = f" in the {domain} domain" if domain else ""
        
        example_section = ""
        if example_expected:
            example_section = f"""
IMPORTANT: Generate expected outputs that follow a similar format and style to this example:
{example_expected}

The expected outputs should maintain the same structure, formatting, and level of detail as the example above.
"""
        
        full_prompt = f"""You are a test case generator. Generate {num_cases} diverse test cases{domain_context} for the given prompt.

Each test case should have:
- input: A realistic input that would test the prompt
- expected: The expected output when the prompt is applied to the input
{example_section}
Generate {num_cases} test cases for this prompt:

{prompt}

Return ONLY a valid JSON array with objects containing 'input' and 'expected' fields. No other text, explanation, or formatting.

IMPORTANT: Ensure all strings are properly escaped. Replace actual newlines with \\n.

Example format:
[
    {{"input": "example input", "expected": "expected output"}},
    {{"input": "another input", "expected": "another expected output"}}
]"""
        
        try:
            messages = [HumanMessage(content=full_prompt)]
            
            response = await model.ainvoke(messages)
            response_content = response.content.strip()
            
            logger.info(f"Generated test cases using {provider or 'default'} model", 
                       response_length=len(response_content))
            
            # Parse test cases
            test_cases_data = extract_json_array(response_content)
            test_cases = []
            
            for case_data in test_cases_data:
                test_cases.append(TestCase(
                    input=case_data["input"],
                    expected=case_data["expected"]
                ))
            
            logger.info(f"Generated {len(test_cases)} test cases")
            return test_cases
            
        except Exception as e:
            logger.error(f"Failed to generate test cases with {provider}", error=str(e))
            raise Exception(f"Failed to generate test cases: {str(e)}")
    
    async def evaluate_prompt(
        self, 
        prompt: str, 
        test_case: TestCase,
        provider: Optional[ModelProvider] = None,
        api_key: Optional[str] = None
    ) -> str:
        """Evaluate a prompt with the given test case using specified model."""
        
        model = self._get_model(provider, is_evaluator=False, api_key=api_key)
        
        try:
            full_prompt = f"{prompt}\n\nInput: {test_case.input}"
            
            messages = [HumanMessage(content=full_prompt)]
            response = await model.ainvoke(messages)
            
            content = response.content.strip()
            
            # Extract content based on format (same logic as before)
            if "```json" in content and "```markdown" in content:
                if test_case.expected.strip().startswith("#"):
                    markdown_start = content.find("```markdown")
                    if markdown_start != -1:
                        markdown_end = content.find("```", markdown_start + 11)
                        if markdown_end != -1:
                            return content[markdown_start + 11:markdown_end].strip()
            
            elif "```json" in content and not test_case.expected.strip().startswith("{"):
                json_end = content.find("```", content.find("```json") + 7)
                if json_end != -1:
                    remaining = content[json_end + 3:].strip()
                    if "```markdown" in remaining:
                        markdown_start = remaining.find("```markdown")
                        markdown_end = remaining.find("```", markdown_start + 11)
                        if markdown_end != -1:
                            return remaining[markdown_start + 11:markdown_end].strip()
                    elif remaining:
                        return remaining
            
            if "```" in content:
                if test_case.expected.strip().startswith("{"):
                    json_start = content.find("```json")
                    if json_start != -1:
                        json_end = content.find("```", json_start + 7)
                        if json_end != -1:
                            return content[json_start + 7:json_end].strip()
                
                code_start = content.find("```")
                if code_start != -1:
                    newline = content.find("\n", code_start)
                    if newline != -1:
                        code_end = content.find("```", newline)
                        if code_end != -1:
                            return content[newline + 1:code_end].strip()
            
            # Sanitize output before returning
            return PromptValidator.sanitize_output(content)
            
        except Exception as e:
            logger.error(f"Failed to evaluate prompt with {provider}", error=str(e))
            raise Exception(f"Failed to evaluate prompt: {str(e)}")
    
    async def score_result(
        self, 
        test_case: TestCase, 
        actual_output: str, 
        score_method: ScoreMethod,
        provider: Optional[ModelProvider] = None,
        api_key: Optional[str] = None
    ) -> tuple[float, Optional[str]]:
        """Score the result using the specified scoring method and model."""
        
        # Always use Gemini 2.5 Flash for evaluation (most efficient)
        # Use user-provided key first, fall back to server key
        evaluator_model = self._get_model(ModelProvider.GEMINI_25_FLASH, is_evaluator=True, api_key=api_key)
        
        if score_method == ScoreMethod.EXACT_MATCH:
            # Semantic similarity with strict evaluation
            return await self._evaluate_semantic_similarity(
                test_case, actual_output, "strict", evaluator_model
            )
        
        elif score_method == ScoreMethod.GPT_JUDGE:
            # Semantic similarity with flexible evaluation
            return await self._evaluate_semantic_similarity(
                test_case, actual_output, "flexible", evaluator_model
            )
        
        elif score_method == ScoreMethod.HYBRID:
            # Optimized semantic evaluation
            judge_prompt = f"""Evaluate if the actual output conveys the same meaning and context as expected.
Focus on semantic equivalence, not exact wording.

Expected: {test_case.expected}
Actual: {actual_output}

Score 0-1 based on meaning similarity:
1.0 = Same meaning/intent
0.8-0.9 = Very similar meaning
0.6-0.7 = Mostly similar
0.4-0.5 = Partially similar
0.0-0.3 = Different meaning

JSON: {{"score": float, "reasoning": "brief explanation"}}"""
            
            try:
                messages = [HumanMessage(content=judge_prompt)]
                response = await evaluator_model.ainvoke(messages)
                
                result = extract_json_object(response.content.strip())
                return float(result["score"]), result["reasoning"]
                
            except Exception as e:
                logger.error("Failed hybrid scoring", error=str(e))
                return 0.0, f"Scoring error: {str(e)}"
    
    async def _evaluate_semantic_similarity(
        self, 
        test_case: TestCase, 
        actual_output: str, 
        mode: str,
        model
    ) -> tuple[float, Optional[str]]:
        """Evaluate semantic similarity between expected and actual output."""
        
        strictness = "very strict" if mode == "strict" else "based on overall meaning"
        
        judge_prompt = f"""Evaluate if these outputs have the same semantic meaning and context.
Be {strictness} in your evaluation.

Expected meaning: {test_case.expected}
Actual output: {actual_output}

Consider:
- Core message/intent
- Context appropriateness  
- Information completeness
- Logical equivalence

Score 0-1 for semantic similarity.
JSON: {{"score": float, "reasoning": "concise explanation"}}"""
        
        try:
            messages = [HumanMessage(content=judge_prompt)]
            response = await model.ainvoke(messages)
            
            result = extract_json_object(response.content.strip())
            return float(result["score"]), result["reasoning"]
            
        except Exception as e:
            logger.error("Failed semantic evaluation", error=str(e))
            return 0.0, f"Evaluation error: {str(e)}"
    
    async def enhance_prompt(
        self, 
        prompt: str, 
        domain: Optional[str],
        provider: Optional[ModelProvider] = None,
        api_key: Optional[str] = None
    ) -> tuple[str, List[str]]:
        """Enhance a prompt using the specified model."""
        
        model = self._get_model(provider, is_evaluator=False, api_key=api_key)
        domain_context = f" in the {domain} domain" if domain else ""
        
        full_prompt = f"""You are a prompt engineering expert. Enhance the given prompt{domain_context} using best practices:

1. Add clear role definition
2. Provide step-by-step instructions
3. Include relevant examples
4. Add output format specifications
5. Include edge case handling

Enhance this prompt:

{prompt}

Return ONLY a valid JSON object with:
- 'enhanced_prompt': The improved prompt (as a single string)
- 'improvements': Array of strings describing what was improved

IMPORTANT: 
- Ensure all strings are properly escaped
- Replace actual newlines with \\n in the JSON
- Do NOT include code blocks or markdown formatting within the JSON strings
- Keep the enhanced_prompt as a single continuous string

Example format:
{{
    "enhanced_prompt": "Your enhanced prompt here as a single string",
    "improvements": ["improvement 1", "improvement 2"]
}}"""
        
        try:
            messages = [HumanMessage(content=full_prompt)]
            
            response = await model.ainvoke(messages)
            response_content = response.content.strip()
            
            logger.info(f"Enhanced prompt using {provider or 'default'} model")
            
            # Parse JSON using robust parser
            result = extract_json_object(response_content)
            
            enhanced_prompt = result["enhanced_prompt"]
            improvements = result["improvements"]
            
            return enhanced_prompt, improvements
            
        except Exception as e:
            logger.error(f"Failed to enhance prompt with {provider}", error=str(e))
            raise Exception(f"Failed to enhance prompt: {str(e)}")
    
    async def run_test_suite(
        self, 
        prompt: str, 
        test_cases: List[TestCase], 
        score_method: ScoreMethod,
        provider: Optional[ModelProvider] = None,
        api_key: Optional[str] = None
    ) -> List[TestResult]:
        """Run the test suite with the specified model."""
        
        results = []
        
        # For hybrid scoring, we can batch evaluate for better efficiency
        if score_method == ScoreMethod.HYBRID and len(test_cases) > 1:
            # Run all evaluations concurrently
            evaluation_tasks = [
                self.evaluate_prompt(prompt, test_case, provider, api_key) 
                for test_case in test_cases
            ]
            
            try:
                actual_outputs = await asyncio.gather(*evaluation_tasks, return_exceptions=True)
                
                # Score all results
                for test_case, actual_output in zip(test_cases, actual_outputs):
                    if isinstance(actual_output, Exception):
                        results.append(TestResult(
                            test_case=test_case,
                            actual_output=f"Error: {str(actual_output)}",
                            score=0.0,
                            reasoning=f"Execution failed: {str(actual_output)}"
                        ))
                    else:
                        score, reasoning = await self.score_result(
                            test_case, actual_output, score_method, provider, api_key
                        )
                        results.append(TestResult(
                            test_case=test_case,
                            actual_output=actual_output,
                            score=score,
                            reasoning=reasoning
                        ))
                        
            except Exception as e:
                logger.error("Batch evaluation failed, falling back to sequential", error=str(e))
                # Fall back to sequential processing
                return await self._run_test_suite_sequential(
                    prompt, test_cases, score_method, provider, api_key
                )
        else:
            # Use sequential processing for other scoring methods
            return await self._run_test_suite_sequential(
                prompt, test_cases, score_method, provider, api_key
            )
        
        return results
    
    async def _run_test_suite_sequential(
        self, 
        prompt: str, 
        test_cases: List[TestCase], 
        score_method: ScoreMethod,
        provider: Optional[ModelProvider] = None,
        api_key: Optional[str] = None
    ) -> List[TestResult]:
        """Run test suite sequentially."""
        
        results = []
        
        for test_case in test_cases:
            try:
                actual_output = await self.evaluate_prompt(prompt, test_case, provider, api_key)
                score, reasoning = await self.score_result(
                    test_case, actual_output, score_method, provider, api_key
                )
                
                results.append(TestResult(
                    test_case=test_case,
                    actual_output=actual_output,
                    score=score,
                    reasoning=reasoning
                ))
                
            except Exception as e:
                logger.error("Failed to run test case", error=str(e))
                results.append(TestResult(
                    test_case=test_case,
                    actual_output=f"Error: {str(e)}",
                    score=0.0,
                    reasoning=f"Execution failed: {str(e)}"
                ))
        
        return results