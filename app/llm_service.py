import asyncio
import json
import time
import uuid
from typing import List, Dict, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage
from langchain.prompts import PromptTemplate
from app.models import TestCase, TestResult, ScoreMethod
from app.config import settings
from app.logging_config import logger
from app.json_utils import extract_json_array, extract_json_object


class GeminiService:
    def __init__(self):
        # Main LLM for general tasks
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=settings.google_api_key,
            temperature=0.7,
            timeout=settings.request_timeout
        )
        
        # Efficient evaluator using gemini-2.0-flash
        self.evaluator = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.google_api_key,
            temperature=0.1,  # Lower temperature for consistent scoring
            timeout=settings.request_timeout
        )
        
        self.token_usage = {"input_tokens": 0, "output_tokens": 0}
    
    async def generate_test_cases(self, prompt: str, domain: Optional[str], num_cases: int, example_expected: Optional[str] = None) -> List[TestCase]:
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
            
            response = await self.llm.ainvoke(messages)
            response_content = response.content.strip()
            
            logger.info("Raw response", response=response_content[:200] + "..." if len(response_content) > 200 else response_content)
            
            # Parse JSON using robust parser
            test_cases_data = extract_json_array(response_content)
            
            test_cases = []
            for case_data in test_cases_data:
                test_cases.append(TestCase(
                    input=case_data["input"],
                    expected=case_data["expected"]
                ))
            
            logger.info("Generated test cases", num_cases=len(test_cases))
            return test_cases
            
        except Exception as e:
            logger.error("Failed to generate test cases", error=str(e), response=response_content if 'response_content' in locals() else "No response")
            raise Exception(f"Failed to generate test cases: {str(e)}")
    
    async def evaluate_prompt(self, prompt: str, test_case: TestCase) -> str:
        try:
            full_prompt = f"{prompt}\n\nInput: {test_case.input}"
            
            messages = [HumanMessage(content=full_prompt)]
            response = await self.llm.ainvoke(messages)
            
            content = response.content.strip()
            
            # Handle mixed outputs (JSON + markdown/text)
            # If response contains both JSON and markdown, extract the relevant part
            if "```json" in content and "```markdown" in content:
                # Extract markdown content if expected output looks like markdown
                if test_case.expected.strip().startswith("#"):
                    markdown_start = content.find("```markdown")
                    if markdown_start != -1:
                        markdown_end = content.find("```", markdown_start + 11)
                        if markdown_end != -1:
                            return content[markdown_start + 11:markdown_end].strip()
            
            # If response contains JSON block but expected output is not JSON
            elif "```json" in content and not test_case.expected.strip().startswith("{"):
                # Look for content after JSON block
                json_end = content.find("```", content.find("```json") + 7)
                if json_end != -1:
                    remaining = content[json_end + 3:].strip()
                    # Extract markdown if present
                    if "```markdown" in remaining:
                        markdown_start = remaining.find("```markdown")
                        markdown_end = remaining.find("```", markdown_start + 11)
                        if markdown_end != -1:
                            return remaining[markdown_start + 11:markdown_end].strip()
                    # Otherwise return the remaining content
                    elif remaining:
                        return remaining
            
            # For responses with code blocks, extract based on expected format
            if "```" in content:
                # If expected output is JSON, extract JSON block
                if test_case.expected.strip().startswith("{"):
                    json_start = content.find("```json")
                    if json_start != -1:
                        json_end = content.find("```", json_start + 7)
                        if json_end != -1:
                            return content[json_start + 7:json_end].strip()
                
                # For other code blocks, extract the first one
                code_start = content.find("```")
                if code_start != -1:
                    # Skip language identifier if present
                    newline = content.find("\n", code_start)
                    if newline != -1:
                        code_end = content.find("```", newline)
                        if code_end != -1:
                            return content[newline + 1:code_end].strip()
            
            return content
            
        except Exception as e:
            logger.error("Failed to evaluate prompt", error=str(e))
            raise Exception(f"Failed to evaluate prompt: {str(e)}")
    
    async def score_result(self, test_case: TestCase, actual_output: str, score_method: ScoreMethod) -> tuple[float, Optional[str]]:
        if score_method == ScoreMethod.EXACT_MATCH:
            # Even for "exact match", evaluate based on meaning
            return await self._evaluate_semantic_similarity(test_case, actual_output, "strict")
        
        elif score_method == ScoreMethod.GPT_JUDGE:
            # Use semantic evaluation for GPT judge as well
            return await self._evaluate_semantic_similarity(test_case, actual_output, "flexible")
        
        elif score_method == ScoreMethod.HYBRID:
            # Use gemini-2.0-flash for semantic evaluation based on context and meaning
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
                response = await self.evaluator.ainvoke(messages)
                
                result = extract_json_object(response.content.strip())
                return float(result["score"]), result["reasoning"]
                
            except Exception as e:
                logger.error("Failed hybrid scoring", error=str(e))
                return 0.0, f"Scoring error: {str(e)}"
    
    async def _evaluate_semantic_similarity(self, test_case: TestCase, actual_output: str, mode: str = "flexible") -> tuple[float, Optional[str]]:
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
            response = await self.evaluator.ainvoke(messages)
            
            result = extract_json_object(response.content.strip())
            return float(result["score"]), result["reasoning"]
            
        except Exception as e:
            logger.error("Failed semantic evaluation", error=str(e))
            return 0.0, f"Evaluation error: {str(e)}"
    
    async def enhance_prompt(self, prompt: str, domain: Optional[str]) -> tuple[str, List[str]]:
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
            
            response = await self.llm.ainvoke(messages)
            response_content = response.content.strip()
            
            logger.info("Raw enhancement response", response=response_content[:200] + "..." if len(response_content) > 200 else response_content)
            
            # Parse JSON using robust parser
            result = extract_json_object(response_content)
            
            return result["enhanced_prompt"], result["improvements"]
            
        except Exception as e:
            logger.error("Failed to enhance prompt", error=str(e), response=response_content if 'response_content' in locals() else "No response")
            raise Exception(f"Failed to enhance prompt: {str(e)}")
    
    async def run_test_suite(self, prompt: str, test_cases: List[TestCase], score_method: ScoreMethod) -> List[TestResult]:
        results = []
        
        # For hybrid scoring, we can batch evaluate for better efficiency
        if score_method == ScoreMethod.HYBRID and len(test_cases) > 1:
            # Run all evaluations concurrently
            evaluation_tasks = [
                self.evaluate_prompt(prompt, test_case) 
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
                        score, reasoning = await self.score_result(test_case, actual_output, score_method)
                        results.append(TestResult(
                            test_case=test_case,
                            actual_output=actual_output,
                            score=score,
                            reasoning=reasoning
                        ))
                        
            except Exception as e:
                logger.error("Batch evaluation failed, falling back to sequential", error=str(e))
                # Fall back to sequential processing
                return await self._run_test_suite_sequential(prompt, test_cases, score_method)
        else:
            # Use sequential processing for other scoring methods
            return await self._run_test_suite_sequential(prompt, test_cases, score_method)
        
        return results
    
    async def _run_test_suite_sequential(self, prompt: str, test_cases: List[TestCase], score_method: ScoreMethod) -> List[TestResult]:
        results = []
        
        for test_case in test_cases:
            try:
                actual_output = await self.evaluate_prompt(prompt, test_case)
                score, reasoning = await self.score_result(test_case, actual_output, score_method)
                
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