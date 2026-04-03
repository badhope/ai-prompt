export interface RetryConfig {
  max_retries: number;
  base_delay: number;
  max_delay: number;
  multiplier: number;
  jitter: boolean;
  retry_on: string[];
  timeout: number;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  total_delay: number;
  success: boolean;
}

export class RetryManager {
  private config: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.config = {
      max_retries: 3,
      base_delay: 1000,
      max_delay: 60000,
      multiplier: 2,
      jitter: true,
      retry_on: ['rate_limit', 'server_error', 'timeout', 'network_error'],
      timeout: 30000,
      ...config,
    };
  }

  async execute<T>(
    operation: () => Promise<T>,
    isRetryable?: (error: any) => boolean
  ): Promise<RetryResult<T>> {
    let lastError: any;
    let attempts = 0;
    let total_delay = 0;

    for (let i = 0; i <= this.config.max_retries; i++) {
      attempts++;

      try {
        const result = await this.withTimeout(operation(), this.config.timeout);
        
        return {
          result,
          attempts,
          total_delay,
          success: true,
        };
      } catch (error: any) {
        lastError = error;

        if (i === this.config.max_retries) {
          break;
        }

        if (!this.shouldRetry(error, isRetryable)) {
          break;
        }

        const delay = this.calculateDelay(i);
        total_delay += delay;

        await this.sleep(delay);
      }
    }

    return {
      result: null as T,
      attempts,
      total_delay,
      success: false,
    };
  }

  private shouldRetry(error: any, customCheck?: (error: any) => boolean): boolean {
    if (customCheck) {
      return customCheck(error);
    }

    const errorType = this.classifyError(error);
    return this.config.retry_on.includes(errorType);
  }

  private classifyError(error: any): string {
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      return 'rate_limit';
    }

    if (error.status >= 500 || error.code === 'internal_error') {
      return 'server_error';
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return 'timeout';
    }

    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      return 'network_error';
    }

    return 'unknown';
  }

  private calculateDelay(attempt: number): number {
    let delay = this.config.base_delay * Math.pow(this.config.multiplier, attempt);
    
    delay = Math.min(delay, this.config.max_delay);

    if (this.config.jitter) {
      const jitterRange = delay * 0.3;
      delay = delay + (Math.random() * jitterRange * 2 - jitterRange);
    }

    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), timeout);
      }),
    ]);
  }
}
