import { useState, useEffect } from 'react';
import TestPrompt from './components/TestPrompt';
import EnhancePrompt from './components/EnhancePrompt';
import FloatingParticles from './components/FloatingParticles';
import { apiService } from './services/api';
import { 
  BeakerIcon, 
  SparklesIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

type ActiveTab = 'test' | 'enhance';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('test');
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    // Check API health on mount
    const checkHealth = async () => {
      try {
        await apiService.getHealth();
        setIsHealthy(true);
      } catch {
        setIsHealthy(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      <FloatingParticles />
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Enhanced Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-white/50">
              <GlobeAltIcon className="h-10 w-10 text-indigo-600" />
            </div>
            <h1 className="text-5xl font-bold text-gradient">
              PromptEval-Lite
            </h1>
          </div>
          <p className="text-gray-700 text-xl max-w-3xl mx-auto leading-relaxed mb-6">
            Zero-storage prompt testing and enhancement microservice. 
            Test your prompts with synthetic cases and enhance them with AI-powered optimization.
          </p>
          
          {/* Enhanced API Status */}
          <div className="flex items-center justify-center space-x-2">
            {isHealthy === null ? (
              <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/50 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-600">Checking API status...</span>
                </div>
              </div>
            ) : isHealthy ? (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 backdrop-blur-sm px-4 py-2 rounded-full border border-emerald-200 shadow-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700">API is online</span>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 backdrop-blur-sm px-4 py-2 rounded-full border border-red-200 shadow-lg">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">API is offline</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Enhanced Navigation Tabs */}
        <nav className="flex justify-center mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-2 flex space-x-2 border border-white/50">
            <button
              onClick={() => setActiveTab('test')}
              className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'test'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <BeakerIcon className="h-6 w-6" />
              <span>Test Prompt</span>
            </button>
            <button
              onClick={() => setActiveTab('enhance')}
              className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'enhance'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <SparklesIcon className="h-6 w-6" />
              <span>Enhance Prompt</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="animate-fade-in">
          {activeTab === 'test' ? <TestPrompt /> : <EnhancePrompt />}
        </main>

        {/* Enhanced Footer */}
        <footer className="text-center mt-20">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 mx-auto max-w-2xl">
            <p className="text-gray-600 mb-2">
              Built with ❤️ using FastAPI, LangChain, and Gemini 1.5 Flash
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <a 
                href="https://github.com/your-repo" 
                className="text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                View on GitHub
              </a>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">Zero-Storage • Real-time • AI-Powered</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;