import OpenAI from 'openai';
import {
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  ProviderInfo,
  ProviderCapabilities,
  ModelConfig,
} from '../types';
import { ILLMProvider } from '../interfaces';

export class OpenAIProvider implements ILLMProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  
  private client: OpenAI;
  private models: ProviderInfo['models'];

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });

    this.models = [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        capabilities: {
          max_tokens: 128000,
          supports_vision: true,
          supports_tools: true,
          supports_streaming: true,
          supports_system_prompt: true,
          supports_temperature: true,
          supports_top_p: true,
          supports_top_k: false,
        },
        pricing: {
          input_per_1k: 0.005,
          output_per_1k: 0.015,
        },
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        capabilities: {
          max_tokens: 128000,
          supports_vision: true,
          supports_tools: true,
          supports_streaming: true,
          supports_system_prompt: true,
          supports_temperature: true,
          supports_top_p: true,
          supports_top_k: false,
        },
        pricing: {
          input_per_1k: 0.01,
          output_per_1k: 0.03,
        },
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        capabilities: {
          max_tokens: 16385,
          supports_vision: false,
          supports_tools: true,
          supports_streaming: true,
          supports_system_prompt: true,
          supports_temperature: true,
          supports_top_p: true,
          supports_top_k: false,
        },
        pricing: {
          input_per_1k: 0.0005,
          output_per_1k: 0.0015,
        },
      },
    ];
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();
    const model = request.model_config?.model || 'gpt-4o';

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (request.context && request.context.length > 0) {
      messages.push({
        role: 'system',
        content: request.context.join('\n\n'),
      });
    }

    messages.push({
      role: 'user',
      content: await this.buildContent(request),
    });

    const response = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: request.model_config?.max_tokens || 4096,
      temperature: request.model_config?.temperature,
      top_p: request.model_config?.top_p,
      stop: request.model_config?.stop_sequences,
      frequency_penalty: request.model_config?.frequency_penalty,
      presence_penalty: request.model_config?.presence_penalty,
    });

    const endTime = Date.now();
    const choice = response.choices[0];

    return {
      id: response.id,
      content: choice.message.content || '',
      tokens: {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
      model: response.model,
      provider: this.id,
      finish_reason: choice.finish_reason,
      latency_ms: endTime - startTime,
    };
  }

  async *stream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    const model = request.model_config?.model || 'gpt-4o';

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (request.context && request.context.length > 0) {
      messages.push({
        role: 'system',
        content: request.context.join('\n\n'),
      });
    }

    messages.push({
      role: 'user',
      content: await this.buildContent(request),
    });

    const stream = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: request.model_config?.max_tokens || 4096,
      temperature: request.model_config?.temperature,
      top_p: request.model_config?.top_p,
      stop: request.model_config?.stop_sequences,
      frequency_penalty: request.model_config?.frequency_penalty,
      presence_penalty: request.model_config?.presence_penalty,
      stream: true,
    });

    let id = '';
    for await (const chunk of stream) {
      id = chunk.id;
      const delta = chunk.choices[0]?.delta?.content || '';
      
      yield {
        id,
        content: delta,
        delta,
        finish_reason: chunk.choices[0]?.finish_reason,
      };
    }
  }

  private async buildContent(request: CompletionRequest): Promise<string> {
    const parts: string[] = [];

    if (request.template) {
      const { TemplateEngine } = await import('../core/TemplateEngine');
      const engine = new TemplateEngine();
      const rendered = await engine.render(
        request.template,
        request.variables,
        request.examples
      );
      parts.push(rendered);
    } else {
      parts.push(JSON.stringify(request.variables, null, 2));
    }

    return parts.join('\n\n');
  }

  getInfo(): ProviderInfo {
    return {
      id: this.id,
      name: this.name,
      models: this.models,
      default_model: 'gpt-4o',
    };
  }

  getCapabilities(model: string): ProviderCapabilities {
    const modelInfo = this.models.find(m => m.id === model);
    if (!modelInfo) {
      throw new Error(`Unknown model: ${model}`);
    }
    return modelInfo.capabilities;
  }

  validateConfig(config: ModelConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2 for OpenAI');
    }

    if (config.max_tokens && config.max_tokens > 128000) {
      errors.push('Max tokens cannot exceed 128000 for OpenAI');
    }

    if (config.top_p !== undefined && (config.top_p < 0 || config.top_p > 1)) {
      errors.push('Top-p must be between 0 and 1');
    }

    if (config.frequency_penalty !== undefined && (config.frequency_penalty < -2 || config.frequency_penalty > 2)) {
      errors.push('Frequency penalty must be between -2 and 2');
    }

    if (config.presence_penalty !== undefined && (config.presence_penalty < -2 || config.presence_penalty > 2)) {
      errors.push('Presence penalty must be between -2 and 2');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  estimateCost(tokens: { input: number; output: number }, model: string): number {
    const modelInfo = this.models.find(m => m.id === model);
    if (!modelInfo) {
      return 0;
    }

    const inputCost = (tokens.input / 1000) * modelInfo.pricing.input_per_1k;
    const outputCost = (tokens.output / 1000) * modelInfo.pricing.output_per_1k;

    return inputCost + outputCost;
  }
}
