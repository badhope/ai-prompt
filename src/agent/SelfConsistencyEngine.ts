import { ILLMProvider } from '../interfaces';
import { CompletionResponse } from '../types';

export interface SelfConsistencyConfig {
  num_samples: number;
  temperature: number;
  voting_strategy: 'majority' | 'weighted';
}

export interface SelfConsistencyResult {
  final_answer: string;
  all_answers: string[];
  vote_counts: Record<string, number>;
  confidence: number;
}

export class SelfConsistencyEngine {
  private provider: ILLMProvider;
  private config: SelfConsistencyConfig;

  constructor(provider: ILLMProvider, config?: Partial<SelfConsistencyConfig>) {
    this.provider = provider;
    this.config = {
      num_samples: 5,
      temperature: 0.7,
      voting_strategy: 'majority',
      ...config,
    };
  }

  async execute(prompt: string): Promise<SelfConsistencyResult> {
    const answers: string[] = [];

    for (let i = 0; i < this.config.num_samples; i++) {
      const response = await this.provider.complete({
        variables: { prompt },
        context: ['Think step by step and provide a clear answer.'],
        model_config: {
          provider: this.provider.id,
          model: this.provider.getInfo().default_model,
          temperature: this.config.temperature,
          max_tokens: 1000,
        },
      });

      answers.push(this.extractAnswer(response.content));
    }

    const voteCounts = this.countVotes(answers);
    const finalAnswer = this.selectWinner(voteCounts);
    const confidence = this.calculateConfidence(voteCounts, answers.length);

    return {
      final_answer: finalAnswer,
      all_answers: answers,
      vote_counts: voteCounts,
      confidence,
    };
  }

  private extractAnswer(content: string): string {
    const patterns = [
      /(?:therefore|thus|so|hence|the answer is|final answer)[\s:]+(.+?)(?:\n|$)/i,
      /(?:answer|result|conclusion)[\s:]+(.+?)(?:\n|$)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length > 0) {
      return sentences[sentences.length - 1].trim();
    }

    return content.trim();
  }

  private countVotes(answers: string[]): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const answer of answers) {
      const normalized = this.normalizeAnswer(answer);
      counts[normalized] = (counts[normalized] || 0) + 1;
    }

    return counts;
  }

  private normalizeAnswer(answer: string): string {
    return answer
      .toLowerCase()
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private selectWinner(voteCounts: Record<string, number>): string {
    let maxVotes = 0;
    let winner = '';

    for (const [answer, votes] of Object.entries(voteCounts)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        winner = answer;
      }
    }

    return winner;
  }

  private calculateConfidence(voteCounts: Record<string, number>, total: number): number {
    const maxVotes = Math.max(...Object.values(voteCounts));
    return maxVotes / total;
  }
}
