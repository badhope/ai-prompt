import { ValidationError } from '../errors';
import { z, ZodSchema, ZodError } from 'zod';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
  data?: any;
}

export class InputValidator {
  private rules: ValidationRule[] = [];

  addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  addRules(rules: ValidationRule[]): this {
    this.rules.push(...rules);
    return this;
  }

  validate(data: any): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    for (const rule of this.rules) {
      const value = this.getNestedValue(data, rule.field);

      if (rule.required && (value === undefined || value === null)) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} is required`,
        });
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      if (rule.type) {
        const typeError = this.validateType(rule, value);
        if (typeError) {
          errors.push({ field: rule.field, message: typeError });
          continue;
        }
      }

      if (rule.minLength !== undefined && typeof value === 'string') {
        if (value.length < rule.minLength) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} must be at least ${rule.minLength} characters`,
          });
        }
      }

      if (rule.maxLength !== undefined && typeof value === 'string') {
        if (value.length > rule.maxLength) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} must be at most ${rule.maxLength} characters`,
          });
        }
      }

      if (rule.min !== undefined && typeof value === 'number') {
        if (value < rule.min) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} must be at least ${rule.min}`,
          });
        }
      }

      if (rule.max !== undefined && typeof value === 'number') {
        if (value > rule.max) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} must be at most ${rule.max}`,
          });
        }
      }

      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} format is invalid`,
          });
        }
      }

      if (rule.custom) {
        const result = rule.custom(value);
        if (result !== true) {
          errors.push({
            field: rule.field,
            message: typeof result === 'string' ? result : rule.message || `${rule.field} is invalid`,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  }

  private validateType(rule: ValidationRule, value: any): string | null {
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (actualType !== rule.type) {
      return `${rule.field} must be of type ${rule.type}`;
    }

    return null;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }
}

export function validateWithSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw new ValidationError(
        'Validation failed',
        { errors }
      );
    }
    throw error;
  }
}

export function createValidationMiddleware(validator: InputValidator) {
  return (source: 'body' | 'query' | 'params' = 'body') => {
    return async (req: any, res: any, next: any) => {
      try {
        const data = req[source];
        const result = validator.validate(data);

        if (!result.valid) {
          throw new ValidationError(
            'Validation failed',
            { errors: result.errors }
          );
        }

        req.validatedData = result.data;
        next();
      } catch (error) {
        next(error);
      }
    };
  };
}

export function createSchemaValidationMiddleware<T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: any, res: any, next: any) => {
    try {
      const data = req[source];
      const validated = validateWithSchema(schema, data);
      req.validatedData = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const commonSchemas = {
  promptId: z.string().min(1).max(100),
  promptName: z.string().min(1).max(200),
  promptContent: z.string().min(1).max(100000),
  promptVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  email: z.string().email(),
  apiKey: z.string().regex(/^sk-[a-f0-9]{64}$/),
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  }),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
};
