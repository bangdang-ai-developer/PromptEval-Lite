// Model type definition
export type AIModel = 
  // Google Gemini models
  'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.0-flash' |
  // OpenAI models
  'gpt-4.1' | 'gpt-4.1-mini' | 'gpt-4.1-nano' | 
  'gpt-4o' | 'gpt-4o-mini' | 'o3' | 'o4-mini' |
  // Anthropic Claude models
  'claude-opus-4' | 'claude-sonnet-4' | 'claude-3.5-sonnet' | 
  'claude-3-opus' | 'claude-3-sonnet';

export interface TestCase {
  input: string;
  expected: string;
}

export interface TestResult {
  test_case: TestCase;
  actual_output: string;
  score: number;
  reasoning?: string;
}

export interface TestRequest {
  prompt: string;
  domain?: string;
  num_cases: number;
  score_method: 'exact_match' | 'gpt_judge' | 'hybrid';
  example_expected?: string;
  model?: AIModel;
  api_key?: string;
}

export interface TestResponse {
  request_id: string;
  prompt: string;
  test_results: TestResult[];
  overall_score: number;
  total_cases: number;
  passed_cases: number;
  execution_time: number;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
  };
  model_used?: string;
}

export interface EnhanceRequest {
  prompt: string;
  domain?: string;
  auto_retest: boolean;
  model?: AIModel;
  api_key?: string;
}

export interface EnhanceResponse {
  request_id: string;
  original_prompt: string;
  enhanced_prompt: string;
  improvements: string[];
  execution_time: number;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
  };
  test_results?: TestResponse;
}

export interface ErrorResponse {
  error: string;
  message: string;
  request_id?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}