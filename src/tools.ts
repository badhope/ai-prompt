/**
 * Tool Calling Framework
 * 工具调用框架
 *
 * Standardized function calling for LLMs
 * 标准化的 LLM 函数调用
 */

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  enum?: string[];
  properties?: Record<string, ToolParameter>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  handler?: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  id: string;
}

export interface ToolResult {
  name: string;
  result: unknown;
  error?: string;
  toolCallId: string;
}

export class Toolkit {
  private tools: Map<string, ToolDefinition> = new Map();

  register(def: ToolDefinition): this {
    this.tools.set(def.name, def);
    return this;
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  toOpenAIFormat(): Array<{ type: 'function'; function: Record<string, unknown> }> {
    return this.list().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: this.paramsToSchema(tool.parameters)
      }
    }));
  }

  toPrompt(lang: 'en' | 'zh' = 'en'): string {
    const tools = this.list();
    if (tools.length === 0) return '';

    const header = lang === 'zh' ? '【可用工具】\n' : '【AVAILABLE TOOLS】\n';

    return header + tools.map(t => {
      const params = t.parameters.map(p =>
        `${p.name}: ${p.type} - ${p.description}`
      ).join('; ');
      return `${t.name}: ${t.description}\n  参数: ${params}`;
    }).join('\n\n');
  }

  async execute(call: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(call.name);

    if (!tool) {
      return {
        name: call.name,
        toolCallId: call.id,
        result: null,
        error: `Tool not found: ${call.name}`
      };
    }

    if (!tool.handler) {
      return {
        name: call.name,
        toolCallId: call.id,
        result: null,
        error: `No handler for: ${call.name}`
      };
    }

    try {
      const result = await tool.handler(call.arguments);
      return {
        name: call.name,
        toolCallId: call.id,
        result
      };
    } catch (error) {
      return {
        name: call.name,
        toolCallId: call.id,
        result: null,
        error: String(error)
      };
    }
  }

  parseToolCall(content: string): ToolCall | null {
    const match = content.match(/<\|tool_call\|>([\s\S]*?)<\|end_tool_call\|>/);
    if (!match) return null;

    try {
      const parsed = JSON.parse(match[1]);
      return {
        id: parsed.id || `call_${Date.now()}`,
        name: parsed.name,
        arguments: parsed.arguments || {}
      };
    } catch {
      return null;
    }
  }

  private paramsToSchema(params: ToolParameter[]): Record<string, unknown> {
    const schema: Record<string, unknown> = {
      type: 'object',
      properties: {},
      required: []
    };

    const props = schema.properties as Record<string, unknown>;
    const required = schema.required as string[];

    for (const p of params) {
      props[p.name] = {
        type: p.type,
        description: p.description,
        ...(p.enum && { enum: p.enum })
      };
      if (p.required) required.push(p.name);
    }

    return schema;
  }
}

export function createToolkit(): Toolkit {
  return new Toolkit();
}

export const builtInTools: ToolDefinition[] = [
  {
    name: 'search',
    description: 'Search web for latest information',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true }
    ]
  },
  {
    name: 'calculate',
    description: 'Calculate math expressions',
    parameters: [
      { name: 'expression', type: 'string', description: 'Math expression', required: true }
    ],
    handler: async (args) => {
      try {
        return Function('"use strict";return (' + args.expression + ')')();
      } catch {
        return 'Error';
      }
    }
  },
  {
    name: 'get_time',
    description: 'Get current date and time',
    parameters: [],
    handler: async () => new Date().toISOString()
  }
];
