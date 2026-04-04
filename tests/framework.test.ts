import { describe, it, expect } from 'vitest';
import { PromptFramework } from '../src/index';
import { createEasyAPI } from '../src/easy-api';

describe('PromptFramework', () => {
  it('should create a prompt', async () => {
    const framework = new PromptFramework();
    const prompt = await framework.createPrompt({
      name: 'test',
      content: 'Hello {{name}}',
      variables: { name: 'World' }
    });

    expect(prompt.id).toBeDefined();
    expect(prompt.name).toBe('test');
    expect(prompt.content).toBe('Hello {{name}}');
  });

  it('should execute a prompt', async () => {
    const framework = new PromptFramework();
    const prompt = await framework.createPrompt({
      name: 'test',
      content: 'Hello {{name}}',
      variables: { name: 'World' }
    });

    const result = await framework.execute(prompt.id);
    expect(result.id).toBeDefined();
    expect(result.promptId).toBe(prompt.id);
    expect(result.result).toContain('Executed');
  });

  it('should create a template', async () => {
    const framework = new PromptFramework();
    const template = await framework.createTemplate({
      name: 'greeting',
      content: 'Hello {{name}}',
      variables: ['name']
    });

    expect(template.id).toBeDefined();
    expect(template.name).toBe('greeting');
  });

  it('should fill a template', async () => {
    const framework = new PromptFramework();
    const template = await framework.createTemplate({
      name: 'greeting',
      content: 'Hello {{name}}',
      variables: ['name']
    });

    const prompt = await framework.fillTemplate(template.id, { name: 'World' });
    expect(prompt.content).toBe('Hello World');
  });

  it('should create a conversation', async () => {
    const framework = new PromptFramework();
    const conversation = await framework.createConversation({
      name: 'test-chat',
      systemPrompt: 'You are a helpful assistant'
    });

    expect(conversation.id).toBeDefined();
    expect(conversation.name).toBe('test-chat');
    expect(conversation.messages).toHaveLength(0);
  });

  it('should chat in a conversation', async () => {
    const framework = new PromptFramework();
    const conversation = await framework.createConversation({
      name: 'test-chat'
    });

    const response = await framework.chat(conversation.id, 'Hello');
    expect(response).toContain('Response to: Hello');
  });

  it('should create an agent', async () => {
    const framework = new PromptFramework();
    const agent = await framework.createAgent({
      name: 'test-agent',
      type: 'assistant',
      capabilities: ['chat']
    });

    expect(agent.id).toBeDefined();
    expect(agent.name).toBe('test-agent');
  });

  it('should execute an agent', async () => {
    const framework = new PromptFramework();
    const agent = await framework.createAgent({
      name: 'test-agent'
    });

    const result = await framework.executeAgent(agent.id, { task: 'test' });
    expect(result.agentId).toBe(agent.id);
    expect(result.result).toContain('test-agent');
  });

  it('should get stats', () => {
    const framework = new PromptFramework();
    const stats = framework.getStats();

    expect(stats).toHaveProperty('totalPrompts');
    expect(stats).toHaveProperty('totalExecutions');
    expect(stats).toHaveProperty('totalCost');
  });
});

describe('EasyAPI', () => {
  it('should create quick prompt', async () => {
    const api = createEasyAPI();
    const result = await api.quick('Hello {{name}}', { name: 'World' });
    expect(result.result).toBeDefined();
  });

  it('should translate text', async () => {
    const api = createEasyAPI();
    const result = await api.translate('你好');
    expect(result.result).toContain('翻译成英文');
  });

  it('should summarize text', async () => {
    const api = createEasyAPI();
    const result = await api.summarize('Long text here...');
    expect(result.result).toContain('总结');
  });

  it('should review code', async () => {
    const api = createEasyAPI();
    const result = await api.codeReview('const x = 1;');
    expect(result.result).toContain('审查');
  });

  it('should use builder pattern', async () => {
    const api = createEasyAPI();
    const result = await api
      .prompt('test')
      .content('Hello {{name}}')
      .variables({ name: 'World' })
      .execute();

    expect(result.result).toBeDefined();
  });

  it('should batch operations', async () => {
    const api = createEasyAPI();
    const results = await api.batch([
      { content: 'Task 1' },
      { content: 'Task 2' }
    ]);

    expect(results).toHaveLength(2);
  });
});
