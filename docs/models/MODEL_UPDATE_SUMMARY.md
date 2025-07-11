# AI Model Update Summary (June 2025)

## Overview
Updated PromptEval-Lite to support the latest AI models available as of June 2025, including new releases from Google Gemini, OpenAI, and Anthropic.

## New Models Added

### Google Gemini Models
- **Gemini 2.5 Pro** - Most advanced with thinking capabilities
- **Gemini 2.5 Flash** - Well-balanced thinking model (new default)
- **Gemini 2.5 Flash-Lite** - Fastest with optional thinking (new evaluator)
- **Gemini 2.0 Flash** - Fast experimental model
- **Gemini 1.5 Pro** - Previous generation pro
- **Gemini 1.5 Flash** - Previous generation flash

### OpenAI Models
- **GPT-4.1** - Latest with 1M context window
- **GPT-4.1 Mini** - Smaller, faster GPT-4.1
- **GPT-4.1 Nano** - Fastest with 1M context
- **GPT-4o** - Multimodal (text + images)
- **GPT-4o Mini** - Cost-efficient small model
- **O3** - Advanced reasoning model
- **O4 Mini** - Fast reasoning model
- **GPT-4** - Classic GPT-4
- **GPT-3.5 Turbo** - Fast and affordable

### Anthropic Claude Models
- **Claude Opus 4** - World's best coding model
- **Claude Sonnet 4** - Balanced performance
- **Claude 3.5 Sonnet** - Previous best
- **Claude 3.5 Haiku** - Fast and efficient
- **Claude 3 Opus** - Powerful reasoning
- **Claude 3 Sonnet** - Balanced Claude 3
- **Claude 3 Haiku** - Fastest Claude 3

## Technical Changes

### Backend Updates
1. **app/models.py**
   - Added comprehensive ModelProvider enum with all new models
   - Updated default descriptions

2. **app/multi_model_service.py**
   - Added model mapping for all new variants
   - Updated default to Gemini 2.5 Flash
   - Set evaluator to Gemini 2.5 Flash-Lite
   - Proper model name mapping to API endpoints

3. **app/config.py**
   - Updated default_model to "gemini-2.5-flash"
   - Updated evaluator_model to "gemini-2.5-flash-lite"

### Frontend Updates
1. **frontend/src/types/api.ts**
   - Created AIModel type with all model options
   - Updated interfaces to use AIModel type

2. **frontend/src/contexts/AppConfigContext.tsx**
   - Updated to use AIModel type
   - Changed default to 'gemini-2.5-flash'

3. **frontend/src/components/ModelConfiguration.tsx**
   - Added comprehensive model dropdown with optgroups
   - Added getModelDescription function
   - Updated tooltips with model capabilities
   - Added provider mapping for saved keys

4. **frontend/src/components/APIKeyManager.tsx**
   - Updated to use provider groups (gemini, openai, claude)
   - Added getProviderFromModel mapping function

## API Key Management
- Keys are now grouped by provider rather than specific model
- Gemini keys work with all Gemini models
- OpenAI keys work with all GPT/O models
- Claude keys work with all Claude models

## Default Changes
- Default model: Gemini 2.5 Flash (thinking model)
- Default evaluator: Gemini 2.5 Flash-Lite (cost-efficient)

## Testing
To test the new models:
1. Select any model from the dropdown
2. Enter appropriate API key (or use server key)
3. Run test/enhance operations

Note: Some models (GPT-4.1, O3, Claude 4) may require special API access.