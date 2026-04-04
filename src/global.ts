/**
 * 全局配置系统
 * 
 * 让整个软件都能使用 AI 提示词工程框架
 */

import { PromptIntegration, createIntegration } from './integration';
import { MultiAgentOrchestrator, createMultiAgentOrchestrator } from './multi-agent';

export interface GlobalConfig {
  /** 是否启用提示词工程 */
  enabled: boolean;
  
  /** 使用模式：'single' | 'multi' | 'hybrid' */
  mode: 'single' | 'multi' | 'hybrid';
  
  /** 自动优化 */
  autoOptimize: boolean;
  
  /** 上下文记忆 */
  enableContext: boolean;
  
  /** 日志级别 */
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'none';
  
  /** 性能监控 */
  enableMonitoring: boolean;
  
  /** 持久化配置 */
  persistence?: {
    enabled: boolean;
    type: 'file' | 'database' | 'memory';
    path?: string;
  };
  
  /** 智能体配置 */
  agents?: {
    /** 默认智能体 */
    default?: string;
    /** 自定义智能体 */
    custom?: Array<{
      name: string;
      type: string;
      keywords: string[];
      priority: number;
    }>;
  };
}

class GlobalAIPromptSystem {
  private static instance: GlobalAIPromptSystem;
  private config: GlobalConfig;
  private integration: PromptIntegration | null = null;
  private orchestrator: MultiAgentOrchestrator | null = null;
  private stats = {
    totalQueries: 0,
    optimizedQueries: 0,
    averageDuration: 0,
    agentUsage: new Map<string, number>()
  };

  private constructor(config?: Partial<GlobalConfig>) {
    this.config = {
      enabled: true,
      mode: 'multi',
      autoOptimize: true,
      enableContext: true,
      logLevel: 'info',
      enableMonitoring: true,
      ...config
    };

    this.initialize();
  }

  /**
   * 获取全局实例
   */
  static getInstance(config?: Partial<GlobalConfig>): GlobalAIPromptSystem {
    if (!GlobalAIPromptSystem.instance) {
      GlobalAIPromptSystem.instance = new GlobalAIPromptSystem(config);
    }
    return GlobalAIPromptSystem.instance;
  }

  /**
   * 初始化系统
   */
  private initialize(): void {
    if (!this.config.enabled) {
      this.log('warn', 'AI Prompt Framework is disabled');
      return;
    }

    this.log('info', 'Initializing AI Prompt Framework...');

    // 初始化单一智能体
    if (this.config.mode === 'single' || this.config.mode === 'hybrid') {
      this.integration = createIntegration({
        autoOptimize: this.config.autoOptimize,
        enableContext: this.config.enableContext
      });
      this.log('info', 'Single agent mode initialized');
    }

    // 初始化多智能体
    if (this.config.mode === 'multi' || this.config.mode === 'hybrid') {
      this.orchestrator = createMultiAgentOrchestrator();
      this.log('info', 'Multi-agent mode initialized');
    }

    this.log('info', 'AI Prompt Framework initialized successfully');
  }

  /**
   * 处理用户问题（核心方法）
   */
  async ask(question: string, options?: {
    mode?: 'single' | 'multi';
    agent?: string;
    context?: any;
  }): Promise<{
    answer: string;
    metadata: {
      mode: string;
      agent?: string;
      optimized: boolean;
      duration: number;
      confidence?: number;
    };
  }> {
    if (!this.config.enabled) {
      return {
        answer: await this.fallbackAsk(question),
        metadata: {
          mode: 'fallback',
          optimized: false,
          duration: 0
        }
      };
    }

    const startTime = Date.now();
    const mode = options?.mode || this.config.mode;

    try {
      let result: any;
      let metadata: any;

      // 使用多智能体模式
      if ((mode === 'multi' || mode === 'hybrid') && this.orchestrator) {
        result = await this.orchestrator.executeTask({
          type: 'question',
          content: question,
          preferredAgent: options?.agent,
          context: options?.context
        });

        metadata = {
          mode: 'multi',
          agent: result.agentName,
          optimized: true,
          duration: result.duration,
          confidence: result.confidence
        };

        // 更新统计
        this.stats.agentUsage.set(
          result.agentName,
          (this.stats.agentUsage.get(result.agentName) || 0) + 1
        );
      }
      // 使用单一智能体模式
      else if (this.integration) {
        result = await this.integration.ask(question, options?.context);

        metadata = {
          mode: 'single',
          optimized: result.optimized,
          duration: result.duration
        };
      }
      // 后备方案
      else {
        result = { content: await this.fallbackAsk(question) };
        metadata = {
          mode: 'fallback',
          optimized: false,
          duration: 0
        };
      }

      // 更新统计
      this.stats.totalQueries++;
      if (metadata.optimized) {
        this.stats.optimizedQueries++;
      }
      this.stats.averageDuration = 
        (this.stats.averageDuration * (this.stats.totalQueries - 1) + metadata.duration) / 
        this.stats.totalQueries;

      return {
        answer: result.result || result.content,
        metadata
      };
    } catch (error) {
      this.log('error', `Error processing question: ${error}`);
      return {
        answer: await this.fallbackAsk(question),
        metadata: {
          mode: 'error',
          optimized: false,
          duration: Date.now() - startTime
        }
      };
    }
  }

  /**
   * 批量处理问题
   */
  async batchAsk(questions: string[]): Promise<Array<{
    question: string;
    answer: string;
    metadata: any;
  }>> {
    const results = [];

    for (const question of questions) {
      const result = await this.ask(question);
      results.push({
        question,
        ...result
      });
    }

    return results;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalQueries: number;
    optimizedQueries: number;
    optimizationRate: number;
    averageDuration: number;
    agentUsage: Record<string, number>;
  } {
    return {
      totalQueries: this.stats.totalQueries,
      optimizedQueries: this.stats.optimizedQueries,
      optimizationRate: this.stats.totalQueries > 0 
        ? (this.stats.optimizedQueries / this.stats.totalQueries) * 100 
        : 0,
      averageDuration: this.stats.averageDuration,
      agentUsage: Object.fromEntries(this.stats.agentUsage)
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<GlobalConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', 'Configuration updated');
    
    // 如果禁用，清理资源
    if (!newConfig.enabled) {
      this.integration = null;
      this.orchestrator = null;
    }
    // 如果启用，重新初始化
    else if (newConfig.enabled && !this.integration && !this.orchestrator) {
      this.initialize();
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): GlobalConfig {
    return { ...this.config };
  }

  /**
   * 后备方案（当框架不可用时）
   */
  private async fallbackAsk(question: string): Promise<string> {
    this.log('warn', 'Using fallback mode - AI Prompt Framework not available');
    return `Fallback response to: ${question}`;
  }

  /**
   * 日志记录
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    if (this.config.logLevel === 'none') return;

    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] < levels[this.config.logLevel]) return;

    const timestamp = new Date().toISOString();
    const prefix = `[AI-Prompt-Framework][${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(`${timestamp} ${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${timestamp} ${prefix} ${message}`);
        break;
      case 'info':
        console.info(`${timestamp} ${prefix} ${message}`);
        break;
      case 'debug':
        console.debug(`${timestamp} ${prefix} ${message}`);
        break;
    }
  }
}

/**
 * 创建全局 AI 提示词系统
 */
export function createGlobalAIPromptSystem(config?: Partial<GlobalConfig>): GlobalAIPromptSystem {
  return GlobalAIPromptSystem.getInstance(config);
}

/**
 * 快速访问函数
 */
let globalInstance: GlobalAIPromptSystem | null = null;

export function initializeGlobal(config?: Partial<GlobalConfig>): void {
  globalInstance = createGlobalAIPromptSystem(config);
}

export async function askAI(question: string, options?: any): Promise<string> {
  if (!globalInstance) {
    initializeGlobal();
  }
  const result = await globalInstance!.ask(question, options);
  return result.answer;
}

export function getAIStats(): any {
  if (!globalInstance) {
    return { error: 'Not initialized' };
  }
  return globalInstance.getStats();
}
