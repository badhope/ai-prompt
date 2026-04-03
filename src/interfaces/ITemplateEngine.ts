import {
  TemplateDefinition,
  VariableDefinition,
  Example,
  ValidationResult,
} from '../types';

export interface ITemplateEngine {
  render(
    template: TemplateDefinition,
    variables: Record<string, any>,
    examples?: Example[]
  ): Promise<string>;
  
  validate(
    template: TemplateDefinition,
    variables: VariableDefinition[]
  ): Promise<ValidationResult>;
  
  extractVariables(template: TemplateDefinition): VariableDefinition[];
  
  compress(template: TemplateDefinition): Promise<TemplateDefinition>;
  
  optimize(template: TemplateDefinition): Promise<TemplateDefinition>;
}

export interface ITemplateParser {
  parse(yaml: string): TemplateDefinition;
  stringify(template: TemplateDefinition): string;
  
  parseSection(content: string): TemplateSection;
  stringifySection(section: TemplateSection): string;
}

interface TemplateSection {
  id: string;
  type: 'static' | 'dynamic' | 'variable' | 'few_shot';
  content?: string;
  source?: string;
  min_examples?: number;
  max_examples?: number;
  order: number;
}
