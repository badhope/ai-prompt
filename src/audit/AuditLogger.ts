export enum AuditEventType {
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_API_KEY_CREATED = 'auth.api_key.created',
  AUTH_API_KEY_REVOKED = 'auth.api_key.revoked',
  
  PROMPT_CREATED = 'prompt.created',
  PROMPT_UPDATED = 'prompt.updated',
  PROMPT_DELETED = 'prompt.deleted',
  PROMPT_ACCESSED = 'prompt.accessed',
  
  TEMPLATE_CREATED = 'template.created',
  TEMPLATE_UPDATED = 'template.updated',
  TEMPLATE_DELETED = 'template.deleted',
  
  EVALUATION_CREATED = 'evaluation.created',
  EVALUATION_COMPLETED = 'evaluation.completed',
  
  PERMISSION_GRANTED = 'permission.granted',
  PERMISSION_REVOKED = 'permission.revoked',
  ROLE_ASSIGNED = 'role.assigned',
  ROLE_REVOKED = 'role.revoked',
  
  CONFIG_CHANGED = 'config.changed',
  SECURITY_VIOLATION = 'security.violation',
  RATE_LIMIT_EXCEEDED = 'rate_limit.exceeded',
  BUDGET_EXCEEDED = 'budget.exceeded',
  
  DATA_EXPORT = 'data.export',
  DATA_IMPORT = 'data.import',
  
  SYSTEM_START = 'system.start',
  SYSTEM_SHUTDOWN = 'system.shutdown',
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  type: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  apiKeyId?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  resourceId?: string;
  details?: Record<string, any>;
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: Record<string, any>;
  requestId?: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditLogConfig {
  retentionDays: number;
  maxLogs: number;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  excludeFields?: string[];
}

export class AuditLogger {
  private logs: AuditEvent[] = [];
  private config: AuditLogConfig;
  private flushTimer?: NodeJS.Timeout;

  constructor(config?: Partial<AuditLogConfig>) {
    this.config = {
      retentionDays: 90,
      maxLogs: 100000,
      enableConsole: true,
      enableFile: false,
      ...config,
    };

    this.startFlushTimer();
  }

  log(event: Partial<AuditEvent>): AuditEvent {
    const fullEvent: AuditEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      type: event.type || AuditEventType.SYSTEM_START,
      severity: event.severity || AuditSeverity.LOW,
      success: event.success ?? true,
      ...event,
    };

    this.logs.push(fullEvent);
    this.enforceLimits();

    if (this.config.enableConsole) {
      this.logToConsole(fullEvent);
    }

    return fullEvent;
  }

  logAuth(
    type: AuditEventType,
    userId: string,
    details?: Record<string, any>,
    success: boolean = true
  ): AuditEvent {
    return this.log({
      type,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      userId,
      details,
      success,
    });
  }

  logResource(
    type: AuditEventType,
    resource: string,
    resourceId: string,
    userId: string,
    changes?: { before?: any; after?: any },
    success: boolean = true
  ): AuditEvent {
    return this.log({
      type,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      resource,
      resourceId,
      userId,
      changes,
      success,
    });
  }

  logSecurity(
    type: AuditEventType,
    severity: AuditSeverity,
    details: Record<string, any>,
    userId?: string
  ): AuditEvent {
    return this.log({
      type,
      severity,
      userId,
      details,
      success: false,
    });
  }

  logSystem(
    type: AuditEventType,
    details?: Record<string, any>
  ): AuditEvent {
    return this.log({
      type,
      severity: AuditSeverity.LOW,
      details,
      success: true,
    });
  }

  getLogs(filter?: {
    userId?: string;
    type?: AuditEventType;
    severity?: AuditSeverity;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): AuditEvent[] {
    let filtered = [...this.logs];

    if (filter?.userId) {
      filtered = filtered.filter(log => log.userId === filter.userId);
    }

    if (filter?.type) {
      filtered = filtered.filter(log => log.type === filter.type);
    }

    if (filter?.severity) {
      filtered = filtered.filter(log => log.severity === filter.severity);
    }

    if (filter?.resource) {
      filtered = filtered.filter(log => log.resource === filter.resource);
    }

    if (filter?.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filter.startDate!);
    }

    if (filter?.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filter.endDate!);
    }

    const limit = filter?.limit || 100;
    return filtered.slice(-limit);
  }

  getStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byUser: Record<string, number>;
    failedCount: number;
  } {
    const stats = {
      total: this.logs.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
      failedCount: 0,
    };

    for (const log of this.logs) {
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
      
      if (log.userId) {
        stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
      }

      if (!log.success) {
        stats.failedCount++;
      }
    }

    return stats;
  }

  clear(): void {
    this.logs = [];
  }

  export(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    const headers = [
      'id', 'timestamp', 'type', 'severity', 'userId', 'resource',
      'resourceId', 'success', 'errorMessage', 'ip', 'userAgent'
    ];

    const rows = this.logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.type,
      log.severity,
      log.userId || '',
      log.resource || '',
      log.resourceId || '',
      log.success,
      log.errorMessage || '',
      log.ip || '',
      log.userAgent || '',
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  private enforceLimits(): void {
    if (this.logs.length > this.config.maxLogs) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - this.config.retentionDays);
      
      this.logs = this.logs.filter(log => log.timestamp >= cutoff);
      
      if (this.logs.length > this.config.maxLogs) {
        this.logs = this.logs.slice(-this.config.maxLogs);
      }
    }
  }

  private logToConsole(event: AuditEvent): void {
    const severityEmoji = {
      [AuditSeverity.LOW]: '📝',
      [AuditSeverity.MEDIUM]: '⚠️',
      [AuditSeverity.HIGH]: '🔴',
      [AuditSeverity.CRITICAL]: '🚨',
    };

    const emoji = severityEmoji[event.severity];
    const success = event.success ? '✓' : '✗';
    
    console.log(
      `${emoji} [${event.timestamp.toISOString()}] ${success} ${event.type} ` +
      `${event.userId ? `user:${event.userId} ` : ''}` +
      `${event.resource ? `${event.resource}:${event.resourceId} ` : ''}` +
      `${event.errorMessage || ''}`
    );
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.enforceLimits();
    }, 60000);
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
}

export function createAuditMiddleware(auditLogger: AuditLogger) {
  return async (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      
      auditLogger.log({
        type: AuditEventType.PROMPT_ACCESSED,
        severity: res.statusCode >= 400 ? AuditSeverity.MEDIUM : AuditSeverity.LOW,
        userId: req.user?.id,
        apiKeyId: req.apiKey?.key,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        resource: req.route?.path || req.path,
        action: req.method,
        details: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
        },
        requestId: req.headers['x-request-id'],
        success: res.statusCode < 400,
      });

      return originalEnd.apply(res, args);
    };

    next();
  };
}
