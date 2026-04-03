export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram';
}

export interface MetricsConfig {
  prefix: string;
  enable_default_metrics: boolean;
  histogram_buckets: number[];
}

export class MetricsCollector {
  private config: MetricsConfig;
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  constructor(config?: Partial<MetricsConfig>) {
    this.config = {
      prefix: 'ai_prompt_',
      enable_default_metrics: true,
      histogram_buckets: [0.1, 0.5, 1, 2.5, 5, 10],
      ...config,
    };
  }

  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  decrement(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.increment(name, -value, tags);
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    this.gauges.set(key, value);
  }

  histogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  timing(name: string, durationMs: number, tags?: Record<string, string>): void {
    this.histogram(name, durationMs, tags);
  }

  time<T>(name: string, tags?: Record<string, string>): (result?: T) => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.timing(name, duration, tags);
    };
  }

  async timePromise<T>(name: string, promise: Promise<T>, tags?: Record<string, string>): Promise<T> {
    const done = this.time(name, tags);
    try {
      const result = await promise;
      done();
      return result;
    } catch (error) {
      done();
      throw error;
    }
  }

  getCounter(name: string, tags?: Record<string, string>): number {
    const key = this.buildKey(name, tags);
    return this.counters.get(key) || 0;
  }

  getGauge(name: string, tags?: Record<string, string>): number {
    const key = this.buildKey(name, tags);
    return this.gauges.get(key) || 0;
  }

  getHistogram(name: string, tags?: Record<string, string>): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const key = this.buildKey(name, tags);
    const values = this.histograms.get(key) || [];

    if (values.length === 0) {
      return {
        count: 0,
        sum: 0,
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
    };
  }

  getAllMetrics(): Metric[] {
    const metrics: Metric[] = [];
    const timestamp = Date.now();

    this.counters.forEach((value, key) => {
      const { name, tags } = this.parseKey(key);
      metrics.push({
        name,
        value,
        timestamp,
        tags,
        type: 'counter',
      });
    });

    this.gauges.forEach((value, key) => {
      const { name, tags } = this.parseKey(key);
      metrics.push({
        name,
        value,
        timestamp,
        tags,
        type: 'gauge',
      });
    });

    this.histograms.forEach((values, key) => {
      const { name, tags } = this.parseKey(key);
      const stats = this.getHistogram(name, tags);
      
      metrics.push({
        name: `${name}_count`,
        value: stats.count,
        timestamp,
        tags,
        type: 'gauge',
      });
      
      metrics.push({
        name: `${name}_avg`,
        value: stats.avg,
        timestamp,
        tags,
        type: 'gauge',
      });
      
      metrics.push({
        name: `${name}_p95`,
        value: stats.p95,
        timestamp,
        tags,
        type: 'gauge',
      });
    });

    return metrics;
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, tags?: Record<string, string>): string {
    const fullName = `${this.config.prefix}${name}`;
    if (!tags || Object.keys(tags).length === 0) {
      return fullName;
    }

    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');

    return `${fullName}{${tagStr}}`;
  }

  private parseKey(key: string): { name: string; tags: Record<string, string> } {
    const match = key.match(/^([^{]+)(?:\{(.+)\})?$/);
    
    if (!match) {
      return { name: key, tags: {} };
    }

    const name = match[1];
    const tags: Record<string, string> = {};

    if (match[2]) {
      match[2].split(',').forEach(pair => {
        const [k, v] = pair.split('=');
        tags[k] = v;
      });
    }

    return { name, tags };
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}
