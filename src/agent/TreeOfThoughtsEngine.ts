import { ILLMProvider } from '../interfaces';
import { CompletionResponse } from '../types';

export interface Thought {
  id: string;
  content: string;
  score: number;
  parent_id?: string;
  children: string[];
  depth: number;
  is_solution: boolean;
}

export interface TreeOfThoughtsConfig {
  max_depth: number;
  branching_factor: number;
  evaluation_method: 'llm' | 'heuristic';
  search_strategy: 'breadth_first' | 'depth_first' | 'best_first';
  pruning_threshold: number;
}

export interface TreeOfThoughtsResult {
  solution: string;
  thoughts: Thought[];
  best_path: string[];
  total_thoughts: number;
  search_time: number;
}

export class TreeOfThoughtsEngine {
  private provider: ILLMProvider;
  private config: TreeOfThoughtsConfig;
  private thoughts: Map<string, Thought> = new Map();

  constructor(provider: ILLMProvider, config?: Partial<TreeOfThoughtsConfig>) {
    this.provider = provider;
    this.config = {
      max_depth: 5,
      branching_factor: 3,
      evaluation_method: 'llm',
      search_strategy: 'best_first',
      pruning_threshold: 0.3,
      ...config,
    };
  }

  async solve(problem: string): Promise<TreeOfThoughtsResult> {
    const startTime = Date.now();
    this.thoughts.clear();

    const rootThought: Thought = {
      id: this.generateId(),
      content: `Problem: ${problem}`,
      score: 1.0,
      children: [],
      depth: 0,
      is_solution: false,
    };

    this.thoughts.set(rootThought.id, rootThought);

    let solution: Thought | null = null;
    const queue: Thought[] = [rootThought];
    let iterations = 0;
    const maxIterations = 1000;

    while (queue.length > 0 && !solution && iterations < maxIterations) {
      iterations++;
      let current: Thought;

      switch (this.config.search_strategy) {
        case 'breadth_first':
          current = queue.shift()!;
          break;
        case 'depth_first':
          current = queue.pop()!;
          break;
        case 'best_first':
          queue.sort((a, b) => b.score - a.score);
          current = queue.shift()!;
          break;
        default:
          current = queue.shift()!;
      }

      if (current.depth >= this.config.max_depth) {
        continue;
      }

      const children = await this.generateThoughts(problem, current);
      
      for (const child of children) {
        this.thoughts.set(child.id, child);
        current.children.push(child.id);

        if (child.is_solution) {
          solution = child;
          break;
        }

        if (child.score >= this.config.pruning_threshold) {
          queue.push(child);
        }
      }
    }

    if (!solution) {
      const allThoughts = Array.from(this.thoughts.values());
      solution = allThoughts.reduce((best, current) => 
        current.score > best.score ? current : best
      );
    }

    const bestPath = this.findBestPath(solution.id);

    return {
      solution: solution.content,
      thoughts: Array.from(this.thoughts.values()),
      best_path: bestPath,
      total_thoughts: this.thoughts.size,
      search_time: Date.now() - startTime,
    };
  }

  private async generateThoughts(problem: string, parent: Thought): Promise<Thought[]> {
    const prompt = this.buildGenerationPrompt(problem, parent);

    const response = await this.provider.complete({
      variables: { prompt },
      context: ['You are a reasoning assistant that thinks through problems step by step.'],
      model_config: {
        provider: this.provider.id,
        model: this.provider.getInfo().default_model,
        temperature: 0.7,
        max_tokens: 1000,
      },
    });

    const thoughtTexts = this.parseThoughts(response.content);
    const thoughts: Thought[] = [];

    for (const text of thoughtTexts.slice(0, this.config.branching_factor)) {
      const score = await this.evaluateThought(text, problem);
      
      const thought: Thought = {
        id: this.generateId(),
        content: text,
        score,
        parent_id: parent.id,
        children: [],
        depth: parent.depth + 1,
        is_solution: this.isSolution(text),
      };

      thoughts.push(thought);
    }

    return thoughts;
  }

  private async evaluateThought(thought: string, problem: string): Promise<number> {
    if (this.config.evaluation_method === 'heuristic') {
      return this.heuristicEvaluation(thought);
    }

    const prompt = this.buildEvaluationPrompt(thought, problem);

    const response = await this.provider.complete({
      variables: { prompt },
      context: ['You are an evaluator that scores reasoning steps.'],
      model_config: {
        provider: this.provider.id,
        model: this.provider.getInfo().default_model,
        temperature: 0.3,
        max_tokens: 100,
      },
    });

    const scoreMatch = response.content.match(/(\d+\.?\d*)/);
    return scoreMatch ? parseFloat(scoreMatch[1]) / 10 : 0.5;
  }

  private heuristicEvaluation(thought: string): number {
    let score = 0.5;

    const positiveIndicators = [
      'therefore',
      'thus',
      'so',
      'hence',
      'conclusion',
      'solution',
      'answer',
      'result',
    ];

    const negativeIndicators = [
      'maybe',
      'perhaps',
      'might',
      'could be',
      'unsure',
      'unclear',
    ];

    const lowerThought = thought.toLowerCase();

    positiveIndicators.forEach(indicator => {
      if (lowerThought.includes(indicator)) {
        score += 0.1;
      }
    });

    negativeIndicators.forEach(indicator => {
      if (lowerThought.includes(indicator)) {
        score -= 0.1;
      }
    });

    return Math.max(0, Math.min(1, score));
  }

  private buildGenerationPrompt(problem: string, parent: Thought): string {
    return `Given the problem: "${problem}"

Current reasoning path:
${this.getReasoningPath(parent.id)}

Generate ${this.config.branching_factor} possible next steps in the reasoning process.
Each step should:
1. Build upon the previous reasoning
2. Move closer to solving the problem
3. Be clear and logical

Format each step as:
Thought: [your reasoning step]`;
  }

  private buildEvaluationPrompt(thought: string, problem: string): string {
    return `Evaluate this reasoning step for solving the problem: "${problem}"

Reasoning step: "${thought}"

Score this step from 0 to 10 based on:
- Relevance to the problem (0-3 points)
- Logical correctness (0-3 points)
- Progress toward solution (0-4 points)

Provide only the numeric score.`;
  }

  private parseThoughts(content: string): string[] {
    const thoughts: string[] = [];
    const lines = content.split('\n');

    let currentThought = '';

    for (const line of lines) {
      if (line.trim().startsWith('Thought:')) {
        if (currentThought) {
          thoughts.push(currentThought.trim());
        }
        currentThought = line.replace(/^Thought:\s*/, '');
      } else if (currentThought) {
        currentThought += ' ' + line.trim();
      }
    }

    if (currentThought) {
      thoughts.push(currentThought.trim());
    }

    return thoughts.filter(t => t.length > 0);
  }

  private isSolution(thought: string): boolean {
    const solutionIndicators = [
      'final answer',
      'solution is',
      'therefore the answer',
      'the answer is',
      'conclusion:',
    ];

    const lowerThought = thought.toLowerCase();
    return solutionIndicators.some(indicator => lowerThought.includes(indicator));
  }

  private getReasoningPath(thoughtId: string): string {
    const path: string[] = [];
    let current: Thought | undefined = this.thoughts.get(thoughtId);

    while (current) {
      path.unshift(current.content);
      current = current.parent_id ? this.thoughts.get(current.parent_id) : undefined;
    }

    return path.map((step, i) => `${i + 1}. ${step}`).join('\n');
  }

  private findBestPath(thoughtId: string): string[] {
    const path: string[] = [];
    let current: Thought | undefined = this.thoughts.get(thoughtId);

    while (current) {
      path.unshift(current.id);
      current = current.parent_id ? this.thoughts.get(current.parent_id) : undefined;
    }

    return path;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}
