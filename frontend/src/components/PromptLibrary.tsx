import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import type { PromptLibraryItem, PromptLibraryResponse } from '../services/api';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  StarIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  FolderIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon,
  CheckIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useAppConfig } from '../contexts/AppConfigContext';
import Toast from './Toast';
import PromptVersionHistory from './PromptVersionHistory';

interface PromptLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: string, promptId?: string) => void;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'created_at' | 'name' | 'usage_count' | 'average_score' | 'last_used_at';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
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

const PromptLibrary: React.FC<PromptLibraryProps> = ({ isOpen, onClose, onSelectPrompt }) => {
  const { isAuthenticated } = useAuth();
  const { } = useAppConfig();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Library data
  const [libraryData, setLibraryData] = useState<PromptLibraryResponse>({
    prompts: [],
    total: 0,
    page: 1,
    page_size: 20,
  });
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    tags: [] as string[],
    favoritesOnly: false,
    templatesOnly: false,
    sortBy: 'created_at' as SortBy,
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  
  // Bulk selection
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  
  // Version history
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistoryPrompt, setVersionHistoryPrompt] = useState<PromptLibraryItem | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const loadPrompts = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const response = await apiService.getPromptLibrary({
        page: currentPage,
        page_size: 20,
        search: searchQuery || undefined,
        category: filters.category || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        is_favorite: filters.favoritesOnly || undefined,
        is_template: filters.templatesOnly || undefined,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder,
      });
      setLibraryData(response);
    } catch {
      setError('Failed to load prompt library');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentPage, searchQuery, filters]);

  useEffect(() => {
    if (isOpen) {
      loadPrompts();
    }
  }, [isOpen, loadPrompts]);

  const handleToggleFavorite = async (promptId: string) => {
    try {
      const result = await apiService.toggleFavorite(promptId);
      setLibraryData(prev => ({
        ...prev,
        prompts: prev.prompts.map(p => 
          p.id === promptId ? { ...p, is_favorite: result.is_favorite } : p
        ),
      }));
    } catch {
      showToastMessage('Failed to update favorite');
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      await apiService.deletePrompt(promptId);
      setLibraryData(prev => ({
        ...prev,
        prompts: prev.prompts.filter(p => p.id !== promptId),
        total: prev.total - 1,
      }));
      showToastMessage('Prompt deleted successfully');
    } catch {
      showToastMessage('Failed to delete prompt');
    }
  };

  const handleDuplicatePrompt = async (prompt: PromptLibraryItem) => {
    try {
      const duplicatedPrompt = {
        ...prompt,
        name: `${prompt.name} (Copy)`,
        usage_count: 0,
        average_score: undefined,
        last_used_at: undefined,
      };
      await apiService.savePrompt(duplicatedPrompt);
      loadPrompts();
      showToastMessage('Prompt duplicated successfully');
    } catch {
      showToastMessage('Failed to duplicate prompt');
    }
  };

  const handleUsePrompt = async (prompt: PromptLibraryItem) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt.prompt, prompt.id);
      
      // Track usage
      try {
        await apiService.trackPromptUsage(prompt.id, undefined, prompt.model_used);
      } catch {
        // Silent fail - don't interrupt the user flow
      }
      
      onClose();
    }
  };

  const handleExportPrompt = (prompt: PromptLibraryItem) => {
    const data = {
      name: prompt.name,
      prompt: prompt.prompt,
      enhanced_prompt: prompt.enhanced_prompt,
      category: prompt.category,
      tags: prompt.tags,
      domain: prompt.domain,
      model_used: prompt.model_used,
      is_template: prompt.is_template,
      template_variables: prompt.template_variables,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prompt.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'prompt'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToastMessage('Prompt exported successfully');
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleViewVersionHistory = (prompt: PromptLibraryItem) => {
    setVersionHistoryPrompt(prompt);
    setShowVersionHistory(true);
  };

  const handlePromptUpdate = (updatedPrompt: PromptLibraryItem) => {
    setLibraryData(prev => ({
      ...prev,
      prompts: prev.prompts.map(p => 
        p.id === updatedPrompt.id ? updatedPrompt : p
      ),
    }));
    setVersionHistoryPrompt(updatedPrompt);
  };

  // Bulk operation handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
    setSelectedPrompt(null);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === libraryData.prompts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(libraryData.prompts.map(p => p.id)));
    }
  };

  const toggleSelectPrompt = (promptId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(promptId)) {
      newSelected.delete(promptId);
    } else {
      newSelected.add(promptId);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} prompts?`)) return;
    
    setIsBulkOperating(true);
    try {
      const result = await apiService.bulkPromptOperation(
        Array.from(selectedIds),
        'delete'
      );
      
      if ('deleted_count' in result) {
        showToastMessage(result.message);
        loadPrompts();
        setSelectedIds(new Set());
        setIsSelectionMode(false);
      }
    } catch {
      showToastMessage('Failed to delete prompts');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBulkOperating(true);
    try {
      const result = await apiService.bulkPromptOperation(
        Array.from(selectedIds),
        'export'
      );
      
      if ('prompts' in result) {
        const data = {
          prompts: result.prompts.map(p => ({
            name: p.name,
            prompt: p.prompt,
            enhanced_prompt: p.enhanced_prompt,
            category: p.category,
            tags: p.tags,
            domain: p.domain,
            model_used: p.model_used,
            is_template: p.is_template,
            template_variables: p.template_variables,
          })),
          export_date: new Date().toISOString(),
          total_count: result.total_count,
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prompts_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToastMessage(`Exported ${result.total_count} prompts`);
        setIsSelectionMode(false);
        setSelectedIds(new Set());
      }
    } catch {
      showToastMessage('Failed to export prompts');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkToggleFavorite = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBulkOperating(true);
    try {
      const result = await apiService.bulkPromptOperation(
        Array.from(selectedIds),
        'toggle_favorite'
      );
      
      if ('toggled_count' in result) {
        showToastMessage(result.message);
        loadPrompts();
        setSelectedIds(new Set());
        setIsSelectionMode(false);
      }
    } catch {
      showToastMessage('Failed to update favorites');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkUpdateCategory = async (newCategory: string) => {
    if (selectedIds.size === 0) return;
    
    setIsBulkOperating(true);
    try {
      const result = await apiService.bulkPromptOperation(
        Array.from(selectedIds),
        'update_category',
        newCategory
      );
      
      if ('updated_count' in result) {
        showToastMessage(result.message);
        loadPrompts();
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        setShowBulkCategoryModal(false);
      }
    } catch {
      showToastMessage('Failed to update category');
    } finally {
      setIsBulkOperating(false);
    }
  };


  const totalPages = Math.ceil(libraryData.total / libraryData.page_size);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden m-4">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <SparklesIcon className="h-7 w-7 mr-2 text-indigo-600" />
              Prompt Library
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {libraryData.total} prompts saved
              {isSelectionMode && selectedIds.size > 0 && (
                <span className="ml-2 font-medium text-indigo-600">
                  • {selectedIds.size} selected
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isSelectionMode ? (
              <button
                onClick={toggleSelectionMode}
                className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Select
              </button>
            ) : (
              <>
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkExport}
                      disabled={isBulkOperating}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
                      Export
                    </button>
                    <button
                      onClick={() => setShowBulkCategoryModal(true)}
                      disabled={isBulkOperating}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <FolderIcon className="h-4 w-4 inline mr-1" />
                      Categorize
                    </button>
                    <button
                      onClick={handleBulkToggleFavorite}
                      disabled={isBulkOperating}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <StarIcon className="h-4 w-4 inline mr-1" />
                      Favorite
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={isBulkOperating}
                      className="px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4 inline mr-1" />
                      Delete
                    </button>
                  </div>
                )}
                <button
                  onClick={toggleSelectionMode}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search prompts by name, content, or tags..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, favoritesOnly: !filters.favoritesOnly })}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  filters.favoritesOnly 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <StarIcon className="h-4 w-4" />
                <span className="text-sm">Favorites</span>
              </button>
              
              <button
                onClick={() => setFilters({ ...filters, templatesOnly: !filters.templatesOnly })}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  filters.templatesOnly 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span className="text-sm">Templates</span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <ViewColumnsIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sort Options & Select All */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {isSelectionMode && (
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <div className={`w-4 h-4 border rounded ${
                    selectedIds.size === libraryData.prompts.length && libraryData.prompts.length > 0
                      ? 'bg-indigo-600 border-indigo-600' 
                      : selectedIds.size > 0 && selectedIds.size < libraryData.prompts.length
                      ? 'bg-indigo-100 border-indigo-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedIds.size === libraryData.prompts.length && libraryData.prompts.length > 0 ? (
                      <CheckIcon className="h-3 w-3 text-white" />
                    ) : selectedIds.size > 0 && selectedIds.size < libraryData.prompts.length ? (
                      <MinusIcon className="h-3 w-3 text-indigo-600" />
                    ) : null}
                  </div>
                  Select All
                </button>
              )}
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as SortBy })}
                className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
              >
                <option value="created_at">Date Created</option>
                <option value="name">Name</option>
                <option value="usage_count">Most Used</option>
                <option value="average_score">Best Score</option>
                <option value="last_used_at">Recently Used</option>
              </select>
              <button
                onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Content Area */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 320px)' }}>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : libraryData.prompts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <SparklesIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">No prompts found</p>
                <p className="text-sm">Save your prompts to build your personal library</p>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {libraryData.prompts.map((prompt) => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        onToggleFavorite={handleToggleFavorite}
                        onDelete={handleDeletePrompt}
                        onDuplicate={handleDuplicatePrompt}
                        onUse={handleUsePrompt}
                        onExport={handleExportPrompt}
                        onViewHistory={handleViewVersionHistory}
                        isSelected={selectedPrompt === prompt.id}
                        onClick={() => isSelectionMode ? toggleSelectPrompt(prompt.id) : setSelectedPrompt(selectedPrompt === prompt.id ? null : prompt.id)}
                        isSelectionMode={isSelectionMode}
                        isChecked={selectedIds.has(prompt.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {libraryData.prompts.map((prompt) => (
                      <PromptListItem
                        key={prompt.id}
                        prompt={prompt}
                        onToggleFavorite={handleToggleFavorite}
                        onDelete={handleDeletePrompt}
                        onDuplicate={handleDuplicatePrompt}
                        onUse={handleUsePrompt}
                        onExport={handleExportPrompt}
                        onViewHistory={handleViewVersionHistory}
                        isSelected={selectedPrompt === prompt.id}
                        onClick={() => isSelectionMode ? toggleSelectPrompt(prompt.id) : setSelectedPrompt(selectedPrompt === prompt.id ? null : prompt.id)}
                        isSelectionMode={isSelectionMode}
                        isChecked={selectedIds.has(prompt.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Bulk Category Update Modal */}
      {showBulkCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Update Category</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a new category for {selectedIds.size} selected prompts
            </p>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-4"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkUpdateCategory(e.target.value);
                }
              }}
            >
              <option value="" disabled>Choose a category...</option>
              {CATEGORIES.filter(cat => cat.value).map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkCategoryModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Version History Modal */}
      {showVersionHistory && versionHistoryPrompt && (
        <PromptVersionHistory
          isOpen={showVersionHistory}
          onClose={() => {
            setShowVersionHistory(false);
            setVersionHistoryPrompt(null);
          }}
          prompt={versionHistoryPrompt}
          onPromptUpdate={handlePromptUpdate}
        />
      )}
    </div>
  );
};

// Prompt Card Component for Grid View
const PromptCard: React.FC<{
  prompt: PromptLibraryItem;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (prompt: PromptLibraryItem) => void;
  onUse: (prompt: PromptLibraryItem) => void;
  onExport: (prompt: PromptLibraryItem) => void;
  onViewHistory: (prompt: PromptLibraryItem) => void;
  isSelected: boolean;
  onClick: () => void;
  isSelectionMode: boolean;
  isChecked: boolean;
}> = ({ prompt, onToggleFavorite, onDelete, onDuplicate, onUse, onExport, onViewHistory, isSelected, onClick, isSelectionMode, isChecked }) => {
  const getCategoryIcon = (category?: string) => {
    const icons: Record<string, string> = {
      translation: '🌐',
      coding: '💻',
      writing: '✍️',
      analysis: '📊',
      summarization: '📝',
      data_formatting: '📋',
      creative: '🎨',
      educational: '🎓',
      business: '💼',
      other: '📦',
    };
    return icons[category || ''] || '📄';
  };

  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer ${
        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isSelectionMode && (
            <div className={`w-5 h-5 border-2 rounded ${
              isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
            } flex items-center justify-center`}>
              {isChecked && <CheckIcon className="h-3 w-3 text-white" />}
            </div>
          )}
          <span className="text-2xl">{getCategoryIcon(prompt.category)}</span>
          <h3 className="font-semibold text-gray-900 line-clamp-1">
            {prompt.name || 'Untitled Prompt'}
          </h3>
        </div>
        {!isSelectionMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(prompt.id);
            }}
            className="p-1 rounded hover:bg-gray-100"
          >
            {prompt.is_favorite ? (
              <StarIconSolid className="h-5 w-5 text-yellow-500" />
            ) : (
              <StarIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
        {prompt.prompt}
      </p>

      {prompt.tags && prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {prompt.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {tag}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{prompt.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-3">
          {prompt.usage_count > 0 && (
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {prompt.usage_count} uses
            </span>
          )}
          {prompt.average_score !== null && prompt.average_score !== undefined && (
            <span className="flex items-center gap-1">
              <ChartBarIcon className="h-3 w-3" />
              {(prompt.average_score * 100).toFixed(0)}%
            </span>
          )}
          {prompt.version_count > 1 && (
            <span className="flex items-center gap-1">
              v{prompt.current_version}
            </span>
          )}
        </div>
        {prompt.is_template && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
            Template
          </span>
        )}
      </div>

      {isSelected && !isSelectionMode && (
        <div className="flex flex-wrap gap-2 pt-3 border-t">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUse(prompt);
            }}
            className="flex-1 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
          >
            Use
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(prompt);
            }}
            className="p-1 text-gray-600 hover:text-gray-900"
            title="Duplicate"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport(prompt);
            }}
            className="p-1 text-gray-600 hover:text-gray-900"
            title="Export"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
          {prompt.version_count > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory(prompt);
              }}
              className="p-1 text-gray-600 hover:text-gray-900"
              title="Version History"
            >
              <ClockIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(prompt.id);
            }}
            className="p-1 text-red-600 hover:text-red-700"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Prompt List Item Component for List View
const PromptListItem: React.FC<{
  prompt: PromptLibraryItem;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (prompt: PromptLibraryItem) => void;
  onUse: (prompt: PromptLibraryItem) => void;
  onExport: (prompt: PromptLibraryItem) => void;
  onViewHistory: (prompt: PromptLibraryItem) => void;
  isSelected: boolean;
  onClick: () => void;
  isSelectionMode: boolean;
  isChecked: boolean;
}> = ({ prompt, onToggleFavorite, onDelete, onDuplicate, onUse, onExport, onViewHistory, isSelected, onClick, isSelectionMode, isChecked }) => {
  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {isSelectionMode && (
              <div className={`w-5 h-5 border-2 rounded ${
                isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
              } flex items-center justify-center`}>
                {isChecked && <CheckIcon className="h-3 w-3 text-white" />}
              </div>
            )}
            <h3 className="font-semibold text-gray-900">
              {prompt.name || 'Untitled Prompt'}
            </h3>
            {prompt.is_template && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                Template
              </span>
            )}
            {prompt.category && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                {prompt.category}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-1 mb-2">
            {prompt.prompt}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
            {prompt.usage_count > 0 && (
              <span>{prompt.usage_count} uses</span>
            )}
            {prompt.average_score !== null && prompt.average_score !== undefined && (
              <span>Score: {(prompt.average_score * 100).toFixed(0)}%</span>
            )}
            {prompt.version_count > 1 && (
              <span>v{prompt.current_version} ({prompt.version_count} versions)</span>
            )}
            <span>Model: {prompt.model_used}</span>
          </div>
        </div>

        {!isSelectionMode && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(prompt.id);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {prompt.is_favorite ? (
                <StarIconSolid className="h-5 w-5 text-yellow-500" />
              ) : (
                <StarIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {onUse && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUse(prompt);
                }}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Use
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(prompt);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Duplicate"
            >
              <DocumentDuplicateIcon className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport(prompt);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Export"
            >
              <ArrowDownTrayIcon className="h-5 w-5 text-gray-600" />
            </button>
            
            {prompt.version_count > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewHistory(prompt);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Version History"
              >
                <ClockIcon className="h-5 w-5 text-gray-600" />
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(prompt.id);
              }}
              className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {isSelected && prompt.description && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">{prompt.description}</p>
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {prompt.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptLibrary;