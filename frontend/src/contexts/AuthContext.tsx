import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'prompteval_token';

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    apiService.clearAuthToken();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch {
      // Token might be invalid
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
      apiService.setAuthToken(savedToken);
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [checkAuth]);

  const login = async (usernameOrEmail: string, password: string) => {
    const response = await apiService.login(usernameOrEmail, password);
    const { access_token } = response;
    
    // Save token
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    apiService.setAuthToken(access_token);
    
    // Get user info
    await checkAuth();
  };

  const register = async (email: string, username: string, password: string) => {
    const response = await apiService.register(email, username, password);
    const { access_token } = response;
    
    // Save token
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    apiService.setAuthToken(access_token);
    
    // Get user info
    await checkAuth();
  };


  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export { useAuth, AuthProvider };