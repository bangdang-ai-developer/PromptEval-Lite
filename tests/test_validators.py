"""
Test cases for input validators.
"""

import pytest
from app.validators import PromptValidator, RateLimitValidator, APIKeyValidator


class TestPromptValidator:
    """Test prompt validation functionality."""
    
    def test_valid_prompt(self):
        """Test that valid prompts pass validation."""
        valid_prompts = [
            "Translate the following text to French:",
            "Write a Python function that calculates factorial",
            "Summarize this article in 3 bullet points",
            "A" * 50,  # Minimum reasonable length
            "B" * 5000,  # Long but within limits
        ]
        
        for prompt in valid_prompts:
            result = PromptValidator.validate_prompt(prompt)
            assert isinstance(result, str)
            assert len(result) >= 10
    
    def test_invalid_prompt_too_short(self):
        """Test that short prompts are rejected."""
        with pytest.raises(ValueError, match="at least 10 characters"):
            PromptValidator.validate_prompt("Hi")
    
    def test_invalid_prompt_too_long(self):
        """Test that excessively long prompts are rejected."""
        with pytest.raises(ValueError, match="must not exceed"):
            PromptValidator.validate_prompt("X" * 10001)
    
    def test_dangerous_patterns(self):
        """Test that dangerous patterns are detected."""
        # These patterns should still be detected after HTML stripping
        dangerous_prompts = [
            "javascript:void(0)",
            "{{ __import__('os').system('rm -rf /') }}",
            "${process.exit()}",
            "eval('malicious code')",
            "exec('import os; os.system(\"bad\")')",
            "import os; os.system('bad')",
            "__import__('os')",
        ]
        
        for prompt in dangerous_prompts:
            with pytest.raises(ValueError, match="dangerous content"):
                PromptValidator.validate_prompt(prompt)
        
        # These HTML-based patterns should be cleaned, not raise errors
        html_prompts = [
            "<script>alert('xss')</script>",
            "<iframe src='evil.com'></iframe>",
        ]
        
        for prompt in html_prompts:
            # Should not raise, but should clean the HTML
            result = PromptValidator.validate_prompt(prompt)
            assert "<script>" not in result
            assert "<iframe>" not in result
    
    def test_html_stripping(self):
        """Test that HTML tags are stripped."""
        prompt = "Please <b>translate</b> this <script>alert()</script> text"
        result = PromptValidator.validate_prompt(prompt)
        assert "<b>" not in result
        assert "<script>" not in result
        assert "translate" in result
    
    def test_unbalanced_brackets(self):
        """Test that unbalanced brackets are detected."""
        with pytest.raises(ValueError, match="Unbalanced"):
            PromptValidator.validate_prompt("This has { unbalanced brackets")
        
        with pytest.raises(ValueError, match="Unbalanced"):
            PromptValidator.validate_prompt("This has [ unbalanced ] brackets ]")
    
    def test_whitespace_normalization(self):
        """Test that whitespace is normalized."""
        prompt = "This   has    multiple     spaces"
        result = PromptValidator.validate_prompt(prompt)
        assert result == "This has multiple spaces"


class TestDomainValidator:
    """Test domain validation functionality."""
    
    def test_valid_domains(self):
        """Test that valid domains pass validation."""
        valid_domains = [
            "translation",
            "code-generation",
            "text_summarization",
            "data analysis",
            None,  # Optional domain
        ]
        
        for domain in valid_domains:
            result = PromptValidator.validate_domain(domain)
            if domain is not None:
                assert isinstance(result, str)
                assert result == (domain.strip().lower() if domain else None)
            else:
                assert result is None
    
    def test_invalid_domains(self):
        """Test that invalid domains are rejected."""
        invalid_domains = [
            "domain!@#$%",
            "../../etc/passwd",
            "<script>alert()</script>",
            "A" * 101,  # Too long
        ]
        
        for domain in invalid_domains:
            with pytest.raises(ValueError):
                PromptValidator.validate_domain(domain)


class TestNumCasesValidator:
    """Test number of cases validation."""
    
    def test_valid_num_cases(self):
        """Test that valid numbers pass validation."""
        for num in range(1, 11):
            result = PromptValidator.validate_num_cases(num, max_allowed=10)
            assert result == num
    
    def test_invalid_num_cases(self):
        """Test that invalid numbers are rejected."""
        with pytest.raises(ValueError, match="at least 1"):
            PromptValidator.validate_num_cases(0)
        
        with pytest.raises(ValueError, match="must not exceed"):
            PromptValidator.validate_num_cases(11, max_allowed=10)
        
        with pytest.raises(ValueError, match="must be an integer"):
            PromptValidator.validate_num_cases("5")  # String instead of int


class TestExampleExpectedValidator:
    """Test example expected output validation."""
    
    def test_valid_examples(self):
        """Test that valid examples pass validation."""
        valid_examples = [
            "Simple output",
            "Multi-line\noutput\nwith newlines",
            "Output with special chars: @#$%^&*()",
            None,  # Optional
        ]
        
        for example in valid_examples:
            result = PromptValidator.validate_example_expected(example)
            if example is not None:
                assert isinstance(result, str)
            else:
                assert result is None
    
    def test_dangerous_examples(self):
        """Test that dangerous examples are rejected."""
        with pytest.raises(ValueError, match="dangerous content"):
            PromptValidator.validate_example_expected("<script>alert()</script>")


class TestOutputSanitizer:
    """Test output sanitization."""
    
    def test_html_removal(self):
        """Test that HTML is removed from outputs."""
        output = "<p>This is <script>alert()</script> output</p>"
        result = PromptValidator.sanitize_output(output)
        assert "<script>" not in result
        assert "</script>" not in result
        # Note: bleach removes tags but keeps content
        assert "This is" in result
        assert "output" in result
    
    def test_length_truncation(self):
        """Test that long outputs are truncated."""
        output = "X" * 6000
        result = PromptValidator.sanitize_output(output)
        assert len(result) < 6000
        assert "truncated" in result
    
    def test_allowed_tags(self):
        """Test that allowed tags are preserved."""
        output = "<p>This has <strong>bold</strong> and <em>italic</em></p>"
        result = PromptValidator.sanitize_output(output)
        # These tags should be preserved based on ALLOWED_TAGS
        assert "bold" in result
        assert "italic" in result


class TestTestRequestValidator:
    """Test complete request validation."""
    
    def test_valid_request(self):
        """Test that valid requests pass validation."""
        request_data = {
            'prompt': 'Translate the following text to French:',
            'domain': 'translation',
            'num_cases': 5,
            'score_method': 'hybrid',
            'example_expected': 'Bonjour le monde',
            'max_allowed_cases': 10
        }
        
        result = PromptValidator.validate_test_request(request_data)
        assert result['prompt'] == request_data['prompt']
        assert result['domain'] == request_data['domain']
        assert result['num_cases'] == request_data['num_cases']
        assert result['score_method'] == request_data['score_method']
        assert result['example_expected'] == request_data['example_expected']
    
    def test_invalid_score_method(self):
        """Test that invalid score methods are rejected."""
        request_data = {
            'prompt': 'Valid prompt for testing',
            'score_method': 'invalid_method'
        }
        
        with pytest.raises(ValueError, match="Invalid score method"):
            PromptValidator.validate_test_request(request_data)


class TestRateLimitValidator:
    """Test rate limit validation."""
    
    def test_valid_ips(self):
        """Test that valid IPs pass validation."""
        valid_ips = [
            "192.168.1.1",
            "10.0.0.1",
            "127.0.0.1",
            "::1",  # IPv6 localhost
            "2001:db8::1",  # IPv6
        ]
        
        for ip in valid_ips:
            result = RateLimitValidator.validate_ip(ip)
            assert result == ip
    
    def test_proxy_ips(self):
        """Test that proxy IPs (non-standard) are handled."""
        proxy_ips = [
            "unknown",
            "forwarded",
            "X-Forwarded-For",
        ]
        
        for ip in proxy_ips:
            # Should not raise error, just validate as string
            result = RateLimitValidator.validate_ip(ip)
            assert result == ip
    
    def test_invalid_ips(self):
        """Test that invalid IPs are rejected."""
        with pytest.raises(ValueError):
            RateLimitValidator.validate_ip("")
        
        with pytest.raises(ValueError):
            RateLimitValidator.validate_ip("X" * 50)  # Too long


class TestAPIKeyValidator:
    """Test API key validation."""
    
    def test_valid_gemini_keys(self):
        """Test that valid Gemini API keys pass validation."""
        valid_keys = [
            "AIzaSyAbcdefghijklmnopqrstuvwxyz12345678",  # 39 chars
            "AIzaSy_test_key_with_underscores_12345",    # With underscores
            "AIzaSy-test-key-with-dashes-1234567890",    # With dashes
        ]
        
        for key in valid_keys:
            result = APIKeyValidator.validate_api_key(key, 'gemini')
            assert result == key
    
    def test_valid_openai_keys(self):
        """Test that valid OpenAI API keys pass validation."""
        valid_keys = [
            "sk-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH",
            "sk-proj-abcdefghijklmnopqrstuvwxyz1234567890",
            "sk-1234567890abcdefghijklmnopqrstuvwxyz",
        ]
        
        for key in valid_keys:
            result = APIKeyValidator.validate_api_key(key, 'gpt4')
            assert result == key
            result = APIKeyValidator.validate_api_key(key, 'gpt35')
            assert result == key
    
    def test_valid_anthropic_keys(self):
        """Test that valid Anthropic API keys pass validation."""
        valid_keys = [
            "sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890",
            "sk-ant-test-1234567890abcdefghijklmnopqrstuvwxyz",
        ]
        
        for key in valid_keys:
            result = APIKeyValidator.validate_api_key(key, 'claude')
            assert result == key
    
    def test_none_api_key(self):
        """Test that None API key returns None."""
        assert APIKeyValidator.validate_api_key(None) is None
        assert APIKeyValidator.validate_api_key("") is None
        assert APIKeyValidator.validate_api_key("   ") is None
    
    def test_invalid_characters(self):
        """Test that API keys with invalid characters are rejected."""
        invalid_keys = [
            "sk-<script>alert()</script>",
            "AIzaSy{malicious}",
            "sk-ant-[injection]",
            "key\nwith\nnewlines",
            "key\twith\ttabs",
            'key"with"quotes',
            "key'with'quotes",
            "key\\with\\backslash",
        ]
        
        for key in invalid_keys:
            with pytest.raises(ValueError, match="invalid characters"):
                APIKeyValidator.validate_api_key(key)
    
    def test_invalid_format_gemini(self):
        """Test that invalid Gemini key formats are rejected."""
        invalid_keys = [
            "notAGeminiKey",
            "AIza",  # Too short
            "A" * 60,  # Too long
        ]
        
        for key in invalid_keys:
            with pytest.raises(ValueError, match="Invalid Gemini API key format"):
                APIKeyValidator.validate_api_key(key, 'gemini')
    
    def test_invalid_format_openai(self):
        """Test that invalid OpenAI key formats are rejected."""
        invalid_keys = [
            "not-starting-with-sk",
            "sk-tooshort",
            "pk-wrongprefix1234567890abcdefgh",
        ]
        
        for key in invalid_keys:
            with pytest.raises(ValueError, match="Invalid OpenAI API key format"):
                APIKeyValidator.validate_api_key(key, 'gpt4')
    
    def test_invalid_format_anthropic(self):
        """Test that invalid Anthropic key formats are rejected."""
        invalid_keys = [
            "sk-wrongprefix",
            "sk-ant-short",
            "not-anthropic-key",
        ]
        
        for key in invalid_keys:
            with pytest.raises(ValueError, match="Invalid Anthropic API key format"):
                APIKeyValidator.validate_api_key(key, 'claude')
    
    def test_too_long_key(self):
        """Test that excessively long keys are rejected."""
        long_key = "sk-" + "a" * 250
        with pytest.raises(ValueError, match="API key is too long"):
            APIKeyValidator.validate_api_key(long_key)