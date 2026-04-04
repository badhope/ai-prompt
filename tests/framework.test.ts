import { describe, it, expect } from 'vitest';
import { PromptFramework } from '../src/index';
import { createEasyAPI } from '../src/easy-api';
import { ValidationError, NotFoundError } from '../src/types/framework';

describe('PromptFramework', () => {
  describe('Prompt Management', () => {
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
      expect(prompt.createdAt).toBeInstanceOf(Date);
      expect(prompt.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when creating prompt with empty name', async () => {
      const framework = new PromptFramework();
      await expect(framework.createPrompt({
        name: '',
        content: 'test'
      })).rejects.toThrow(ValidationError);
    });

    it('should throw error when creating prompt with empty content', async () => {
      const framework = new PromptFramework();
      await expect(framework.createPrompt({
        name: 'test',
        content: ''
      })).rejects.toThrow(ValidationError);
    });

    it('should get a prompt by id', async () => {
      const framework = new PromptFramework();
      const prompt = await framework.createPrompt({
        name: 'test',
        content: 'Hello'
      });

      const retrieved = await framework.getPrompt(prompt.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(prompt.id);
    });

    it('should return undefined for non-existent prompt', async () => {
      const framework = new PromptFramework();
      const result = await framework.getPrompt('non-existent');
      expect(result).toBeUndefined();
    });

    it('should update a prompt', async () => {
      const framework = new PromptFramework();
      const prompt = await framework.createPrompt({
        name: 'test',
        content: 'Original'
      });

      const updated = await framework.updatePrompt(prompt.id, {
        content: 'Updated'
      });

      expect(updated.content).toBe('Updated');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(prompt.updatedAt.getTime());
    });

    it('should throw error when updating non-existent prompt', async () => {
      const framework = new PromptFramework();
      await expect(framework.updatePrompt('non-existent', {
        content: 'test'
      })).rejects.toThrow(NotFoundError);
    });

    it('should delete a prompt', async () => {
      const framework = new PromptFramework();
      const prompt = await framework.createPrompt({
        name: 'test',
        content: 'test'
      });

      await framework.deletePrompt(prompt.id);
      const result = await framework.getPrompt(prompt.id);
      expect(result).toBeUndefined();
    });

    it('should not throw when deleting non-existent prompt', async () => {
      const framework = new PromptFramework();
      await expect(framework.deletePrompt('non-existent')).resolves.not.toThrow();
    });
  });

  describe('Prompt Execution', () => {
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
      expect(result.tokens).toBeDefined();
      expect(result.cost).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error when executing non-existent prompt', async () => {
      const framework = new PromptFramework();
      await expect(framework.execute('non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should generate unique execution IDs', async () => {
      const framework = new PromptFramework();
      const prompt = await framework.createPrompt({
        name: 'test',
        content: 'test'
      });

      const result1 = await framework.execute(prompt.id);
      const result2 = await framework.execute(prompt.id);
      expect(result1.id).not.toBe(result2.id);
    });

    it('should track execution statistics', async () => {
      const framework = new PromptFramework();
      const prompt = await framework.createPrompt({
        name: 'test',
        content: 'test'
      });

      await framework.execute(prompt.id);
      await framework.execute(prompt.id);

      const stats = framework.getStats();
      expect(stats.totalExecutions).toBe(2);
      expect(stats.totalCost).toBeGreaterThan(0);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Template Management', () => {
    it('should create a template', async () => {
      const framework = new PromptFramework();
      const template = await framework.createTemplate({
        name: 'greeting',
        content: 'Hello {{name}}',
        variables: ['name']
      });

      expect(template.id).toBeDefined();
      expect(template.name).toBe('greeting');
      expect(template.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when creating template with empty name', async () => {
      const framework = new PromptFramework();
      await expect(framework.createTemplate({
        name: '',
        content: 'test',
        variables: []
      })).rejects.toThrow(ValidationError);
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

    it('should throw error when filling non-existent template', async () => {
      const framework = new PromptFramework();
      await expect(framework.fillTemplate('non-existent', {})).rejects.toThrow(NotFoundError);
    });

    it('should handle multiple variables in template', async () => {
      const framework = new PromptFramework();
      const template = await framework.createTemplate({
        name: 'email',
        content: 'Dear {{name}}, {{message}}',
        variables: ['name', 'message']
      });

      const prompt = await framework.fillTemplate(template.id, {
        name: 'John',
        message: 'Welcome!'
      });
      expect(prompt.content).toBe('Dear John, Welcome!');
    });
  });

  describe('Conversation Management', () => {
    it('should create a conversation', async () => {
      const framework = new PromptFramework();
      const conversation = await framework.createConversation({
        name: 'test-chat',
        systemPrompt: 'You are a helpful assistant'
      });

      expect(conversation.id).toBeDefined();
      expect(conversation.name).toBe('test-chat');
      expect(conversation.messages).toHaveLength(0);
      expect(conversation.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when creating conversation with empty name', async () => {
      const framework = new PromptFramework();
      await expect(framework.createConversation({
        name: ''
      })).rejects.toThrow(ValidationError);
    });

    it('should chat in a conversation', async () => {
      const framework = new PromptFramework();
      const conversation = await framework.createConversation({
        name: 'test-chat'
      });

      const response = await framework.chat(conversation.id, 'Hello');
      expect(response).toContain('Response to: Hello');
      expect(conversation.messages).toHaveLength(2);
      expect(conversation.messages[0].role).toBe('user');
      expect(conversation.messages[1].role).toBe('assistant');
    });

    it('should throw error when chatting with non-existent conversation', async () => {
      const framework = new PromptFramework();
      await expect(framework.chat('non-existent', 'Hello')).rejects.toThrow(NotFoundError);
    });

    it('should throw error when sending empty message', async () => {
      const framework = new PromptFramework();
      const conversation = await framework.createConversation({
        name: 'test'
      });

      await expect(framework.chat(conversation.id, '')).rejects.toThrow(ValidationError);
    });

    it('should maintain message history', async () => {
      const framework = new PromptFramework();
      const conversation = await framework.createConversation({
        name: 'test'
      });

      await framework.chat(conversation.id, 'Message 1');
      await framework.chat(conversation.id, 'Message 2');

      expect(conversation.messages).toHaveLength(4);
    });
  });

  describe('Agent Management', () => {
    it('should create an agent', async () => {
      const framework = new PromptFramework();
      const agent = await framework.createAgent({
        name: 'test-agent',
        type: 'assistant',
        capabilities: ['chat']
      });

      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('test-agent');
      expect(agent.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when creating agent with empty name', async () => {
      const framework = new PromptFramework();
      await expect(framework.createAgent({
        name: ''
      })).rejects.toThrow(ValidationError);
    });

    it('should execute an agent', async () => {
      const framework = new PromptFramework();
      const agent = await framework.createAgent({
        name: 'test-agent'
      });

      const result = await framework.executeAgent(agent.id, { task: 'test' });
      expect(result).toMatchObject({
        agentId: agent.id,
        task: { task: 'test' }
      });
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('timestamp');
    });

    it('should throw error when executing non-existent agent', async () => {
      const framework = new PromptFramework();
      await expect(framework.executeAgent('non-existent', {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should get accurate stats', async () => {
      const framework = new PromptFramework();
      const prompt = await framework.createPrompt({
        name: 'test',
        content: 'test'
      });

      await framework.execute(prompt.id);
      await framework.execute(prompt.id);

      const stats = framework.getStats();
      expect(stats.totalPrompts).toBe(1);
      expect(stats.totalExecutions).toBe(2);
      expect(stats.totalCost).toBeCloseTo(0.002, 3);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should calculate cost breakdown correctly', async () => {
      const framework = new PromptFramework();
      const prompt = await framework.createPrompt({
        name: 'test',
        content: 'test'
      });

      await framework.execute(prompt.id);

      const breakdown = framework.getCostBreakdown();
      expect(breakdown.daily).toBeGreaterThan(0);
      expect(breakdown.monthly).toBeGreaterThan(0);
      expect(breakdown.total).toBeGreaterThan(0);
      expect(breakdown.total).toBe(breakdown.daily);
    });

    it('should return zero costs when no executions', () => {
      const framework = new PromptFramework();
      const breakdown = framework.getCostBreakdown();
      expect(breakdown.daily).toBe(0);
      expect(breakdown.monthly).toBe(0);
      expect(breakdown.total).toBe(0);
    });
  });
});

describe('EasyAPI', () => {
  it('should create quick prompt', async () => {
    const api = createEasyAPI();
    const result = await api.quick('Hello {{name}}', { name: 'World' });
    expect(result.result).toBeDefined();
    expect(result.promptId).toBeDefined();
  });

  it('should translate text', async () => {
    const api = createEasyAPI();
    const result = await api.translate('你好');
    expect(result.result).toContain('翻译成英文');
  });

  it('should translate to custom language', async () => {
    const api = createEasyAPI();
    const result = await api.translate('你好', 'Japanese');
    expect(result.result).toContain('翻译成Japanese');
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
    expect(result.result).toContain('{{language}}'); // Template variables are not replaced in mock execution
  });

  it('should review code with custom language', async () => {
    const api = createEasyAPI();
    const result = await api.codeReview('x = 1', 'Python');
    expect(result.result).toContain('审查');
  });

  it('should use builder pattern', async () => {
    const api = createEasyAPI();
    const result = await api
      .prompt('test')
      .content('Hello {{name}}')
      .variables({ name: 'World' })
      .tags(['test'])
      .version('1.0')
      .execute();

    expect(result.result).toBeDefined();
  });

  it('should use builder pattern with partial config', async () => {
    const api = createEasyAPI();
    const prompt = await api
      .prompt('test')
      .content('Hello')
      .create();

    expect(prompt.name).toBe('test');
    expect(prompt.content).toBe('Hello');
  });

  it('should batch operations', async () => {
    const api = createEasyAPI();
    const results = await api.batch([
      { content: 'Task 1' },
      { content: 'Task 2' }
    ]);

    expect(results).toHaveLength(2);
  });

  it('should handle empty batch', async () => {
    const api = createEasyAPI();
    const results = await api.batch([]);
    expect(results).toEqual([]);
  });

  it('should batch with variables', async () => {
    const api = createEasyAPI();
    const results = await api.batch([
      { content: 'Hello {{name}}', variables: { name: 'Alice' } },
      { content: 'Hello {{name}}', variables: { name: 'Bob' } }
    ]);

    expect(results).toHaveLength(2);
  });

  it('should get stats', () => {
    const api = createEasyAPI();
    const stats = api.getStats();
    expect(stats).toHaveProperty('totalPrompts');
    expect(stats).toHaveProperty('totalExecutions');
  });

  it('should get cost breakdown', () => {
    const api = createEasyAPI();
    const breakdown = api.getCostBreakdown();
    expect(breakdown).toHaveProperty('daily');
    expect(breakdown).toHaveProperty('monthly');
    expect(breakdown).toHaveProperty('total');
  });

  it('should support all quick methods', async () => {
    const api = createEasyAPI();

    const docResult = await api.generateDoc('function test() {}');
    expect(docResult.result).toContain('生成文档');

    const explainResult = await api.explain('const x = 1');
    expect(explainResult.result).toContain('解释');

    const refactorResult = await api.refactor('function test() {}');
    expect(refactorResult.result).toContain('重构');

    const testResult = await api.writeTest('function add(a, b) {}');
    expect(testResult.result).toContain('单元测试');
  });

  it('should support conversation builder', async () => {
    const api = createEasyAPI();
    const response = await api
      .conversation('test')
      .systemPrompt('You are helpful')
      .chat('Hello');

    expect(response).toContain('Response to: Hello');
  });

  it('should support agent builder', async () => {
    const api = createEasyAPI();
    const result = await api
      .agent('test-agent')
      .type('assistant')
      .capabilities(['chat', 'code'])
      .execute({ task: 'test' });

    expect(result).toHaveProperty('agentId');
    expect(result).toHaveProperty('result');
  });
});
