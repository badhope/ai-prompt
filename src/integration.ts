/**
 * AI 提示词工程集成层
 * 
 * 将提示词工程无缝集成到软件中，自动应用优化的提示词策略。
 */

import { PromptFramework } from './index';
import { createEasyAPI } from './easy-api';
import { PromptOptimizer, OptimizationOptions } from './optimizer';

export interface IntegrationConfig {
  autoOptimize?: boolean;
  enableContext?: boolean;
  maxContextLength?: number;
  defaultTemplate?: string;
  /** 压缩级别 0-3，级别越高越省 token */
  compressLevel?: 0 | 1 | 2 | 3;
  /** 自动启用思维链 */
  enableCoT?: boolean;
  /** 自动角色识别 */
  autoRole?: boolean;
  customEnhancer?: (input: string, context?: Record<string, unknown>) => string;
  optimizer?: Partial<OptimizationOptions>;
}

export interface AIResponse {
  content: string;
  promptUsed: string;
  promptOriginal?: string;
  optimized: boolean;
  compressLevel: number;
  tokenSaved: number;
  compressionRate: number;
  duration: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class PromptIntegration {
  private framework: PromptFramework;
  private easyAPI: ReturnType<typeof createEasyAPI>;
  private optimizer: PromptOptimizer;
  private config: Required<IntegrationConfig>;
  private conversationHistory: Map<string, Message[]> = new Map();

  constructor(config?: IntegrationConfig) {
    this.config = {
      autoOptimize: true,
      enableContext: true,
      maxContextLength: 10,
      defaultTemplate: '{{question}}',
      compressLevel: 2,
      enableCoT: true,
      autoRole: true,
      customEnhancer: (input: string) => input,
      optimizer: {},
      ...config
    };

    this.framework = new PromptFramework();
    this.easyAPI = createEasyAPI();
    this.optimizer = new PromptOptimizer();
  }

  /**
   * 处理用户问题并获取 AI 回复
   */
  async ask(question: string, context?: Record<string, unknown>): Promise<AIResponse> {
    const startTime = Date.now();

    const role = (this.config.autoRole ? this.detectRole(question) : undefined) as import('./optimizer').RoleType | undefined;

    const optimized = this.optimizer.optimize(question, {
      compressLevel: this.config.compressLevel,
      cot: this.config.enableCoT ? 'minimal' : 'none',
      role,
      ...this.config.optimizer
    });

    const enhancedPrompt = this.applyTemplate(optimized.optimized);
    const result = await this.easyAPI.quick(enhancedPrompt);

    if (this.config.enableContext) {
      this.saveContext(question, result.result);
    }

    return {
      content: result.result,
      promptUsed: enhancedPrompt,
      promptOriginal: question,
      optimized: this.config.autoOptimize,
      compressLevel: this.config.compressLevel,
      tokenSaved: optimized.tokenSaved,
      compressionRate: optimized.compressionRate,
      duration: Date.now() - startTime
    };
  }

  /**
   * 使用模板快速提问
   */
  async withTemplate(
    templateContent: string,
    variables: Record<string, unknown>
  ): Promise<AIResponse> {
    const startTime = Date.now();

    const template = await this.framework.createTemplate({
      name: 'custom-template',
      content: templateContent,
      variables: Object.keys(variables)
    });

    const prompt = await this.framework.fillTemplate(template.id, variables);
    const result = await this.framework.execute(prompt.id);

    return {
      content: result.result,
      promptUsed: prompt.content,
      optimized: false,
      compressLevel: 0,
      tokenSaved: 0,
      compressionRate: 0,
      duration: Date.now() - startTime
    };
  }

  /**
   * 批量处理问题
   */
  async batch(questions: string[]): Promise<AIResponse[]> {
    const results = await this.easyAPI.batch(
      questions.map(q => ({ content: q }))
    );

    return results.map((result, index) => ({
      content: result.result,
      promptUsed: questions[index],
      optimized: false,
      compressLevel: 0,
      tokenSaved: 0,
      compressionRate: 0,
      duration: 0
    }));
  }

  /**
   * 获取对话历史
   */
  getHistory(conversationId: string = 'default'): Message[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * 清空对话历史
   */
  clearHistory(conversationId: string = 'default'): void {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * 应用提示词模板
   */
  private applyTemplate(question: string): string {
    return this.config.defaultTemplate.replace('{{question}}', question);
  }

  /**
   * 保存上下文
   */
  private saveContext(question: string, answer: string): void {
    const history = this.getHistory();
    history.push(
      { role: 'user', content: question, timestamp: new Date() },
      { role: 'assistant', content: answer, timestamp: new Date() }
    );

    while (history.length > this.config.maxContextLength * 2) {
      history.shift();
    }

    this.conversationHistory.set('default', history);
  }

  /**
   * 自动识别角色 - 根据关键词判断问题类型
   */
  private detectRole(question: string): string | undefined {
    const patterns: Array<{ keywords: string[]; role: string }> = [
      { keywords: ['代码', '函数', '类', 'bug', '调试', '重构'], role: 'code' },
      { keywords: ['审查', 'review', '问题', '改进'], role: 'review' },
      { keywords: ['翻译', '英文', '中文'], role: 'translate' },
      { keywords: ['文档', '注释', '说明', 'README'], role: 'doc' },
      { keywords: ['测试', '单元测试', '测试用例'], role: 'test' },
      { keywords: ['分析', '数据', '统计'], role: 'analyze' },
      { keywords: ['架构', '设计', '系统', '性能'], role: 'architect' },
      { keywords: ['安全', '漏洞', '加密'], role: 'security' },
    ];

    for (const { keywords, role } of patterns) {
      if (keywords.some(k => question.includes(k))) {
        return role;
      }
    }

    return undefined;
  }
}

export function createIntegration(config?: IntegrationConfig): PromptIntegration {
  return new PromptIntegration(config);
}
