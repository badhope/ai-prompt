import { CompletionRequest, CompletionResponse } from '../types';
import { ExactMatchCache } from './ExactMatchCache';
import { SemanticCache } from './SemanticCache';

export interface MultiLevelCacheConfig {
  exact_match?: {
    ttl?: number;
    max_size?: number;
  };
  semantic?: {
    similarity_threshold?: number;
    ttl?: number;
    max_size?: number;
  };
  enable_semantic_cache?: boolean;
}

export interface CacheStats {
  exact_match: {
    size: number;
    max_size: number;
    total_hits: number;
    hit_rate: number;
  };
  semantic: {
    size: number;
    max_size: number;
    total_hits: number;
    hit_rate: number;
  };
  overall: {
    total_requests: number;
    total_hits: number;
    overall_hit_rate: number;
  };
}

export class MultiLevelCache {
  private exactMatchCache: ExactMatchCache<CompletionResponse>;
  private semanticCache?: SemanticCache<CompletionResponse>;
  private totalRequests = 0;
  private exactMatchHits = 0;
  private semanticHits = 0;

  constructor(
    embedFn?: (text: string) => Promise<number[]>,
    config?: MultiLevelCacheConfig
  ) {
    this.exactMatchCache = new ExactMatchCache({
      ttl: config?.exact_match?.ttl || 300000, // 5 minutes
      max_size: config?.exact_match?.max_size || 1000,
    });

    if (config?.enable_semantic_cache !== false && embedFn) {
      this.semanticCache = new SemanticCache(embedFn, {
        similarity_threshold: config?.semantic?.similarity_threshold || 0.95,
        ttl: config?.semantic?.ttl || 3600000, // 1 hour
        max_size: config?.semantic?.max_size || 500,
      });
    }
  }

  async get(request: CompletionRequest): Promise<CompletionResponse | null> {
    this.totalRequests++;

    const exactMatch = this.exactMatchCache.get(request);
    if (exactMatch) {
      this.exactMatchHits++;
      return exactMatch;
    }

    if (this.semanticCache && request.template) {
      const prompt = JSON.stringify(request.template);
      const semanticMatch = await this.semanticCache.get(prompt);
      if (semanticMatch) {
        this.semanticHits++;
        return semanticMatch;
      }
    }

    return null;
  }

  async set(request: CompletionRequest, response: CompletionResponse): Promise<void> {
    this.exactMatchCache.set(request, response, {
      tokens: response.tokens,
      model: response.model,
    });

    if (this.semanticCache && request.template) {
      const prompt = JSON.stringify(request.template);
      await this.semanticCache.set(prompt, response, {
        tokens: response.tokens,
        model: response.model,
      });
    }
  }

  has(request: CompletionRequest): boolean {
    return this.exactMatchCache.has(request);
  }

  delete(request: CompletionRequest): boolean {
    return this.exactMatchCache.delete(request);
  }

  clear(): void {
    this.exactMatchCache.clear();
    this.semanticCache?.clear();
    this.totalRequests = 0;
    this.exactMatchHits = 0;
    this.semanticHits = 0;
  }

  getStats(): CacheStats {
    const exactMatchStats = this.exactMatchCache.stats();
    const semanticStats = this.semanticCache?.stats();

    return {
      exact_match: {
        size: exactMatchStats.size,
        max_size: exactMatchStats.max_size,
        total_hits: this.exactMatchHits,
        hit_rate: this.totalRequests > 0 ? this.exactMatchHits / this.totalRequests : 0,
      },
      semantic: {
        size: semanticStats?.size || 0,
        max_size: semanticStats?.max_size || 0,
        total_hits: this.semanticHits,
        hit_rate: this.totalRequests > 0 ? this.semanticHits / this.totalRequests : 0,
      },
      overall: {
        total_requests: this.totalRequests,
        total_hits: this.exactMatchHits + this.semanticHits,
        overall_hit_rate:
          this.totalRequests > 0
            ? (this.exactMatchHits + this.semanticHits) / this.totalRequests
            : 0,
      },
    };
  }

  getExactMatchCache(): ExactMatchCache<CompletionResponse> {
    return this.exactMatchCache;
  }

  getSemanticCache(): SemanticCache<CompletionResponse> | undefined {
    return this.semanticCache;
  }
}
