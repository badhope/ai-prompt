import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  ProviderInfo,
  ProviderCapabilities,
  ModelConfig,
} from '../types';
import { ILLMProvider } from '../interfaces';

export class GeminiProvider implements ILLMProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  
  private genAI: GoogleGenerativeAI;
  private models: ProviderInfo['models'];

  constructor(apiKey?: string) {
    this.genAI = new GoogleGenerativeAI(
      apiKey || process.env.GOOGLE_AI_KEY || ''
    );

    this.models = [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        capabilities: {
          max_tokens: 2097152,
          supports_vision: true,
          supports_tools: true,
          supports_streaming: true,
          supports_system_prompt: true,
          supports_temperature: true,
          supports_top_p: true,
          supports_top_k: true,
        },
        pricing: {
          input_per_1k: 0.00125,
          output_per_1k: 0.005,
        },
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        capabilities: {
          max_tokens: 1048576,
          supports_vision: true,
          supports_tools: true,
          supports_streaming: true,
          supports_system_prompt: true,
          supports_temperature: true,
          supports_top_p: true,
          supports_top_k: true,
        },
        pricing: {
          input_per_1k: 0.000075,
          output_per_1k: 0.0003,
        },
      },
    ];
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();
    const modelId = request.model_config?.model || 'gemini-1.5-pro';
    
    const model = this.genAI.getGenerativeModel({ model: modelId });

    const prompt = await this.buildPrompt(request);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: request.model_config?.temperature,
        topP: request.model_config?.top_p,
        topK: request.model_config?.top_k,
        maxOutputTokens: request.model_config?.max_tokens || 8192,
        stopSequences: request.model_config?.stop_sequences,
      },
      systemInstruction: request.context?.join('\n\n'),
    });

    const endTime = Date.now();
    const response = result.response;

    return {
      id: `gemini-${Date.now()}`,
      content: response.text(),
      tokens: {
        input: response.usageMetadata?.promptTokenCount || 0,
        output: response.usageMetadata?.candidatesTokenCount || 0,
        total: response.usageMetadata?.totalTokenCount || 0,
      },
      model: modelId,
      provider: this.id,
      finish_reason: 'end_turn',
      latency_ms: endTime - startTime,
    };
  }

  async *stream(request: CompletionRequest): AsyncIterable<StreamChunk> {
    const modelId = request.model_config?.model || 'gemini-1.5-pro';
    const model = this.genAI.getGenerativeModel({ model: modelId });

    const prompt = await this.buildPrompt(request);

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: request.model_config?.temperature,
        topP: request.model_config?.top_p,
        topK: request.model_config?.top_k,
        maxOutputTokens: request.model_config?.max_tokens || 8192,
        stopSequences: request.model_config?.stop_sequences,
      },
      systemInstruction: request.context?.join('\n\n'),
    });

    const id = `gemini-${Date.now()}`;
    
    for await (const chunk of result.stream) {
      const text = chunk.text();
      yield {
        id,
        content: text,
        delta: text,
      };
    }

    yield {
      id,
      content: '',
      delta: '',
      finish_reason: 'end_turn',
    };
  }

  private async buildPrompt(request: CompletionRequest): Promise<string> {
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
      default_model: 'gemini-1.5-pro',
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
      errors.push('Temperature must be between 0 and 2 for Gemini');
    }

    if (config.max_tokens && config.max_tokens > 2097152) {
      errors.push('Max tokens cannot exceed 2097152 for Gemini');
    }

    if (config.top_p !== undefined && (config.top_p < 0 || config.top_p > 1)) {
      errors.push('Top-p must be between 0 and 1');
    }

    if (config.top_k !== undefined && config.top_k < 1) {
      errors.push('Top-k must be at least 1');
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
