import { createHash } from 'crypto';

export interface CacheEntry<T> {
  key: string;
  value: T;
  created_at: number;
  expires_at: number;
  hits: number;
  metadata?: Record<string, any>;
}

export interface CacheConfig {
  ttl: number;
  max_size: number;
}

export class ExactMatchCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      ttl: 300000, // 5 minutes
      max_size: 1000,
      ...config,
    };
  }

  get(request: any): T | null {
    const key = this.generateKey(request);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expires_at) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.value;
  }

  set(request: any, response: T, metadata?: Record<string, any>): void {
    const key = this.generateKey(request);

    if (this.cache.size >= this.config.max_size) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      key,
      value: response,
      created_at: Date.now(),
      expires_at: Date.now() + this.config.ttl,
      hits: 0,
      metadata,
    };

    this.cache.set(key, entry);
  }

  has(request: any): boolean {
    const key = this.generateKey(request);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expires_at) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(request: any): boolean {
    const key = this.generateKey(request);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  stats(): {
    size: number;
    max_size: number;
    total_hits: number;
    avg_hits: number;
  } {
    let total_hits = 0;
    this.cache.forEach(entry => {
      total_hits += entry.hits;
    });

    return {
      size: this.cache.size,
      max_size: this.config.max_size,
      total_hits,
      avg_hits: this.cache.size > 0 ? total_hits / this.cache.size : 0,
    };
  }

  private generateKey(request: any): string {
    const normalized = JSON.stringify(request, Object.keys(request).sort());
    return createHash('sha256').update(normalized).digest('hex');
  }

  private evictOldest(): void {
    let oldest: CacheEntry<T> | null = null;
    let oldestKey: string | null = null;

    this.cache.forEach((entry, key) => {
      if (!oldest || entry.created_at < oldest.created_at) {
        oldest = entry;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
