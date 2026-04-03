import { TemplateDefinition, VariableDefinition, Example, ValidationResult } from '../types';
import { ITemplateEngine } from '../interfaces';

export class TemplateEngine implements ITemplateEngine {
  async render(
    template: TemplateDefinition,
    variables: Record<string, any>,
    examples?: Example[]
  ): Promise<string> {
    const sections: string[] = [];

    const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);

    for (const section of sortedSections) {
      const rendered = await this.renderSection(section, variables, examples);
      if (rendered) {
        sections.push(rendered);
      }
    }

    return sections.join('\n\n');
  }

  private async renderSection(
    section: TemplateDefinition['sections'][0],
    variables: Record<string, any>,
    examples?: Example[]
  ): Promise<string> {
    switch (section.type) {
      case 'static':
        return section.content || '';

      case 'dynamic':
        if (section.source && variables[section.source] !== undefined) {
          return String(variables[section.source]);
        }
        return section.content || '';

      case 'variable':
        if (section.source && variables[section.source] !== undefined) {
          return String(variables[section.source]);
        }
        return '';

      case 'few_shot':
        return this.renderFewShot(section, examples);

      default:
        return section.content || '';
    }
  }

  private renderFewShot(
    section: TemplateDefinition['sections'][0],
    examples?: Example[]
  ): string {
    if (!examples || examples.length === 0) {
      return '';
    }

    const minExamples = section.min_examples || 1;
    const maxExamples = section.max_examples || examples.length;
    
    const selectedExamples = examples.slice(0, Math.min(maxExamples, examples.length));
    
    if (selectedExamples.length < minExamples) {
      console.warn(`Not enough examples: ${selectedExamples.length} < ${minExamples}`);
    }

    const exampleStrings = selectedExamples.map((ex, idx) => {
      const inputStr = Object.entries(ex.input)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      return `Example ${idx + 1}:\nInput:\n${inputStr}\n\nOutput:\n${ex.output}`;
    });

    return exampleStrings.join('\n\n---\n\n');
  }

  async validate(
    template: TemplateDefinition,
    variables: VariableDefinition[]
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template.metadata || !template.metadata.id) {
      errors.push('Template metadata must include an id');
    }

    if (!template.sections || template.sections.length === 0) {
      errors.push('Template must have at least one section');
    }

    const variableNames = new Set(variables.map(v => v.name));
    
    for (const section of template.sections) {
      if (section.type === 'variable' || section.type === 'dynamic') {
        if (section.source && !variableNames.has(section.source)) {
          errors.push(`Section references undefined variable: ${section.source}`);
        }
      }

      if (section.type === 'few_shot') {
        if (section.min_examples && section.min_examples < 0) {
          errors.push('min_examples must be non-negative');
        }
        if (section.max_examples && section.max_examples < 1) {
          errors.push('max_examples must be at least 1');
        }
        if (section.min_examples && section.max_examples && section.min_examples > section.max_examples) {
          errors.push('min_examples cannot be greater than max_examples');
        }
      }
    }

    for (const variable of variables) {
      if (variable.required && !variable.default) {
        warnings.push(`Required variable "${variable.name}" has no default value`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  extractVariables(template: TemplateDefinition): VariableDefinition[] {
    const variables: VariableDefinition[] = [];
    const seen = new Set<string>();

    for (const section of template.sections) {
      if ((section.type === 'variable' || section.type === 'dynamic') && section.source) {
        if (!seen.has(section.source)) {
          seen.add(section.source);
          variables.push({
            name: section.source,
            type: 'string',
            required: true,
          });
        }
      }
    }

    return variables;
  }

  async compress(template: TemplateDefinition): Promise<TemplateDefinition> {
    const compressedSections = template.sections.map(section => {
      if (section.type === 'static' && section.content) {
        const compressed = this.compressText(section.content);
        return { ...section, content: compressed };
      }
      return section;
    });

    return { ...template, sections: compressedSections };
  }

  async optimize(template: TemplateDefinition): Promise<TemplateDefinition> {
    let optimized = { ...template };

    optimized = this.removeDuplicateSections(optimized);
    optimized = this.reorderSections(optimized);
    optimized = await this.compress(optimized);

    return optimized;
  }

  private compressText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  private removeDuplicateSections(template: TemplateDefinition): TemplateDefinition {
    const seen = new Set<string>();
    const uniqueSections: typeof template.sections = [];

    for (const section of template.sections) {
      const key = `${section.type}:${section.content || section.source}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSections.push(section);
      }
    }

    return { ...template, sections: uniqueSections };
  }

  private reorderSections(template: TemplateDefinition): TemplateDefinition {
    const priorityOrder = ['static', 'variable', 'dynamic', 'few_shot'];
    
    const sorted = [...template.sections].sort((a, b) => {
      const priorityA = priorityOrder.indexOf(a.type);
      const priorityB = priorityOrder.indexOf(b.type);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return a.order - b.order;
    });

    return {
      ...template,
      sections: sorted.map((section, idx) => ({ ...section, order: idx })),
    };
  }
}
