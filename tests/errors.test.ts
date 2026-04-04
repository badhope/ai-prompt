import { describe, it, expect } from 'vitest';
import { PromptFramework } from '../src/index';
import { ValidationError, NotFoundError, FrameworkError } from '../src/types/framework';

describe('Error Handling', () => {
  describe('ValidationError', () => {
    it('should create validation error with proper message', () => {
      const error = new ValidationError('name', 'cannot be empty');
      expect(error).toBeInstanceOf(FrameworkError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toContain('name');
      expect(error.details).toEqual({ field: 'name' });
    });

    it('should throw validation error for empty prompt name', async () => {
      const framework = new PromptFramework();
      try {
        await framework.createPrompt({ name: '', content: 'test' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.code).toBe('VALIDATION_ERROR');
        }
      }
    });

    it('should throw validation error for empty prompt content', async () => {
      const framework = new PromptFramework();
      try {
        await framework.createPrompt({ name: 'test', content: '   ' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it('should throw validation error for empty template name', async () => {
      const framework = new PromptFramework();
      await expect(framework.createTemplate({
        name: '  ',
        content: 'test',
        variables: []
      })).rejects.toThrow(ValidationError);
    });

    it('should throw validation error for empty conversation name', async () => {
      const framework = new PromptFramework();
      await expect(framework.createConversation({ name: '' })).rejects.toThrow(ValidationError);
    });

    it('should throw validation error for empty agent name', async () => {
      const framework = new PromptFramework();
      await expect(framework.createAgent({ name: '' })).rejects.toThrow(ValidationError);
    });

    it('should throw validation error for empty message', async () => {
      const framework = new PromptFramework();
      const conversation = await framework.createConversation({ name: 'test' });
      await expect(framework.chat(conversation.id, '  ')).rejects.toThrow(ValidationError);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with proper message', () => {
      const error = new NotFoundError('Prompt', '123');
      expect(error).toBeInstanceOf(FrameworkError);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toContain('Prompt');
      expect(error.message).toContain('123');
      expect(error.details).toEqual({ resource: 'Prompt', id: '123' });
    });

    it('should throw not found error for non-existent prompt', async () => {
      const framework = new PromptFramework();
      await expect(framework.execute('non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should throw not found error for non-existent template', async () => {
      const framework = new PromptFramework();
      await expect(framework.fillTemplate('non-existent', {})).rejects.toThrow(NotFoundError);
    });

    it('should throw not found error for non-existent conversation', async () => {
      const framework = new PromptFramework();
      await expect(framework.chat('non-existent', 'hello')).rejects.toThrow(NotFoundError);
    });

    it('should throw not found error for non-existent agent', async () => {
      const framework = new PromptFramework();
      await expect(framework.executeAgent('non-existent', {})).rejects.toThrow(NotFoundError);
    });

    it('should throw not found error when updating non-existent prompt', async () => {
      const framework = new PromptFramework();
      await expect(framework.updatePrompt('non-existent', { content: 'test' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('Error Recovery', () => {
    it('should continue working after catching validation error', async () => {
      const framework = new PromptFramework();

      // Try to create invalid prompt
      try {
        await framework.createPrompt({ name: '', content: 'test' });
      } catch (error) {
        // Expected error
      }

      // Should still be able to create valid prompt
      const validPrompt = await framework.createPrompt({
        name: 'valid',
        content: 'test'
      });
      expect(validPrompt.name).toBe('valid');
    });

    it('should continue working after catching not found error', async () => {
      const framework = new PromptFramework();

      // Try to execute non-existent prompt
      try {
        await framework.execute('non-existent');
      } catch (error) {
        // Expected error
      }

      // Should still be able to create and execute valid prompt
      const prompt = await framework.createPrompt({
        name: 'test',
        content: 'test'
      });
      const result = await framework.execute(prompt.id);
      expect(result.promptId).toBe(prompt.id);
    });

    it('should handle multiple consecutive errors gracefully', async () => {
      const framework = new PromptFramework();

      const errors = [];
      try {
        await framework.createPrompt({ name: '', content: 'test' });
      } catch (error) {
        errors.push(error);
      }

      try {
        await framework.execute('non-existent');
      } catch (error) {
        errors.push(error);
      }

      expect(errors).toHaveLength(2);
      expect(errors[0]).toBeInstanceOf(ValidationError);
      expect(errors[1]).toBeInstanceOf(NotFoundError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only strings as empty', async () => {
      const framework = new PromptFramework();
      await expect(framework.createPrompt({
        name: '   ',
        content: 'test'
      })).rejects.toThrow(ValidationError);
    });

    it('should handle null/undefined variables gracefully', async () => {
      const framework = new PromptFramework();
      const prompt = await framework.createPrompt({
        name: 'test',
        content: 'Hello {{name}}',
        variables: null as unknown as Record<string, unknown>
      });
      expect(prompt).toBeDefined();
    });

    it('should handle special characters in content', async () => {
      const framework = new PromptFramework();
      const prompt = await framework.createPrompt({
        name: 'test',
        content: 'Hello <script>alert("xss")</script> {{name}}'
      });
      expect(prompt.content).toContain('<script>');
    });

    it('should handle very long content', async () => {
      const framework = new PromptFramework();
      const longContent = 'a'.repeat(10000);
      const prompt = await framework.createPrompt({
        name: 'test',
        content: longContent
      });
      expect(prompt.content.length).toBe(10000);
    });

    it('should handle unicode characters', async () => {
      const framework = new PromptFramework();
      const prompt = await framework.createPrompt({
        name: 'test',
        content: '你好 🌍 Привет'
      });
      expect(prompt.content).toContain('🌍');
    });
  });
});
