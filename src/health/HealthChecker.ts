import { Request, Response } from 'express';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthStatus;
    cache: HealthStatus;
    providers: HealthStatus;
    memory: HealthStatus;
  };
}

export interface HealthStatus {
  status: 'up' | 'down' | 'degraded';
  message?: string;
  latency?: number;
  details?: Record<string, any>;
}

export interface ReadinessResult {
  ready: boolean;
  checks: {
    database: boolean;
    cache: boolean;
    providers: boolean;
  };
}

export class HealthChecker {
  private startTime: number;
  private version: string;

  constructor(version: string = '2.0.0') {
    this.startTime = Date.now();
    this.version = version;
  }

  async checkHealth(
    dbCheck?: () => Promise<boolean>,
    cacheCheck?: () => Promise<boolean>,
    providersCheck?: () => Promise<boolean>
  ): Promise<HealthCheckResult> {
    const checks = {
      database: await this.checkDatabase(dbCheck),
      cache: await this.checkCache(cacheCheck),
      providers: await this.checkProviders(providersCheck),
      memory: this.checkMemory(),
    };

    const allUp = Object.values(checks).every(c => c.status === 'up');
    const anyDown = Object.values(checks).some(c => c.status === 'down');

    let status: 'healthy' | 'unhealthy' | 'degraded';
    if (anyDown) {
      status = 'unhealthy';
    } else if (allUp) {
      status = 'healthy';
    } else {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime: Date.now() - this.startTime,
      checks,
    };
  }

  async checkReadiness(
    dbCheck?: () => Promise<boolean>,
    cacheCheck?: () => Promise<boolean>,
    providersCheck?: () => Promise<boolean>
  ): Promise<ReadinessResult> {
    const checks = {
      database: dbCheck ? await dbCheck().catch(() => false) : true,
      cache: cacheCheck ? await cacheCheck().catch(() => false) : true,
      providers: providersCheck ? await providersCheck().catch(() => false) : true,
    };

    return {
      ready: Object.values(checks).every(c => c),
      checks,
    };
  }

  healthEndpoint(
    dbCheck?: () => Promise<boolean>,
    cacheCheck?: () => Promise<boolean>,
    providersCheck?: () => Promise<boolean>
  ) {
    return async (req: Request, res: Response) => {
      const health = await this.checkHealth(dbCheck, cacheCheck, providersCheck);
      
      const statusCode = health.status === 'healthy' ? 200 : 
                         health.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(health);
    };
  }

  readinessEndpoint(
    dbCheck?: () => Promise<boolean>,
    cacheCheck?: () => Promise<boolean>,
    providersCheck?: () => Promise<boolean>
  ) {
    return async (req: Request, res: Response) => {
      const readiness = await this.checkReadiness(dbCheck, cacheCheck, providersCheck);
      
      res.status(readiness.ready ? 200 : 503).json(readiness);
    };
  }

  livenessEndpoint() {
    return (req: Request, res: Response) => {
      res.status(200).json({
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
      });
    };
  }

  private async checkDatabase(checkFn?: () => Promise<boolean>): Promise<HealthStatus> {
    if (!checkFn) {
      return { status: 'up', message: 'Database check not configured' };
    }

    const start = Date.now();
    try {
      const isUp = await checkFn();
      const latency = Date.now() - start;

      return {
        status: isUp ? 'up' : 'down',
        latency,
        message: isUp ? 'Database connection successful' : 'Database connection failed',
      };
    } catch (error: any) {
      return {
        status: 'down',
        latency: Date.now() - start,
        message: error.message,
      };
    }
  }

  private async checkCache(checkFn?: () => Promise<boolean>): Promise<HealthStatus> {
    if (!checkFn) {
      return { status: 'up', message: 'Cache check not configured' };
    }

    const start = Date.now();
    try {
      const isUp = await checkFn();
      const latency = Date.now() - start;

      return {
        status: isUp ? 'up' : 'down',
        latency,
        message: isUp ? 'Cache connection successful' : 'Cache connection failed',
      };
    } catch (error: any) {
      return {
        status: 'down',
        latency: Date.now() - start,
        message: error.message,
      };
    }
  }

  private async checkProviders(checkFn?: () => Promise<boolean>): Promise<HealthStatus> {
    if (!checkFn) {
      return { status: 'up', message: 'Providers check not configured' };
    }

    const start = Date.now();
    try {
      const isUp = await checkFn();
      const latency = Date.now() - start;

      return {
        status: isUp ? 'up' : 'down',
        latency,
        message: isUp ? 'Providers available' : 'No providers available',
      };
    } catch (error: any) {
      return {
        status: 'down',
        latency: Date.now() - start,
        message: error.message,
      };
    }
  }

  private checkMemory(): HealthStatus {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;

    let status: 'up' | 'down' | 'degraded';
    if (usagePercent > 90) {
      status = 'down';
    } else if (usagePercent > 75) {
      status = 'degraded';
    } else {
      status = 'up';
    }

    return {
      status,
      message: `Memory usage: ${usagePercent.toFixed(2)}%`,
      details: {
        heapUsed: `${heapUsedMB.toFixed(2)} MB`,
        heapTotal: `${heapTotalMB.toFixed(2)} MB`,
        external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      },
    };
  }
}
