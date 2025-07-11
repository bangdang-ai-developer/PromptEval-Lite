# Actual Available Models

Due to the rapid changes in AI model availability, the application currently maps all model selections to the following actually available models:

## Google Gemini
- **gemini-1.5-pro**: Advanced multimodal model
- **gemini-1.5-flash**: Fast and efficient model

All Gemini 2.x model selections will use Gemini 1.5 models until the newer versions are released.

## OpenAI
- **gpt-4**: GPT-4 (if available on your API key)
- **gpt-3.5-turbo**: Fast and affordable

The GPT-4.1, GPT-4o, and O3/O4 models shown in the UI are placeholders for future releases.

## Anthropic Claude
- **claude-3-opus-20240229**: Most capable Claude model
- **claude-3-sonnet-20240229**: Balanced performance
- **claude-3-haiku-20240307**: Fast and efficient

Claude 4 models shown in the UI are placeholders for future releases.

## Model Mapping

The application automatically maps UI selections to available models:
- All Gemini 2.x → Gemini 1.5 equivalent
- GPT-4.1/4o variants → GPT-4 or GPT-3.5-turbo
- Claude 4 variants → Claude 3 equivalent

This ensures the application works with current APIs while providing a future-ready interface.