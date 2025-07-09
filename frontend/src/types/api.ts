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
}

export interface EnhanceRequest {
  prompt: string;
  domain?: string;
  auto_retest: boolean;
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