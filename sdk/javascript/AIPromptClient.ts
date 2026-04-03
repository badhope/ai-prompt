export interface AIPromptClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CompletionRequest {
  prompt: string;
  variables?: Record<string, any>;
  provider?: 'claude' | 'openai' | 'gemini';
  model?: string;
  options?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
  };
}

export interface CompletionResponse {
  id: string;
  content: string;
  model: string;
  tokens: {
    input: number;
    output: number;
  };
  finish_reason: string;
}

export interface ReActRequest {
  question: string;
  tools?: any[];
  provider?: string;
}

export interface ToTRequest {
  problem: string;
  config?: {
    max_depth?: number;
    branching_factor?: number;
    search_strategy?: 'breadth_first' | 'depth_first' | 'best_first';
  };
  provider?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class AIPromptClient {
  private config: AIPromptClientConfig;

  constructor(config: AIPromptClientConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
    } = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          message: data.message,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async healthCheck(): Promise<APIResponse<any>> {
    return this.request('/health');
  }

  async listPrompts(): Promise<APIResponse<Prompt[]>> {
    return this.request('/api/prompts');
  }

  async getPrompt(id: string): Promise<APIResponse<Prompt>> {
    return this.request(`/api/prompts/${id}`);
  }

  async createPrompt(prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>): Promise<APIResponse<Prompt>> {
    return this.request('/api/prompts', {
      method: 'POST',
      body: prompt,
    });
  }

  async updatePrompt(id: string, updates: Partial<Prompt>): Promise<APIResponse<Prompt>> {
    return this.request(`/api/prompts/${id}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deletePrompt(id: string): Promise<APIResponse<void>> {
    return this.request(`/api/prompts/${id}`, {
      method: 'DELETE',
    });
  }

  async complete(request: CompletionRequest): Promise<APIResponse<CompletionResponse>> {
    return this.request('/api/complete', {
      method: 'POST',
      body: request,
    });
  }

  async *stream(request: CompletionRequest): AsyncGenerator<string> {
    const url = `${this.config.baseUrl}/api/stream`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Stream not available');
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              yield parsed.content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async executeReAct(request: ReActRequest): Promise<APIResponse<any>> {
    return this.request('/api/agents/react', {
      method: 'POST',
      body: request,
    });
  }

  async executeToT(request: ToTRequest): Promise<APIResponse<any>> {
    return this.request('/api/agents/tot', {
      method: 'POST',
      body: request,
    });
  }

  async getStats(): Promise<APIResponse<any>> {
    return this.request('/api/stats');
  }
}

export default AIPromptClient;
