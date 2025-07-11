import { useState, useMemo, useEffect } from 'react';
import type { TestRequest, TestResponse } from '../types/api';
import { apiService, ApiError } from '../services/api';
import { useAppConfig } from '../contexts/AppConfigContext';
import LoadingSpinner from './LoadingSpinner';
import TestResults from './TestResults';
import ModelConfiguration from './ModelConfiguration';
import Toast from './Toast';
import { BeakerIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, DocumentDuplicateIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import SavePromptModal from './SavePromptModal';

// Example prompts for users to try
const EXAMPLE_PROMPTS = [
  {
    name: 'Translation Assistant',
    prompt: 'You are a professional translator. Translate the following text from English to French, maintaining the tone and context. Provide only the translation without explanations.',
    domain: 'translation',
    example_expected: 'Bonjour, comment allez-vous aujourd\'hui?'
  },
  {
    name: 'Code Documentation',
    prompt: 'You are a technical writer. Given a function or code snippet, write clear and concise documentation including purpose, parameters, return value, and usage example.',
    domain: 'documentation',
    example_expected: '/**\n * Calculates the sum of two numbers\n * @param {number} a - First number\n * @param {number} b - Second number\n * @returns {number} The sum of a and b\n * @example\n * const result = add(5, 3); // returns 8\n */'
  },
  {
    name: 'Email Summarizer',
    prompt: 'Summarize the following email in 2-3 bullet points, highlighting key action items and important information.',
    domain: 'summarization',
    example_expected: '• Meeting scheduled for Friday at 2 PM to discuss Q4 targets\n• Need to submit quarterly report by end of week\n• Follow up with client about contract renewal'
  },
  {
    name: 'JSON Formatter',
    prompt: 'Convert the given data into a properly formatted JSON object with appropriate keys and structure.',
    domain: 'data_formatting',
    example_expected: '{\n  "name": "John Doe",\n  "age": 30,\n  "email": "john@example.com"\n}'
  }
];

const TestPrompt = () => {
  const { config, updateConfig, syncFromTest, saveTestResults, clearTestResults } = useAppConfig();
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showingSavedResults, setShowingSavedResults] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Restore saved results when component mounts
  useEffect(() => {
    if (config.lastTestResults) {
      setResults(config.lastTestResults);
      setShowingSavedResults(true);
    }
  }, [config.lastTestResults]);
  
  // Update form state from config
  const localFormData = {
    num_cases: config.testFormState.num_cases,
    score_method: config.testFormState.score_method,
  };
  
  const updateTestFormState = (updates: Partial<typeof localFormData>) => {
    updateConfig({
      testFormState: {
        ...config.testFormState,
        ...updates,
      },
    });
  };

  // Validation and hints
  const promptValidation = useMemo(() => {
    const length = config.prompt.length;
    if (length === 0) return { status: 'empty', message: '' };
    if (length < 20) return { status: 'warning', message: 'Consider adding more context for better results' };
    if (length > 2000) return { status: 'warning', message: 'Very long prompt - consider being more concise' };
    if (length >= 50 && length <= 500) return { status: 'good', message: 'Good prompt length' };
    return { status: 'ok', message: '' };
  }, [config.prompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.prompt.trim()) {
      setError('Please enter a prompt to test');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);
    setShowingSavedResults(false);
    clearTestResults(); // Clear any saved results when starting new test

    try {
      // Prepare the test request
      const testRequest: TestRequest = {
        prompt: config.prompt,
        domain: config.domain || undefined,
        num_cases: localFormData.num_cases,
        score_method: localFormData.score_method,
        example_expected: config.example_expected || undefined,
        model: config.model,
        api_key: apiKey,
      };
      const response = await apiService.testPrompt(testRequest);
      setResults(response);
      
      // Save results to context
      saveTestResults(response);
      
      // Sync successful test data for use in other tabs
      syncFromTest({
        prompt: config.prompt,
        domain: config.domain,
        example_expected: config.example_expected,
        model: config.model,
        apiKeyOption: config.apiKeyOption,
        selectedSavedKeyId: config.selectedSavedKeyId,
        manualApiKey: config.manualApiKey,
      });
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'prompt' || name === 'domain' || name === 'example_expected') {
      updateConfig({ [name]: value });
    } else if (name === 'num_cases' || name === 'score_method') {
      updateTestFormState({
        [name]: name === 'num_cases' ? parseInt(value) : value,
      });
    }
  };

  const loadExample = (example: typeof EXAMPLE_PROMPTS[0]) => {
    updateConfig({
      prompt: example.prompt,
      domain: example.domain,
      example_expected: example.example_expected,
    });
    setShowExamples(false);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <BeakerIcon className="h-8 w-8 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Test Prompt</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Example Prompts Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Need inspiration?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExamples(!showExamples)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showExamples ? 'Hide Examples' : 'Show Examples'}
                </button>
              </div>
              
              {showExamples && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  {EXAMPLE_PROMPTS.map((example, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => loadExample(example)}
                      className="text-left p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <DocumentDuplicateIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-800">{example.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{example.prompt}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                  Prompt to Test *
                </label>
                <div className="flex items-center space-x-2">
                  {promptValidation.status === 'good' && (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  )}
                  {promptValidation.status === 'warning' && (
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-xs text-gray-500">
                    {config.prompt.length} characters
                  </span>
                </div>
              </div>
              <textarea
                id="prompt"
                name="prompt"
                value={config.prompt}
                onChange={handleChange}
                className={`textarea-field ${
                  promptValidation.status === 'good' 
                    ? 'border-green-300 focus:border-green-500' 
                    : promptValidation.status === 'warning'
                    ? 'border-amber-300 focus:border-amber-500'
                    : ''
                }`}
                rows={4}
                placeholder="Enter your prompt here..."
                required
              />
              {promptValidation.message && (
                <p className={`text-xs mt-1 ${
                  promptValidation.status === 'good' 
                    ? 'text-green-600' 
                    : 'text-amber-600'
                }`}>
                  {promptValidation.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div>
                <label htmlFor="num_cases" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Test Cases
                </label>
                <input
                  type="number"
                  id="num_cases"
                  name="num_cases"
                  value={localFormData.num_cases}
                  onChange={handleChange}
                  className="input-field"
                  min="1"
                  max="10"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label htmlFor="score_method" className="block text-sm font-medium text-gray-700">
                    Scoring Method
                  </label>
                  <div className="group relative">
                    <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <p className="mb-2"><strong>Hybrid:</strong> Fast semantic evaluation using Gemini 2.0 Flash</p>
                      <p className="mb-2"><strong>Strict:</strong> Requires high semantic similarity</p>
                      <p><strong>Flexible:</strong> More lenient semantic matching</p>
                      <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                    </div>
                  </div>
                </div>
                <select
                  id="score_method"
                  name="score_method"
                  value={localFormData.score_method}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="hybrid">Hybrid (Recommended)</option>
                  <option value="exact_match">Semantic Similarity (Strict)</option>
                  <option value="gpt_judge">Semantic Similarity (Flexible)</option>
                </select>
              </div>
            </div>

            {/* Model Configuration Component */}
            <ModelConfiguration onApiKeyChange={setApiKey} />

            <div>
              <label htmlFor="example_expected" className="block text-sm font-medium text-gray-700 mb-2">
                Example Expected Output (optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Provide an example of the expected output format to guide test case generation
              </p>
              <textarea
                id="example_expected"
                name="example_expected"
                value={config.example_expected}
                onChange={handleChange}
                className="textarea-field"
                rows={3}
                placeholder="e.g., # Title\n\n## Section\n* Bullet point\n* Another point"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Testing Prompt...</span>
                </>
              ) : (
                <>
                  <BeakerIcon className="h-5 w-5" />
                  <span>Test Prompt</span>
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
      {results && showingSavedResults && config.resultsTimestamp.test && (
        <div className="card border-blue-200 bg-blue-50 mb-4">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Showing previous results from {new Date(config.resultsTimestamp.test).toLocaleTimeString()}
                </span>
              </div>
              <button
                onClick={() => {
                  clearTestResults();
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
        <div className="space-y-4">
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
          
          <TestResults results={results} onSyncToEnhance={() => {
            // The sync already happened after successful test
            // This is just for user feedback
            setToastMessage('Prompt data has been synced! Switch to the Enhance tab to use it.');
            setShowToast(true);
          }} />
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
          testResults={results}
        />
      )}
    </div>
  );
};

export default TestPrompt;