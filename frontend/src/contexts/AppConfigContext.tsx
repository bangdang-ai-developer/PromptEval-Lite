import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TestResponse, EnhanceResponse, AIModel } from '../types/api';

export interface AppConfig {
  // Prompt data
  prompt: string;
  domain: string;
  example_expected: string;
  
  // Model configuration
  model: AIModel;
  apiKeyOption: 'manual' | 'saved' | 'server';
  selectedSavedKeyId: string;
  manualApiKey: string;
  
  // Additional settings
  lastUpdatedFrom: 'test' | 'enhance' | null;
  hasUnsyncedChanges: boolean;
  
  // Persisted results
  lastTestResults: TestResponse | null;
  lastEnhanceResults: EnhanceResponse | null;
  
  // Form state
  testFormState: {
    num_cases: number;
    score_method: 'exact_match' | 'gpt_judge' | 'hybrid';
  };
  enhanceFormState: {
    auto_retest: boolean;
  };
  
  // Results timestamps
  resultsTimestamp: {
    test?: string;
    enhance?: string;
  };
}

interface AppConfigContextType {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  syncFromTest: (testData: Partial<AppConfig>) => void;
  syncFromEnhance: (enhanceData: Partial<AppConfig>) => void;
  clearConfig: () => void;
  hasConfigData: boolean;
  
  // Results management
  saveTestResults: (results: TestResponse) => void;
  saveEnhanceResults: (results: EnhanceResponse) => void;
  clearTestResults: () => void;
  clearEnhanceResults: () => void;
}

const defaultConfig: AppConfig = {
  prompt: '',
  domain: '',
  example_expected: '',
  model: 'gemini-2.5-flash',
  apiKeyOption: 'server',
  selectedSavedKeyId: '',
  manualApiKey: '',
  lastUpdatedFrom: null,
  hasUnsyncedChanges: false,
  lastTestResults: null,
  lastEnhanceResults: null,
  testFormState: {
    num_cases: 5,
    score_method: 'hybrid',
  },
  enhanceFormState: {
    auto_retest: false,
  },
  resultsTimestamp: {},
};

const AppConfigContext = createContext<AppConfigContextType | null>(null);

const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return context;
};

interface AppConfigProviderProps {
  children: ReactNode;
}

const AppConfigProvider: React.FC<AppConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('prompteval-config');
    if (saved) {
      try {
        return { ...defaultConfig, ...JSON.parse(saved) };
      } catch {
        return defaultConfig;
      }
    }
    return defaultConfig;
  });

  // Save to localStorage whenever config changes (with size limit check)
  useEffect(() => {
    try {
      // Create a copy without large results if storage is getting full
      const configToSave = { ...config };
      const configString = JSON.stringify(configToSave);
      
      // If config is too large (> 4MB), remove results
      if (configString.length > 4 * 1024 * 1024) {
        configToSave.lastTestResults = null;
        configToSave.lastEnhanceResults = null;
      }
      
      localStorage.setItem('prompteval-config', JSON.stringify(configToSave));
    } catch {
      // If storage is full, try saving without results
      console.warn('localStorage full, saving without results');
      const minimalConfig = { ...config, lastTestResults: null, lastEnhanceResults: null };
      localStorage.setItem('prompteval-config', JSON.stringify(minimalConfig));
    }
  }, [config]);

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...updates,
      hasUnsyncedChanges: true,
    }));
  };

  const syncFromTest = (testData: Partial<AppConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...testData,
      lastUpdatedFrom: 'test',
      hasUnsyncedChanges: false,
    }));
  };

  const syncFromEnhance = (enhanceData: Partial<AppConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...enhanceData,
      lastUpdatedFrom: 'enhance',
      hasUnsyncedChanges: false,
    }));
  };

  const clearConfig = () => {
    setConfig(defaultConfig);
    localStorage.removeItem('prompteval-config');
  };
  
  const saveTestResults = (results: TestResponse) => {
    setConfig(prev => ({
      ...prev,
      lastTestResults: results,
      resultsTimestamp: {
        ...prev.resultsTimestamp,
        test: new Date().toISOString(),
      },
    }));
  };
  
  const saveEnhanceResults = (results: EnhanceResponse) => {
    setConfig(prev => ({
      ...prev,
      lastEnhanceResults: results,
      resultsTimestamp: {
        ...prev.resultsTimestamp,
        enhance: new Date().toISOString(),
      },
    }));
  };
  
  const clearTestResults = () => {
    setConfig(prev => ({
      ...prev,
      lastTestResults: null,
      resultsTimestamp: {
        ...prev.resultsTimestamp,
        test: undefined,
      },
    }));
  };
  
  const clearEnhanceResults = () => {
    setConfig(prev => ({
      ...prev,
      lastEnhanceResults: null,
      resultsTimestamp: {
        ...prev.resultsTimestamp,
        enhance: undefined,
      },
    }));
  };

  const hasConfigData = !!(config.prompt || config.domain || config.manualApiKey);

  const value: AppConfigContextType = {
    config,
    updateConfig,
    syncFromTest,
    syncFromEnhance,
    clearConfig,
    hasConfigData,
    saveTestResults,
    saveEnhanceResults,
    clearTestResults,
    clearEnhanceResults,
  };

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { useAppConfig, AppConfigProvider };