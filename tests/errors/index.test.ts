import { describe, it, expect } from 'vitest';
import { 
  FrameworkError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  ProviderError,
  NetworkError,
  TimeoutError,
  ConfigurationError,
  SecurityViolationError,
  BudgetExceededError,
  ErrorCode,
  isFrameworkError,
  toFrameworkError,
} from '../src/errors';

describe('Errors', () => {
  describe('FrameworkError', () => {
    it('should create error with all properties', () => {
      const error = new FrameworkError(
        'Test error',
        ErrorCode.VALIDATION_ERROR,
        400,
        { field: 'name' },
        'req-123'
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'name' });
      expect(error.requestId).toBe('req-123');
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.name).toBe('FrameworkError');
    });

    it('should convert to JSON', () => {
      const error = new FrameworkError(
        'Test error',
        ErrorCode.VALIDATION_ERROR,
        400,
        { field: 'name' },
        'req-123'
      );

      const json = error.toJSON();
      expect(json.message).toBe('Test error');
      expect(json.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(json.statusCode).toBe(400);
      expect(json.details).toEqual({ field: 'name' });
      expect(json.requestId).toBe('req-123');
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('Prompt');
      expect(error.message).toBe('Prompt not found');
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error', () => {
      const error = new UnauthorizedError();
      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should create unauthorized error with custom message', () => {
      const error = new UnauthorizedError('Invalid token');
      expect(error.message).toBe('Invalid token');
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error', () => {
      const error = new ForbiddenError();
      expect(error.message).toBe('Forbidden');
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error', () => {
      const error = new RateLimitError(60);
      expect(error.message).toBe('Rate limit exceeded. Retry after 60 seconds');
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(60);
      expect(error.details?.retryAfter).toBe(60);
      expect(error.name).toBe('RateLimitError');
    });
  });

  describe('ProviderError', () => {
    it('should create provider error', () => {
      const error = new ProviderError('API failed', 'openai', { status: 500 });
      expect(error.message).toBe('API failed');
      expect(error.code).toBe(ErrorCode.PROVIDER_ERROR);
      expect(error.statusCode).toBe(502);
      expect(error.details?.provider).toBe('openai');
      expect(error.details?.status).toBe(500);
      expect(error.name).toBe('ProviderError');
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('Connection failed');
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.statusCode).toBe(503);
      expect(error.name).toBe('NetworkError');
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error', () => {
      const error = new TimeoutError(5000);
      expect(error.message).toBe('Request timeout after 5000ms');
      expect(error.code).toBe(ErrorCode.TIMEOUT);
      expect(error.statusCode).toBe(504);
      expect(error.details?.timeout).toBe(5000);
      expect(error.name).toBe('TimeoutError');
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError('Invalid config', { field: 'apiKey' });
      expect(error.code).toBe(ErrorCode.CONFIGURATION_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ConfigurationError');
    });
  });

  describe('SecurityViolationError', () => {
    it('should create security violation error', () => {
      const error = new SecurityViolationError('Injection detected', { input: 'test' });
      expect(error.code).toBe(ErrorCode.SECURITY_VIOLATION);
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('SecurityViolationError');
    });
  });

  describe('BudgetExceededError', () => {
    it('should create budget exceeded error', () => {
      const error = new BudgetExceededError('Daily limit reached', { limit: 100 });
      expect(error.code).toBe(ErrorCode.BUDGET_EXCEEDED);
      expect(error.statusCode).toBe(402);
      expect(error.name).toBe('BudgetExceededError');
    });
  });

  describe('isFrameworkError', () => {
    it('should return true for FrameworkError', () => {
      const error = new FrameworkError('Test');
      expect(isFrameworkError(error)).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Test');
      expect(isFrameworkError(error)).toBe(false);
    });
  });

  describe('toFrameworkError', () => {
    it('should return same error if already FrameworkError', () => {
      const error = new ValidationError('Test');
      const result = toFrameworkError(error);
      expect(result).toBe(error);
    });

    it('should wrap regular Error', () => {
      const error = new Error('Test error');
      const result = toFrameworkError(error);
      expect(result).toBeInstanceOf(FrameworkError);
      expect(result.message).toBe('Test error');
      expect(result.code).toBe(ErrorCode.INTERNAL_ERROR);
    });

    it('should wrap non-Error objects', () => {
      const result = toFrameworkError('string error');
      expect(result).toBeInstanceOf(FrameworkError);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.code).toBe(ErrorCode.UNKNOWN);
    });
  });
});
