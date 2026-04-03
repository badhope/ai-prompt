import {
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  ProviderInfo,
  ProviderCapabilities,
  ModelConfig,
} from '../types';

export interface ILLMProvider {
  readonly id: string;
  readonly name: string;
  
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  stream(request: CompletionRequest): AsyncIterable<StreamChunk>;
  embed?(text: string | string[]): Promise<number[] | number[][]>;
  
  getInfo(): ProviderInfo;
  getCapabilities(model: string): ProviderCapabilities;
  
  validateConfig(config: ModelConfig): ValidationResult;
  estimateCost(tokens: { input: number; output: number }, model: string): number;
}

export interface IProviderRegistry {
  register(provider: ILLMProvider): void;
  get(id: string): ILLMProvider | null;
  list(): ProviderInfo[];
  getDefault(): ILLMProvider;
  setDefault(id: string): void;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
