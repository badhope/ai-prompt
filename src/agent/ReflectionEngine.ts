import { ILLMProvider } from '../interfaces';
import { CompletionResponse } from '../types';

export interface ReflectionCriteria {
  accuracy: boolean;
  completeness: boolean;
  relevance: boolean;
  clarity: boolean;
}

export interface ReflectionResult {
  should_refine: boolean;
  critique: string;
  suggestions: string[];
  score: number;
}

export interface ReflectionConfig {
  max_refinements: number;
  criteria: string[];
  min_score: number;
}

export class ReflectionEngine {
  private provider: ILLMProvider;
  private config: ReflectionConfig;

  constructor(provider: ILLMProvider, config?: Partial<ReflectionConfig>) {
    this.provider = provider;
    this.config = {
      max_refinements: 3,
      criteria: ['accuracy', 'completeness', 'relevance', 'clarity'],
      min_score: 0.8,
      ...config,
    };
  }

  async reflect(
    originalPrompt: string,
    response: string,
    criteria?: Partial<ReflectionCriteria>
  ): Promise<ReflectionResult> {
    const reflectionPrompt = this.buildReflectionPrompt(originalPrompt, response, criteria);

    const reflectionResponse = await this.provider.complete({
      variables: { prompt: reflectionPrompt },
      context: ['You are a critical reviewer that evaluates AI responses.'],
      model_config: {
        provider: this.provider.id,
        model: this.provider.getInfo().default_model,
        temperature: 0.3,
        max_tokens: 1000,
      },
    });

    return this.parseReflection(reflectionResponse.content);
  }

  async refine(
    originalPrompt: string,
    currentResponse: string,
    critique: string,
    suggestions: string[]
  ): Promise<string> {
    const refinementPrompt = this.buildRefinementPrompt(
      originalPrompt,
      currentResponse,
      critique,
      suggestions
    );

    const refinedResponse = await this.provider.complete({
      variables: { prompt: refinementPrompt },
      context: ['You are an AI assistant that improves responses based on feedback.'],
      model_config: {
        provider: this.provider.id,
        model: this.provider.getInfo().default_model,
        temperature: 0.5,
        max_tokens: 2000,
      },
    });

    return refinedResponse.content;
  }

  async executeWithReflection(
    prompt: string,
    initialResponse: string
  ): Promise<{ finalResponse: string; refinements: number; reflections: ReflectionResult[] }> {
    let currentResponse = initialResponse;
    let refinements = 0;
    const reflections: ReflectionResult[] = [];

    while (refinements < this.config.max_refinements) {
      const reflection = await this.reflect(prompt, currentResponse);
      reflections.push(reflection);

      if (!reflection.should_refine || reflection.score >= this.config.min_score) {
        break;
      }

      currentResponse = await this.refine(
        prompt,
        currentResponse,
        reflection.critique,
        reflection.suggestions
      );

      refinements++;
    }

    return {
      finalResponse: currentResponse,
      refinements,
      reflections,
    };
  }

  private buildReflectionPrompt(
    originalPrompt: string,
    response: string,
    criteria?: Partial<ReflectionCriteria>
  ): string {
    const criteriaList = this.config.criteria
      .filter(c => criteria?.[c as keyof ReflectionCriteria] !== false)
      .join(', ');

    return `Evaluate the following AI response based on these criteria: ${criteriaList}.

Original Prompt:
${originalPrompt}

AI Response:
${response}

Please provide:
1. A score from 0.0 to 1.0 (where 1.0 is perfect)
2. A brief critique of the response
3. Specific suggestions for improvement (if any)
4. Whether the response should be refined (yes/no)

Format your response as:
Score: [0.0-1.0]
Critique: [your critique]
Suggestions: [suggestion1, suggestion2, ...]
Should Refine: [yes/no]`;
  }

  private buildRefinementPrompt(
    originalPrompt: string,
    currentResponse: string,
    critique: string,
    suggestions: string[]
  ): string {
    return `Improve the following response based on the critique and suggestions.

Original Prompt:
${originalPrompt}

Current Response:
${currentResponse}

Critique:
${critique}

Suggestions:
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Please provide an improved response that addresses the critique and incorporates the suggestions:`;
  }

  private parseReflection(content: string): ReflectionResult {
    const lines = content.split('\n').filter(l => l.trim());
    
    let score = 0.5;
    let critique = '';
    let suggestions: string[] = [];
    let shouldRefine = false;

    for (const line of lines) {
      if (line.toLowerCase().startsWith('score:')) {
        const scoreMatch = line.match(/(\d+\.?\d*)/);
        if (scoreMatch) {
          score = parseFloat(scoreMatch[1]);
        }
      } else if (line.toLowerCase().startsWith('critique:')) {
        critique = line.substring('critique:'.length).trim();
      } else if (line.toLowerCase().startsWith('suggestions:')) {
        const suggestionsText = line.substring('suggestions:'.length).trim();
        suggestions = suggestionsText
          .split(/[,;]/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
      } else if (line.toLowerCase().startsWith('should refine:')) {
        const refineText = line.substring('should refine:'.length).trim().toLowerCase();
        shouldRefine = refineText === 'yes' || refineText === 'true';
      }
    }

    if (score < this.config.min_score) {
      shouldRefine = true;
    }

    return {
      should_refine: shouldRefine,
      critique,
      suggestions,
      score,
    };
  }
}
