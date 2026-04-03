import { ForbiddenError, ValidationError } from '../errors';

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  name: string;
  permissions: Permission[];
  inherits?: string[];
}

export interface ResourcePolicy {
  resource: string;
  actions: string[];
  effect: 'allow' | 'deny';
  conditions?: (context: AuthorizationContext) => boolean;
}

export interface AuthorizationContext {
  userId: string;
  roles: string[];
  attributes: Record<string, any>;
  resource?: string;
  action?: string;
  environment?: Record<string, any>;
}

export class AuthorizationManager {
  private roles: Map<string, Role> = new Map();
  private policies: ResourcePolicy[] = [];
  private userRoles: Map<string, string[]> = new Map();

  constructor() {
    this.initializeDefaultRoles();
  }

  private initializeDefaultRoles(): void {
    this.createRole('admin', [
      { resource: '*', action: '*' },
    ]);

    this.createRole('user', [
      { resource: 'prompts', action: 'read' },
      { resource: 'prompts', action: 'write' },
      { resource: 'templates', action: 'read' },
      { resource: 'templates', action: 'write' },
      { resource: 'evaluations', action: 'read' },
    ]);

    this.createRole('viewer', [
      { resource: 'prompts', action: 'read' },
      { resource: 'templates', action: 'read' },
    ]);

    this.createRole('service', [
      { resource: 'prompts', action: 'read' },
      { resource: 'prompts', action: 'write' },
      { resource: 'templates', action: 'read' },
      { resource: 'templates', action: 'write' },
      { resource: 'evaluations', action: 'read' },
      { resource: 'evaluations', action: 'write' },
    ]);
  }

  createRole(name: string, permissions: Permission[], inherits?: string[]): Role {
    const role: Role = { name, permissions, inherits };
    this.roles.set(name, role);
    return role;
  }

  assignRole(userId: string, roleName: string): void {
    if (!this.roles.has(roleName)) {
      throw new ValidationError(`Role ${roleName} does not exist`);
    }

    const roles = this.userRoles.get(userId) || [];
    if (!roles.includes(roleName)) {
      roles.push(roleName);
      this.userRoles.set(userId, roles);
    }
  }

  revokeRole(userId: string, roleName: string): void {
    const roles = this.userRoles.get(userId) || [];
    const index = roles.indexOf(roleName);
    if (index > -1) {
      roles.splice(index, 1);
    }
  }

  getUserRoles(userId: string): string[] {
    const directRoles = this.userRoles.get(userId) || [];
    const allRoles = new Set<string>();

    const addRoleWithInheritance = (roleName: string) => {
      if (allRoles.has(roleName)) return;
      allRoles.add(roleName);

      const role = this.roles.get(roleName);
      if (role?.inherits) {
        role.inherits.forEach(addRoleWithInheritance);
      }
    };

    directRoles.forEach(addRoleWithInheritance);
    return Array.from(allRoles);
  }

  addPolicy(policy: ResourcePolicy): void {
    this.policies.push(policy);
  }

  checkPermission(
    userId: string,
    resource: string,
    action: string,
    context?: Partial<AuthorizationContext>
  ): boolean {
    const roles = this.getUserRoles(userId);
    
    const authContext: AuthorizationContext = {
      userId,
      roles,
      attributes: context?.attributes || {},
      resource,
      action,
      environment: context?.environment || {},
    };

    for (const policy of this.policies) {
      if (this.matchPolicy(policy, authContext)) {
        if (policy.conditions && !policy.conditions(authContext)) {
          continue;
        }
        return policy.effect === 'allow';
      }
    }

    for (const roleName of roles) {
      const role = this.roles.get(roleName);
      if (!role) continue;

      for (const permission of role.permissions) {
        if (this.matchPermission(permission, resource, action)) {
          return true;
        }
      }
    }

    return false;
  }

  requirePermission(
    userId: string,
    resource: string,
    action: string,
    context?: Partial<AuthorizationContext>
  ): void {
    if (!this.checkPermission(userId, resource, action, context)) {
      throw new ForbiddenError(
        `Access denied: ${action} on ${resource}`,
        { userId, resource, action }
      );
    }
  }

  checkAnyPermission(
    userId: string,
    permissions: Array<{ resource: string; action: string }>
  ): boolean {
    return permissions.some(({ resource, action }) =>
      this.checkPermission(userId, resource, action)
    );
  }

  checkAllPermissions(
    userId: string,
    permissions: Array<{ resource: string; action: string }>
  ): boolean {
    return permissions.every(({ resource, action }) =>
      this.checkPermission(userId, resource, action)
    );
  }

  getResourcePermissions(userId: string, resource: string): string[] {
    const roles = this.getUserRoles(userId);
    const actions = new Set<string>();

    for (const roleName of roles) {
      const role = this.roles.get(roleName);
      if (!role) continue;

      for (const permission of role.permissions) {
        if (permission.resource === resource || permission.resource === '*') {
          if (permission.action === '*') {
            return ['*'];
          }
          actions.add(permission.action);
        }
      }
    }

    return Array.from(actions);
  }

  private matchPolicy(policy: ResourcePolicy, context: AuthorizationContext): boolean {
    if (policy.resource !== context.resource && policy.resource !== '*') {
      return false;
    }

    if (!policy.actions.includes(context.action || '') && !policy.actions.includes('*')) {
      return false;
    }

    return true;
  }

  private matchPermission(
    permission: Permission,
    resource: string,
    action: string
  ): boolean {
    const resourceMatch = 
      permission.resource === resource || permission.resource === '*';
    
    const actionMatch = 
      permission.action === action || permission.action === '*';

    return resourceMatch && actionMatch;
  }
}

export function createAuthorizationMiddleware(authzManager: AuthorizationManager) {
  return (resource: string, action: string) => {
    return async (req: any, res: any, next: any) => {
      try {
        if (!req.user?.id) {
          throw new ForbiddenError('Authentication required');
        }

        authzManager.requirePermission(req.user.id, resource, action, {
          attributes: req.user,
          environment: {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          },
        });

        next();
      } catch (error) {
        next(error);
      }
    };
  };
}
