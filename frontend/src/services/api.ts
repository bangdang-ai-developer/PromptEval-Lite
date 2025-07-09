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

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
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

export const apiService = {
  async testPrompt(request: TestRequest): Promise<TestResponse> {
    return fetchApi<TestResponse>('/test', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async enhancePrompt(request: EnhanceRequest): Promise<EnhanceResponse> {
    return fetchApi<EnhanceResponse>('/enhance', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async getHealth(): Promise<HealthResponse> {
    return fetchApi<HealthResponse>('/health');
  },
};

