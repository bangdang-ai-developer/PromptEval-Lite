#!/usr/bin/env python3
"""
Test script to verify the API key and basic functionality
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.llm_service import GeminiService

async def test_api_key():
    """Test if the API key is working"""
    try:
        service = GeminiService()
        
        # Simple test
        from langchain.schema import HumanMessage
        messages = [HumanMessage(content="Say 'Hello, API is working!'")]
        response = await service.llm.ainvoke(messages)
        
        print("✅ API Key is working!")
        print(f"Response: {response.content}")
        return True
        
    except Exception as e:
        print(f"❌ API Key test failed: {str(e)}")
        return False

async def test_test_case_generation():
    """Test test case generation"""
    try:
        service = GeminiService()
        test_cases = await service.generate_test_cases(
            "Translate the following text to French",
            "translation",
            2
        )
        
        print("✅ Test case generation is working!")
        for i, case in enumerate(test_cases):
            print(f"Test case {i+1}: {case.input} -> {case.expected}")
        return True
        
    except Exception as e:
        print(f"❌ Test case generation failed: {str(e)}")
        return False

async def test_prompt_enhancement():
    """Test prompt enhancement"""
    try:
        service = GeminiService()
        enhanced_prompt, improvements = await service.enhance_prompt(
            "Translate text to French",
            "translation"
        )
        
        print("✅ Prompt enhancement is working!")
        print(f"Enhanced prompt: {enhanced_prompt[:100]}...")
        print(f"Improvements: {improvements}")
        return True
        
    except Exception as e:
        print(f"❌ Prompt enhancement failed: {str(e)}")
        return False

async def main():
    print("Testing PromptEval-Lite functionality...")
    
    # Check if API key is set
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        print("❌ GOOGLE_API_KEY not set in .env file")
        print("Please set your API key in the .env file")
        return
    
    # Test API key
    if not await test_api_key():
        return
    
    # Test test case generation
    if not await test_test_case_generation():
        return
    
    # Test prompt enhancement
    if not await test_prompt_enhancement():
        return
    
    print("\n🎉 All tests passed! The API is ready to use.")

if __name__ == "__main__":
    asyncio.run(main())