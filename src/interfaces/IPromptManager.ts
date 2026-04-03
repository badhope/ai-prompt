import { Prompt, PromptVersion, ValidationResult } from '../types';

export interface IPromptManager {
  create(prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>): Promise<Prompt>;
  read(id: string): Promise<Prompt | null>;
  update(id: string, changes: Partial<Prompt>): Promise<Prompt>;
  delete(id: string): Promise<void>;
  
  list(filter?: PromptFilter): Promise<Prompt[]>;
  search(query: string): Promise<Prompt[]>;
  findByTag(tag: string): Promise<Prompt[]>;
  
  version(promptId: string, changes: string): Promise<PromptVersion>;
  getVersion(promptId: string, version: string): Promise<PromptVersion | null>;
  listVersions(promptId: string): Promise<PromptVersion[]>;
  rollback(promptId: string, version: string): Promise<Prompt>;
  
  validate(prompt: Prompt): Promise<ValidationResult>;
  duplicate(id: string, newName: string): Promise<Prompt>;
}

export interface PromptFilter {
  category?: string;
  tags?: string[];
  author?: string;
  is_active?: boolean;
  is_template?: boolean;
  created_after?: Date;
  created_before?: Date;
  search?: string;
}

export interface IPromptRepository {
  save(prompt: Prompt): Promise<Prompt>;
  find(id: string): Promise<Prompt | null>;
  findAll(filter?: PromptFilter): Promise<Prompt[]>;
  delete(id: string): Promise<void>;
  
  saveVersion(version: PromptVersion): Promise<PromptVersion>;
  findVersion(promptId: string, version: string): Promise<PromptVersion | null>;
  findVersions(promptId: string): Promise<PromptVersion[]>;
}
