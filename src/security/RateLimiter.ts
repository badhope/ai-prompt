export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipFailedRequests: boolean;
  skipSuccessfulRequests: boolean;
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private requests: Map<string, number[]> = new Map();

  constructor(config: Partial<RateLimitConfig>) {
    this.config = {
      windowMs: 60000,
      maxRequests: 100,
      skipFailedRequests: false,
      skipSuccessfulRequests: false,
      ...config,
    };
  }

  check(identifier: string): RateLimitResult {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier) 
      : identifier;

    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let requests = this.requests.get(key) || [];
    requests = requests.filter(time => time > windowStart);

    const currentCount = requests.length;
    const remaining = Math.max(0, this.config.maxRequests - currentCount);
    const resetTime = now + this.config.windowMs;

    if (currentCount >= this.config.maxRequests) {
      const oldestRequest = Math.min(...requests);
      const retryAfter = oldestRequest + this.config.windowMs - now;

      return {
        allowed: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(retryAfter / 1000),
      };
    }

    return {
      allowed: true,
      limit: this.config.maxRequests,
      remaining: remaining - 1,
      resetTime,
    };
  }

  record(identifier: string): void {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier) 
      : identifier;

    const now = Date.now();
    const requests = this.requests.get(key) || [];
    requests.push(now);

    const windowStart = now - this.config.windowMs;
    const filtered = requests.filter(time => time > windowStart);
    
    this.requests.set(key, filtered);
  }

  reset(identifier: string): void {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier) 
      : identifier;
    
    this.requests.delete(key);
  }

  resetAll(): void {
    this.requests.clear();
  }

  getStats(identifier: string): {
    current: number;
    limit: number;
    remaining: number;
  } {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier) 
      : identifier;

    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const requests = this.requests.get(key) || [];
    const currentCount = requests.filter(time => time > windowStart).length;

    return {
      current: currentCount,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - currentCount),
    };
  }
}

export class TokenBucketRateLimiter {
  private buckets: Map<string, { tokens: number; lastUpdate: number }> = new Map();
  private maxTokens: number;
  private refillRate: number;

  constructor(maxTokens: number = 100, refillRate: number = 10) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
  }

  check(identifier: string, tokens: number = 1): RateLimitResult {
    const now = Date.now();
    const bucket = this.buckets.get(identifier);

    if (!bucket) {
      this.buckets.set(identifier, {
        tokens: this.maxTokens - tokens,
        lastUpdate: now,
      });

      return {
        allowed: true,
        limit: this.maxTokens,
        remaining: this.maxTokens - tokens,
        resetTime: now + 1000,
      };
    }

    const timePassed = (now - bucket.lastUpdate) / 1000;
    const newTokens = Math.min(
      this.maxTokens,
      bucket.tokens + timePassed * this.refillRate
    );

    if (newTokens >= tokens) {
      this.buckets.set(identifier, {
        tokens: newTokens - tokens,
        lastUpdate: now,
      });

      return {
        allowed: true,
        limit: this.maxTokens,
        remaining: Math.floor(newTokens - tokens),
        resetTime: now + 1000,
      };
    }

    const waitTime = ((tokens - newTokens) / this.refillRate) * 1000;

    return {
      allowed: false,
      limit: this.maxTokens,
      remaining: 0,
      resetTime: now + waitTime,
      retryAfter: Math.ceil(waitTime / 1000),
    };
  }

  reset(identifier: string): void {
    this.buckets.delete(identifier);
  }

  resetAll(): void {
    this.buckets.clear();
  }
}
