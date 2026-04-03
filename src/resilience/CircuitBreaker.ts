export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerConfig {
  failure_threshold: number;
  success_threshold: number;
  timeout: number;
  monitoring_period: number;
}

export interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  last_failure_time: number | null;
  last_state_change: number;
  total_requests: number;
  total_failures: number;
  total_successes: number;
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitState = 'closed';
  private failures: number = 0;
  private successes: number = 0;
  private last_failure_time: number | null = null;
  private last_state_change: number = Date.now();
  private total_requests: number = 0;
  private total_failures: number = 0;
  private total_successes: number = 0;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = {
      failure_threshold: 5,
      success_threshold: 2,
      timeout: 60000,
      monitoring_period: 60000,
      ...config,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('half_open');
      } else {
        throw new Error('Circuit breaker is OPEN - rejecting request');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error: any) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.total_requests++;
    this.total_successes++;
    this.successes++;
    this.failures = 0;

    if (this.state === 'half_open') {
      if (this.successes >= this.config.success_threshold) {
        this.transitionTo('closed');
      }
    }
  }

  private onFailure(): void {
    this.total_requests++;
    this.total_failures++;
    this.failures++;
    this.successes = 0;
    this.last_failure_time = Date.now();

    if (this.state === 'half_open') {
      this.transitionTo('open');
    } else if (this.state === 'closed') {
      if (this.failures >= this.config.failure_threshold) {
        this.transitionTo('open');
      }
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.last_failure_time) {
      return true;
    }

    const timeSinceLastFailure = Date.now() - this.last_failure_time;
    return timeSinceLastFailure >= this.config.timeout;
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.last_state_change = Date.now();

    if (newState === 'closed') {
      this.failures = 0;
      this.successes = 0;
    } else if (newState === 'half_open') {
      this.successes = 0;
    } else if (newState === 'open') {
      // Reset counters when opening
    }

    console.log(`Circuit breaker: ${oldState} → ${newState}`);
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): CircuitStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      last_failure_time: this.last_failure_time,
      last_state_change: this.last_state_change,
      total_requests: this.total_requests,
      total_failures: this.total_failures,
      total_successes: this.total_successes,
    };
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.last_failure_time = null;
    this.last_state_change = Date.now();
  }

  forceOpen(): void {
    this.transitionTo('open');
  }

  forceClose(): void {
    this.transitionTo('closed');
  }
}
