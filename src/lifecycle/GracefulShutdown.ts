export interface ShutdownHandler {
  name: string;
  priority: number;
  handler: () => Promise<void> | void;
  timeout: number;
}

export interface GracefulShutdownConfig {
  timeout: number;
  signals: NodeJS.Signals[];
  logger?: (message: string) => void;
}

export class GracefulShutdownManager {
  private handlers: ShutdownHandler[] = [];
  private isShuttingDown: boolean = false;
  private config: GracefulShutdownConfig;

  constructor(config?: Partial<GracefulShutdownConfig>) {
    this.config = {
      timeout: 30000,
      signals: ['SIGTERM', 'SIGINT', 'SIGUSR2'],
      ...config,
    };

    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    for (const signal of this.config.signals) {
      process.on(signal, async () => {
        await this.shutdown(signal);
      });
    }

    process.on('uncaughtException', async (error) => {
      this.log(`Uncaught exception: ${error.message}`);
      await this.shutdown('uncaughtException');
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason) => {
      this.log(`Unhandled rejection: ${reason}`);
      await this.shutdown('unhandledRejection');
      process.exit(1);
    });
  }

  register(
    name: string,
    handler: () => Promise<void> | void,
    options?: { priority?: number; timeout?: number }
  ): void {
    this.handlers.push({
      name,
      handler,
      priority: options?.priority || 100,
      timeout: options?.timeout || this.config.timeout,
    });

    this.handlers.sort((a, b) => a.priority - b.priority);
  }

  async shutdown(reason: string = 'manual'): Promise<void> {
    if (this.isShuttingDown) {
      this.log('Shutdown already in progress, waiting...');
      return;
    }

    this.isShuttingDown = true;
    this.log(`Starting graceful shutdown (reason: ${reason})`);

    const startTime = Date.now();
    const results: Array<{ name: string; success: boolean; duration: number; error?: Error }> = [];

    for (const handler of this.handlers) {
      const handlerStart = Date.now();
      this.log(`Executing shutdown handler: ${handler.name}`);

      try {
        await Promise.race([
          Promise.resolve(handler.handler()),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), handler.timeout)
          ),
        ]);

        const duration = Date.now() - handlerStart;
        results.push({ name: handler.name, success: true, duration });
        this.log(`✓ ${handler.name} completed in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - handlerStart;
        results.push({
          name: handler.name,
          success: false,
          duration,
          error: error instanceof Error ? error : new Error(String(error)),
        });
        this.log(`✗ ${handler.name} failed: ${error}`);
      }
    }

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    this.log(`Shutdown completed in ${totalDuration}ms`);
    this.log(`Success: ${successCount}, Failed: ${failCount}`);

    if (failCount > 0) {
      this.log('Some shutdown handlers failed:');
      results
        .filter(r => !r.success)
        .forEach(r => {
          this.log(`  - ${r.name}: ${r.error?.message}`);
        });
    }
  }

  isShuttingDownNow(): boolean {
    return this.isShuttingDown;
  }

  private log(message: string): void {
    if (this.config.logger) {
      this.config.logger(message);
    } else {
      console.log(`[GracefulShutdown] ${message}`);
    }
  }
}

export function createGracefulShutdown(config?: Partial<GracefulShutdownConfig>): GracefulShutdownManager {
  return new GracefulShutdownManager(config);
}
