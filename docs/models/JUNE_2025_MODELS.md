# June 2025 Model Implementation

## Implemented Models

Based on research of actual API availability in June 2025, the following models have been implemented:

### Google Gemini
- **gemini-2.5-pro**: State-of-the-art thinking model
- **gemini-2.5-flash**: Best price/performance with thinking (default)
- **gemini-2.0-flash-exp**: Fast experimental model

API endpoints are confirmed working as of June 2025.

### OpenAI
- **gpt-4.1**: Latest with 1M context window
- **gpt-4.1-mini**: Efficient variant, outperforms GPT-4o
- **gpt-4.1-nano**: Fastest and cheapest with 1M context
- **gpt-4o**: Multimodal model (default in ChatGPT)
- **gpt-4o-mini**: Cost-efficient small model
- **o3**: Most intelligent reasoning model
- **o4-mini**: Fast reasoning, best for math/coding

All models confirmed available via OpenAI API.

### Anthropic Claude
- **claude-opus-4-20250514**: Best coding model (72.5% SWE-bench)
- **claude-sonnet-4-20250514**: Balanced performance (72.7% SWE-bench)
- **claude-3-5-sonnet-20241022**: Previous best, still excellent
- **claude-3-opus-20240229**: Claude 3 Opus
- **claude-3-sonnet-20240229**: Claude 3 Sonnet

Models use snapshot dates for version stability.

## Key Features

1. **Thinking Models**: Gemini 2.5 models support dynamic thinking budgets
2. **Extended Context**: GPT-4.1 family supports 1M token context
3. **Hybrid Modes**: Claude 4 models offer instant and extended thinking modes
4. **Multimodal**: GPT-4o supports text and image inputs

## Configuration

Default model: `gemini-2.5-flash` (best balance)
Evaluator model: `gemini-2.5-flash` (for scoring)

## Notes

- All models require appropriate API keys
- Some models may require special access (O3, Claude 4)
- Pricing varies significantly between models
- Check provider documentation for rate limits