import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AuthManager, UserRole } from '../src/auth';
import { AuthorizationManager } from '../src/auth/AuthorizationManager';
import { DIContainer } from '../src/di';
import { GracefulShutdownManager } from '../src/lifecycle';
import { AuditLogger, AuditEventType, AuditSeverity } from '../src/audit';

describe('Integration Tests', () => {
  describe('Authentication and Authorization Flow', () => {
    let authManager: AuthManager;
    let authzManager: AuthorizationManager;

    beforeAll(() => {
      authManager = new AuthManager();
      authzManager = new AuthorizationManager();
    });

    it('should authenticate user with API key and check permissions', () => {
      const user = authManager.createUser('test@example.com', UserRole.USER);
      const apiKey = authManager.createApiKey(user.id, 'test-key');

      authzManager.assignRole(user.id, 'user');

      const authResult = authManager.authenticate(apiKey.key);
      expect(authResult.user.email).toBe('test@example.com');

      const canRead = authzManager.checkPermission(user.id, 'prompts', 'read');
      expect(canRead).toBe(true);

      const canDelete = authzManager.checkPermission(user.id, 'prompts', 'delete');
      expect(canDelete).toBe(false);
    });

    it('should handle admin role with full permissions', () => {
      const admin = authManager.createUser('admin@example.com', UserRole.ADMIN);
      authzManager.assignRole(admin.id, 'admin');

      const canDoAnything = authzManager.checkPermission(admin.id, 'any-resource', 'any-action');
      expect(canDoAnything).toBe(true);
    });

    it('should enforce API key expiration', async () => {
      const user = authManager.createUser('temp@example.com', UserRole.USER);
      const expiresAt = new Date(Date.now() - 1000);
      const apiKey = authManager.createApiKey(
        user.id,
        'expired-key',
        ['read'],
        1000,
        expiresAt
      );

      expect(() => {
        authManager.authenticate(apiKey.key);
      }).toThrow('API key has expired');
    });
  });

  describe('Dependency Injection Container', () => {
    let container: DIContainer;

    beforeAll(() => {
      container = new DIContainer();
    });

    it('should resolve dependencies correctly', () => {
      class Database {
        connect() {
          return 'connected';
        }
      }

      class UserService {
        constructor(private db: Database) {}

        getUsers() {
          return this.db.connect();
        }
      }

      container.register('Database', () => new Database());
      container.registerClass('UserService', UserService, ['Database']);

      const userService = container.resolve<UserService>('UserService');
      expect(userService.getUsers()).toBe('connected');
    });

    it('should handle singleton lifecycle', () => {
      let instanceCount = 0;

      container.register('Singleton', () => {
        instanceCount++;
        return { id: instanceCount };
      }, 'singleton');

      const instance1 = container.resolve('Singleton');
      const instance2 = container.resolve('Singleton');

      expect(instance1).toBe(instance2);
      expect(instanceCount).toBe(1);
    });

    it('should handle transient lifecycle', () => {
      let instanceCount = 0;

      container.register('Transient', () => {
        instanceCount++;
        return { id: instanceCount };
      }, 'transient');

      const instance1 = container.resolve('Transient');
      const instance2 = container.resolve('Transient');

      expect(instance1).not.toBe(instance2);
      expect(instanceCount).toBe(2);
    });

    it('should detect circular dependencies', () => {
      container.registerClass('ServiceA', class {}, ['ServiceB']);
      container.registerClass('ServiceB', class {}, ['ServiceA']);

      expect(() => {
        container.resolve('ServiceA');
      }).toThrow('Circular dependency detected');
    });
  });

  describe('Graceful Shutdown', () => {
    it('should execute shutdown handlers in priority order', async () => {
      const shutdownManager = new GracefulShutdownManager({
        timeout: 5000,
        signals: [],
      });

      const order: string[] = [];

      shutdownManager.register('handler1', async () => {
        order.push('handler1');
      }, { priority: 100 });

      shutdownManager.register('handler2', async () => {
        order.push('handler2');
      }, { priority: 1 });

      shutdownManager.register('handler3', async () => {
        order.push('handler3');
      }, { priority: 50 });

      await shutdownManager.shutdown('test');

      expect(order).toEqual(['handler2', 'handler3', 'handler1']);
    });

    it('should handle handler timeouts', async () => {
      const shutdownManager = new GracefulShutdownManager({
        timeout: 100,
        signals: [],
      });

      shutdownManager.register('slow-handler', async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      }, { timeout: 50 });

      await shutdownManager.shutdown('test');
      expect(shutdownManager.isShuttingDownNow()).toBe(true);
    });
  });

  describe('Audit Logging', () => {
    let auditLogger: AuditLogger;

    beforeAll(() => {
      auditLogger = new AuditLogger({
        enableConsole: false,
      });
    });

    afterAll(() => {
      auditLogger.destroy();
    });

    it('should log and retrieve audit events', () => {
      auditLogger.logAuth(AuditEventType.AUTH_LOGIN, 'user1', { ip: '127.0.0.1' });
      auditLogger.logResource(
        AuditEventType.PROMPT_CREATED,
        'prompt',
        'prompt-1',
        'user1',
        { after: { name: 'Test Prompt' } }
      );

      const logs = auditLogger.getLogs({ userId: 'user1' });
      expect(logs.length).toBe(2);
      expect(logs[0].type).toBe(AuditEventType.AUTH_LOGIN);
      expect(logs[1].type).toBe(AuditEventType.PROMPT_CREATED);
    });

    it('should filter logs by severity', () => {
      auditLogger.clear();
      
      auditLogger.logSecurity(
        AuditEventType.SECURITY_VIOLATION,
        AuditSeverity.HIGH,
        { reason: 'Injection attempt' }
      );
      
      auditLogger.logAuth(AuditEventType.AUTH_LOGIN, 'user1');

      const highSeverityLogs = auditLogger.getLogs({ severity: AuditSeverity.HIGH });
      expect(highSeverityLogs.length).toBe(1);
      expect(highSeverityLogs[0].type).toBe(AuditEventType.SECURITY_VIOLATION);
    });

    it('should generate statistics', () => {
      auditLogger.clear();
      
      auditLogger.logAuth(AuditEventType.AUTH_LOGIN, 'user1');
      auditLogger.logAuth(AuditEventType.AUTH_LOGIN, 'user2');
      auditLogger.logResource(AuditEventType.PROMPT_CREATED, 'prompt', 'p1', 'user1');

      const stats = auditLogger.getStats();
      expect(stats.total).toBe(3);
      expect(stats.byType[AuditEventType.AUTH_LOGIN]).toBe(2);
      expect(stats.byType[AuditEventType.PROMPT_CREATED]).toBe(1);
    });

    it('should export logs to JSON', () => {
      auditLogger.clear();
      auditLogger.logAuth(AuditEventType.AUTH_LOGIN, 'user1');

      const exported = auditLogger.export('json');
      const parsed = JSON.parse(exported);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
    });
  });

  describe('End-to-End Flow', () => {
    it('should handle complete request flow', async () => {
      const authManager = new AuthManager();
      const authzManager = new AuthorizationManager();
      const auditLogger = new AuditLogger({ enableConsole: false });

      const user = authManager.createUser('e2e@example.com', UserRole.USER);
      const apiKey = authManager.createApiKey(user.id, 'e2e-key', ['read', 'write']);
      authzManager.assignRole(user.id, 'user');

      const authResult = authManager.authenticate(apiKey.key);
      expect(authResult.user.id).toBe(user.id);

      const canRead = authzManager.checkPermission(user.id, 'prompts', 'read');
      expect(canRead).toBe(true);

      auditLogger.logResource(
        AuditEventType.PROMPT_ACCESSED,
        'prompt',
        'prompt-123',
        user.id,
        undefined,
        true
      );

      const logs = auditLogger.getLogs({ userId: user.id });
      expect(logs.length).toBeGreaterThan(0);

      auditLogger.destroy();
    });
  });
});
