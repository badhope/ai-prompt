export interface PromptConfig {
  name: string;
  content: string;
  variables?: Record<string, unknown>;
  tags?: string[];
  version?: string;
}

export interface Prompt extends PromptConfig {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateConfig {
  name: string;
  content: string;
  variables: string[];
}

export interface Template extends TemplateConfig {
  id: string;
  createdAt: Date;
}

export interface ConversationConfig {
  name: string;
  systemPrompt?: string;
}

export interface Conversation extends ConversationConfig {
  id: string;
  messages: Message[];
  createdAt: Date;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AgentConfig {
  name: string;
  type?: string;
  systemPrompt?: string;
  capabilities?: string[];
}

export interface Agent extends AgentConfig {
  id: string;
  createdAt: Date;
}

export interface ExecutionResult {
  id: string;
  promptId: string;
  result: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  duration: number;
  timestamp: Date;
}

export interface ProviderConfig {
  openaiApiKey?: string;
  claudeApiKey?: string;
  geminiApiKey?: string;
}

export interface SecurityConfig {
  enabled?: boolean;
  maxPromptLength?: number;
  allowedModels?: string[];
}

export interface CacheConfig {
  enabled?: boolean;
  ttl?: number;
  maxSize?: number;
}

export interface BudgetConfig {
  enabled?: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
  alertThreshold?: number;
}

export interface FrameworkConfig {
  dbPath?: string;
  providers?: ProviderConfig;
  security?: SecurityConfig;
  cache?: CacheConfig;
  budget?: BudgetConfig;
}

export interface Stats {
  totalPrompts: number;
  totalExecutions: number;
  totalCost: number;
  averageDuration: number;
}

export class FrameworkError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'FrameworkError';
  }
}

export class ValidationError extends FrameworkError {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`, 'VALIDATION_ERROR', { field });
  }
}

export class NotFoundError extends FrameworkError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', { resource, id });
  }
}

export interface BudgetAlert {
  type: 'daily' | 'monthly' | 'threshold';
  currentCost: number;
  limit: number;
  percentage: number;
  timestamp: Date;
}
