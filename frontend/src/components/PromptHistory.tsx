import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import type { PromptHistoryResponse } from '../services/api';
import { 
  XMarkIcon, 
  ClockIcon, 
  StarIcon,
  TrashIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from './LoadingSpinner';

interface PromptHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

const PromptHistory: React.FC<PromptHistoryProps> = ({ isOpen, onClose, onSelectPrompt }) => {
  const [history, setHistory] = useState<PromptHistoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    favoritesOnly: false,
    model: '',
  });
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await apiService.getPromptHistory({
        favorites_only: filter.favoritesOnly,
        model: filter.model || undefined,
      });
      setHistory(items);
    } catch {
      setError('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  const handleToggleFavorite = async (historyId: string) => {
    try {
      const result = await apiService.toggleFavorite(historyId);
      setHistory(history.map(item => 
        item.id === historyId ? { ...item, is_favorite: result.is_favorite } : item
      ));
    } catch {
      setError('Failed to update favorite');
    }
  };

  const handleDelete = async (historyId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await apiService.deleteHistoryItem(historyId);
      setHistory(history.filter(item => item.id !== historyId));
    } catch {
      setError('Failed to delete item');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getModelBadgeColor = (model: string) => {
    const colors: Record<string, string> = {
      'gemini': 'bg-blue-100 text-blue-700',
      'gpt-4': 'bg-green-100 text-green-700',
      'gpt-3.5-turbo': 'bg-teal-100 text-teal-700',
      'claude-3': 'bg-purple-100 text-purple-700',
    };
    return colors[model] || 'bg-gray-100 text-gray-700';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden m-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClockIcon className="h-7 w-7 mr-2 text-indigo-600" />
            Prompt History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => setFilter({ ...filter, favoritesOnly: !filter.favoritesOnly })}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                filter.favoritesOnly 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <StarIcon className="h-4 w-4" />
              <span className="text-sm">Favorites Only</span>
            </button>

            <select
              value={filter.model}
              onChange={(e) => setFilter({ ...filter, model: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Models</option>
              <option value="gemini">Gemini</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5</option>
              <option value="claude-3">Claude 3</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 240px)' }}>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No history found</p>
                <p className="text-sm mt-2">Your prompt tests and enhancements will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                      selectedItem === item.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getModelBadgeColor(item.model_used)}`}>
                            {item.model_used}
                          </span>
                          {item.overall_score !== null && item.overall_score !== undefined && (
                            <span className="text-sm text-gray-600">
                              Score: {(item.overall_score * 100).toFixed(0)}%
                            </span>
                          )}
                          {item.execution_time && (
                            <span className="text-sm text-gray-500">
                              {item.execution_time.toFixed(1)}s
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-900 line-clamp-2 mb-1">
                          {item.prompt}
                        </p>
                        
                        {item.domain && (
                          <p className="text-xs text-gray-500">
                            Domain: {item.domain}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(item.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(item.id);
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {item.is_favorite ? (
                            <StarIconSolid className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <StarIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        
                        {onSelectPrompt && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPrompt(item.prompt);
                              onClose();
                            }}
                            className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors"
                            title="Use this prompt"
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {selectedItem === item.id && item.enhanced_prompt && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Enhanced Version:</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {item.enhanced_prompt}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptHistory;