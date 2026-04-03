import {
  ChainDefinition,
  ChainExecution,
  ChainStepExecution,
  CompletionRequest,
  CompletionResponse,
} from '../types';

export interface IChainOrchestrator {
  execute(
    chain: ChainDefinition,
    input: Record<string, any>,
    config?: ChainExecutionConfig
  ): Promise<ChainExecution>;
  
  pause(executionId: string): Promise<void>;
  resume(executionId: string): Promise<ChainExecution>;
  cancel(executionId: string): Promise<void>;
  
  getStatus(executionId: string): Promise<ChainExecution>;
  getHistory(executionId: string): Promise<ChainStepExecution[]>;
}

export interface ChainExecutionConfig {
  timeout_ms?: number;
  enable_logging?: boolean;
  enable_checkpoints?: boolean;
  max_retries?: number;
  on_step_complete?: (step: ChainStepExecution) => void;
  on_error?: (error: Error, step: ChainStepExecution) => void;
}

export interface IChainBuilder {
  create(name: string): ChainBuilder;
}

export interface ChainBuilder {
  addStep(step: Omit<ChainStep, 'id'>): ChainBuilder;
  addReasoningStep(prompt: string): ChainBuilder;
  addActionStep(tools: string[]): ChainBuilder;
  addCondition(condition: string, steps: ChainStep[]): ChainBuilder;
  
  setTermination(condition: string, maxSteps?: number): ChainBuilder;
  enableReflection(): ChainBuilder;
  enablePersistence(): ChainBuilder;
  
  build(): ChainDefinition;
}

interface ChainStep {
  id: string;
  type: 'reasoning' | 'action' | 'observation' | 'thought' | 'decision';
  prompt_template?: string;
  tools?: string[];
  condition?: string;
  max_retries?: number;
}
