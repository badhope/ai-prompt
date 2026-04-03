import { PromptFramework } from './index';

export class EasyAPI {
  private framework: PromptFramework;

  constructor(config?: any) {
    this.framework = new PromptFramework(config);
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

  async quick(content: string, variables?: Record<string, any>) {
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

  async batch(tasks: Array<{ content: string; variables?: Record<string, any> }>) {
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

  async *stream(content: string, variables?: Record<string, any>) {
    const prompt = await this.framework.createPrompt({
      name: 'stream-prompt',
      content,
      variables
    });

    yield* this.framework.stream(prompt.id);
  }

  getStats() {
    return this.framework.getStats();
  }

  getCostBreakdown() {
    return this.framework.getCostBreakdown();
  }

  onBudgetAlert(callback: (alert: any) => void) {
    return this.framework.onBudgetAlert(callback);
  }
}

export class PromptBuilder {
  private framework: PromptFramework;
  private name: string;
  private _content?: string;
  private _variables?: Record<string, any>;
  private _tags?: string[];
  private _version?: string;

  constructor(framework: PromptFramework, name: string) {
    this.framework = framework;
    this.name = name;
  }

  content(content: string) {
    this._content = content;
    return this;
  }

  variables(variables: Record<string, any>) {
    this._variables = variables;
    return this;
  }

  tags(tags: string[]) {
    this._tags = tags;
    return this;
  }

  version(version: string) {
    this._version = version;
    return this;
  }

  async create() {
    return this.framework.createPrompt({
      name: this.name,
      content: this._content || '',
      variables: this._variables,
      tags: this._tags,
      version: this._version
    });
  }

  async execute() {
    const prompt = await this.create();
    return this.framework.execute(prompt.id);
  }
}

export class TemplateBuilder {
  private framework: PromptFramework;
  private name: string;
  private _content?: string;
  private _variables?: string[];

  constructor(framework: PromptFramework, name: string) {
    this.framework = framework;
    this.name = name;
  }

  content(content: string) {
    this._content = content;
    return this;
  }

  variables(variables: string[]) {
    this._variables = variables;
    return this;
  }

  async create() {
    return this.framework.createTemplate({
      name: this.name,
      content: this._content || '',
      variables: this._variables
    });
  }

  async fill(variables: Record<string, any>) {
    const template = await this.create();
    return this.framework.fillTemplate(template.id, variables);
  }
}

export class ConversationBuilder {
  private framework: PromptFramework;
  private name: string;
  private _systemPrompt?: string;

  constructor(framework: PromptFramework, name: string) {
    this.framework = framework;
    this.name = name;
  }

  systemPrompt(prompt: string) {
    this._systemPrompt = prompt;
    return this;
  }

  async create() {
    return this.framework.createConversation({
      name: this.name,
      systemPrompt: this._systemPrompt
    });
  }

  async chat(message: string) {
    const conversation = await this.create();
    return this.framework.chat(conversation.id, message);
  }
}

export class AgentBuilder {
  private framework: PromptFramework;
  private name: string;
  private _type?: string;
  private _systemPrompt?: string;
  private _capabilities?: string[];

  constructor(framework: PromptFramework, name: string) {
    this.framework = framework;
    this.name = name;
  }

  type(type: string) {
    this._type = type;
    return this;
  }

  systemPrompt(prompt: string) {
    this._systemPrompt = prompt;
    return this;
  }

  capabilities(capabilities: string[]) {
    this._capabilities = capabilities;
    return this;
  }

  async create() {
    return this.framework.createAgent({
      name: this.name,
      type: this._type,
      systemPrompt: this._systemPrompt,
      capabilities: this._capabilities
    });
  }

  async execute(task: any) {
    const agent = await this.create();
    return this.framework.executeAgent(agent.id, task);
  }
}

export function createEasyAPI(config?: any) {
  return new EasyAPI(config);
}
