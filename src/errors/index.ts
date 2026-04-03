export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class FrameworkError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly requestId?: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    statusCode: number = 500,
    details?: Record<string, any>,
    requestId?: string
  ) {
    super(message);
    this.name = 'FrameworkError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    this.requestId = requestId;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      requestId: this.requestId,
      stack: this.stack,
    };
  }
}

export class ValidationError extends FrameworkError {
  constructor(message: string, details?: Record<string, any>, requestId?: string) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details, requestId);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends FrameworkError {
  constructor(resource: string, requestId?: string) {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, 404, undefined, requestId);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends FrameworkError {
  constructor(message: string = 'Unauthorized', requestId?: string) {
    super(message, ErrorCode.UNAUTHORIZED, 401, undefined, requestId);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends FrameworkError {
  constructor(message: string = 'Forbidden', requestId?: string) {
    super(message, ErrorCode.FORBIDDEN, 403, undefined, requestId);
    this.name = 'ForbiddenError';
  }
}

export class RateLimitError extends FrameworkError {
  public readonly retryAfter: number;

  constructor(retryAfter: number, requestId?: string) {
    super(
      `Rate limit exceeded. Retry after ${retryAfter} seconds`,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      { retryAfter },
      requestId
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ProviderError extends FrameworkError {
  constructor(message: string, provider: string, details?: Record<string, any>, requestId?: string) {
    super(message, ErrorCode.PROVIDER_ERROR, 502, { provider, ...details }, requestId);
    this.name = 'ProviderError';
  }
}

export class NetworkError extends FrameworkError {
  constructor(message: string, requestId?: string) {
    super(message, ErrorCode.NETWORK_ERROR, 503, undefined, requestId);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends FrameworkError {
  constructor(timeout: number, requestId?: string) {
    super(
      `Request timeout after ${timeout}ms`,
      ErrorCode.TIMEOUT,
      504,
      { timeout },
      requestId
    );
    this.name = 'TimeoutError';
  }
}

export class ConfigurationError extends FrameworkError {
  constructor(message: string, details?: Record<string, any>, requestId?: string) {
    super(message, ErrorCode.CONFIGURATION_ERROR, 500, details, requestId);
    this.name = 'ConfigurationError';
  }
}

export class SecurityViolationError extends FrameworkError {
  constructor(message: string, details?: Record<string, any>, requestId?: string) {
    super(message, ErrorCode.SECURITY_VIOLATION, 400, details, requestId);
    this.name = 'SecurityViolationError';
  }
}

export class BudgetExceededError extends FrameworkError {
  constructor(message: string, details?: Record<string, any>, requestId?: string) {
    super(message, ErrorCode.BUDGET_EXCEEDED, 402, details, requestId);
    this.name = 'BudgetExceededError';
  }
}

export function isFrameworkError(error: any): error is FrameworkError {
  return error instanceof FrameworkError;
}

export function toFrameworkError(error: any, requestId?: string): FrameworkError {
  if (isFrameworkError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new FrameworkError(
      error.message,
      ErrorCode.INTERNAL_ERROR,
      500,
      { originalError: error.name },
      requestId
    );
  }

  return new FrameworkError(
    'An unknown error occurred',
    ErrorCode.UNKNOWN,
    500,
    { originalError: String(error) },
    requestId
  );
}
