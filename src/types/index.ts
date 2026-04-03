import { z } from 'zod';

export type PromptCategory = 
  | 'coding'
  | 'writing'
  | 'analysis'
  | 'creative'
  | 'business'
  | 'education'
  | 'research'
  | 'automation';

export type PromptPriority = 'low' | 'medium' | 'high' | 'critical';

export interface VariableDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: any;
  description?: string;
  validation?: z.ZodSchema;
}

export interface Example {
  input: Record<string, any>;
  output: string;
  description?: string;
}

export interface TemplateSection {
  id: string;
  type: 'static' | 'dynamic' | 'variable' | 'few_shot';
  content?: string;
  source?: string;
  min_examples?: number;
  max_examples?: number;
  order: number;
}

export interface TemplateDefinition {
  metadata: {
    id: string;
    version: string;
    author: string;
    tags: string[];
    description: string;
  };
  sections: TemplateSection[];
  output_format?: {
    type: 'text' | 'markdown' | 'json' | 'structured';
    schema?: Record<string, any>;
  };
}

export interface ModelConfig {
  provider: 'claude' | 'openai' | 'gemini' | 'local' | string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface PromptMetrics {
  accuracy?: number;
  latency_p50?: number;
  latency_p95?: number;
  latency_p99?: number;
  token_usage?: number;
  cost_per_1k?: number;
  success_rate?: number;
  total_executions?: number;
}

export interface Prompt {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  priority: PromptPriority;
  
  template: TemplateDefinition;
  variables: VariableDefinition[];
  examples: Example[];
  
  version: string;
  author: string;
  created_at: Date;
  updated_at: Date;
  tags: string[];
  
  model_config: ModelConfig;
  
  metrics: PromptMetrics;
  
  dependencies?: string[];
  variants?: string[];
  parent_version?: string;
  
  is_active: boolean;
  is_template: boolean;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version: string;
  changes: string;
  created_at: Date;
  author: string;
  prompt: Prompt;
}

export interface CompletionRequest {
  prompt_id?: string;
  template?: TemplateDefinition;
  variables: Record<string, any>;
  context?: string[];
  examples?: Example[];
  model_config?: Partial<ModelConfig>;
  stream?: boolean;
  metadata?: Record<string, any>;
}

export interface CompletionResponse {
  id: string;
  content: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
  provider: string;
  finish_reason: string;
  latency_ms: number;
  metadata?: Record<string, any>;
}

export interface StreamChunk {
  id: string;
  content: string;
  delta: string;
  tokens?: number;
  finish_reason?: string;
}

export interface ExecutionTrace {
  id: string;
  prompt_id: string;
  version: string;
  
  input: {
    variables: Record<string, any>;
    context: string[];
  };
  
  output: {
    content: string;
    tokens: number;
    finish_reason: string;
  };
  
  timing: {
    started_at: Date;
    completed_at: Date;
    duration_ms: number;
    first_token_ms?: number;
  };
  
  chain?: {
    step: number;
    total_steps: number;
    parent_trace_id?: string;
  };
  
  debug: {
    model_used: string;
    provider: string;
    retry_count: number;
    cache_hit: boolean;
  };
  
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface TestResult {
  test_id: string;
  passed: boolean;
  output?: string;
  expected?: string;
  error?: string;
  duration_ms: number;
}

export interface PromptTest {
  id: string;
  prompt_id: string;
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'performance' | 'ab';
  
  input: Record<string, any>;
  expected_output?: string | RegExp | Record<string, any>;
  validators?: string[];
  
  config?: {
    timeout_ms?: number;
    retry_count?: number;
    compare_mode?: 'exact' | 'semantic' | 'regex' | 'schema';
  };
}

export interface PromptTestSuite {
  id: string;
  name: string;
  prompt_id: string;
  tests: PromptTest[];
  config: {
    parallel: boolean;
    stop_on_failure: boolean;
    timeout_ms: number;
  };
}

export type ChainStepType = 'reasoning' | 'action' | 'observation' | 'thought' | 'decision';

export interface ChainStep {
  id: string;
  type: ChainStepType;
  prompt_template?: string;
  tools?: string[];
  condition?: string;
  max_retries?: number;
}

export interface ChainDefinition {
  id: string;
  name: string;
  description: string;
  type: 'sequential' | 'cot' | 'react' | 'custom';
  
  steps: ChainStep[];
  
  config: {
    max_iterations?: number;
    timeout_ms?: number;
    enable_reflection?: boolean;
    persistence?: boolean;
  };
  
  termination?: {
    condition: string;
    max_steps?: number;
  };
}

export interface ChainExecution {
  id: string;
  chain_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  
  current_step: number;
  total_steps: number;
  
  steps: ChainStepExecution[];
  
  started_at: Date;
  completed_at?: Date;
  
  result?: any;
  error?: string;
}

export interface ChainStepExecution {
  step_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  
  input: any;
  output?: any;
  
  started_at: Date;
  completed_at?: Date;
  duration_ms?: number;
  
  retry_count: number;
  error?: string;
}

export interface ProviderCapabilities {
  max_tokens: number;
  supports_vision: boolean;
  supports_tools: boolean;
  supports_streaming: boolean;
  supports_system_prompt: boolean;
  supports_temperature: boolean;
  supports_top_p: boolean;
  supports_top_k: boolean;
}

export interface ProviderModel {
  id: string;
  name: string;
  capabilities: ProviderCapabilities;
  pricing: {
    input_per_1k: number;
    output_per_1k: number;
  };
}

export interface ProviderInfo {
  id: string;
  name: string;
  models: ProviderModel[];
  default_model: string;
}
