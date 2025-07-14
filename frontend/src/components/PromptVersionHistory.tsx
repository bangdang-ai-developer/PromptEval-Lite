import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { PromptVersion, PromptLibraryItem } from '../services/api';
import { 
  XMarkIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import Toast from './Toast';
import DiffView from './DiffView';

interface PromptVersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: PromptLibraryItem;
  onPromptUpdate?: (updatedPrompt: PromptLibraryItem) => void;
}

const PromptVersionHistory: React.FC<PromptVersionHistoryProps> = ({
  isOpen,
  onClose,
  prompt,
  onPromptUpdate,
}) => {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (isOpen && prompt) {
      loadVersions();
    }
  }, [isOpen, prompt]);

  const loadVersions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const versionHistory = await apiService.getPromptVersions(prompt.id);
      setVersions(versionHistory);
    } catch {
      setError('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreVersion = async (version: PromptVersion) => {
    if (!confirm(`Are you sure you want to restore to version ${version.version_number}?`)) {
      return;
    }

    setIsRestoring(true);
    try {
      const restoredPrompt = await apiService.restorePromptVersion(prompt.id, version.version_number);
      showToastMessage(`Restored to version ${version.version_number}`);
      if (onPromptUpdate) {
        onPromptUpdate(restoredPrompt);
      }
      // Reload versions to show the new version created by restore
      await loadVersions();
    } catch {
      showToastMessage('Failed to restore version');
    } finally {
      setIsRestoring(false);
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getVersionLabel = (version: PromptVersion) => {
    if (version.version_number === prompt.current_version) {
      return 'Current Version';
    }
    return `Version ${version.version_number}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden m-4">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <ClockIcon className="h-7 w-7 mr-2 text-indigo-600" />
              Version History
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {prompt.name || 'Untitled Prompt'} • {prompt.version_count} versions
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Version List */}
          <div className="w-1/3 border-r overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="p-4 text-red-600">{error}</div>
            ) : versions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No version history available</p>
              </div>
            ) : (
              <div className="divide-y">
                {/* Current Version */}
                <div
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    !selectedVersion ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                  }`}
                  onClick={() => {
                    setSelectedVersion(null);
                    setShowDiff(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Current Version</span>
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Version {prompt.current_version}
                      </p>
                      {prompt.last_modified_at && (
                        <p className="text-xs text-gray-500">
                          Modified {formatDate(prompt.last_modified_at)}
                        </p>
                      )}
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Version History */}
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedVersion?.id === version.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                    }`}
                    onClick={() => {
                      setSelectedVersion(version);
                      setShowDiff(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {getVersionLabel(version)}
                          </span>
                        </div>
                        {version.change_summary && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {version.change_summary}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(version.created_at)}
                        </p>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Version Details */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedVersion ? (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">
                    Version {selectedVersion.version_number} Details
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{formatDate(selectedVersion.created_at)}</span>
                    {selectedVersion.model_used && (
                      <span>Model: {selectedVersion.model_used}</span>
                    )}
                    {selectedVersion.overall_score !== null && selectedVersion.overall_score !== undefined && (
                      <span>Score: {(selectedVersion.overall_score * 100).toFixed(0)}%</span>
                    )}
                  </div>
                  {selectedVersion.change_summary && (
                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {selectedVersion.change_summary}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => setShowDiff(!showDiff)}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                    {showDiff ? 'Hide Diff' : 'Show Diff'}
                  </button>
                  {selectedVersion.version_number !== prompt.current_version && (
                    <button
                      onClick={() => handleRestoreVersion(selectedVersion)}
                      disabled={isRestoring}
                      className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isRestoring ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <ArrowPathIcon className="h-4 w-4" />
                          Restore This Version
                        </>
                      )}
                    </button>
                  )}
                </div>

                {showDiff ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Prompt Changes</h4>
                      <DiffView
                        expected={selectedVersion.prompt}
                        actual={prompt.prompt}
                      />
                    </div>
                    {selectedVersion.enhanced_prompt && prompt.enhanced_prompt && (
                      <div>
                        <h4 className="font-medium mb-2">Enhanced Prompt Changes</h4>
                        <DiffView
                          expected={selectedVersion.enhanced_prompt}
                          actual={prompt.enhanced_prompt}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Prompt</h4>
                      <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
                        {selectedVersion.prompt}
                      </pre>
                    </div>
                    {selectedVersion.enhanced_prompt && (
                      <div>
                        <h4 className="font-medium mb-2">Enhanced Prompt</h4>
                        <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
                          {selectedVersion.enhanced_prompt}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-4">Current Version</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Version:</span>
                      <span className="ml-2 font-medium">{prompt.current_version}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Versions:</span>
                      <span className="ml-2 font-medium">{prompt.version_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2 font-medium">{formatDate(prompt.created_at)}</span>
                    </div>
                    {prompt.last_modified_at && (
                      <div>
                        <span className="text-gray-600">Last Modified:</span>
                        <span className="ml-2 font-medium">{formatDate(prompt.last_modified_at)}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Current Prompt</h4>
                    <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
                      {prompt.prompt}
                    </pre>
                  </div>
                  {prompt.enhanced_prompt && (
                    <div>
                      <h4 className="font-medium mb-2">Current Enhanced Prompt</h4>
                      <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
                        {prompt.enhanced_prompt}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default PromptVersionHistory;