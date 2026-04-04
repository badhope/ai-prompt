import { PromptFramework } from './index';
import {
  PromptConfig,
  TemplateConfig,
  ConversationConfig,
  AgentConfig,
  BudgetAlert
} from './types/framework';

export class EasyAPI {
  private framework: PromptFramework;

  constructor(config?: unknown) {
    this.framework = new PromptFramework(config as Record<string, unknown> | undefined);
  }

  prompt(name: string) {
    return new PromptBuilder(this.framework, name);
  }

  template(name: string) {
    return new TemplateBuilder(this.framework, name);
  }

  conversation(name: string) {
    return new ConversationBuilder(this.framework, name);
  }

  agent(name: string) {
    return new AgentBuilder(this.framework, name);
  }

  async quick(content: string, variables?: Record<string, unknown>) {
    const prompt = await this.framework.createPrompt({
      name: 'quick-prompt',
      content,
      variables
    });
    return this.framework.execute(prompt.id);
  }

  async translate(text: string, targetLang: string = '英文') {
    return this.quick(`翻译成${targetLang}：{{text}}`, { text });
  }

  async summarize(text: string) {
    return this.quick('请总结以下内容：{{text}}', { text });
  }

  async codeReview(code: string, language: string = 'TypeScript') {
    return this.quick(
      `请审查以下{{language}}代码并提供改进建议：\n\n\`\`\`{{language}}\n{{code}}\n\`\`\``,
      { code, language }
    );
  }

  async generateDoc(code: string, language: string = 'TypeScript') {
    return this.quick(
      `请为以下{{language}}代码生成文档：\n\n\`\`\`{{language}}\n{{code}}\n\`\`\``,
      { code, language }
    );
  }

  async explain(code: string, language: string = 'TypeScript') {
    return this.quick(
      `请解释以下{{language}}代码的功能：\n\n\`\`\`{{language}}\n{{code}}\n\`\`\``,
      { code, language }
    );
  }

  async refactor(code: string, language: string = 'TypeScript') {
    return this.quick(
      `请重构以下{{language}}代码以提高质量：\n\n\`\`\`{{language}}\n{{code}}\n\`\`\``,
      { code, language }
    );
  }

  async writeTest(code: string, language: string = 'TypeScript') {
    return this.quick(
      `请为以下{{language}}代码编写单元测试：\n\n\`\`\`{{language}}\n{{code}}\n\`\`\``,
      { code, language }
    );
  }

  async chat(message: string, context?: string) {
    const conversation = await this.framework.createConversation({
      name: 'quick-chat',
      systemPrompt: context || '你是一个友好的AI助手。'
    });
    return this.framework.chat(conversation.id, message);
  }

  async batch(tasks: Array<{ content: string; variables?: Record<string, unknown> }>) {
    if (tasks.length === 0) {
      return [];
    }

    const prompts = await Promise.all(
      tasks.map(task =>
        this.framework.createPrompt({
          name: 'batch-prompt',
          content: task.content,
          variables: task.variables
        })
      )
    );

    return Promise.all(
      prompts.map(prompt => this.framework.execute(prompt.id))
    );
  }

  getStats() {
    return this.framework.getStats();
  }

  getCostBreakdown() {
    return this.framework.getCostBreakdown();
  }

  onBudgetAlert(callback: (alert: BudgetAlert) => void) {
    return this.framework.onBudgetAlert(callback);
  }
}

abstract class BaseBuilder<T, Self extends BaseBuilder<T, Self>> {
  protected framework: PromptFramework;
  protected config: Partial<T> = {};

  constructor(framework: PromptFramework) {
    this.framework = framework;
  }

  protected set<K extends keyof T>(key: K, value: T[K]): Self {
    this.config[key] = value;
    return this as unknown as Self;
  }
}

export class PromptBuilder extends BaseBuilder<PromptConfig, PromptBuilder> {
  private name: string;

  constructor(framework: PromptFramework, name: string) {
    super(framework);
    this.name = name;
  }

  content(content: string) {
    return this.set('content', content);
  }

  variables(variables: Record<string, unknown>) {
    return this.set('variables', variables);
  }

  tags(tags: string[]) {
    return this.set('tags', tags);
  }

  version(version: string) {
    return this.set('version', version);
  }

  async create() {
    return this.framework.createPrompt({
      name: this.name,
      content: this.config.content || '',
      variables: this.config.variables,
      tags: this.config.tags,
      version: this.config.version
    });
  }

  async execute() {
    const prompt = await this.create();
    return this.framework.execute(prompt.id);
  }
}

export class TemplateBuilder extends BaseBuilder<TemplateConfig, TemplateBuilder> {
  private name: string;

  constructor(framework: PromptFramework, name: string) {
    super(framework);
    this.name = name;
  }

  content(content: string) {
    return this.set('content', content);
  }

  variables(variables: string[]) {
    return this.set('variables', variables);
  }

  async create() {
    return this.framework.createTemplate({
      name: this.name,
      content: this.config.content || '',
      variables: this.config.variables || []
    });
  }

  async fill(variables: Record<string, unknown>) {
    const template = await this.create();
    return this.framework.fillTemplate(template.id, variables);
  }
}

export class ConversationBuilder extends BaseBuilder<ConversationConfig, ConversationBuilder> {
  private name: string;

  constructor(framework: PromptFramework, name: string) {
    super(framework);
    this.name = name;
  }

  systemPrompt(systemPrompt: string) {
    return this.set('systemPrompt', systemPrompt);
  }

  async create() {
    return this.framework.createConversation({
      name: this.name,
      systemPrompt: this.config.systemPrompt
    });
  }

  async chat(message: string) {
    const conversation = await this.create();
    return this.framework.chat(conversation.id, message);
  }
}

export class AgentBuilder extends BaseBuilder<AgentConfig, AgentBuilder> {
  private name: string;

  constructor(framework: PromptFramework, name: string) {
    super(framework);
    this.name = name;
  }

  type(type: string) {
    return this.set('type', type);
  }

  systemPrompt(systemPrompt: string) {
    return this.set('systemPrompt', systemPrompt);
  }

  capabilities(capabilities: string[]) {
    return this.set('capabilities', capabilities);
  }

  async create() {
    return this.framework.createAgent({
      name: this.name,
      type: this.config.type,
      systemPrompt: this.config.systemPrompt,
      capabilities: this.config.capabilities
    });
  }

  async execute(task: unknown) {
    const agent = await this.create();
    return this.framework.executeAgent(agent.id, task);
  }
}

export function createEasyAPI(config?: unknown) {
  return new EasyAPI(config);
}
