export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  conditions?: Record<string, any>;
}

export class RBACManager {
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private userRoles: Map<string, string[]> = new Map();

  constructor() {
    this.initializeDefaultRoles();
    this.initializeDefaultPermissions();
  }

  private initializeDefaultRoles(): void {
    this.roles.set('admin', {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['*'],
    });

    this.roles.set('user', {
      id: 'user',
      name: 'User',
      description: 'Standard user access',
      permissions: [
        'prompt:read',
        'prompt:create',
        'prompt:update',
        'template:read',
        'template:create',
        'provider:read',
      ],
    });

    this.roles.set('viewer', {
      id: 'viewer',
      name: 'Viewer',
      description: 'Read-only access',
      permissions: [
        'prompt:read',
        'template:read',
        'provider:read',
      ],
    });
  }

  private initializeDefaultPermissions(): void {
    const defaultPermissions: Permission[] = [
      { id: 'prompt:create', name: 'Create Prompt', resource: 'prompt', action: 'create' },
      { id: 'prompt:read', name: 'Read Prompt', resource: 'prompt', action: 'read' },
      { id: 'prompt:update', name: 'Update Prompt', resource: 'prompt', action: 'update' },
      { id: 'prompt:delete', name: 'Delete Prompt', resource: 'prompt', action: 'delete' },
      { id: 'template:create', name: 'Create Template', resource: 'template', action: 'create' },
      { id: 'template:read', name: 'Read Template', resource: 'template', action: 'read' },
      { id: 'template:update', name: 'Update Template', resource: 'template', action: 'update' },
      { id: 'template:delete', name: 'Delete Template', resource: 'template', action: 'delete' },
      { id: 'provider:read', name: 'Read Provider', resource: 'provider', action: 'read' },
      { id: 'provider:execute', name: 'Execute Provider', resource: 'provider', action: 'execute' },
      { id: 'admin:all', name: 'Full Admin Access', resource: '*', action: 'execute' },
    ];

    defaultPermissions.forEach(p => this.permissions.set(p.id, p));
  }

  createRole(role: Role): void {
    this.roles.set(role.id, role);
  }

  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  deleteRole(roleId: string): boolean {
    return this.roles.delete(roleId);
  }

  assignRole(userId: string, roleId: string): void {
    const roles = this.userRoles.get(userId) || [];
    if (!roles.includes(roleId)) {
      roles.push(roleId);
      this.userRoles.set(userId, roles);
    }
  }

  revokeRole(userId: string, roleId: string): void {
    const roles = this.userRoles.get(userId) || [];
    const index = roles.indexOf(roleId);
    if (index > -1) {
      roles.splice(index, 1);
      this.userRoles.set(userId, roles);
    }
  }

  getUserRoles(userId: string): Role[] {
    const roleIds = this.userRoles.get(userId) || [];
    return roleIds
      .map(id => this.roles.get(id))
      .filter((r): r is Role => r !== undefined);
  }

  getUserPermissions(userId: string): string[] {
    const roles = this.getUserRoles(userId);
    const permissions = new Set<string>();

    roles.forEach(role => {
      role.permissions.forEach(p => permissions.add(p));
    });

    return Array.from(permissions);
  }

  hasPermission(userId: string, permission: string): boolean {
    const userPermissions = this.getUserPermissions(userId);
    
    if (userPermissions.includes('*')) {
      return true;
    }

    if (userPermissions.includes(permission)) {
      return true;
    }

    const [resource, action] = permission.split(':');
    const wildcardPermission = `${resource}:*`;
    
    return userPermissions.includes(wildcardPermission);
  }

  checkAccess(userId: string, resource: string, action: Permission['action']): boolean {
    const permission = `${resource}:${action}`;
    return this.hasPermission(userId, permission);
  }

  createPermission(permission: Permission): void {
    this.permissions.set(permission.id, permission);
  }

  getPermission(permissionId: string): Permission | undefined {
    return this.permissions.get(permissionId);
  }

  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  deletePermission(permissionId: string): boolean {
    return this.permissions.delete(permissionId);
  }
}
