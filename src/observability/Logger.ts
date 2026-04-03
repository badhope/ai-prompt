export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogConfig {
  level: LogLevel;
  format: 'json' | 'text';
  timestamp: boolean;
  colors: boolean;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

export class Logger {
  private config: LogConfig;
  private context: Record<string, any> = {};

  constructor(config?: Partial<LogConfig>) {
    this.config = {
      level: 'info',
      format: 'text',
      timestamp: true,
      colors: true,
      ...config,
    };
  }

  setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | Record<string, any>): void {
    const context = error instanceof Error
      ? { error: error.message, stack: error.stack }
      : error;
    this.log('error', message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.context, ...context },
    };

    if (this.config.format === 'json') {
      console.log(JSON.stringify(entry));
    } else {
      this.logText(entry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevel = levels.indexOf(this.config.level);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= currentLevel;
  }

  private logText(entry: LogEntry): void {
    const timestamp = this.config.timestamp ? `[${entry.timestamp}] ` : '';
    const level = this.formatLevel(entry.level);
    const context = entry.context && Object.keys(entry.context).length > 0
      ? ` ${JSON.stringify(entry.context)}`
      : '';

    console.log(`${timestamp}${level} ${entry.message}${context}`);
  }

  private formatLevel(level: LogLevel): string {
    if (!this.config.colors) {
      return `[${level.toUpperCase()}]`;
    }

    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };

    const reset = '\x1b[0m';
    return `${colors[level]}[${level.toUpperCase()}]${reset}`;
  }
}
