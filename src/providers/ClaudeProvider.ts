import Anthropic from '@anthropic-ai/sdk';
import {
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  ProviderInfo,
  ProviderCapabilities,
  ModelConfig,
} from '../types';
import { ILLMProvider } from '../interfaces';

export class ClaudeProvider implements ILLMProvider {
  readonly id = 'claude';
  readonly name = 'Anthropic Claude';
  
  private client: Anthropic;
  private models: ProviderInfo['models'];

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });

    this.models = [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        capabilities: {
          max_tokens: 200000,
          supports_vision: true,
          supports_tools: true,
          supports_streaming: true,
          supports_system_prompt: true,
          supports_temperature: true,
          supports_top_p: true,
          supports_top_k: true,
        },
        pricing: {
          input_per_1k: 0.003,
          output_per_1k: 0.015,
        },
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        capabilities: {
          max_tokens: 200000,
          supports_vision: true,
          supports_tools: true,
          supports_streaming: true,
          supports_system_prompt: true,
          supports_temperature: true,
          supports_top_p: true,
          supports_top_k: true,
        },
        pricing: {
          input_per_1k: 0.015,
          output_per_1k: 0.075,
        },
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        capabilities: {
          max_tokens: 200000,
          supports_vision: true,
          supports_tools: true,
          supports_streaming: true,
          supports_system_prompt: true,
          supports_temperature: true,
          supports_top_p: true,
          supports_top_k: true,
        },
        pricing: {
          input_per_1k: 0.00025,
          output_per_1k: 0.00125,
        },
      },
    ];
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();
    const model = request.model_config?.model || 'claude-3-5-sonnet-20241022';

    const response = await this.client.messages.create({
      model,
      max_tokens: request.model_config?.max_tokens || 4096,
      temperature: request.model_config?.temperature,
      top_p: request.model_config?.top_p,
      top_k: request.model_config?.top_k,
      stop_sequences: request.model_config?.stop_sequences,
      system: request.context?.join('\n\n') || undefined,
      messages: [
        {
          role: 'user',
          content: await this.buildContent(request),
        },
      ],
    });

    const endTime = Date.now();

    return {
      id: response.id,
      content: response.content
        .filter(block => block.type === 'text')
        .map(block => (block as Anthropic.TextBlock).text)
        .join(''),
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
      provider: this.id,
      finish_reason: response.stop_reason || 'end_turn',
      latency_ms: endTime - startTime,
    };
  }

  async *stream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    const model = request.model_config?.model || 'claude-3-5-sonnet-20241022';

    const stream = await this.client.messages.stream({
      model,
      max_tokens: request.model_config?.max_tokens || 4096,
      temperature: request.model_config?.temperature,
      top_p: request.model_config?.top_p,
      top_k: request.model_config?.top_k,
      stop_sequences: request.model_config?.stop_sequences,
      system: request.context?.join('\n\n') || undefined,
      messages: [
        {
          role: 'user',
          content: await this.buildContent(request),
        },
      ],
    });

    let id = '';
    for await (const event of stream) {
      if (event.type === 'message_start') {
        id = event.message.id;
      } else if (event.type === 'content_block_delta') {
        const delta = event.delta as Anthropic.TextDelta;
        yield {
          id,
          content: delta.text,
          delta: delta.text,
        };
      } else if (event.type === 'message_stop') {
        yield {
          id,
          content: '',
          delta: '',
          finish_reason: 'end_turn',
        };
      }
    }
  }

  private async buildContent(request: CompletionRequest): Promise<string> {
    const parts: string[] = [];

    if (request.template) {
      const { TemplateEngine } = await import('./TemplateEngine');
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
      default_model: 'claude-3-5-sonnet-20241022',
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

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
      errors.push('Temperature must be between 0 and 1 for Claude');
    }

    if (config.max_tokens && config.max_tokens > 200000) {
      errors.push('Max tokens cannot exceed 200000 for Claude');
    }

    if (config.top_p !== undefined && (config.top_p < 0 || config.top_p > 1)) {
      errors.push('Top-p must be between 0 and 1');
    }

    if (config.top_k !== undefined && config.top_k < 0) {
      errors.push('Top-k must be non-negative');
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
