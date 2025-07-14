import { useState, useEffect } from 'react';
import type { EnhanceRequest, EnhanceResponse } from '../types/api';
import { apiService, ApiError } from '../services/api';
import { useAppConfig } from '../contexts/AppConfigContext';
import LoadingSpinner from './LoadingSpinner';
import TestResults from './TestResults';
import ModelConfiguration from './ModelConfiguration';
import { 
  SparklesIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import SavePromptModal from './SavePromptModal';
import Toast from './Toast';

const EnhancePrompt = () => {
  const { config, updateConfig, syncFromEnhance, saveEnhanceResults, clearEnhanceResults } = useAppConfig();
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<EnhanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSyncedBanner, setShowSyncedBanner] = useState(false);
  const [showingSavedResults, setShowingSavedResults] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Restore saved results when component mounts
  useEffect(() => {
    if (config.lastEnhanceResults) {
      setResults(config.lastEnhanceResults);
      setShowingSavedResults(true);
    }
  }, [config.lastEnhanceResults]);
  
  // Check if we have synced data from Test tab
  useEffect(() => {
    if (config.lastUpdatedFrom === 'test' && config.prompt) {
      setShowSyncedBanner(true);
      // Auto-hide banner after 5 seconds
      const timer = setTimeout(() => setShowSyncedBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [config.lastUpdatedFrom, config.prompt]);
  
  // Use form state from config
  const autoRetest = config.enhanceFormState.auto_retest;
  const setAutoRetest = (value: boolean) => {
    updateConfig({
      enhanceFormState: {
        ...config.enhanceFormState,
        auto_retest: value,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.prompt.trim()) {
      setError('Please enter a prompt to enhance');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setShowingSavedResults(false);
    clearEnhanceResults(); // Clear any saved results when starting new enhancement

    try {
      const enhanceRequest: EnhanceRequest = {
        prompt: config.prompt,
        domain: config.domain || undefined,
        auto_retest: autoRetest,
        model: config.model,
        api_key: apiKey,
      };
      
      const response = await apiService.enhancePrompt(enhanceRequest);
      setResults(response);
      
      // Save results to context
      saveEnhanceResults(response);
      
      // Update config with enhanced prompt for potential use in Test tab
      if (response.enhanced_prompt) {
        syncFromEnhance({
          prompt: response.enhanced_prompt,
          domain: config.domain,
          model: config.model,
          apiKeyOption: config.apiKeyOption,
          selectedSavedKeyId: config.selectedSavedKeyId,
          manualApiKey: config.manualApiKey,
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const errorMessage = err.response.message;
        // Provide more helpful error messages for API key issues
        if (errorMessage.includes('API key') || errorMessage.includes('placeholder')) {
          setError(`${errorMessage}. Please provide a valid API key or check your server configuration.`);
        } else if (errorMessage.includes('not provided and not configured')) {
          setError(`${errorMessage}. You can either enter your own API key or configure one on the server.`);
        } else {
          setError(errorMessage);
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    if (name === 'prompt' || name === 'domain') {
      updateConfig({ [name]: value });
    } else if (name === 'auto_retest' && type === 'checkbox') {
      setAutoRetest(checked);
    }
  };

  const copyToClipboard = async () => {
    if (results?.enhanced_prompt) {
      try {
        await navigator.clipboard.writeText(results.enhanced_prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <SparklesIcon className="h-8 w-8 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Enhance Prompt</h2>
          </div>

          {/* Synced Data Banner */}
          {showSyncedBanner && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between animate-slide-down">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Using synced prompt from Test tab
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncedBanner(false)}
                className="text-green-600 hover:text-green-700"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Prompt to Enhance *
              </label>
              <textarea
                id="prompt"
                name="prompt"
                value={config.prompt}
                onChange={handleChange}
                className="textarea-field"
                rows={4}
                placeholder="Enter your prompt here..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                  Domain (optional)
                </label>
                <input
                  type="text"
                  id="domain"
                  name="domain"
                  value={config.domain}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., translation, summarization"
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="auto_retest"
                  name="auto_retest"
                  checked={autoRetest}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="auto_retest" className="text-sm font-medium text-gray-700">
                  Auto-retest enhanced prompt
                </label>
              </div>
            </div>

            {/* Model Configuration Component */}
            <ModelConfiguration onApiKeyChange={setApiKey} />

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Enhancing Prompt...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  <span>Enhance Prompt</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50">
          <div className="p-4">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Saved Results Banner */}
      {results && showingSavedResults && config.resultsTimestamp.enhance && (
        <div className="card border-blue-200 bg-blue-50">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Showing previous results from {new Date(config.resultsTimestamp.enhance).toLocaleTimeString()}
                </span>
              </div>
              <button
                onClick={() => {
                  clearEnhanceResults();
                  setResults(null);
                  setShowingSavedResults(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Results
              </button>
            </div>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <BookmarkIcon className="h-5 w-5" />
              Save to Library
            </button>
          </div>
          
          {/* Enhanced Prompt */}
          <div className="card animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Enhanced Prompt</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {results.execution_time.toFixed(2)}s
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    {copied ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {results.enhanced_prompt}
                </pre>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Improvements Made:</h4>
                <ul className="space-y-1">
                  {results.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Test Results (if auto-retest was enabled) */}
          {results.test_results && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <ArrowPathIcon className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Auto-Test Results</h3>
              </div>
              <TestResults results={results.test_results} />
            </div>
          )}
        </div>
      )}
      
      {showToast && (
        <Toast 
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
      
      {showSaveModal && (
        <SavePromptModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSuccess={() => {
            setToastMessage('Prompt saved to your library!');
            setShowToast(true);
          }}
          prompt={config.prompt}
          domain={config.domain}
          model={config.model}
          enhanceResults={results || undefined}
        />
      )}
    </div>
  );
};

export default EnhancePrompt;