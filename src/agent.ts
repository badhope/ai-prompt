/**
 * Lightweight Agent Mode
 * 轻量 Agent 模式
 *
 * NOT multi-agent orchestration - this is built-in REACT loop for prompt engineering
 * 不是多 Agent 编排 - 这是内置的 REACT 循环，属于提示词工程的一部分
 */

import { Toolkit, ToolCall, ToolResult, ToolDefinition } from './tools';
import { PromptOptimizer, RoleType, CoTType } from './optimizer';

export type AgentMode = 'react' | 'planact' | 'simple';
export type AgentState = 'idle' | 'thinking' | 'toolcall' | 'executing' | 'answering' | 'done';

export interface AgentStep {
  type: 'thought' | 'tool' | 'result' | 'answer';
  content: string;
  timestamp: number;
}

export interface AgentConfig {
  mode: AgentMode;
  maxSteps: number;
  language: 'en' | 'zh';
  role?: RoleType;
  cot: CoTType;
  stream?: boolean;
}

export class Agent {
  private toolkit: Toolkit;
  private optimizer: PromptOptimizer;
  private config: AgentConfig;
  private state: AgentState = 'idle';
  private steps: AgentStep[] = [];
  private history: Array<{ role: string; content: string }> = [];

  constructor(config?: Partial<AgentConfig>) {
    this.config = {
      mode: 'react',
      maxSteps: 5,
      language: 'en',
      cot: 'minimal',
      ...config
    };
    this.toolkit = new Toolkit();
    this.optimizer = new PromptOptimizer();
  }

  useTool(def: ToolDefinition): this {
    this.toolkit.register(def);
    return this;
  }

  getState(): AgentState {
    return this.state;
  }

  getSteps(): AgentStep[] {
    return [...this.steps];
  }

  getToolkit(): Toolkit {
    return this.toolkit;
  }

  async run(query: string): Promise<string> {
    this.state = 'thinking';
    this.steps = [];
    this.history = [];

    const optimizedQuery = this.optimizer.optimize(query, {
      language: this.config.language === 'zh' ? 'zh' : 'en',
      compressLevel: 2,
      role: this.config.role,
      cot: this.config.cot,
    }).optimized;

    this.addStep('thought', `Query: ${optimizedQuery}`);

    const systemPrompt = this.getSystemPrompt();
    this.history.push({ role: 'system', content: systemPrompt });
    this.history.push({ role: 'user', content: optimizedQuery });

    let finalAnswer = '';

    for (let i = 0; i < this.config.maxSteps; i++) {
      this.state = 'thinking';

      const thought = this.simulateLLM(this.getLastMessage());
      this.addStep('thought', thought);

      const toolCall = this.toolkit.parseToolCall(thought);
      if (toolCall) {
        this.state = 'executing';
        this.addStep('tool', `Calling: ${toolCall.name}(${JSON.stringify(toolCall.arguments)})`);

        const result = await this.toolkit.execute(toolCall);
        this.addStep('result', `Result: ${JSON.stringify(result.result)}`);

        this.history.push({
          role: 'user',
          content: `Tool result for ${toolCall.name}: ${JSON.stringify(result.result)}`
        });
      }

      if (this.isAnswerComplete(thought) || i === this.config.maxSteps - 1) {
        this.state = 'answering';
        finalAnswer = this.extractAnswer(thought);
        break;
      }
    }

    this.state = 'done';
    this.addStep('answer', finalAnswer);
    return finalAnswer;
  }

  private getSystemPrompt(): string {
    const lang = this.config.language;
    const isZh = lang === 'zh';

    const modePrompts = {
      react: isZh
        ? '【思考-行动-观察】循环。需要工具时用：<|tool_call|>{"name":"","arguments":{}}<|end_tool_call|>'
        : '【Thought-Action-Observation】 loop. Use tools: <|tool_call|>{"name":"","arguments":{}}<|end_tool_call|>',
      planact: isZh
        ? '先制定计划，再执行。每个步骤检查是否需要工具。'
        : 'Plan first, then execute. Check tools each step.',
      simple: isZh
        ? '只在必要时调用工具。'
        : 'Only call tools when necessary.'
    };

    return [
      isZh ? '你是一个能调用工具的助手。' : 'You are an AI assistant with tool access.',
      modePrompts[this.config.mode],
      this.toolkit.toPrompt(lang),
      isZh ? '不需要工具就直接回答。' : 'Answer directly if no tools needed.'
    ].filter(Boolean).join('\n\n');
  }

  private addStep(type: AgentStep['type'], content: string): void {
    this.steps.push({
      type,
      content,
      timestamp: Date.now()
    });
  }

  private getLastMessage(): string {
    const last = this.history[this.history.length - 1];
    return last?.content || '';
  }

  private simulateLLM(_prompt: string): string {
    return "我理解了问题，让我直接回答。\n\n**Answer**: 根据上下文和可用信息，我已经可以回答。作为一个演示 Agent，这里展示了完整的 REACT 循环流程：思考 → 工具调用 → 执行 → 结果 → 最终回答。\n\n实际集成时，此方法应替换为真实的 LLM API 调用。";
  }

  private isAnswerComplete(text: string): boolean {
    return text.toLowerCase().includes('answer:')
      || text.toLowerCase().includes('final:')
      || text.toLowerCase().includes('总结：');
  }

  private extractAnswer(text: string): string {
    const match = text.match(/(?:final|answer|总结)[:：]\s*([\s\S]*)$/i);
    return match ? match[1].trim() : text;
  }
}

export function createAgent(config?: Partial<AgentConfig>): Agent {
  return new Agent(config);
}
