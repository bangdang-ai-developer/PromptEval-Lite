import { useState } from 'react';
import type { TestResponse } from '../types/api';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowDownTrayIcon, EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { exportToJSON, exportToCSV, exportToMarkdown } from '../utils/exportUtils';
import DiffView from './DiffView';

interface TestResultsProps {
  results: TestResponse;
  onSyncToEnhance?: () => void;
}

const TestResults = ({ results, onSyncToEnhance }: TestResultsProps) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDiffView, setShowDiffView] = useState<{ [key: number]: boolean }>({});
  const scorePercentage = results.overall_score * 100;
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-green-500';
    if (score >= 60) return 'from-amber-500 to-yellow-500';
    return 'from-red-500 to-rose-500';
  };
  
  const toggleDiffView = (index: number) => {
    setShowDiffView(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="card-enhanced animate-slide-up">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gradient">Test Results</h3>
          <div className="flex items-center space-x-4">
            {results.model_used && (
              <div className="metric-card">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Model:</span>
                  <span className="text-sm font-medium text-gray-700">
                    {results.model_used.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <div className="metric-card">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">
                  {results.execution_time.toFixed(2)}s
                </span>
              </div>
            </div>
            
            {/* Sync to Enhance Button */}
            {onSyncToEnhance && (
              <button
                onClick={onSyncToEnhance}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                title="Use this prompt in the Enhance tab"
              >
                <ArrowRightIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Use in Enhance</span>
              </button>
            )}
            
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Export</span>
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => {
                      exportToJSON(results);
                      setShowExportMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => {
                      exportToCSV(results);
                      setShowExportMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => {
                      exportToMarkdown(results);
                      setShowExportMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as Markdown
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overall Score with enhanced styling */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-800">Overall Score</span>
            <span className={`text-4xl font-bold bg-gradient-to-r ${getScoreColor(scorePercentage)} bg-clip-text text-transparent`}>
              {scorePercentage.toFixed(1)}%
            </span>
          </div>
          
          {/* Enhanced progress bar */}
          <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getScoreColor(scorePercentage)} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${scorePercentage}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          
          {/* Metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="metric-card">
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient-success">
                  {results.passed_cases}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient">
                  {results.total_cases}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
            <div className="metric-card">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {results.token_usage.input_tokens + results.token_usage.output_tokens}
                </div>
                <div className="text-sm text-gray-600">Tokens</div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Cases with enhanced design */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Test Case Details</h4>
          {results.test_results.map((result, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-xl ${
                result.score >= 0.8 
                  ? 'success-card border-emerald-200 hover:border-emerald-300' 
                  : result.score >= 0.5 
                  ? 'warning-card border-amber-200 hover:border-amber-300' 
                  : 'error-card border-red-200 hover:border-red-300'
              }`}
            >
              {/* Header with improved styling */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold text-gray-700">
                      Test Case {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {result.score >= 0.8 ? (
                      <CheckCircleIcon className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">Score:</span>
                    <span
                      className={`ml-2 text-lg font-bold ${
                        result.score >= 0.8
                          ? 'text-gradient-success'
                          : result.score >= 0.5
                          ? 'text-gradient-warning'
                          : 'text-gradient-error'
                      }`}
                    >
                      {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  {/* Diff View Toggle */}
                  <button
                    onClick={() => toggleDiffView(index)}
                    className="flex items-center space-x-1 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white/90 transition-colors"
                    title="Toggle diff view"
                  >
                    {showDiffView[index] ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-600" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-600" />
                    )}
                    <span className="text-xs font-medium text-gray-600">
                      {showDiffView[index] ? 'Hide' : 'Show'} Diff
                    </span>
                  </button>
                </div>
              </div>
              
              {/* Content with enhanced layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Input
                    </h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {result.test_case.input}
                    </p>
                  </div>
                  
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Expected
                    </h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {result.test_case.expected}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Actual Output
                    </h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {result.actual_output}
                    </p>
                  </div>
                  
                  {result.reasoning && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                        Reasoning
                      </h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {result.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Diff View */}
              {showDiffView[index] && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h5 className="text-sm font-semibold text-gray-700 mb-4">Output Comparison</h5>
                  <DiffView 
                    expected={result.test_case.expected} 
                    actual={result.actual_output} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestResults;