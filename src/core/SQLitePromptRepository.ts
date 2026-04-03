import Database from 'better-sqlite3';
import { Prompt, PromptVersion, PromptFilter } from '../types';
import { IPromptRepository } from '../interfaces';

export class SQLitePromptRepository implements IPromptRepository {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        priority TEXT,
        template TEXT NOT NULL,
        variables TEXT,
        examples TEXT,
        version TEXT NOT NULL,
        author TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        tags TEXT,
        model_config TEXT NOT NULL,
        metrics TEXT,
        dependencies TEXT,
        variants TEXT,
        parent_version TEXT,
        is_active INTEGER DEFAULT 1,
        is_template INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS prompt_versions (
        id TEXT PRIMARY KEY,
        prompt_id TEXT NOT NULL,
        version TEXT NOT NULL,
        changes TEXT,
        created_at TEXT NOT NULL,
        author TEXT,
        prompt TEXT NOT NULL,
        FOREIGN KEY (prompt_id) REFERENCES prompts(id),
        UNIQUE(prompt_id, version)
      );

      CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
      CREATE INDEX IF NOT EXISTS idx_prompts_author ON prompts(author);
      CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at);
      CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
    `);
  }

  async save(prompt: Prompt): Promise<Prompt> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO prompts (
        id, name, description, category, priority, template, variables, examples,
        version, author, created_at, updated_at, tags, model_config, metrics,
        dependencies, variants, parent_version, is_active, is_template
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      prompt.id,
      prompt.name,
      prompt.description,
      prompt.category,
      prompt.priority,
      JSON.stringify(prompt.template),
      JSON.stringify(prompt.variables),
      JSON.stringify(prompt.examples),
      prompt.version,
      prompt.author,
      prompt.created_at.toISOString(),
      prompt.updated_at.toISOString(),
      JSON.stringify(prompt.tags),
      JSON.stringify(prompt.model_config),
      JSON.stringify(prompt.metrics),
      JSON.stringify(prompt.dependencies || []),
      JSON.stringify(prompt.variants || []),
      prompt.parent_version || null,
      prompt.is_active ? 1 : 0,
      prompt.is_template ? 1 : 0
    );

    return prompt;
  }

  async find(id: string): Promise<Prompt | null> {
    const stmt = this.db.prepare('SELECT * FROM prompts WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToPrompt(row);
  }

  async findAll(filter?: PromptFilter): Promise<Prompt[]> {
    let sql = 'SELECT * FROM prompts WHERE 1=1';
    const params: any[] = [];

    if (filter) {
      if (filter.category) {
        sql += ' AND category = ?';
        params.push(filter.category);
      }
      if (filter.author) {
        sql += ' AND author = ?';
        params.push(filter.author);
      }
      if (filter.is_active !== undefined) {
        sql += ' AND is_active = ?';
        params.push(filter.is_active ? 1 : 0);
      }
      if (filter.is_template !== undefined) {
        sql += ' AND is_template = ?';
        params.push(filter.is_template ? 1 : 0);
      }
      if (filter.created_after) {
        sql += ' AND created_at >= ?';
        params.push(filter.created_after.toISOString());
      }
      if (filter.created_before) {
        sql += ' AND created_at <= ?';
        params.push(filter.created_before.toISOString());
      }
      if (filter.search) {
        sql += ' AND (name LIKE ? OR description LIKE ?)';
        const searchPattern = `%${filter.search}%`;
        params.push(searchPattern, searchPattern);
      }
    }

    sql += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    let prompts = rows.map(row => this.rowToPrompt(row));

    if (filter?.tags && filter.tags.length > 0) {
      prompts = prompts.filter(p => 
        filter.tags!.some(tag => p.tags.includes(tag))
      );
    }

    return prompts;
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM prompts WHERE id = ?');
    stmt.run(id);

    const versionStmt = this.db.prepare('DELETE FROM prompt_versions WHERE prompt_id = ?');
    versionStmt.run(id);
  }

  async saveVersion(version: PromptVersion): Promise<PromptVersion> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO prompt_versions (
        id, prompt_id, version, changes, created_at, author, prompt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      version.id,
      version.prompt_id,
      version.version,
      version.changes,
      version.created_at.toISOString(),
      version.author,
      JSON.stringify(version.prompt)
    );

    return version;
  }

  async findVersion(promptId: string, version: string): Promise<PromptVersion | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM prompt_versions 
      WHERE prompt_id = ? AND version = ?
    `);
    const row = stmt.get(promptId, version) as any;

    if (!row) return null;

    return this.rowToVersion(row);
  }

  async findVersions(promptId: string): Promise<PromptVersion[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM prompt_versions 
      WHERE prompt_id = ? 
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(promptId) as any[];

    return rows.map(row => this.rowToVersion(row));
  }

  private rowToPrompt(row: any): Prompt {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      priority: row.priority,
      template: JSON.parse(row.template),
      variables: JSON.parse(row.variables || '[]'),
      examples: JSON.parse(row.examples || '[]'),
      version: row.version,
      author: row.author,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      tags: JSON.parse(row.tags || '[]'),
      model_config: JSON.parse(row.model_config),
      metrics: JSON.parse(row.metrics || '{}'),
      dependencies: JSON.parse(row.dependencies || '[]'),
      variants: JSON.parse(row.variants || '[]'),
      parent_version: row.parent_version || undefined,
      is_active: row.is_active === 1,
      is_template: row.is_template === 1,
    };
  }

  private rowToVersion(row: any): PromptVersion {
    return {
      id: row.id,
      prompt_id: row.prompt_id,
      version: row.version,
      changes: row.changes,
      created_at: new Date(row.created_at),
      author: row.author,
      prompt: JSON.parse(row.prompt),
    };
  }

  close(): void {
    this.db.close();
  }
}
