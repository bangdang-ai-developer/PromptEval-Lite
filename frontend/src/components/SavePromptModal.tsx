import { useState } from 'react';
import { XMarkIcon, TagIcon, FolderIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import type { TestResponse, EnhanceResponse } from '../types/api';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

interface SavePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  prompt: string;
  domain?: string;
  model: string;
  testResults?: TestResponse;
  enhanceResults?: EnhanceResponse;
}

const CATEGORIES = [
  { value: 'translation', label: '🌐 Translation' },
  { value: 'coding', label: '💻 Coding' },
  { value: 'writing', label: '✍️ Writing' },
  { value: 'analysis', label: '📊 Analysis' },
  { value: 'summarization', label: '📝 Summarization' },
  { value: 'data_formatting', label: '📋 Data Formatting' },
  { value: 'creative', label: '🎨 Creative' },
  { value: 'educational', label: '🎓 Educational' },
  { value: 'business', label: '💼 Business' },
  { value: 'other', label: '📦 Other' },
];

const SavePromptModal: React.FC<SavePromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prompt,
  domain,
  model,
  testResults,
  enhanceResults,
}) => {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: domain || 'other',
    tags: '',
    isTemplate: false,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please login to save prompts');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare tags array
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Prepare save request
      const saveRequest = {
        prompt,
        name: formData.name || `Prompt ${new Date().toLocaleDateString()}`,
        description: formData.description,
        category: formData.category,
        tags,
        domain,
        enhanced_prompt: enhanceResults?.enhanced_prompt,
        model_used: model,
        test_results: testResults ? {
          test_results: testResults.test_results,
          overall_score: testResults.overall_score,
          total_cases: testResults.total_cases,
          passed_cases: testResults.passed_cases,
        } : undefined,
        overall_score: testResults?.overall_score,
        improvements: enhanceResults?.improvements,
        execution_time: testResults?.execution_time || enhanceResults?.execution_time,
        token_usage: testResults?.token_usage || enhanceResults?.token_usage,
        is_template: formData.isTemplate,
        template_variables: formData.isTemplate ? extractTemplateVariables(prompt) : undefined,
      };

      await apiService.savePrompt(saveRequest);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError('Failed to save prompt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractTemplateVariables = (text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const generatePromptName = async () => {
    setIsGeneratingName(true);
    try {
      const result = await apiService.generatePromptName(prompt);
      setFormData({ ...formData, name: result.name });
    } catch (error) {
      // Fallback to simple extraction if AI generation fails
      const firstLine = prompt.split('\n')[0];
      const cleanedLine = firstLine.replace(/[^\w\s]/g, '').trim();
      const words = cleanedLine.split(' ').slice(0, 5).join(' ');
      setFormData({ ...formData, name: words || 'My Prompt' });
    } finally {
      setIsGeneratingName(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden m-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Save Prompt</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {!isAuthenticated && (
            <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md">
              Please login to save prompts to your library
            </div>
          )}

          {/* Prompt Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Prompt Preview</h3>
            <p className="text-sm text-gray-600 line-clamp-3">{prompt}</p>
            {testResults && (
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <span>Score: {(testResults.overall_score * 100).toFixed(0)}%</span>
                <span>Model: {model}</span>
                <span>Tests: {testResults.total_cases}</span>
              </div>
            )}
          </div>

          {/* Name Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="flex-1 input-field"
                placeholder="Enter a descriptive name"
                required
                maxLength={255}
              />
              <button
                type="button"
                onClick={generatePromptName}
                disabled={isGeneratingName}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGeneratingName ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Auto-generate</span>
                )}
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              placeholder="Add notes about this prompt (optional)"
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FolderIcon className="inline h-4 w-4 mr-1" />
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <TagIcon className="inline h-4 w-4 mr-1" />
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="input-field"
              placeholder="Enter tags separated by commas (e.g., api, json, validation)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tags help you organize and find your prompts quickly
            </p>
          </div>

          {/* Template Option */}
          <div className="mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isTemplate}
                onChange={(e) => setFormData({ ...formData, isTemplate: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                Save as template
              </span>
            </label>
            {formData.isTemplate && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <p className="mb-1">Template variables detected:</p>
                <div className="flex flex-wrap gap-2">
                  {extractTemplateVariables(prompt).map(variable => (
                    <span key={variable} className="px-2 py-1 bg-blue-100 rounded">
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
                {extractTemplateVariables(prompt).length === 0 && (
                  <p className="text-xs mt-1">
                    No variables found. Use {`{{variable_name}}`} syntax to create template variables.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isLoading || !isAuthenticated}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save to Library</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SavePromptModal;