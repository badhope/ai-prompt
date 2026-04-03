import {
  PromptTest,
  PromptTestSuite,
  TestResult,
  Prompt,
  CompletionResponse,
} from '../types';

export interface IEvaluator {
  evaluate(
    prompt: Prompt,
    tests: PromptTest[]
  ): Promise<EvaluationResult>;
  
  compare(
    promptA: Prompt,
    promptB: Prompt,
    tests: PromptTest[]
  ): Promise<ComparisonResult>;
  
  benchmark(
    prompt: Prompt,
    iterations: number
  ): Promise<BenchmarkResult>;
}

export interface EvaluationResult {
  prompt_id: string;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  
  results: TestResult[];
  
  metrics: {
    accuracy: number;
    avg_latency_ms: number;
    avg_tokens: number;
    total_cost: number;
  };
  
  summary: string;
}

export interface ComparisonResult {
  prompt_a: EvaluationResult;
  prompt_b: EvaluationResult;
  
  winner: 'a' | 'b' | 'tie';
  confidence: number;
  
  analysis: {
    accuracy_diff: number;
    latency_diff: number;
    cost_diff: number;
  };
}

export interface BenchmarkResult {
  prompt_id: string;
  iterations: number;
  
  metrics: {
    min_latency_ms: number;
    max_latency_ms: number;
    avg_latency_ms: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    
    min_tokens: number;
    max_tokens: number;
    avg_tokens: number;
    
    total_cost: number;
    avg_cost: number;
    
    success_rate: number;
    error_rate: number;
  };
  
  errors: Array<{
    iteration: number;
    error: string;
  }>;
}

export interface ITestRunner {
  run(test: PromptTest, prompt: Prompt): Promise<TestResult>;
  runSuite(suite: PromptTestSuite, prompt: Prompt): Promise<TestResult[]>;
  
  runParallel(tests: PromptTest[], prompt: Prompt): Promise<TestResult[]>;
}

export interface IValidator {
  id: string;
  name: string;
  description: string;
  
  validate(
    output: string,
    expected: any,
    context?: ValidationContext
  ): Promise<ValidationResult>;
}

export interface ValidationContext {
  prompt?: Prompt;
  test?: PromptTest;
  response?: CompletionResponse;
}

export interface ValidationResult {
  valid: boolean;
  score?: number;
  errors: string[];
  warnings?: string[];
  details?: Record<string, any>;
}
