import { describe, it, expect } from 'vitest';
import { validateConfig, applyDefaults, validateAndApplyConfig } from '../src/config';

describe('Config Validation', () => {
  describe('validateConfig', () => {
    it('should return valid for empty config', () => {
      const result = validateConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContain('No configuration provided, using defaults');
    });

    it('should validate provider API keys', () => {
      const result = validateConfig({
        providers: {},
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one provider API key must be provided');
    });

    it('should warn about invalid Claude API key format', () => {
      const result = validateConfig({
        providers: {
          claudeApiKey: 'invalid-key',
        },
      });
      expect(result.warnings).toContain('Claude API key format may be invalid');
    });

    it('should warn about invalid OpenAI API key format', () => {
      const result = validateConfig({
        providers: {
          openaiApiKey: 'invalid-key',
        },
      });
      expect(result.warnings).toContain('OpenAI API key format may be invalid');
    });

    it('should validate maxInputLength', () => {
      const result = validateConfig({
        providers: {
          openaiApiKey: 'sk-test',
        },
        security: {
          maxInputLength: 50,
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxInputLength must be at least 100 characters');
    });

    it('should warn about very large maxInputLength', () => {
      const result = validateConfig({
        providers: {
          openaiApiKey: 'sk-test',
        },
        security: {
          maxInputLength: 200000,
        },
      });
      expect(result.warnings).toContain('maxInputLength is very large, this may impact performance');
    });

    it('should validate semantic cache threshold', () => {
      const result = validateConfig({
        providers: {
          openaiApiKey: 'sk-test',
        },
        cache: {
          semantic: {
            threshold: 1.5,
          },
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Semantic cache threshold must be between 0 and 1');
    });

    it('should validate budget values', () => {
      const result = validateConfig({
        providers: {
          openaiApiKey: 'sk-test',
        },
        budget: {
          daily: -10,
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Daily budget must be greater than 0');
    });

    it('should warn when daily budget > monthly budget', () => {
      const result = validateConfig({
        providers: {
          openaiApiKey: 'sk-test',
        },
        budget: {
          daily: 1000,
          monthly: 500,
        },
      });
      expect(result.warnings).toContain('Daily budget is greater than monthly budget');
    });

    it('should reject database path with ".."', () => {
      const result = validateConfig({
        providers: {
          openaiApiKey: 'sk-test',
        },
        dbPath: '../malicious.db',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Database path cannot contain ".." for security reasons');
    });
  });

  describe('applyDefaults', () => {
    it('should apply all defaults', () => {
      const config = applyDefaults();
      expect(config.dbPath).toBe(':memory:');
      expect(config.enableCache).toBe(true);
      expect(config.enableSecurity).toBe(true);
      expect(config.enableObservability).toBe(true);
      expect(config.security.maxInputLength).toBe(10000);
      expect(config.cache.exact.ttl).toBe(3600);
      expect(config.budget.daily).toBe(100);
    });

    it('should merge with provided config', () => {
      const config = applyDefaults({
        dbPath: 'custom.db',
        security: {
          maxInputLength: 5000,
        },
      });
      expect(config.dbPath).toBe('custom.db');
      expect(config.security.maxInputLength).toBe(5000);
      expect(config.security.enableInjectionDetection).toBe(true);
    });
  });

  describe('validateAndApplyConfig', () => {
    it('should throw on invalid config', () => {
      expect(() => {
        validateAndApplyConfig({
          providers: {},
        });
      }).toThrow('Configuration validation failed');
    });

    it('should return config with defaults on valid config', () => {
      const config = validateAndApplyConfig({
        providers: {
          openaiApiKey: 'sk-test',
        },
      });
      expect(config.dbPath).toBe(':memory:');
      expect(config.enableCache).toBe(true);
    });
  });
});
