import { FrameworkConfig } from '../index';
import { ConfigurationError } from '../errors';

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateConfig(config?: FrameworkConfig): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config) {
    warnings.push('No configuration provided, using defaults');
    return { valid: true, errors, warnings };
  }

  if (config.providers) {
    if (!config.providers.claudeApiKey && 
        !config.providers.openaiApiKey && 
        !config.providers.geminiApiKey) {
      errors.push('At least one provider API key must be provided');
    }

    if (config.providers.claudeApiKey && !config.providers.claudeApiKey.startsWith('sk-ant-')) {
      warnings.push('Claude API key format may be invalid');
    }

    if (config.providers.openaiApiKey && !config.providers.openaiApiKey.startsWith('sk-')) {
      warnings.push('OpenAI API key format may be invalid');
    }
  } else {
    warnings.push('No providers configured');
  }

  if (config.security) {
    if (config.security.maxInputLength && config.security.maxInputLength < 100) {
      errors.push('maxInputLength must be at least 100 characters');
    }

    if (config.security.maxInputLength && config.security.maxInputLength > 100000) {
      warnings.push('maxInputLength is very large, this may impact performance');
    }
  }

  if (config.cache) {
    if (config.cache.exact) {
      if (config.cache.exact.ttl && config.cache.exact.ttl < 60) {
        warnings.push('Exact cache TTL is very short (< 60s), this may reduce cache effectiveness');
      }

      if (config.cache.exact.maxSize && config.cache.exact.maxSize < 10) {
        warnings.push('Exact cache maxSize is very small, this may limit cache usefulness');
      }
    }

    if (config.cache.semantic) {
      if (config.cache.semantic.threshold && (config.cache.semantic.threshold < 0 || config.cache.semantic.threshold > 1)) {
        errors.push('Semantic cache threshold must be between 0 and 1');
      }
    }
  }

  if (config.budget) {
    if (config.budget.daily && config.budget.daily <= 0) {
      errors.push('Daily budget must be greater than 0');
    }

    if (config.budget.monthly && config.budget.monthly <= 0) {
      errors.push('Monthly budget must be greater than 0');
    }

    if (config.budget.daily && config.budget.monthly && config.budget.daily > config.budget.monthly) {
      warnings.push('Daily budget is greater than monthly budget');
    }
  }

  if (config.dbPath) {
    if (config.dbPath.includes('..')) {
      errors.push('Database path cannot contain ".." for security reasons');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function applyDefaults(config?: FrameworkConfig): Required<FrameworkConfig> {
  return {
    dbPath: config?.dbPath || ':memory:',
    providers: config?.providers || {},
    security: {
      enableInjectionDetection: true,
      enablePIIFilter: true,
      maxInputLength: 10000,
      ...config?.security,
    },
    cache: {
      exact: {
        ttl: 3600,
        maxSize: 1000,
        ...config?.cache?.exact,
      },
      semantic: {
        ttl: 7200,
        threshold: 0.95,
        maxSize: 500,
        ...config?.cache?.semantic,
      },
      ...config?.cache,
    },
    budget: {
      daily: 100,
      monthly: 1000,
      ...config?.budget,
    },
    enableCache: config?.enableCache ?? true,
    enableSecurity: config?.enableSecurity ?? true,
    enableObservability: config?.enableObservability ?? true,
    enableHealthCheck: config?.enableHealthCheck ?? true,
    enableCostMonitor: config?.enableCostMonitor ?? true,
    embedFn: config?.embedFn,
  };
}

export function validateAndApplyConfig(config?: FrameworkConfig): Required<FrameworkConfig> {
  const validation = validateConfig(config);

  if (!validation.valid) {
    throw new ConfigurationError(
      `Configuration validation failed: ${validation.errors.join(', ')}`,
      { errors: validation.errors, warnings: validation.warnings }
    );
  }

  if (validation.warnings.length > 0) {
    console.warn('Configuration warnings:', validation.warnings);
  }

  return applyDefaults(config);
}
