import { ValidationResult } from '../types';

export interface SecurityConfig {
  sanitization: {
    remove_html: boolean;
    escape_sql: boolean;
    normalize_unicode: boolean;
    max_length: number;
  };
  injection_detection: {
    enabled: boolean;
    patterns: string[];
    threshold: number;
  };
  pii_filter: {
    enabled: boolean;
    types: string[];
    action: 'redact' | 'mask' | 'block';
  };
}

export class SecurityLayer {
  private config: SecurityConfig;

  private injectionPatterns = [
    /ignore\s+(all\s+)?(previous|above)\s+(instructions|rules)/gi,
    /disregard\s+(all\s+)?(previous|above)\s+(instructions|rules)/gi,
    /forget\s+(all\s+)?(previous|above)\s+(instructions|rules)/gi,
    /you\s+are\s+now\s+a?\s*(different|new|another)/gi,
    /act\s+as\s+if\s+you\s+are/gi,
    /pretend\s+(that\s+)?you\s+are/gi,
    /role[\s-]*play\s+as/gi,
    /simulate\s+being\s+a/gi,
    /override\s+(your\s+)?(instructions|rules|guidelines)/gi,
    /bypass\s+(your\s+)?(instructions|rules|safety)/gi,
    /jailbreak/gi,
    /DAN\s*:/gi,
    /system:\s*$/gim,
    /<\|.*?\|>/g,
    /\[SYSTEM\]/gi,
    /\[INST\]/gi,
    /\{\{.*?\}\}/g,
  ];

  private piiPatterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    credit_card: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    api_key: /(?:api[_-]?key|apikey|access[_-]?token)[\s:=]+['"]?[\w\-]{20,}['"]?/gi,
    password: /(?:password|passwd|pwd)[\s:=]+['"]?\w+['"]?/gi,
  };

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      sanitization: {
        remove_html: true,
        escape_sql: true,
        normalize_unicode: true,
        max_length: 100000,
        ...config?.sanitization,
      },
      injection_detection: {
        enabled: true,
        patterns: [],
        threshold: 0.85,
        ...config?.injection_detection,
      },
      pii_filter: {
        enabled: true,
        types: ['email', 'phone', 'ssn', 'credit_card', 'api_key', 'password'],
        action: 'redact',
        ...config?.pii_filter,
      },
    };
  }

  sanitize(input: string): string {
    let sanitized = input;

    if (this.config.sanitization.max_length) {
      sanitized = sanitized.substring(0, this.config.sanitization.max_length);
    }

    if (this.config.sanitization.remove_html) {
      sanitized = this.removeHTML(sanitized);
    }

    if (this.config.sanitization.escape_sql) {
      sanitized = this.escapeSQL(sanitized);
    }

    if (this.config.sanitization.normalize_unicode) {
      sanitized = sanitized.normalize('NFKC');
    }

    return sanitized.trim();
  }

  detectInjection(input: string): ValidationResult {
    if (!this.config.injection_detection.enabled) {
      return { valid: true, errors: [], warnings: [] };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const detections: string[] = [];

    for (const pattern of this.injectionPatterns) {
      const matches = input.match(pattern);
      if (matches) {
        detections.push(`Pattern matched: ${pattern.source}`);
      }
    }

    const suspiciousPhrases = [
      'ignore previous',
      'disregard instructions',
      'forget everything',
      'you are now',
      'act as',
      'pretend',
      'roleplay',
      'simulate',
      'override',
      'bypass',
      'jailbreak',
    ];

    const lowerInput = input.toLowerCase();
    for (const phrase of suspiciousPhrases) {
      if (lowerInput.includes(phrase)) {
        detections.push(`Suspicious phrase: "${phrase}"`);
      }
    }

    const base64Pattern = /[A-Za-z0-9+/]{40,}={0,2}/g;
    const base64Matches = input.match(base64Pattern);
    if (base64Matches) {
      for (const match of base64Matches) {
        try {
          const decoded = Buffer.from(match, 'base64').toString('utf-8');
          if (this.containsInjection(decoded)) {
            detections.push('Encoded injection attempt detected');
          }
        } catch (e) {
          // Not valid base64, ignore
        }
      }
    }

    const riskScore = detections.length / (this.injectionPatterns.length + suspiciousPhrases.length);
    
    if (riskScore >= this.config.injection_detection.threshold) {
      errors.push('High risk of prompt injection detected');
      errors.push(...detections);
    } else if (detections.length > 0) {
      warnings.push('Potential injection patterns detected');
      warnings.push(...detections);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  detectPII(input: string): { hasPII: boolean; types: string[]; redacted: string } {
    if (!this.config.pii_filter.enabled) {
      return { hasPII: false, types: [], redacted: input };
    }

    const detectedTypes: string[] = [];
    let redacted = input;

    for (const type of this.config.pii_filter.types) {
      const pattern = this.piiPatterns[type as keyof typeof this.piiPatterns];
      if (pattern) {
        const matches = input.match(pattern);
        if (matches && matches.length > 0) {
          detectedTypes.push(type);
          redacted = this.redactPII(redacted, type, pattern);
        }
      }
    }

    return {
      hasPII: detectedTypes.length > 0,
      types: detectedTypes,
      redacted,
    };
  }

  validate(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const sanitized = this.sanitize(input);

    const injectionResult = this.detectInjection(sanitized);
    errors.push(...injectionResult.errors);
    warnings.push(...injectionResult.warnings);

    const piiResult = this.detectPII(sanitized);
    if (piiResult.hasPII) {
      warnings.push(`PII detected: ${piiResult.types.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  process(input: string): { output: string; validation: ValidationResult; piiDetected: boolean } {
    const sanitized = this.sanitize(input);
    const injectionResult = this.detectInjection(sanitized);
    const piiResult = this.detectPII(sanitized);

    let output = piiResult.redacted;

    if (piiResult.hasPII && this.config.pii_filter.action === 'block') {
      return {
        output: '',
        validation: {
          valid: false,
          errors: ['PII detected and blocked'],
          warnings: [],
        },
        piiDetected: true,
      };
    }

    return {
      output,
      validation: injectionResult,
      piiDetected: piiResult.hasPII,
    };
  }

  private removeHTML(input: string): string {
    return input.replace(/<[^>]*>/g, '');
  }

  private escapeSQL(input: string): string {
    return input
      .replace(/'/g, "''")
      .replace(/"/g, '""')
      .replace(/;/g, '\\;')
      .replace(/--/g, '\\-\\-');
  }

  private containsInjection(text: string): boolean {
    const lowerText = text.toLowerCase();
    const injectionKeywords = [
      'ignore', 'disregard', 'forget', 'override', 'bypass',
      'jailbreak', 'system', 'instruction', 'rule',
    ];
    
    return injectionKeywords.some(keyword => lowerText.includes(keyword));
  }

  private redactPII(text: string, type: string, pattern: RegExp): string {
    switch (this.config.pii_filter.action) {
      case 'redact':
        return text.replace(pattern, `[${type.toUpperCase()}_REDACTED]`);
      
      case 'mask':
        return text.replace(pattern, (match) => {
          const len = match.length;
          const visible = Math.floor(len * 0.2);
          return match.substring(0, visible) + '*'.repeat(len - visible);
        });
      
      case 'block':
        return text;
      
      default:
        return text;
    }
  }
}
