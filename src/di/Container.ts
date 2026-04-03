export type Constructor<T = any> = new (...args: any[]) => T;
export type Factory<T = any> = () => T | Promise<T>;

export interface ServiceDescriptor<T = any> {
  token: string | symbol;
  lifecycle: 'singleton' | 'transient' | 'scoped';
  factory?: Factory<T>;
  constructor?: Constructor<T>;
  dependencies?: Array<string | symbol>;
  instance?: T;
}

export class DIContainer {
  private services: Map<string | symbol, ServiceDescriptor> = new Map();
  private singletons: Map<string | symbol, any> = new Map();
  private resolving: Set<string | symbol> = new Set();

  register<T>(
    token: string | symbol,
    factory: Factory<T>,
    lifecycle: 'singleton' | 'transient' | 'scoped' = 'singleton'
  ): this {
    this.services.set(token, {
      token,
      lifecycle,
      factory,
    });
    return this;
  }

  registerClass<T>(
    token: string | symbol,
    constructor: Constructor<T>,
    dependencies: Array<string | symbol> = [],
    lifecycle: 'singleton' | 'transient' | 'scoped' = 'singleton'
  ): this {
    this.services.set(token, {
      token,
      lifecycle,
      constructor,
      dependencies,
    });
    return this;
  }

  registerSingleton<T>(token: string | symbol, instance: T): this {
    this.singletons.set(token, instance);
    return this;
  }

  resolve<T>(token: string | symbol): T {
    if (this.singletons.has(token)) {
      return this.singletons.get(token);
    }

    const descriptor = this.services.get(token);
    if (!descriptor) {
      throw new Error(`Service ${String(token)} not found`);
    }

    if (this.resolving.has(token)) {
      throw new Error(`Circular dependency detected: ${String(token)}`);
    }

    this.resolving.add(token);

    try {
      let instance: T;

      if (descriptor.factory) {
        instance = descriptor.factory();
      } else if (descriptor.constructor) {
        const deps = descriptor.dependencies?.map(dep => this.resolve(dep)) || [];
        instance = new descriptor.constructor(...deps);
      } else {
        throw new Error(`Invalid service descriptor for ${String(token)}`);
      }

      if (descriptor.lifecycle === 'singleton') {
        this.singletons.set(token, instance);
      }

      return instance;
    } finally {
      this.resolving.delete(token);
    }
  }

  async resolveAsync<T>(token: string | symbol): Promise<T> {
    if (this.singletons.has(token)) {
      return this.singletons.get(token);
    }

    const descriptor = this.services.get(token);
    if (!descriptor) {
      throw new Error(`Service ${String(token)} not found`);
    }

    if (this.resolving.has(token)) {
      throw new Error(`Circular dependency detected: ${String(token)}`);
    }

    this.resolving.add(token);

    try {
      let instance: T;

      if (descriptor.factory) {
        instance = await descriptor.factory();
      } else if (descriptor.constructor) {
        const deps = await Promise.all(
          descriptor.dependencies?.map(dep => this.resolveAsync(dep)) || []
        );
        instance = new descriptor.constructor(...deps);
      } else {
        throw new Error(`Invalid service descriptor for ${String(token)}`);
      }

      if (descriptor.lifecycle === 'singleton') {
        this.singletons.set(token, instance);
      }

      return instance;
    } finally {
      this.resolving.delete(token);
    }
  }

  has(token: string | symbol): boolean {
    return this.services.has(token) || this.singletons.has(token);
  }

  unregister(token: string | symbol): boolean {
    this.singletons.delete(token);
    return this.services.delete(token);
  }

  clear(): void {
    this.services.clear();
    this.singletons.clear();
    this.resolving.clear();
  }

  createScope(): ScopedContainer {
    return new ScopedContainer(this);
  }
}

export class ScopedContainer {
  private parent: DIContainer;
  private scopedInstances: Map<string | symbol, any> = new Map();

  constructor(parent: DIContainer) {
    this.parent = parent;
  }

  resolve<T>(token: string | symbol): T {
    if (this.scopedInstances.has(token)) {
      return this.scopedInstances.get(token);
    }

    const descriptor = (this.parent as any).services.get(token);
    if (!descriptor) {
      return this.parent.resolve(token);
    }

    if (descriptor.lifecycle === 'scoped') {
      const instance = this.parent.resolve(token);
      this.scopedInstances.set(token, instance);
      return instance;
    }

    return this.parent.resolve(token);
  }

  dispose(): void {
    this.scopedInstances.clear();
  }
}

export const container = new DIContainer();

export function Injectable(token?: string | symbol) {
  return function <T extends Constructor>(constructor: T) {
    const actualToken = token || constructor.name;
    container.registerClass(actualToken, constructor, [], 'singleton');
    return constructor;
  };
}

export function Inject(token: string | symbol) {
  return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    const existingDependencies = Reflect.getMetadata('design:paramtypes', target) || [];
    existingDependencies[parameterIndex] = token;
    Reflect.defineMetadata('design:paramtypes', existingDependencies, target);
  };
}

export function Service(token?: string | symbol, lifecycle: 'singleton' | 'transient' | 'scoped' = 'singleton') {
  return function <T extends Constructor>(constructor: T) {
    const actualToken = token || constructor.name;
    container.registerClass(actualToken, constructor, [], lifecycle);
    return constructor;
  };
}
