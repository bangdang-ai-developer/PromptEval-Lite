import type {
  TestRequest,
  TestResponse,
  EnhanceRequest,
  EnhanceResponse,
  ErrorResponse,
  HealthResponse,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiError extends Error {
  public status: number;
  public response: ErrorResponse;
  
  constructor(status: number, response: ErrorResponse) {
    super(response.message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

// Types for auth endpoints
export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
}

export interface SaveAPIKeyRequest {
  provider: 'gemini' | 'openai' | 'claude';
  api_key: string;
  key_name: string;
}

export interface APIKeyResponse {
  id: string;
  provider: string;
  key_name: string;
  created_at: string;
}

export interface PromptHistoryResponse {
  id: string;
  prompt: string;
  enhanced_prompt?: string;
  domain?: string;
  model_used: string;
  overall_score?: number;
  is_favorite: boolean;
  created_at: string;
  execution_time?: number;
}

export interface PromptHistoryDetail extends PromptHistoryResponse {
  test_results?: TestResponse;
  improvements?: string[];
  token_usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

class ApiService {
  private authToken: string | null = null;

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorResponse: ErrorResponse;
      try {
        errorResponse = await response.json();
      } catch {
        errorResponse = {
          error: 'Unknown error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      throw new ApiError(response.status, errorResponse);
    }

    return response.json();
  }

  // Original endpoints
  async testPrompt(request: TestRequest): Promise<TestResponse> {
    return this.fetchApi<TestResponse>('/test', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async enhancePrompt(request: EnhanceRequest): Promise<EnhanceResponse> {
    return this.fetchApi<EnhanceResponse>('/enhance', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getHealth(): Promise<HealthResponse> {
    return this.fetchApi<HealthResponse>('/health');
  }

  // Auth endpoints
  async register(email: string, username: string, password: string): Promise<TokenResponse> {
    return this.fetchApi<TokenResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
  }

  async login(usernameOrEmail: string, password: string): Promise<TokenResponse> {
    return this.fetchApi<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
    });
  }

  async getCurrentUser(): Promise<UserResponse> {
    return this.fetchApi<UserResponse>('/api/auth/me');
  }

  // User API endpoints
  async getAPIKeys(): Promise<APIKeyResponse[]> {
    return this.fetchApi<APIKeyResponse[]>('/api/user/api-keys');
  }

  async saveAPIKey(request: SaveAPIKeyRequest): Promise<APIKeyResponse> {
    return this.fetchApi<APIKeyResponse>('/api/user/api-keys', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async deleteAPIKey(keyId: string): Promise<void> {
    await this.fetchApi(`/api/user/api-keys/${keyId}`, {
      method: 'DELETE',
    });
  }

  async getPromptHistory(params?: {
    skip?: number;
    limit?: number;
    favorites_only?: boolean;
    model?: string;
  }): Promise<PromptHistoryResponse[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.favorites_only) queryParams.append('favorites_only', 'true');
    if (params?.model) queryParams.append('model', params.model);

    const query = queryParams.toString();
    return this.fetchApi<PromptHistoryResponse[]>(`/api/user/history${query ? `?${query}` : ''}`);
  }

  async getPromptHistoryDetail(historyId: string): Promise<PromptHistoryDetail> {
    return this.fetchApi<PromptHistoryDetail>(`/api/user/history/${historyId}`);
  }

  async toggleFavorite(historyId: string): Promise<{ is_favorite: boolean }> {
    return this.fetchApi<{ is_favorite: boolean }>(`/api/user/history/${historyId}/favorite`, {
      method: 'PUT',
    });
  }

  async deleteHistoryItem(historyId: string): Promise<void> {
    await this.fetchApi(`/api/user/history/${historyId}`, {
      method: 'DELETE',
    });
  }

  // Enhanced Prompt Management APIs
  async savePrompt(data: {
    prompt: string;
    name: string;
    description?: string;
    category?: string;
    tags?: string[];
    domain?: string;
    enhanced_prompt?: string;
    model_used: string;
    test_results?: any;
    overall_score?: number;
    improvements?: string[];
    execution_time?: number;
    token_usage?: any;
    is_template?: boolean;
    template_variables?: string[];
  }): Promise<PromptLibraryItem> {
    return this.fetchApi<PromptLibraryItem>('/api/prompts/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPromptLibrary(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    tags?: string[];
    is_template?: boolean;
    is_favorite?: boolean;
    sort_by?: string;
    sort_order?: string;
  }): Promise<PromptLibraryResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }
    return this.fetchApi<PromptLibraryResponse>(`/api/prompts/library?${queryParams}`);
  }

  async getPrompt(promptId: string): Promise<PromptLibraryItem> {
    return this.fetchApi<PromptLibraryItem>(`/api/prompts/${promptId}`);
  }

  async updatePrompt(promptId: string, data: {
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
    is_template?: boolean;
    template_variables?: string[];
    is_public?: boolean;
  }, createVersion: boolean = true, changeSummary?: string): Promise<PromptLibraryItem> {
    const params = new URLSearchParams();
    params.append('create_version', String(createVersion));
    if (changeSummary) {
      params.append('change_summary', changeSummary);
    }
    return this.fetchApi<PromptLibraryItem>(`/api/prompts/${promptId}?${params}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePrompt(promptId: string): Promise<void> {
    await this.fetchApi(`/api/prompts/${promptId}`, {
      method: 'DELETE',
    });
  }

  async trackPromptUsage(promptId: string, test_score?: number, model_used?: string): Promise<{
    prompt_id: string;
    usage_count: number;
    average_score: number;
    message: string;
  }> {
    return this.fetchApi(`/api/prompts/${promptId}/use`, {
      method: 'POST',
      body: JSON.stringify({ test_score, model_used }),
    });
  }

  async getPublicTemplates(params?: {
    category?: string;
    search?: string;
  }): Promise<PromptLibraryItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    return this.fetchApi<PromptLibraryItem[]>(`/api/prompts/templates/public?${queryParams}`);
  }

  async getPromptCategories(): Promise<string[]> {
    return this.fetchApi<string[]>('/api/prompts/categories');
  }

  async generatePromptName(prompt: string): Promise<{ name: string }> {
    return this.fetchApi<{ name: string }>('/api/prompts/generate-name', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  async bulkPromptOperation(
    promptIds: string[],
    operation: 'delete' | 'export' | 'update_category' | 'toggle_favorite',
    category?: string
  ): Promise<BulkOperationResponse | BulkExportResponse> {
    return this.fetchApi<BulkOperationResponse | BulkExportResponse>('/api/prompts/bulk', {
      method: 'POST',
      body: JSON.stringify({
        prompt_ids: promptIds,
        operation,
        category,
      }),
    });
  }

  async getPromptVersions(promptId: string): Promise<PromptVersion[]> {
    return this.fetchApi<PromptVersion[]>(`/api/prompts/${promptId}/versions`);
  }

  async getPromptVersion(promptId: string, versionNumber: number): Promise<PromptVersion> {
    return this.fetchApi<PromptVersion>(`/api/prompts/${promptId}/versions/${versionNumber}`);
  }

  async restorePromptVersion(promptId: string, versionNumber: number): Promise<PromptLibraryItem> {
    return this.fetchApi<PromptLibraryItem>(`/api/prompts/${promptId}/versions/${versionNumber}/restore`, {
      method: 'POST',
    });
  }
}

export interface PromptLibraryItem {
  id: string;
  user_id: string;
  prompt: string;
  enhanced_prompt?: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  domain?: string;
  model_used: string;
  overall_score?: number;
  is_favorite: boolean;
  is_template: boolean;
  template_variables?: string[];
  usage_count: number;
  average_score?: number;
  last_used_at?: string;
  is_public: boolean;
  created_at: string;
  execution_time?: number;
  test_results?: any;
  improvements?: string[];
  token_usage?: any;
  // Version information
  current_version: number;
  version_count: number;
  last_modified_at?: string;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  prompt: string;
  enhanced_prompt?: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  domain?: string;
  model_used: string;
  test_results?: any;
  overall_score?: number;
  improvements?: string[];
  execution_time?: number;
  token_usage?: any;
  is_template: boolean;
  template_variables?: string[];
  change_summary?: string;
  created_at: string;
}

export interface PromptLibraryResponse {
  prompts: PromptLibraryItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface BulkOperationResponse {
  message: string;
  deleted_count?: number;
  updated_count?: number;
  toggled_count?: number;
  new_category?: string;
}

export interface BulkExportResponse {
  prompts: PromptLibraryItem[];
  export_format: string;
  total_count: number;
}

export const apiService = new ApiService();