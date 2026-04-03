import { ILLMProvider } from '../interfaces';
import { CompletionRequest, CompletionResponse } from '../types';

export interface ReActStep {
  type: 'thought' | 'action' | 'observation';
  content: string;
  tool?: string;
  tool_input?: any;
  tool_output?: any;
  timestamp: number;
}

export interface ReActConfig {
  max_iterations: number;
  tools: Record<string, (input: any) => Promise<any>>;
  verbose: boolean;
}

export interface ReActResult {
  answer: string;
  steps: ReActStep[];
  iterations: number;
  success: boolean;
  total_tokens: number;
  total_cost: number;
}

export class ReActEngine {
  private provider: ILLMProvider;
  private config: ReActConfig;

  constructor(provider: ILLMProvider, config: Partial<ReActConfig>) {
    this.provider = provider;
    this.config = {
      max_iterations: 10,
      tools: {},
      verbose: false,
      ...config,
    };
  }

  async execute(question: string): Promise<ReActResult> {
    const steps: ReActStep[] = [];
    let iterations = 0;
    let total_tokens = 0;
    let total_cost = 0;
    let answer = '';
    let success = false;

    const systemPrompt = this.buildSystemPrompt();
    const conversationHistory: string[] = [];

    conversationHistory.push(`Question: ${question}`);

    while (iterations < this.config.max_iterations) {
      iterations++;

      const thoughtPrompt = this.buildThoughtPrompt(conversationHistory);
      const thoughtResponse = await this.generateResponse(systemPrompt, thoughtPrompt);
      
      total_tokens += thoughtResponse.tokens.total;
      total_cost += this.provider.estimateCost(thoughtResponse.tokens, thoughtResponse.model);

      const thought = this.parseThought(thoughtResponse.content);
      steps.push({
        type: 'thought',
        content: thought.content,
        timestamp: Date.now(),
      });

      conversationHistory.push(`Thought: ${thought.content}`);

      if (thought.is_final_answer) {
        answer = thought.content;
        success = true;
        break;
      }

      if (!thought.action) {
        const finalResponse = await this.generateFinalAnswer(systemPrompt, conversationHistory);
        answer = finalResponse.content;
        total_tokens += finalResponse.tokens.total;
        total_cost += this.provider.estimateCost(finalResponse.tokens, finalResponse.model);
        success = true;
        break;
      }

      steps.push({
        type: 'action',
        content: `Using tool: ${thought.action}`,
        tool: thought.action,
        tool_input: thought.action_input,
        timestamp: Date.now(),
      });

      conversationHistory.push(`Action: ${thought.action}[${JSON.stringify(thought.action_input)}]`);

      const observation = await this.executeTool(thought.action, thought.action_input);
      
      steps.push({
        type: 'observation',
        content: observation,
        tool: thought.action,
        tool_output: observation,
        timestamp: Date.now(),
      });

      conversationHistory.push(`Observation: ${observation}`);
    }

    if (!success) {
      answer = 'I was unable to complete the task within the maximum number of iterations.';
    }

    return {
      answer,
      steps,
      iterations,
      success,
      total_tokens,
      total_cost,
    };
  }

  private buildSystemPrompt(): string {
    const toolDescriptions = Object.entries(this.config.tools)
      .map(([name, fn]) => `${name}: ${fn.description || 'No description'}`)
      .join('\n');

    return `You are a reasoning agent that uses the ReAct (Reason + Act) framework.

You have access to the following tools:
${toolDescriptions}

Use the following format:

Thought: you should always think about what to do
Action: the action to take, should be one of [${Object.keys(this.config.tools).join(', ')}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Important:
- Always think step by step
- Use tools when you need information or to perform actions
- When you have the final answer, say "Final Answer:" followed by the answer
- Be concise but thorough`;
  }

  private buildThoughtPrompt(history: string[]): string {
    return history.join('\n\n') + '\n\nThought:';
  }

  private async generateResponse(systemPrompt: string, userPrompt: string): Promise<CompletionResponse> {
    return await this.provider.complete({
      variables: { prompt: userPrompt },
      context: [systemPrompt],
      model_config: {
        provider: this.provider.id,
        model: this.provider.getInfo().default_model,
        temperature: 0.7,
        max_tokens: 1000,
      },
    });
  }

  private async generateFinalAnswer(systemPrompt: string, history: string[]): Promise<CompletionResponse> {
    const finalPrompt = history.join('\n\n') + '\n\nThought: I now know the final answer.\nFinal Answer:';
    return await this.generateResponse(systemPrompt, finalPrompt);
  }

  private parseThought(content: string): {
    content: string;
    action?: string;
    action_input?: any;
    is_final_answer: boolean;
  } {
    const lines = content.split('\n').filter(l => l.trim());
    
    let thoughtContent = '';
    let action: string | undefined;
    let actionInput: any;
    let isFinalAnswer = false;

    for (const line of lines) {
      if (line.startsWith('Thought:')) {
        thoughtContent = line.substring('Thought:'.length).trim();
      } else if (line.startsWith('Action:')) {
        action = line.substring('Action:'.length).trim();
      } else if (line.startsWith('Action Input:')) {
        try {
          actionInput = JSON.parse(line.substring('Action Input:'.length).trim());
        } catch {
          actionInput = line.substring('Action Input:'.length).trim();
        }
      } else if (line.startsWith('Final Answer:')) {
        thoughtContent = line.substring('Final Answer:'.length).trim();
        isFinalAnswer = true;
      }
    }

    if (!thoughtContent) {
      thoughtContent = content;
    }

    if (thoughtContent.toLowerCase().includes('final answer')) {
      isFinalAnswer = true;
    }

    return {
      content: thoughtContent,
      action,
      action_input: actionInput,
      is_final_answer: isFinalAnswer,
    };
  }

  private async executeTool(toolName: string, input: any): Promise<string> {
    const tool = this.config.tools[toolName];
    
    if (!tool) {
      return `Error: Tool "${toolName}" not found. Available tools: ${Object.keys(this.config.tools).join(', ')}`;
    }

    try {
      const result = await tool(input);
      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (error: any) {
      return `Error executing tool ${toolName}: ${error.message}`;
    }
  }
}
