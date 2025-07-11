import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { APIKeyResponse, SaveAPIKeyRequest } from '../services/api';
import { 
  XMarkIcon, 
  KeyIcon, 
  PlusIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon 
} from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

interface APIKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
}


const APIKeyManager: React.FC<APIKeyManagerProps> = ({ isOpen, onClose }) => {
  const [apiKeys, setApiKeys] = useState<APIKeyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState<SaveAPIKeyRequest>({
    provider: 'gemini',
    api_key: '',
    key_name: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadApiKeys();
    }
  }, [isOpen]);

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      const keys = await apiService.getAPIKeys();
      setApiKeys(keys);
    } catch {
      setError('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await apiService.saveAPIKey(formData);
      await loadApiKeys();
      setShowAddForm(false);
      setFormData({ provider: 'gemini', api_key: '', key_name: '' });
    } catch {
      setError('Failed to save API key');
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      await apiService.deleteAPIKey(keyId);
      await loadApiKeys();
    } catch {
      setError('Failed to delete API key');
    }
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      'gemini': 'Google Gemini',
      'openai': 'OpenAI',
      'claude': 'Anthropic Claude',
    };
    return names[provider] || provider;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden m-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <KeyIcon className="h-7 w-7 mr-2 text-indigo-600" />
            API Key Management
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 180px)' }}>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mb-6 flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add New API Key</span>
            </button>
          )}

          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Add New API Key</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value as 'gemini' | 'openai' | 'claude' })}
                    className="input-field"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI</option>
                    <option value="claude">Anthropic Claude</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={formData.key_name}
                    onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Personal Key, Work Key"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      className="input-field pr-10"
                      placeholder={
                        formData.provider === 'gemini' ? 'AIzaSy...' :
                        formData.provider === 'openai' ? 'sk-...' :
                        formData.provider === 'claude' ? 'sk-ant-...' :
                        'Enter your API key'
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showApiKey ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save API Key
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ provider: 'gemini', api_key: '', key_name: '' });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <KeyIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No API keys saved yet</p>
              <p className="text-sm mt-2">Add your API keys to use them across sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{key.key_name}</h4>
                    <p className="text-sm text-gray-500">
                      {getProviderName(key.provider)} • Added {new Date(key.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(key.id)}
                    className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default APIKeyManager;