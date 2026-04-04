import { describe, it, expect } from 'vitest';
import { PromptFramework } from '../src/index';

describe('Performance Tests', () => {
  describe('Prompt Creation Performance', () => {
    it('should handle bulk prompt creation efficiently', async () => {
      const framework = new PromptFramework();
      const count = 1000;
      const startTime = Date.now();

      for (let i = 0; i < count; i++) {
        await framework.createPrompt({
          name: `prompt-${i}`,
          content: `Content ${i}`
        });
      }

      const duration = Date.now() - startTime;
      const stats = framework.getStats();

      expect(stats.totalPrompts).toBe(count);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should maintain performance with large prompts', async () => {
      const framework = new PromptFramework();
      const largeContent = 'x'.repeat(10000);
      const count = 100;
      const startTime = Date.now();

      for (let i = 0; i < count; i++) {
        await framework.createPrompt({
          name: `large-${i}`,
          content: largeContent
        });
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Execution Performance', () => {
    it('should handle multiple executions efficiently', async () => {
      const framework = new PromptFramework();
      const prompt = await framework.createPrompt({
        name: 'test',
        content: 'test'
      });

      const count = 100;
      const startTime = Date.now();

      for (let i = 0; i < count; i++) {
        await framework.execute(prompt.id);
      }

      const duration = Date.now() - startTime;
      const stats = framework.getStats();

      expect(stats.totalExecutions).toBe(count);
      expect(duration).toBeLessThan(2000);
    });

    it('should track statistics accurately under load', async () => {
      const framework = new PromptFramework();
      const prompt = await framework.createPrompt({
        name: 'test',
        content: 'test'
      });

      const count = 50;
      await Promise.all(Array.from({ length: count }, () => framework.execute(prompt.id)));

      const stats = framework.getStats();
      expect(stats.totalExecutions).toBe(count);
      expect(stats.totalCost).toBeCloseTo(count * 0.001, 3);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with many prompts', async () => {
      const framework = new PromptFramework();
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 1000; i++) {
        await framework.createPrompt({
          name: `prompt-${i}`,
          content: `Content ${i}`
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Memory growth should be reasonable (< 50MB for 1000 prompts)
      expect(memoryGrowth).toBeLessThan(50);
    });

    it('should handle prompt deletion properly', async () => {
      const framework = new PromptFramework();
      const prompts = [];

      for (let i = 0; i < 100; i++) {
        const prompt = await framework.createPrompt({
          name: `prompt-${i}`,
          content: `Content ${i}`
        });
        prompts.push(prompt.id);
      }

      // Delete half of them
      for (let i = 0; i < 50; i++) {
        await framework.deletePrompt(prompts[i]);
      }

      const stats = framework.getStats();
      expect(stats.totalPrompts).toBe(50);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent prompt creation', async () => {
      const framework = new PromptFramework();
      const count = 50;

      const promises = Array.from({ length: count }, (_, i) =>
        framework.createPrompt({
          name: `concurrent-${i}`,
          content: `Content ${i}`
        })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(count);

      const ids = new Set(results.map(r => r.id));
      expect(ids.size).toBe(count); // All IDs should be unique
    });

    it('should handle concurrent executions', async () => {
      const framework = new PromptFramework();
      const prompt = await framework.createPrompt({
        name: 'test',
        content: 'test'
      });

      const count = 50;
      const promises = Array.from({ length: count }, () => framework.execute(prompt.id));

      const results = await Promise.all(promises);
      expect(results).toHaveLength(count);

      const ids = new Set(results.map(r => r.id));
      expect(ids.size).toBe(count); // All execution IDs should be unique
    });

    it('should handle mixed concurrent operations', async () => {
      const framework = new PromptFramework();

      const createPromises = Array.from({ length: 20 }, (_, i) =>
        framework.createPrompt({
          name: `mixed-${i}`,
          content: `Content ${i}`
        })
      );

      const created = await Promise.all(createPromises);

      const executePromises = created.map(p => framework.execute(p.id));
      const results = await Promise.all(executePromises);

      expect(results).toHaveLength(20);
      const stats = framework.getStats();
      expect(stats.totalExecutions).toBe(20);
    });
  });

  describe('Template Performance', () => {
    it('should handle bulk template creation', async () => {
      const framework = new PromptFramework();
      const count = 100;
      const startTime = Date.now();

      for (let i = 0; i < count; i++) {
        await framework.createTemplate({
          name: `template-${i}`,
          content: `Template ${i} {{var}}`,
          variables: ['var']
        });
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });

    it('should handle rapid template filling', async () => {
      const framework = new PromptFramework();
      const template = await framework.createTemplate({
        name: 'test',
        content: 'Hello {{name}}, welcome to {{place}}',
        variables: ['name', 'place']
      });

      const count = 100;
      const startTime = Date.now();

      for (let i = 0; i < count; i++) {
        await framework.fillTemplate(template.id, {
          name: `User${i}`,
          place: `Place${i}`
        });
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Conversation Performance', () => {
    it('should handle many messages in a conversation', async () => {
      const framework = new PromptFramework();
      const conversation = await framework.createConversation({
        name: 'long-chat'
      });

      const count = 100;
      const startTime = Date.now();

      for (let i = 0; i < count; i++) {
        await framework.chat(conversation.id, `Message ${i}`);
      }

      const duration = Date.now() - startTime;
      expect(conversation.messages).toHaveLength(count * 2); // user + assistant
      expect(duration).toBeLessThan(2000);
    });

    it('should handle multiple concurrent conversations', async () => {
      const framework = new PromptFramework();
      const count = 20;

      const conversations = await Promise.all(
        Array.from({ length: count }, (_, i) =>
          framework.createConversation({ name: `chat-${i}` })
        )
      );

      const chatPromises = conversations.map(c => framework.chat(c.id, 'Hello'));
      const results = await Promise.all(chatPromises);

      expect(results).toHaveLength(count);
    });
  });
});
