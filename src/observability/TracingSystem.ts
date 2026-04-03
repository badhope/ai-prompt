export interface Span {
  id: string;
  trace_id: string;
  parent_id?: string;
  name: string;
  start_time: number;
  end_time?: number;
  duration?: number;
  tags: Record<string, any>;
  logs: LogEntry[];
  status: 'ok' | 'error';
}

export interface LogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  fields?: Record<string, any>;
}

export interface TracingConfig {
  service_name: string;
  sampling_rate: number;
  max_spans: number;
}

export class TracingSystem {
  private config: TracingConfig;
  private spans: Map<string, Span> = new Map();
  private currentTraceId: string | null = null;

  constructor(config?: Partial<TracingConfig>) {
    this.config = {
      service_name: 'ai-prompt-engine',
      sampling_rate: 1.0,
      max_spans: 10000,
      ...config,
    };
  }

  startSpan(name: string, parentSpanId?: string, tags?: Record<string, any>): Span {
    const spanId = this.generateId();
    const traceId = parentSpanId ? this.getTraceId(parentSpanId) : this.generateId();

    const span: Span = {
      id: spanId,
      trace_id: traceId,
      parent_id: parentSpanId,
      name,
      start_time: Date.now(),
      tags: tags || {},
      logs: [],
      status: 'ok',
    };

    if (this.spans.size >= this.config.max_spans) {
      this.evictOldestSpan();
    }

    this.spans.set(spanId, span);
    this.currentTraceId = traceId;

    return span;
  }

  endSpan(spanId: string): void {
    const span = this.spans.get(spanId);
    if (!span) {
      return;
    }

    span.end_time = Date.now();
    span.duration = span.end_time - span.start_time;
  }

  log(spanId: string, level: LogEntry['level'], message: string, fields?: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (!span) {
      return;
    }

    span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      fields,
    });
  }

  setError(spanId: string, error: Error): void {
    const span = this.spans.get(spanId);
    if (!span) {
      return;
    }

    span.status = 'error';
    span.tags.error = true;
    span.tags.error_message = error.message;
    span.tags.error_stack = error.stack;

    this.log(spanId, 'error', error.message, {
      stack: error.stack,
    });
  }

  addTag(spanId: string, key: string, value: any): void {
    const span = this.spans.get(spanId);
    if (!span) {
      return;
    }

    span.tags[key] = value;
  }

  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  getTrace(traceId: string): Span[] {
    const spans: Span[] = [];
    this.spans.forEach(span => {
      if (span.trace_id === traceId) {
        spans.push(span);
      }
    });
    return spans.sort((a, b) => a.start_time - b.start_time);
  }

  getAllSpans(): Span[] {
    return Array.from(this.spans.values());
  }

  clear(): void {
    this.spans.clear();
    this.currentTraceId = null;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private getTraceId(spanId: string): string {
    const span = this.spans.get(spanId);
    return span?.trace_id || this.generateId();
  }

  private evictOldestSpan(): void {
    let oldest: Span | null = null;
    let oldestKey: string | null = null;

    this.spans.forEach((span, key) => {
      if (!oldest || span.start_time < oldest.start_time) {
        oldest = span;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.spans.delete(oldestKey);
    }
  }
}
