/**
 * AI 提示词工程集成层
 * 
 * 这个模块将提示词工程集成到您的软件中，
 * 让每次用户提问都能自动应用优化的提示词。
 */

import { PromptFramework } from './index';
import { createEasyAPI } from './easy-api';

export interface IntegrationConfig {
  /** 是否启用自动优化 */
  autoOptimize?: boolean;
  /** 是否启用上下文记忆 */
  enableContext?: boolean;
  /** 最大上下文长度 */
  maxContextLength?: number;
  /** 默认提示词模板 */
  defaultTemplate?: string;
  /** 自定义提示词增强函数 */
  customEnhancer?: (input: string, context?: any) => string;
}

export interface UserQuestion {
  /** 用户原始问题 */
  original: string;
  /** 优化后的问题 */
  optimized: string;
  /** 使用的提示词模板 */
  template?: string;
  /** 上下文信息 */
  context?: any;
}

export interface AIResponse {
  /** AI 回复内容 */
  content: string;
  /** 使用的提示词 */
  promptUsed: string;
  /** 是否经过优化 */
  optimized: boolean;
  /** 执行时间（毫秒） */
  duration: number;
}

export class PromptIntegration {
  private framework: PromptFramework;
  private easyAPI: ReturnType<typeof createEasyAPI>;
  private config: IntegrationConfig;
  private conversationHistory: Map<string, any[]> = new Map();

  constructor(config?: IntegrationConfig) {
    this.config = {
      autoOptimize: true,
      enableContext: true,
      maxContextLength: 10,
      defaultTemplate: '请详细回答以下问题：{{question}}',
      ...config
    };

    this.framework = new PromptFramework();
    this.easyAPI = createEasyAPI();
  }

  /**
   * 处理用户问题并获取 AI 回复
   */
  async ask(question: string, context?: any): Promise<AIResponse> {
    const startTime = Date.now();

    // 1. 优化问题
    const optimizedQuestion = this.optimizeQuestion(question, context);

    // 2. 应用提示词模板
    const enhancedPrompt = this.applyTemplate(optimizedQuestion, context);

    // 3. 执行提示词
    const result = await this.easyAPI.quick(enhancedPrompt);

    // 4. 保存上下文
    if (this.config.enableContext) {
      this.saveContext(question, result.result);
    }

    const duration = Date.now() - startTime;

    return {
      content: result.result,
      promptUsed: enhancedPrompt,
      optimized: this.config.autoOptimize ?? true,
      duration
    };
  }

  /**
   * 使用预设模板快速提问
   */
  async quickAsk(
    question: string,
    templateName: string,
    variables?: Record<string, any>
  ): Promise<string> {
    const template = await this.framework.createTemplate({
      name: templateName,
      content: this.getTemplateContent(templateName),
      variables: Object.keys(variables || {})
    });

    const prompt = await this.framework.fillTemplate(template.id, {
      question,
      ...variables
    });

    const result = await this.framework.execute(prompt.id);
    return result.result;
  }

  /**
   * 使用预设场景提问
   */
  async askWithScenario(
    question: string,
    scenario: 'code' | 'writing' | 'analysis' | 'translation' | 'creative',
    options?: any
  ): Promise<string> {
    return this.quickAsk(question, scenario, { ...options, question });
  }

  /**
   * 批量处理问题
   */
  async batchAsk(questions: string[]): Promise<AIResponse[]> {
    const results = await this.easyAPI.batch(
      questions.map(q => ({ content: q }))
    );

    return results.map((result, index) => ({
      content: result.result,
      promptUsed: questions[index],
      optimized: false,
      duration: 0
    }));
  }

  /**
   * 获取对话历史
   */
  getHistory(conversationId: string = 'default'): any[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * 清空对话历史
   */
  clearHistory(conversationId: string = 'default'): void {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * 优化问题（添加提示词工程技巧）
   */
  private optimizeQuestion(question: string, context?: any): string {
    if (!this.config.autoOptimize) {
      return question;
    }

    // 使用自定义增强函数
    if (this.config.customEnhancer) {
      return this.config.customEnhancer(question, context);
    }

    // 默认优化策略
    const optimizations = [
      // 1. 添加角色设定
      this.addRoleContext(question),
      // 2. 明确任务类型
      this.specifyTask(question),
      // 3. 添加输出要求
      this.addOutputRequirements(question)
    ];

    return optimizations.filter(Boolean).join('\n');
  }

  /**
   * 应用提示词模板
   */
  private applyTemplate(question: string, _context?: any): string {
    const template = this.config.defaultTemplate || 
                     '请详细回答以下问题：{{question}}';
    
    return template.replace('{{question}}', question);
  }

  /**
   * 获取模板内容
   */
  private getTemplateContent(name: string): string {
    const templates: Record<string, string> = {
      code: '请作为资深程序员，帮我分析和优化以下代码：{{question}}',
      writing: '请作为专业作家，帮我改进以下文本：{{question}}',
      analysis: '请作为数据分析师，帮我深入分析：{{question}}',
      translation: '请作为专业翻译，帮我翻译以下内容：{{question}}',
      creative: '请发挥创意，帮我完成：{{question}}',
      default: '请详细回答以下问题：{{question}}'
    };

    return templates[name] || templates.default;
  }

  /**
   * 添加角色上下文
   */
  private addRoleContext(question: string): string {
    const roleKeywords: Record<string, string> = {
      '代码': '作为资深软件工程师',
      '翻译': '作为专业翻译',
      '写作': '作为专业作家',
      '分析': '作为数据分析师',
      '设计': '作为资深设计师',
      '优化': '作为性能优化专家'
    };

    for (const [keyword, role] of Object.entries(roleKeywords)) {
      if (question.includes(keyword)) {
        return `${role}，${question}`;
      }
    }

    return `作为 AI 助手，${question}`;
  }

  /**
   * 明确任务类型
   */
  private specifyTask(question: string): string {
    if (question.endsWith('?')) {
      return question + ' 请提供详细、准确的解答。';
    }
    return '请帮我：' + question + '。请提供详细步骤和说明。';
  }

  /**
   * 添加输出要求
   */
  private addOutputRequirements(_question: string): string {
    const requirements = [
      '回答要条理清晰',
      '提供具体示例',
      '避免歧义'
    ];

    return requirements.join('，') + '。';
  }

  /**
   * 保存上下文
   */
  private saveContext(question: string, answer: string): void {
    const conversationId = 'default';
    let history = this.conversationHistory.get(conversationId) || [];

    history.push({
      role: 'user',
      content: question,
      timestamp: Date.now()
    });

    history.push({
      role: 'assistant',
      content: answer,
      timestamp: Date.now()
    });

    // 限制历史记录长度
    if (history.length > (this.config.maxContextLength || 10) * 2) {
      history = history.slice(-(this.config.maxContextLength || 10) * 2);
    }

    this.conversationHistory.set(conversationId, history);
  }
}

/**
 * 创建集成实例
 */
export function createIntegration(config?: IntegrationConfig): PromptIntegration {
  return new PromptIntegration(config);
}

/**
 * 快速使用示例
 */
export async function quickAskAI(
  question: string,
  options?: Partial<IntegrationConfig>
): Promise<string> {
  const integration = createIntegration(options);
  const result = await integration.ask(question);
  return result.content;
}
