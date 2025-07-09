import { useState } from 'react';
import type { TestRequest, TestResponse } from '../types/api';
import { apiService, ApiError } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import TestResults from './TestResults';
import { BeakerIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const TestPrompt = () => {
  const [formData, setFormData] = useState<TestRequest>({
    prompt: '',
    domain: '',
    num_cases: 5,
    score_method: 'hybrid',
    example_expected: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.prompt.trim()) {
      setError('Please enter a prompt to test');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await apiService.testPrompt({
        ...formData,
        domain: formData.domain || undefined,
        example_expected: formData.example_expected || undefined,
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'num_cases' ? parseInt(value) : value,
    }));
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
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Prompt to Test *
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div>
                <label htmlFor="num_cases" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Test Cases
                </label>
                <input
                  type="number"
                  id="num_cases"
                  name="num_cases"
                  value={formData.num_cases}
                  onChange={handleChange}
                  className="input-field"
                  min="1"
                  max="10"
                />
              </div>

              <div>
                <label htmlFor="score_method" className="block text-sm font-medium text-gray-700 mb-2">
                  Scoring Method
                </label>
                <select
                  id="score_method"
                  name="score_method"
                  value={formData.score_method}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="hybrid">Hybrid (Recommended)</option>
                  <option value="exact_match">Semantic Similarity (Strict)</option>
                  <option value="gpt_judge">Semantic Similarity (Flexible)</option>
                </select>
              </div>
            </div>

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
                value={formData.example_expected}
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

      {results && <TestResults results={results} />}
    </div>
  );
};

export default TestPrompt;