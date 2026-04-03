import { ILLMProvider } from '../interfaces';
import { CompletionRequest, CompletionResponse, StreamChunk } from '../types';
import { RetryManager } from './RetryManager';
import { CircuitBreaker } from './CircuitBreaker';

export interface ResilientProviderConfig {
  retry?: Partial<import('./RetryManager').RetryConfig>;
  circuitBreaker?: Partial<import('./CircuitBreaker').CircuitBreakerConfig>;
  fallbackProvider?: ILLMProvider;
}

export class ResilientProvider implements ILLMProvider {
  readonly id: string;
  readonly name: string;

  private provider: ILLMProvider;
  private retryManager: RetryManager;
  private circuitBreaker: CircuitBreaker;
  private fallbackProvider?: ILLMProvider;

  constructor(provider: ILLMProvider, config?: ResilientProviderConfig) {
    this.provider = provider;
    this.id = provider.id;
    this.name = provider.name;
    this.retryManager = new RetryManager(config?.retry);
    this.circuitBreaker = new CircuitBreaker(config?.circuitBreaker);
    this.fallbackProvider = config?.fallbackProvider;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const retryResult = await this.retryManager.execute(
      async () => {
        return await this.circuitBreaker.execute(async () => {
          return await this.provider.complete(request);
        });
      },
      (error) => this.isRetryableError(error)
    );

    if (retryResult.success) {
      return retryResult.result;
    }

    if (this.fallbackProvider) {
      console.log(`Primary provider failed, using fallback: ${this.fallbackProvider.id}`);
      return await this.fallbackProvider.complete(request);
    }

    throw new Error(`All retry attempts failed for provider ${this.id}`);
  }

  async *stream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    try {
      const stream = this.circuitBreaker.execute(async function* () {
        for await (const chunk of this.provider.stream(request)) {
          yield chunk;
        }
      });

      for await (const chunk of await stream) {
        yield chunk;
      }
    } catch (error) {
      if (this.fallbackProvider) {
        console.log(`Primary provider failed, using fallback: ${this.fallbackProvider.id}`);
        for await (const chunk of this.fallbackProvider.stream(request)) {
          yield chunk;
        }
      } else {
        throw error;
      }
    }
  }

  getInfo() {
    return this.provider.getInfo();
  }

  getCapabilities(model: string) {
    return this.provider.getCapabilities(model);
  }

  validateConfig(config: any) {
    return this.provider.validateConfig(config);
  }

  estimateCost(tokens: { input: number; output: number }, model: string) {
    return this.provider.estimateCost(tokens, model);
  }

  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }

  resetCircuitBreaker() {
    this.circuitBreaker.reset();
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = [429, 500, 502, 503, 504];
    const retryableErrorCodes = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNABORTED',
      'ENOTFOUND',
      'EAI_AGAIN',
      'rate_limit_exceeded',
      'internal_error',
      'timeout',
    ];

    if (error.status && retryableCodes.includes(error.status)) {
      return true;
    }

    if (error.code && retryableErrorCodes.includes(error.code)) {
      return true;
    }

    return false;
  }
}
