import { createHash } from 'crypto';

export interface SemanticCacheConfig {
  similarity_threshold: number;
  ttl: number;
  max_size: number;
}

export interface SemanticCacheEntry<T> {
  embedding: number[];
  value: T;
  prompt: string;
  created_at: number;
  expires_at: number;
  hits: number;
  metadata?: Record<string, any>;
}

export class SemanticCache<T> {
  private cache: Map<string, SemanticCacheEntry<T>> = new Map();
  private config: SemanticCacheConfig;
  private embedFn?: (text: string) => Promise<number[]>;

  constructor(
    embedFn?: (text: string) => Promise<number[]>,
    config?: Partial<SemanticCacheConfig>
  ) {
    this.embedFn = embedFn;
    this.config = {
      similarity_threshold: 0.95,
      ttl: 3600000, // 1 hour
      max_size: 500,
      ...config,
    };
  }

  async get(prompt: string): Promise<T | null> {
    if (!this.embedFn) {
      return null;
    }

    const embedding = await this.embedFn(prompt);

    let bestMatch: SemanticCacheEntry<T> | null = null;
    let bestSimilarity = 0;

    for (const entry of this.cache.values()) {
      if (Date.now() > entry.expires_at) {
        continue;
      }

      const similarity = this.cosineSimilarity(embedding, entry.embedding);

      if (similarity >= this.config.similarity_threshold && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }

    if (bestMatch) {
      bestMatch.hits++;
      return bestMatch.value;
    }

    return null;
  }

  async set(prompt: string, response: T, metadata?: Record<string, any>): Promise<void> {
    if (!this.embedFn) {
      return;
    }

    if (this.cache.size >= this.config.max_size) {
      this.evictLRU();
    }

    const embedding = await this.embedFn(prompt);
    const key = createHash('sha256').update(prompt).digest('hex');

    const entry: SemanticCacheEntry<T> = {
      embedding,
      value: response,
      prompt,
      created_at: Date.now(),
      expires_at: Date.now() + this.config.ttl,
      hits: 0,
      metadata,
    };

    this.cache.set(key, entry);
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
    avg_similarity: number;
  } {
    let total_hits = 0;
    this.cache.forEach(entry => {
      total_hits += entry.hits;
    });

    return {
      size: this.cache.size,
      max_size: this.config.max_size,
      total_hits,
      avg_similarity: this.config.similarity_threshold,
    };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  private evictLRU(): void {
    let lru: SemanticCacheEntry<T> | null = null;
    let lruKey: string | null = null;

    this.cache.forEach((entry, key) => {
      if (!lru || entry.hits < lru.hits) {
        lru = entry;
        lruKey = key;
      }
    });

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
}
