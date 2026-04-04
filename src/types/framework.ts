export interface PromptConfig {
  name: string;
  content: string;
  variables?: Record<string, any>;
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

export interface FrameworkConfig {
  dbPath?: string;
  providers?: ProviderConfig;
  security?: any;
  cache?: any;
  budget?: any;
}

export interface Stats {
  totalPrompts: number;
  totalExecutions: number;
  totalCost: number;
  averageDuration: number;
}
