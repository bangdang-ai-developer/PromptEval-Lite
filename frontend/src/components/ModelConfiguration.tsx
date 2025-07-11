import { useState, useMemo, useEffect } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useAppConfig } from '../contexts/AppConfigContext';
import { apiService } from '../services/api';
import type { APIKeyResponse } from '../services/api';
import type { AIModel } from '../types/api';

interface ModelConfigurationProps {
  onApiKeyChange?: (apiKey: string) => void;
  className?: string;
}

const getModelDescription = (model: AIModel): string => {
  const descriptions: Record<AIModel, string> = {
    // Gemini models
    'gemini-2.5-pro': 'State-of-the-art thinking model for complex problems',
    'gemini-2.5-flash': 'Best price/performance with thinking capabilities',
    'gemini-2.0-flash': 'Fast experimental model with 1M context',
    // OpenAI models
    'gpt-4.1': 'Latest GPT-4 with 1M context, best for coding and complex tasks',
    'gpt-4.1-mini': 'Smaller GPT-4.1, beats GPT-4o in many benchmarks',
    'gpt-4.1-nano': 'Fastest GPT-4.1 variant with 1M context window',
    'gpt-4o': 'Multimodal model for text and image understanding',
    'gpt-4o-mini': 'Cost-efficient small model, great for simple tasks',
    'o3': 'Most intelligent reasoning model, thinks before responding',
    'o4-mini': 'Fast reasoning model, best for math and coding',
    // Claude models
    'claude-opus-4': 'Best coding model (72.5% SWE-bench), handles hours-long tasks',
    'claude-sonnet-4': 'Excellent balance (72.7% SWE-bench)',
    'claude-3.5-sonnet': 'Previous best, still excellent for most tasks',
    'claude-3-opus': 'Powerful Claude 3 for complex reasoning',
    'claude-3-sonnet': 'Balanced Claude 3 model',
  };
  return descriptions[model] || 'Advanced AI model';
};

const ModelConfiguration: React.FC<ModelConfigurationProps> = ({ 
  onApiKeyChange, 
  className = '' 
}) => {
  const { isAuthenticated } = useAuth();
  const { config, updateConfig } = useAppConfig();
  const [savedApiKeys, setSavedApiKeys] = useState<APIKeyResponse[]>([]);

  // Load saved API keys for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedApiKeys();
    }
  }, [isAuthenticated]);

  const loadSavedApiKeys = async () => {
    try {
      const keys = await apiService.getAPIKeys();
      setSavedApiKeys(keys);
    } catch {
      // Silently fail - user can still enter manually
    }
  };

  // Map model to provider for filtering saved keys
  const getProviderFromModel = (model: AIModel): string => {
    if (model.startsWith('gemini')) return 'gemini';
    if (model.startsWith('gpt') || model.startsWith('o')) return 'openai';
    if (model.startsWith('claude')) return 'claude';
    return 'gemini';
  };

  // Filter saved keys by selected model's provider
  const availableSavedKeys = useMemo(() => {
    const provider = getProviderFromModel(config.model);
    return savedApiKeys.filter(key => key.provider === provider);
  }, [savedApiKeys, config.model]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value as AIModel;
    updateConfig({ 
      model: newModel,
      // Reset API key selection when model changes
      selectedSavedKeyId: '',
      manualApiKey: '',
    });
  };

  const handleApiKeyOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as typeof config.apiKeyOption;
    updateConfig({ 
      apiKeyOption: value,
      // Clear keys when switching modes
      selectedSavedKeyId: value === 'saved' ? '' : config.selectedSavedKeyId,
      manualApiKey: value === 'manual' ? '' : config.manualApiKey,
    });
    
    // Notify parent of API key change
    if (onApiKeyChange) {
      if (value === 'server') {
        onApiKeyChange('');
      } else if (value === 'saved' && config.selectedSavedKeyId) {
        onApiKeyChange(`saved:${config.selectedSavedKeyId}`);
      } else if (value === 'manual' && config.manualApiKey) {
        onApiKeyChange(config.manualApiKey);
      }
    }
  };

  const handleSavedKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const keyId = e.target.value;
    updateConfig({ selectedSavedKeyId: keyId });
    if (onApiKeyChange && keyId) {
      onApiKeyChange(`saved:${keyId}`);
    }
  };

  const handleManualKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    updateConfig({ manualApiKey: key });
    if (onApiKeyChange) {
      onApiKeyChange(key);
    }
  };

  // Get the current API key for parent components
  useEffect(() => {
    if (onApiKeyChange) {
      if (config.apiKeyOption === 'server') {
        onApiKeyChange('');
      } else if (config.apiKeyOption === 'saved' && config.selectedSavedKeyId) {
        onApiKeyChange(`saved:${config.selectedSavedKeyId}`);
      } else if (config.apiKeyOption === 'manual' && config.manualApiKey) {
        onApiKeyChange(config.manualApiKey);
      }
    }
  }, [config.apiKeyOption, config.selectedSavedKeyId, config.manualApiKey, onApiKeyChange]);

  return (
    <div className={`bg-gray-50 p-6 rounded-lg border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">🤖 Model Configuration</h3>
        <div className="group relative">
          <InformationCircleIcon className="h-5 w-5 text-gray-400 cursor-help" />
          <div className="absolute right-0 bottom-full mb-2 w-72 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <p className="mb-2 font-semibold">This configuration applies to all features</p>
            <p>Your selected model and API key settings will be used across Test, Enhance, and other functions.</p>
            <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Model Selection */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="model" className="text-sm font-medium text-gray-700">
              AI Model
            </label>
            <div className="group relative">
              <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 bottom-full mb-2 w-80 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="mb-2">
                  <p className="font-semibold text-yellow-300 mb-1">Google Gemini:</p>
                  <p className="text-xs">2.5 models: Thinking models with enhanced reasoning</p>
                  <p className="text-xs">2.0: Fast experimental model</p>
                </div>
                <div className="mb-2">
                  <p className="font-semibold text-blue-300 mb-1">OpenAI:</p>
                  <p className="text-xs">GPT-4.1: Latest with 1M context</p>
                  <p className="text-xs">O3/O4: Advanced reasoning models</p>
                </div>
                <div>
                  <p className="font-semibold text-purple-300 mb-1">Anthropic Claude:</p>
                  <p className="text-xs">Claude 4: Best for coding (72%+ SWE-bench)</p>
                  <p className="text-xs">Claude 3.5/3: Previous generation</p>
                </div>
                <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
              </div>
            </div>
          </div>
          <select
            id="model"
            name="model"
            value={config.model}
            onChange={handleModelChange}
            className="input-field w-full"
          >
            <optgroup label="Google Gemini">
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Thinking Model)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            </optgroup>
            <optgroup label="OpenAI (Coming Soon)">
              <option value="gpt-4.1" disabled>GPT-4.1 (1M Context)</option>
              <option value="gpt-4.1-mini" disabled>GPT-4.1 Mini</option>
              <option value="gpt-4.1-nano" disabled>GPT-4.1 Nano (Fastest)</option>
              <option value="gpt-4o" disabled>GPT-4o (Multimodal)</option>
              <option value="gpt-4o-mini" disabled>GPT-4o Mini</option>
              <option value="o3" disabled>O3 (Advanced Reasoning)</option>
              <option value="o4-mini" disabled>O4 Mini (Math/Code)</option>
            </optgroup>
            <optgroup label="Anthropic Claude (Coming Soon)">
              <option value="claude-opus-4" disabled>Claude Opus 4 (Best Coding)</option>
              <option value="claude-sonnet-4" disabled>Claude Sonnet 4</option>
              <option value="claude-3.5-sonnet" disabled>Claude 3.5 Sonnet</option>
              <option value="claude-3-opus" disabled>Claude 3 Opus</option>
              <option value="claude-3-sonnet" disabled>Claude 3 Sonnet</option>
            </optgroup>
          </select>
          <p className="text-xs text-gray-500 mt-2">
            {getModelDescription(config.model)}
          </p>
        </div>

        {/* API Key Configuration */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              API Key Source
            </label>
            <div className="group relative">
              <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <p className="mb-2">Choose how to authenticate with the AI model.</p>
                <p className="text-xs text-gray-300 mb-1"><strong>Server key:</strong> Use the default server configuration</p>
                <p className="text-xs text-gray-300 mb-1"><strong>Saved key:</strong> Use your saved API keys</p>
                <p className="text-xs text-gray-300"><strong>Manual:</strong> Enter a key for this session only</p>
                <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
              </div>
            </div>
          </div>
          
          {/* API Key Source Selection */}
          <select
            value={config.apiKeyOption}
            onChange={handleApiKeyOptionChange}
            className="input-field w-full mb-3"
          >
            <option value="server">Use Server Key</option>
            {isAuthenticated && availableSavedKeys.length > 0 && (
              <option value="saved">Use Saved Key</option>
            )}
            <option value="manual">Enter Manually</option>
          </select>
          
          {/* Conditional Fields */}
          {config.apiKeyOption === 'saved' && (
            <div>
              <select
                value={config.selectedSavedKeyId}
                onChange={handleSavedKeyChange}
                className="input-field w-full"
                required
              >
                <option value="">Select a saved key...</option>
                {availableSavedKeys.map(key => (
                  <option key={key.id} value={key.id}>
                    {key.key_name}
                  </option>
                ))}
              </select>
              {!config.selectedSavedKeyId && (
                <p className="text-xs text-amber-600 mt-1">
                  Please select a saved API key to continue
                </p>
              )}
            </div>
          )}
          
          {config.apiKeyOption === 'manual' && (
            <div>
              <input
                type="password"
                value={config.manualApiKey}
                onChange={handleManualKeyChange}
                className="input-field w-full"
                placeholder={
                  getProviderFromModel(config.model) === 'gemini' ? 'AIzaSy...' :
                  getProviderFromModel(config.model) === 'openai' ? 'sk-...' :
                  getProviderFromModel(config.model) === 'claude' ? 'sk-ant-...' :
                  'Enter your API key'
                }
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {getProviderFromModel(config.model) === 'gemini' && 'Google AI Studio API key'}
                {getProviderFromModel(config.model) === 'openai' && 'OpenAI API key'}
                {getProviderFromModel(config.model) === 'claude' && 'Anthropic API key'}
              </p>
            </div>
          )}
          
          {config.apiKeyOption === 'server' && (
            <p className="text-xs text-gray-500">
              Using server-configured API key
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-700 flex items-center">
          <InformationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          This configuration is shared across all features in the application
        </p>
      </div>
    </div>
  );
};

export default ModelConfiguration;