import json
import re
from typing import Any, Dict, List
from app.logging_config import logger


def safe_json_parse(text: str) -> Any:
    """
    Safely parse JSON from text that may contain formatting issues.
    
    Args:
        text: The text containing JSON
        
    Returns:
        Parsed JSON object or raises Exception
    """
    original_text = text
    
    # Clean up the response to extract JSON
    if "```json" in text:
        # Find the FIRST ```json and the LAST ``` to handle nested code blocks
        start_marker = text.find("```json") + 7
        # Find the last ``` that likely closes our JSON
        end_marker = text.rfind("```")
        if start_marker < end_marker:
            text = text[start_marker:end_marker].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    
    # Try direct parsing first
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.warning("Initial JSON parse failed, attempting fixes", error=str(e))
    
    # Try to fix common issues
    try:
        # Fix newlines and other problematic characters in strings
        def fix_string_content(match):
            content = match.group(0)
            # Replace problematic characters within string literals
            content = content.replace('\n', '\\n')
            content = content.replace('\r', '\\r')
            content = content.replace('\t', '\\t')
            content = content.replace('\b', '\\b')
            content = content.replace('\f', '\\f')
            # Handle nested quotes more carefully
            return content
        
        # This regex finds strings and replaces problematic characters
        fixed_text = re.sub(r'"[^"\\]*(?:\\.[^"\\]*)*"', fix_string_content, text, flags=re.DOTALL)
        
        return json.loads(fixed_text)
    except json.JSONDecodeError as e:
        logger.warning("String content fix failed, trying aggressive replacement", error=str(e))
    
    # Try more aggressive fixes
    try:
        # Replace problematic characters
        fixed_text = text.replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
        # Fix common escape issues
        fixed_text = fixed_text.replace('\\\\', '\\')
        
        return json.loads(fixed_text)
    except json.JSONDecodeError as e:
        logger.warning("Character replacement failed, trying manual extraction", error=str(e))
    
    # Try to extract JSON manually
    try:
        # Find the main JSON structure
        if text.strip().startswith('['):
            # Array
            start_idx = text.find('[')
            end_idx = text.rfind(']') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = text[start_idx:end_idx]
                # Apply fixes
                json_str = re.sub(r'"[^"\\]*(?:\\.[^"\\]*)*"', fix_newlines, json_str, flags=re.DOTALL)
                return json.loads(json_str)
        else:
            # Object
            start_idx = text.find('{')
            end_idx = text.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = text[start_idx:end_idx]
                # Apply fixes
                json_str = re.sub(r'"[^"\\]*(?:\\.[^"\\]*)*"', fix_newlines, json_str, flags=re.DOTALL)
                return json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.error("All JSON parsing attempts failed", error=str(e), text=text[:500])
    
    # If all else fails, try to create a fallback structure
    logger.error("Creating fallback JSON structure due to parsing failure")
    
    # Try to extract key information manually for common structures
    if "enhanced_prompt" in original_text:
        # For enhance prompt responses with complex content
        try:
            # Use a more sophisticated approach to extract the enhanced_prompt
            # Look for the pattern and handle nested structures
            lines = original_text.split('\n')
            enhanced_prompt_lines = []
            improvements_lines = []
            
            in_enhanced_prompt = False
            in_improvements = False
            brace_count = 0
            
            for line in lines:
                if '"enhanced_prompt":' in line:
                    in_enhanced_prompt = True
                    # Extract the start of the prompt
                    start_idx = line.find('"enhanced_prompt":') + len('"enhanced_prompt":')
                    prompt_start = line[start_idx:].strip()
                    if prompt_start.startswith('"'):
                        prompt_start = prompt_start[1:]  # Remove opening quote
                    enhanced_prompt_lines.append(prompt_start)
                elif in_enhanced_prompt and '"improvements":' in line:
                    in_enhanced_prompt = False
                    in_improvements = True
                    # Remove the closing quote and comma from the last prompt line
                    if enhanced_prompt_lines:
                        last_line = enhanced_prompt_lines[-1]
                        if last_line.endswith('",'):
                            enhanced_prompt_lines[-1] = last_line[:-2]
                        elif last_line.endswith('"'):
                            enhanced_prompt_lines[-1] = last_line[:-1]
                elif in_enhanced_prompt:
                    enhanced_prompt_lines.append(line)
                elif in_improvements and line.strip().startswith('"') and line.strip().endswith('"'):
                    # Extract improvement item
                    improvement = line.strip()[1:-1]  # Remove quotes
                    if improvement.endswith(','):
                        improvement = improvement[:-1]
                    improvements_lines.append(improvement)
            
            if enhanced_prompt_lines:
                enhanced_prompt = '\n'.join(enhanced_prompt_lines)
                # Clean up the enhanced prompt
                enhanced_prompt = enhanced_prompt.replace('\\"', '"')
                enhanced_prompt = enhanced_prompt.replace('\\n', '\n')
                
                if not improvements_lines:
                    improvements_lines = ["Extracted enhanced prompt successfully"]
                
                return {
                    "enhanced_prompt": enhanced_prompt,
                    "improvements": improvements_lines
                }
        except Exception as e:
            logger.warning("Manual extraction failed", error=str(e))
    
    # Final fallback
    raise Exception(f"Unable to parse JSON from response: {text[:200]}...")


def extract_json_array(text: str) -> List[Dict[str, Any]]:
    """Extract JSON array from text"""
    result = safe_json_parse(text)
    if isinstance(result, list):
        return result
    elif isinstance(result, dict):
        # Maybe it's wrapped in an object
        for key, value in result.items():
            if isinstance(value, list):
                return value
    raise Exception(f"Expected JSON array but got: {type(result)}")


def extract_json_object(text: str) -> Dict[str, Any]:
    """Extract JSON object from text"""
    result = safe_json_parse(text)
    if isinstance(result, dict):
        return result
    raise Exception(f"Expected JSON object but got: {type(result)}")