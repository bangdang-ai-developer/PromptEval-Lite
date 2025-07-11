"""
Input validation and sanitization utilities for PromptEval-Lite.
Prevents injection attacks and ensures data integrity.
"""

import re
import bleach
from typing import Optional, List, Dict, Any
from pydantic import ValidationError

# Maximum lengths to prevent DoS attacks
MAX_PROMPT_LENGTH = 10000
MAX_DOMAIN_LENGTH = 100
MAX_EXPECTED_LENGTH = 5000
MIN_PROMPT_LENGTH = 10

# Dangerous patterns that could indicate injection attempts
DANGEROUS_PATTERNS = [
    r'<script[^>]*>.*?</script>',  # Script tags
    r'javascript:',  # JavaScript protocol
    r'on\w+\s*=',  # Event handlers
    r'<iframe',  # Iframes
    r'<embed',  # Embed tags
    r'<object',  # Object tags
    r'\{\{.*?\}\}',  # Template injection
    r'\$\{.*?\}',  # Template literals
    r'__.*__',  # Python magic methods
    r'eval\s*\(',  # Eval calls
    r'exec\s*\(',  # Exec calls
    r'import\s+',  # Import statements
    r'require\s*\(',  # Require statements
]

# Allowed HTML tags for sanitization (if needed for rich text)
ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'blockquote']
ALLOWED_ATTRIBUTES = {}


class PromptValidator:
    """Validates and sanitizes prompt inputs."""
    
    @staticmethod
    def validate_prompt(prompt: str) -> str:
        """
        Validate and sanitize a prompt input.
        
        Args:
            prompt: The raw prompt string
            
        Returns:
            Sanitized prompt string
            
        Raises:
            ValueError: If prompt is invalid or dangerous
        """
        if not prompt or not isinstance(prompt, str):
            raise ValueError("Prompt must be a non-empty string")
        
        prompt = prompt.strip()
        
        # Check length constraints
        if len(prompt) < MIN_PROMPT_LENGTH:
            raise ValueError(f"Prompt must be at least {MIN_PROMPT_LENGTH} characters long")
        
        if len(prompt) > MAX_PROMPT_LENGTH:
            raise ValueError(f"Prompt must not exceed {MAX_PROMPT_LENGTH} characters")
        
        # Remove any HTML tags first
        cleaned_prompt = bleach.clean(prompt, tags=[], strip=True)
        
        # Check for dangerous patterns in the cleaned prompt
        for pattern in DANGEROUS_PATTERNS:
            if re.search(pattern, cleaned_prompt, re.IGNORECASE | re.DOTALL):
                raise ValueError("Prompt contains potentially dangerous content")
        
        prompt = cleaned_prompt
        
        # Normalize whitespace
        prompt = ' '.join(prompt.split())
        
        # Additional checks for suspicious content
        if prompt.count('{') != prompt.count('}'):
            raise ValueError("Unbalanced braces detected")
        
        if prompt.count('[') != prompt.count(']'):
            raise ValueError("Unbalanced brackets detected")
        
        return prompt
    
    @staticmethod
    def validate_domain(domain: Optional[str]) -> Optional[str]:
        """
        Validate domain input.
        
        Args:
            domain: The domain string or None
            
        Returns:
            Sanitized domain string or None
            
        Raises:
            ValueError: If domain is invalid
        """
        if domain is None:
            return None
        
        if not isinstance(domain, str):
            raise ValueError("Domain must be a string")
        
        domain = domain.strip().lower()
        
        if len(domain) > MAX_DOMAIN_LENGTH:
            raise ValueError(f"Domain must not exceed {MAX_DOMAIN_LENGTH} characters")
        
        # Allow only alphanumeric, spaces, hyphens, and underscores
        if not re.match(r'^[a-zA-Z0-9\s\-_]+$', domain):
            raise ValueError("Domain contains invalid characters")
        
        return domain
    
    @staticmethod
    def validate_num_cases(num_cases: int, max_allowed: int = 10) -> int:
        """
        Validate number of test cases.
        
        Args:
            num_cases: Number of test cases requested
            max_allowed: Maximum allowed test cases
            
        Returns:
            Validated number of cases
            
        Raises:
            ValueError: If num_cases is invalid
        """
        if not isinstance(num_cases, int):
            raise ValueError("Number of cases must be an integer")
        
        if num_cases < 1:
            raise ValueError("Number of cases must be at least 1")
        
        if num_cases > max_allowed:
            raise ValueError(f"Number of cases must not exceed {max_allowed}")
        
        return num_cases
    
    @staticmethod
    def validate_example_expected(example: Optional[str]) -> Optional[str]:
        """
        Validate example expected output.
        
        Args:
            example: The example expected output
            
        Returns:
            Sanitized example or None
            
        Raises:
            ValueError: If example is invalid
        """
        if example is None:
            return None
        
        if not isinstance(example, str):
            raise ValueError("Example expected must be a string")
        
        example = example.strip()
        
        if len(example) > MAX_EXPECTED_LENGTH:
            raise ValueError(f"Example expected must not exceed {MAX_EXPECTED_LENGTH} characters")
        
        # Check for dangerous patterns
        for pattern in DANGEROUS_PATTERNS:
            if re.search(pattern, example, re.IGNORECASE | re.DOTALL):
                raise ValueError("Example contains potentially dangerous content")
        
        return example
    
    @staticmethod
    def sanitize_output(output: str) -> str:
        """
        Sanitize LLM output before sending to client.
        
        Args:
            output: Raw LLM output
            
        Returns:
            Sanitized output
        """
        if not isinstance(output, str):
            return str(output)
        
        # Remove any potential HTML/script content
        output = bleach.clean(output, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)
        
        # Limit length to prevent response bloat
        if len(output) > MAX_EXPECTED_LENGTH:
            output = output[:MAX_EXPECTED_LENGTH] + "... [truncated]"
        
        return output
    
    @staticmethod
    def validate_test_request(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate entire test request payload.
        
        Args:
            data: Request data dictionary
            
        Returns:
            Validated and sanitized data
            
        Raises:
            ValueError: If data is invalid
        """
        validated = {}
        
        # Validate prompt
        validated['prompt'] = PromptValidator.validate_prompt(data.get('prompt', ''))
        
        # Validate domain
        validated['domain'] = PromptValidator.validate_domain(data.get('domain'))
        
        # Validate num_cases
        validated['num_cases'] = PromptValidator.validate_num_cases(
            data.get('num_cases', 5),
            max_allowed=data.get('max_allowed_cases', 10)
        )
        
        # Validate score_method
        score_method = data.get('score_method', 'hybrid')
        if score_method not in ['exact_match', 'gpt_judge', 'hybrid']:
            raise ValueError("Invalid score method")
        validated['score_method'] = score_method
        
        # Validate example_expected
        validated['example_expected'] = PromptValidator.validate_example_expected(
            data.get('example_expected')
        )
        
        return validated


class RateLimitValidator:
    """Validates rate limiting parameters."""
    
    @staticmethod
    def validate_ip(ip: str) -> str:
        """
        Validate IP address format.
        
        Args:
            ip: IP address string
            
        Returns:
            Validated IP address
            
        Raises:
            ValueError: If IP is invalid
        """
        # Basic IP validation (supports both IPv4 and IPv6)
        ip_pattern = r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}$'
        
        if not re.match(ip_pattern, ip):
            # Could be behind proxy, validate as string
            if not ip or len(ip) > 45:  # Max IPv6 length
                raise ValueError("Invalid IP address")
        
        return ip


class APIKeyValidator:
    """Validates API keys for different providers."""
    
    @staticmethod
    def is_placeholder_key(api_key: str) -> bool:
        """Check if API key is a placeholder value."""
        if not api_key:
            return True
        placeholders = ["your_", "_here", "xxx", "placeholder", "change_me", "your-secret-key", "demo"]
        return any(p in api_key.lower() for p in placeholders)
    
    @staticmethod
    def validate_api_key(api_key: Optional[str], provider: Optional[str] = None) -> Optional[str]:
        """
        Validate API key format and sanitize.
        
        Args:
            api_key: The API key string
            provider: The model provider (gemini, gpt4, gpt35, claude)
            
        Returns:
            Validated API key or None
            
        Raises:
            ValueError: If API key format is invalid
        """
        if api_key is None:
            return None
        
        if not isinstance(api_key, str):
            raise ValueError("API key must be a string")
        
        api_key = api_key.strip()
        
        if not api_key:
            return None
        
        # Check for placeholder keys
        if APIKeyValidator.is_placeholder_key(api_key):
            raise ValueError("Please provide a valid API key - placeholder keys are not allowed")
        
        # Check for common injection patterns
        if any(char in api_key for char in ['<', '>', '{', '}', '[', ']', '"', "'", '\\', '\n', '\r', '\t']):
            raise ValueError("API key contains invalid characters")
        
        # Provider-specific validation
        if provider:
            provider = provider.lower()
            
            if provider == 'gemini':
                # Google API keys are typically 39 characters
                if not re.match(r'^[A-Za-z0-9_-]{30,50}$', api_key):
                    raise ValueError("Invalid Gemini API key format")
            
            elif provider in ['gpt4', 'gpt35']:
                # OpenAI keys start with 'sk-' and are typically 48+ chars
                if not api_key.startswith('sk-') or len(api_key) < 20:
                    raise ValueError("Invalid OpenAI API key format")
                if not re.match(r'^sk-[A-Za-z0-9_-]+$', api_key):
                    raise ValueError("Invalid OpenAI API key format")
            
            elif provider == 'claude':
                # Anthropic keys typically start with 'sk-ant-'
                if not api_key.startswith('sk-ant-') or len(api_key) < 20:
                    raise ValueError("Invalid Anthropic API key format")
                if not re.match(r'^sk-ant-[A-Za-z0-9_-]+$', api_key):
                    raise ValueError("Invalid Anthropic API key format")
        
        # General length check
        if len(api_key) > 200:
            raise ValueError("API key is too long")
        
        return api_key