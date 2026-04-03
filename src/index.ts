export { PromptManager } from './core/PromptManager';
export { SQLitePromptRepository } from './core/SQLitePromptRepository';
export { TemplateEngine } from './core/TemplateEngine';

export { 
  ClaudeProvider, 
  OpenAIProvider, 
  GeminiProvider, 
  ProviderRegistry,
  globalRegistry,
  initializeProviders 
} from './providers';

export { SecurityLayer, RateLimiter, TokenBucketRateLimiter, RBACManager } from './security';
export type { SecurityConfig, RateLimitConfig, RateLimitResult, User, Role, Permission } from './security';

export { 
  RetryManager, 
  CircuitBreaker, 
  ResilientProvider 
} from './resilience';
export type { 
  RetryConfig, 
  CircuitBreakerConfig, 
  ResilientProviderConfig 
} from './resilience';

export { 
  ExactMatchCache, 
  SemanticCache, 
  MultiLevelCache 
} from './cache';
export type { 
  CacheConfig, 
  SemanticCacheConfig, 
  MultiLevelCacheConfig 
} from './cache';

export { 
  ReActEngine, 
  ReflectionEngine, 
  SelfConsistencyEngine,
  TreeOfThoughtsEngine 
} from './agent';
export type { 
  ReActConfig, 
  ReflectionConfig, 
  SelfConsistencyConfig,
  TreeOfThoughtsConfig,
  TreeOfThoughtsResult,
  Thought
} from './agent';

export { 
  MetricsCollector, 
  TracingSystem, 
  Logger 
} from './observability';
export type { 
  MetricsConfig, 
  TracingConfig, 
  LogConfig 
} from './observability';

export { HealthChecker } from './health';
export type { HealthCheckResult, HealthStatus, ReadinessResult } from './health';

export { CostMonitor } from './monitoring';
export type { CostRecord, CostBudget, CostStats, CostAlert } from './monitoring';

export { APIServer } from './api';
export type { APIServerConfig } from './api';

export * from './types';
export * from './interfaces';

import { PromptManager } from './core/PromptManager';
import { SQLitePromptRepository } from './core/SQLitePromptRepository';
import { TemplateEngine } from './core/TemplateEngine';
import { ProviderRegistry, initializeProviders } from './providers';
import { SecurityLayer, SecurityConfig, RateLimiter, RBACManager } from './security';
import { MultiLevelCache, MultiLevelCacheConfig } from './cache';
import { MetricsCollector } from './observability';
import { TracingSystem } from './observability';
import { Logger } from './observability';
import { HealthChecker } from './health';
import { CostMonitor, CostBudget } from './monitoring';

export interface FrameworkConfig {
  dbPath?: string;
  providers?: {
    claudeApiKey?: string;
    openaiApiKey?: string;
    geminiApiKey?: string;
  };
  security?: Partial<SecurityConfig>;
  cache?: Partial<MultiLevelCacheConfig>;
  budget?: Partial<CostBudget>;
  enableCache?: boolean;
  enableSecurity?: boolean;
  enableObservability?: boolean;
  enableHealthCheck?: boolean;
  enableCostMonitor?: boolean;
  embedFn?: (text: string) => Promise<number[]>;
}

export class PromptFramework {
  private promptManager: PromptManager;
  private templateEngine: TemplateEngine;
  private providerRegistry: ProviderRegistry;
  private securityLayer?: SecurityLayer;
  private rateLimiter?: RateLimiter;
  private rbacManager?: RBACManager;
  private cache?: MultiLevelCache;
  private metrics?: MetricsCollector;
  private tracing?: TracingSystem;
  private logger?: Logger;
  private healthChecker?: HealthChecker;
  private costMonitor?: CostMonitor;

  constructor(config?: FrameworkConfig) {
    const repository = new SQLitePromptRepository(config?.dbPath || ':memory:');
    this.promptManager = new PromptManager(repository);
    this.templateEngine = new TemplateEngine();
    this.providerRegistry = new ProviderRegistry();

    if (config?.providers) {
      initializeProviders(config.providers);
    }

    if (config?.enableSecurity !== false) {
      this.securityLayer = new SecurityLayer(config?.security);
      this.rateLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 100 });
      this.rbacManager = new RBACManager();
    }

    if (config?.enableCache !== false) {
      this.cache = new MultiLevelCache(config?.embedFn, config?.cache);
    }

    if (config?.enableObservability !== false) {
      this.metrics = new MetricsCollector();
      this.tracing = new TracingSystem();
      this.logger = new Logger();
    }

    if (config?.enableHealthCheck !== false) {
      this.healthChecker = new HealthChecker();
    }

    if (config?.enableCostMonitor !== false) {
      this.costMonitor = new CostMonitor(config?.budget);
    }
  }

  get prompts(): PromptManager {
    return this.promptManager;
  }

  get templates(): TemplateEngine {
    return this.templateEngine;
  }

  get providers(): ProviderRegistry {
    return this.providerRegistry;
  }

  get security(): SecurityLayer | undefined {
    return this.securityLayer;
  }

  get rateLimiter(): RateLimiter | undefined {
    return this.rateLimiter;
  }

  get rbac(): RBACManager | undefined {
    return this.rbacManager;
  }

  get cacheLayer(): MultiLevelCache | undefined {
    return this.cache;
  }

  get observability(): {
    metrics: MetricsCollector | undefined;
    tracing: TracingSystem | undefined;
    logger: Logger | undefined;
  } {
    return {
      metrics: this.metrics,
      tracing: this.tracing,
      logger: this.logger,
    };
  }

  get health(): HealthChecker | undefined {
    return this.healthChecker;
  }

  get costs(): CostMonitor | undefined {
    return this.costMonitor;
  }

  async processWithSecurity(input: string): Promise<{
    output: string;
    validation: any;
    piiDetected: boolean;
  }> {
    if (!this.securityLayer) {
      return {
        output: input,
        validation: { valid: true, errors: [], warnings: [] },
        piiDetected: false,
      };
    }

    return this.securityLayer.process(input);
  }

  async getCacheStats(): Promise<any> {
    if (!this.cache) {
      return null;
    }

    return this.cache.getStats();
  }

  getMetrics(): any {
    if (!this.metrics) {
      return null;
    }

    return this.metrics.getAllMetrics();
  }

  getCostStats(): any {
    if (!this.costMonitor) {
      return null;
    }

    return this.costMonitor.getStats();
  }
}

export default PromptFramework;
