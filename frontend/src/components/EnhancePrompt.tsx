import { useState } from 'react';
import type { EnhanceRequest, EnhanceResponse } from '../types/api';
import { apiService, ApiError } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import TestResults from './TestResults';
import { 
  SparklesIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const EnhancePrompt = () => {
  const [formData, setFormData] = useState<EnhanceRequest>({
    prompt: '',
    domain: '',
    auto_retest: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<EnhanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.prompt.trim()) {
      setError('Please enter a prompt to enhance');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await apiService.enhancePrompt({
        ...formData,
        domain: formData.domain || undefined,
      });
      setResults(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.response.message);
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Prompt to Enhance *
              </label>
              <textarea
                id="prompt"
                name="prompt"
                value={formData.prompt}
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
                  value={formData.domain}
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
                  checked={formData.auto_retest}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="auto_retest" className="text-sm font-medium text-gray-700">
                  Auto-retest enhanced prompt
                </label>
              </div>
            </div>

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

      {results && (
        <div className="space-y-6">
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
    </div>
  );
};

export default EnhancePrompt;