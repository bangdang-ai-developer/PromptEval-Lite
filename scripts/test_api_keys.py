#!/usr/bin/env python3
"""
Script to test API keys for different providers.
"""
import os
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_gemini_key():
    """Test Google Gemini API key."""
    api_key = os.getenv("GOOGLE_API_KEY", "")
    
    if not api_key or api_key == "your_gemini_api_key_here":
        print("❌ Google API Key: Not configured (using placeholder)")
        print("   Get your key from: https://makersuite.google.com/app/apikey")
        return False
    
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.1
        )
        
        # Test with a simple prompt
        response = await llm.ainvoke("Say 'API key is valid'")
        print(f"✅ Google API Key: Valid")
        print(f"   Response: {response.content[:50]}...")
        return True
        
    except Exception as e:
        print(f"❌ Google API Key: Invalid")
        print(f"   Error: {str(e)}")
        return False

async def test_openai_key():
    """Test OpenAI API key."""
    api_key = os.getenv("OPENAI_API_KEY", "")
    
    if not api_key or api_key == "your_openai_api_key_here":
        print("⚠️  OpenAI API Key: Not configured (optional)")
        return None
    
    try:
        from langchain_openai import ChatOpenAI
        
        llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            openai_api_key=api_key,
            temperature=0.1
        )
        
        response = await llm.ainvoke("Say 'API key is valid'")
        print(f"✅ OpenAI API Key: Valid")
        print(f"   Response: {response.content[:50]}...")
        return True
        
    except Exception as e:
        print(f"❌ OpenAI API Key: Invalid")
        print(f"   Error: {str(e)}")
        return False

async def test_anthropic_key():
    """Test Anthropic API key."""
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    
    if not api_key or api_key == "your_anthropic_api_key_here":
        print("⚠️  Anthropic API Key: Not configured (optional)")
        return None
    
    try:
        from langchain_anthropic import ChatAnthropic
        
        llm = ChatAnthropic(
            model="claude-3-sonnet-20240229",
            anthropic_api_key=api_key,
            temperature=0.1
        )
        
        response = await llm.ainvoke("Say 'API key is valid'")
        print(f"✅ Anthropic API Key: Valid")
        print(f"   Response: {response.content[:50]}...")
        return True
        
    except Exception as e:
        print(f"❌ Anthropic API Key: Invalid")
        print(f"   Error: {str(e)}")
        return False

async def main():
    """Test all configured API keys."""
    print("Testing API Keys Configuration")
    print("=" * 50)
    print()
    
    # Test each provider
    gemini_valid = await test_gemini_key()
    print()
    
    openai_valid = await test_openai_key()
    print()
    
    anthropic_valid = await test_anthropic_key()
    print()
    
    # Summary
    print("Summary")
    print("=" * 50)
    
    if gemini_valid:
        print("✅ Google Gemini is ready to use")
    else:
        print("❌ Google Gemini is NOT configured (required for default operation)")
        print("   Please update GOOGLE_API_KEY in your .env file")
    
    if openai_valid:
        print("✅ OpenAI is ready to use")
    elif openai_valid is None:
        print("⚠️  OpenAI is not configured (optional)")
    
    if anthropic_valid:
        print("✅ Anthropic is ready to use")
    elif anthropic_valid is None:
        print("⚠️  Anthropic is not configured (optional)")
    
    print()
    print("Note: At least one valid API key is required for the application to work.")
    print("Users can also provide their own API keys through the web interface.")

if __name__ == "__main__":
    asyncio.run(main())