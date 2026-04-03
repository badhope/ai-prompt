import { ILLMProvider, IProviderRegistry } from '../interfaces';
import { ProviderInfo } from '../types';

export class ProviderRegistry implements IProviderRegistry {
  private providers: Map<string, ILLMProvider> = new Map();
  private defaultProviderId: string = '';

  register(provider: ILLMProvider): void {
    this.providers.set(provider.id, provider);
    
    if (this.providers.size === 1) {
      this.defaultProviderId = provider.id;
    }
  }

  get(id: string): ILLMProvider | null {
    return this.providers.get(id) || null;
  }

  list(): ProviderInfo[] {
    return Array.from(this.providers.values()).map(p => p.getInfo());
  }

  getDefault(): ILLMProvider {
    const provider = this.providers.get(this.defaultProviderId);
    if (!provider) {
      throw new Error('No default provider set');
    }
    return provider;
  }

  setDefault(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(`Provider not found: ${id}`);
    }
    this.defaultProviderId = id;
  }
}

export const globalRegistry = new ProviderRegistry();

export function initializeProviders(config?: {
  claudeApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
}): void {
  if (config?.claudeApiKey || process.env.ANTHROPIC_API_KEY) {
    const { ClaudeProvider } = require('./ClaudeProvider');
    globalRegistry.register(new ClaudeProvider(config?.claudeApiKey));
  }

  if (config?.openaiApiKey || process.env.OPENAI_API_KEY) {
    const { OpenAIProvider } = require('./OpenAIProvider');
    globalRegistry.register(new OpenAIProvider(config?.openaiApiKey));
  }

  if (config?.geminiApiKey || process.env.GOOGLE_AI_KEY) {
    const { GeminiProvider } = require('./GeminiProvider');
    globalRegistry.register(new GeminiProvider(config?.geminiApiKey));
  }
}

export { ClaudeProvider } from './ClaudeProvider';
export { OpenAIProvider } from './OpenAIProvider';
export { GeminiProvider } from './GeminiProvider';
