import {
  PromptConfig,
  Prompt,
  TemplateConfig,
  Template,
  ConversationConfig,
  Conversation,
  ExecutionResult,
  FrameworkConfig,
  Stats,
  ValidationError,
  NotFoundError,
  BudgetAlert
} from './types/framework';

export class PromptFramework {
  private config: FrameworkConfig;
  private prompts: Map<string, Prompt> = new Map();
  private templates: Map<string, Template> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private executions: ExecutionResult[] = [];
  private budgetAlertCallback?: (alert: BudgetAlert) => void;

  constructor(config?: FrameworkConfig) {
    this.config = config || {};
  }

  async createPrompt(config: PromptConfig): Promise<Prompt> {
    if (!config.name || config.name.trim() === '') {
      throw new ValidationError('name', 'Prompt name cannot be empty');
    }
    if (!config.content || config.content.trim() === '') {
      throw new ValidationError('content', 'Prompt content cannot be empty');
    }

    const id = this.generateId();
    const now = new Date();
    
    const prompt: Prompt = {
      id,
      ...config,
      createdAt: now,
      updatedAt: now
    };
    
    this.prompts.set(id, prompt);
    return prompt;
  }

  async getPrompt(id: string): Promise<Prompt | undefined> {
    return this.prompts.get(id);
  }

  async updatePrompt(id: string, updates: Partial<PromptConfig>): Promise<Prompt> {
    const prompt = this.prompts.get(id);
    if (!prompt) {
      throw new NotFoundError('Prompt', id);
    }
    
    if (updates.content !== undefined && updates.content.trim() === '') {
      throw new ValidationError('content', 'Prompt content cannot be empty');
    }
    
    const updated = {
      ...prompt,
      ...updates,
      updatedAt: new Date()
    };
    
    this.prompts.set(id, updated);
    return updated;
  }

  async deletePrompt(id: string): Promise<void> {
    this.prompts.delete(id);
  }

  async execute(promptId: string): Promise<ExecutionResult> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) {
      throw new NotFoundError('Prompt', promptId);
    }

    const startTime = Date.now();
    const result: ExecutionResult = {
      id: this.generateId(),
      promptId,
      result: `Executed: ${prompt.content}`,
      tokens: {
        input: 100,
        output: 50,
        total: 150
      },
      cost: 0.001,
      duration: Date.now() - startTime,
      timestamp: new Date()
    };

    this.executions.push(result);
    this.checkBudgetAlerts();

    return result;
  }

  async createTemplate(config: TemplateConfig): Promise<Template> {
    if (!config.name || config.name.trim() === '') {
      throw new ValidationError('name', 'Template name cannot be empty');
    }
    if (!config.content || config.content.trim() === '') {
      throw new ValidationError('content', 'Template content cannot be empty');
    }

    const id = this.generateId();
    
    const template: Template = {
      id,
      ...config,
      createdAt: new Date()
    };
    
    this.templates.set(id, template);
    return template;
  }

  async fillTemplate(templateId: string, variables: Record<string, unknown>): Promise<Prompt> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new NotFoundError('Template', templateId);
    }

    let content = template.content;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    return this.createPrompt({
      name: template.name,
      content,
      variables
    });
  }

  async createConversation(config: ConversationConfig): Promise<Conversation> {
    if (!config.name || config.name.trim() === '') {
      throw new ValidationError('name', 'Conversation name cannot be empty');
    }

    const id = this.generateId();
    
    const conversation: Conversation = {
      id,
      ...config,
      messages: [],
      createdAt: new Date()
    };
    
    this.conversations.set(id, conversation);
    return conversation;
  }

  async chat(conversationId: string, message: string): Promise<string> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation', conversationId);
    }

    if (!message || message.trim() === '') {
      throw new ValidationError('message', 'Message cannot be empty');
    }

    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    const response = `Response to: ${message}`;
    
    conversation.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    return response;
  }

  getStats(): Stats {
    const totalExecutions = this.executions.length;
    const totalCost = this.executions.reduce((sum, exec) => sum + exec.cost, 0);
    const averageDuration = totalExecutions > 0
      ? this.executions.reduce((sum, exec) => sum + exec.duration, 0) / totalExecutions
      : 0;

    return {
      totalPrompts: this.prompts.size,
      totalExecutions,
      totalCost,
      averageDuration
    };
  }

  getCostBreakdown(): { daily: number; monthly: number; total: number } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const daily = this.executions
      .filter(exec => exec.timestamp >= today)
      .reduce((sum, exec) => sum + exec.cost, 0);

    const monthly = this.executions
      .filter(exec => exec.timestamp >= monthStart)
      .reduce((sum, exec) => sum + exec.cost, 0);

    const total = this.executions.reduce((sum, exec) => sum + exec.cost, 0);

    return { daily, monthly, total };
  }

  onBudgetAlert(callback: (alert: BudgetAlert) => void): void {
    this.budgetAlertCallback = callback;
  }

  private checkBudgetAlerts(): void {
    if (!this.budgetAlertCallback || !this.config.budget?.enabled) {
      return;
    }

    const breakdown = this.getCostBreakdown();
    const { budget } = this.config;

    if (budget.dailyLimit && breakdown.daily >= budget.dailyLimit * (budget.alertThreshold || 0.8)) {
      this.budgetAlertCallback({
        type: 'daily',
        currentCost: breakdown.daily,
        limit: budget.dailyLimit,
        percentage: (breakdown.daily / budget.dailyLimit) * 100,
        timestamp: new Date()
      });
    }

    if (budget.monthlyLimit && breakdown.monthly >= budget.monthlyLimit * (budget.alertThreshold || 0.8)) {
      this.budgetAlertCallback({
        type: 'monthly',
        currentCost: breakdown.monthly,
        limit: budget.monthlyLimit,
        percentage: (breakdown.monthly / budget.monthlyLimit) * 100,
        timestamp: new Date()
      });
    }
  }

  private generateId(): string {
    // @ts-ignore - crypto is available in modern environments
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      // @ts-ignore
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

export { PromptOptimizer, createOptimizer, optimizePrompt } from './optimizer';
export type * from './optimizer';

export { Toolkit, createToolkit, builtInTools } from './tools';
export type * from './tools';

export { Agent, createAgent } from './agent';
export type * from './agent';

export { PromptIntegration, createIntegration } from './integration';
export type * from './integration';

export default PromptFramework;
