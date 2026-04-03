import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { UnauthorizedError, ForbiddenError } from '../errors';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  permissions: string[];
  apiKey?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
  SERVICE = 'service',
}

export interface ApiKey {
  key: string;
  userId: string;
  name: string;
  scopes: string[];
  rateLimit: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
}

export interface AuthConfig {
  jwtSecret?: string;
  apiKeyHeader?: string;
  tokenExpiry?: number;
  enableRateLimit?: boolean;
}

export interface AuthResult {
  user: User;
  apiKey?: ApiKey;
  permissions: string[];
}

export class AuthManager {
  private config: AuthConfig;
  private users: Map<string, User> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();
  private userApiKeys: Map<string, string[]> = new Map();
  private tokens: Map<string, { userId: string; expiresAt: number }> = new Map();

  constructor(config?: Partial<AuthConfig>) {
    this.config = {
      jwtSecret: randomBytes(32).toString('hex'),
      apiKeyHeader: 'x-api-key',
      tokenExpiry: 3600,
      enableRateLimit: true,
      ...config,
    };
  }

  createUser(
    email: string,
    role: UserRole = UserRole.USER,
    permissions: string[] = []
  ): User {
    const userId = this.generateId();
    const user: User = {
      id: userId,
      email,
      role,
      permissions: this.getDefaultPermissions(role).concat(permissions),
      createdAt: new Date(),
    };

    this.users.set(userId, user);
    return user;
  }

  createApiKey(
    userId: string,
    name: string,
    scopes: string[] = ['read', 'write'],
    rateLimit: number = 1000,
    expiresAt?: Date
  ): ApiKey {
    const user = this.users.get(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const key = this.generateApiKey();
    const apiKey: ApiKey = {
      key,
      userId,
      name,
      scopes,
      rateLimit,
      expiresAt,
      createdAt: new Date(),
    };

    this.apiKeys.set(key, apiKey);
    
    const userKeys = this.userApiKeys.get(userId) || [];
    userKeys.push(key);
    this.userApiKeys.set(userId, userKeys);

    return apiKey;
  }

  authenticate(apiKey: string): AuthResult {
    const key = this.apiKeys.get(apiKey);
    if (!key) {
      throw new UnauthorizedError('Invalid API key');
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
      throw new UnauthorizedError('API key has expired');
    }

    const user = this.users.get(key.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    key.lastUsedAt = new Date();
    user.lastLoginAt = new Date();

    return {
      user,
      apiKey: key,
      permissions: user.permissions,
    };
  }

  authenticateBasic(email: string, password: string): AuthResult {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return {
      user,
      permissions: user.permissions,
    };
  }

  generateToken(userId: string): string {
    const user = this.users.get(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (this.config.tokenExpiry || 3600) * 1000;

    this.tokens.set(token, { userId, expiresAt });

    return token;
  }

  validateToken(token: string): AuthResult {
    const tokenData = this.tokens.get(token);
    if (!tokenData) {
      throw new UnauthorizedError('Invalid token');
    }

    if (tokenData.expiresAt < Date.now()) {
      this.tokens.delete(token);
      throw new UnauthorizedError('Token has expired');
    }

    const user = this.users.get(tokenData.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      user,
      permissions: user.permissions,
    };
  }

  revokeToken(token: string): void {
    this.tokens.delete(token);
  }

  checkPermission(user: User, permission: string): boolean {
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return user.permissions.includes(permission) || 
           user.permissions.includes('*');
  }

  requirePermission(user: User, permission: string): void {
    if (!this.checkPermission(user, permission)) {
      throw new ForbiddenError(`Missing required permission: ${permission}`);
    }
  }

  checkScope(apiKey: ApiKey, scope: string): boolean {
    return apiKey.scopes.includes(scope) || apiKey.scopes.includes('*');
  }

  requireScope(apiKey: ApiKey, scope: string): void {
    if (!this.checkScope(apiKey, scope)) {
      throw new ForbiddenError(`Missing required scope: ${scope}`);
    }
  }

  revokeApiKey(apiKey: string): void {
    const key = this.apiKeys.get(apiKey);
    if (key) {
      this.apiKeys.delete(apiKey);
      const userKeys = this.userApiKeys.get(key.userId) || [];
      const index = userKeys.indexOf(apiKey);
      if (index > -1) {
        userKeys.splice(index, 1);
      }
    }
  }

  getUserApiKeys(userId: string): ApiKey[] {
    const keyIds = this.userApiKeys.get(userId) || [];
    return keyIds
      .map(id => this.apiKeys.get(id))
      .filter((k): k is ApiKey => k !== undefined);
  }

  hashPassword(password: string, salt?: string): string {
    const actualSalt = salt || randomBytes(16).toString('hex');
    const hash = createHash('sha256')
      .update(password + actualSalt)
      .digest('hex');
    return `${actualSalt}:${hash}`;
  }

  verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const newHash = createHash('sha256')
      .update(password + salt)
      .digest('hex');
    
    try {
      return timingSafeEqual(Buffer.from(hash), Buffer.from(newHash));
    } catch {
      return false;
    }
  }

  private generateId(): string {
    return randomBytes(16).toString('hex');
  }

  private generateApiKey(): string {
    return `sk-${randomBytes(32).toString('hex')}`;
  }

  private getDefaultPermissions(role: UserRole): string[] {
    switch (role) {
      case UserRole.ADMIN:
        return ['*'];
      case UserRole.USER:
        return ['prompts:read', 'prompts:write', 'templates:read', 'templates:write'];
      case UserRole.VIEWER:
        return ['prompts:read', 'templates:read'];
      case UserRole.SERVICE:
        return ['prompts:read', 'prompts:write', 'templates:read', 'templates:write', 'evaluations:read', 'evaluations:write'];
      default:
        return [];
    }
  }
}

export function createAuthMiddleware(authManager: AuthManager) {
  return async (req: any, res: any, next: any) => {
    try {
      const apiKey = req.headers[authManager['config'].apiKeyHeader || 'x-api-key'];
      
      if (!apiKey) {
        throw new UnauthorizedError('API key is required');
      }

      const authResult = authManager.authenticate(apiKey);
      req.user = authResult.user;
      req.apiKey = authResult.apiKey;
      req.permissions = authResult.permissions;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function createPermissionMiddleware(authManager: AuthManager, permission: string) {
  return async (req: any, res: any, next: any) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      authManager.requirePermission(req.user, permission);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function createScopeMiddleware(authManager: AuthManager, scope: string) {
  return async (req: any, res: any, next: any) => {
    try {
      if (!req.apiKey) {
        throw new UnauthorizedError('API key required');
      }

      authManager.requireScope(req.apiKey, scope);
      next();
    } catch (error) {
      next(error);
    }
  };
}
