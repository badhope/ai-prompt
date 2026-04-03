import { v4 as uuidv4 } from 'uuid';
import { Prompt, PromptVersion, ValidationResult, PromptFilter } from '../types';
import { IPromptManager, IPromptRepository } from '../interfaces';

export class PromptManager implements IPromptManager {
  private repository: IPromptRepository;
  private cache: Map<string, Prompt> = new Map();

  constructor(repository: IPromptRepository) {
    this.repository = repository;
  }

  async create(promptData: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>): Promise<Prompt> {
    const validation = await this.validate(promptData as Prompt);
    if (!validation.valid) {
      throw new Error(`Invalid prompt: ${validation.errors.join(', ')}`);
    }

    const prompt: Prompt = {
      ...promptData,
      id: uuidv4(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const saved = await this.repository.save(prompt);
    this.cache.set(saved.id, saved);
    
    return saved;
  }

  async read(id: string): Promise<Prompt | null> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const prompt = await this.repository.find(id);
    if (prompt) {
      this.cache.set(id, prompt);
    }
    
    return prompt;
  }

  async update(id: string, changes: Partial<Prompt>): Promise<Prompt> {
    const existing = await this.read(id);
    if (!existing) {
      throw new Error(`Prompt not found: ${id}`);
    }

    const updated: Prompt = {
      ...existing,
      ...changes,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: new Date(),
    };

    const validation = await this.validate(updated);
    if (!validation.valid) {
      throw new Error(`Invalid prompt: ${validation.errors.join(', ')}`);
    }

    const saved = await this.repository.save(updated);
    this.cache.set(id, saved);
    
    return saved;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
    this.cache.delete(id);
  }

  async list(filter?: PromptFilter): Promise<Prompt[]> {
    return this.repository.findAll(filter);
  }

  async search(query: string): Promise<Prompt[]> {
    const all = await this.list();
    const lowerQuery = query.toLowerCase();
    
    return all.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async findByTag(tag: string): Promise<Prompt[]> {
    return this.list({ tags: [tag] });
  }

  async version(promptId: string, changes: string): Promise<PromptVersion> {
    const prompt = await this.read(promptId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    const versions = await this.repository.findVersions(promptId);
    const latestVersion = versions.length > 0 
      ? this.parseVersion(versions[0].version)
      : { major: 1, minor: 0, patch: 0 };

    const newVersion = `${latestVersion.major}.${latestVersion.minor}.${latestVersion.patch + 1}`;

    const versionRecord: PromptVersion = {
      id: uuidv4(),
      prompt_id: promptId,
      version: newVersion,
      changes,
      created_at: new Date(),
      author: prompt.author,
      prompt: { ...prompt, version: newVersion },
    };

    await this.repository.saveVersion(versionRecord);
    
    await this.update(promptId, { version: newVersion });
    
    return versionRecord;
  }

  async getVersion(promptId: string, version: string): Promise<PromptVersion | null> {
    return this.repository.findVersion(promptId, version);
  }

  async listVersions(promptId: string): Promise<PromptVersion[]> {
    return this.repository.findVersions(promptId);
  }

  async rollback(promptId: string, version: string): Promise<Prompt> {
    const versionRecord = await this.getVersion(promptId, version);
    if (!versionRecord) {
      throw new Error(`Version not found: ${version}`);
    }

    const rolledBack = await this.update(promptId, {
      ...versionRecord.prompt,
      parent_version: promptId,
    });

    return rolledBack;
  }

  async validate(prompt: Prompt): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!prompt.name || prompt.name.trim().length === 0) {
      errors.push('Prompt name is required');
    }

    if (!prompt.template || !prompt.template.metadata) {
      errors.push('Template metadata is required');
    }

    if (!prompt.model_config || !prompt.model_config.provider || !prompt.model_config.model) {
      errors.push('Model configuration is incomplete');
    }

    if (prompt.variables) {
      for (const variable of prompt.variables) {
        if (!variable.name) {
          errors.push('Variable name is required');
        }
        if (!variable.type) {
          errors.push(`Variable ${variable.name} must have a type`);
        }
      }
    }

    if (prompt.model_config.temperature < 0 || prompt.model_config.temperature > 2) {
      warnings.push('Temperature should be between 0 and 2');
    }

    if (prompt.model_config.max_tokens < 1) {
      errors.push('Max tokens must be at least 1');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async duplicate(id: string, newName: string): Promise<Prompt> {
    const original = await this.read(id);
    if (!original) {
      throw new Error(`Prompt not found: ${id}`);
    }

    const duplicate = await this.create({
      ...original,
      name: newName,
      version: '1.0.0',
      parent_version: id,
      metrics: {},
    });

    return duplicate;
  }

  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 1,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  }
}
