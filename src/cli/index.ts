#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { PromptManager } from '../core/PromptManager';
import { SQLitePromptRepository } from '../core/SQLitePromptRepository';
import { TemplateEngine } from '../core/TemplateEngine';
import { initializeProviders, globalRegistry } from '../providers';
import inquirer from 'inquirer';
import ora from 'ora';

const program = new Command();

const repository = new SQLitePromptRepository('./prompts.db');
const promptManager = new PromptManager(repository);
const templateEngine = new TemplateEngine();

program
  .name('prompt-cli')
  .description('AI Prompt Engineering Framework CLI')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize the prompt framework')
  .action(async () => {
    console.log(chalk.blue.bold('\n🚀 Initializing AI Prompt Framework...\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'providers',
        message: 'Select AI providers to configure:',
        choices: [
          { name: 'Anthropic Claude', value: 'claude', checked: true },
          { name: 'OpenAI GPT', value: 'openai', checked: true },
          { name: 'Google Gemini', value: 'gemini' },
        ],
      },
    ]);

    console.log(chalk.green('\n✓ Framework initialized successfully!'));
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('  1. Set API keys in environment variables'));
    console.log(chalk.gray('  2. Create your first prompt: prompt-cli create'));
    console.log(chalk.gray('  3. List prompts: prompt-cli list'));
  });

program
  .command('create')
  .description('Create a new prompt')
  .option('-n, --name <name>', 'Prompt name')
  .option('-c, --category <category>', 'Prompt category')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n📝 Create New Prompt\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Prompt name:',
        default: options.name,
        when: !options.name,
      },
      {
        type: 'list',
        name: 'category',
        message: 'Select category:',
        choices: [
          'coding',
          'writing',
          'analysis',
          'creative',
          'business',
          'education',
          'research',
          'automation',
        ],
        default: options.category,
        when: !options.category,
      },
      {
        type: 'editor',
        name: 'description',
        message: 'Enter prompt description:',
      },
      {
        type: 'list',
        name: 'provider',
        message: 'Select AI provider:',
        choices: ['claude', 'openai', 'gemini'],
      },
      {
        type: 'list',
        name: 'model',
        message: 'Select model:',
        choices: (answers) => {
          const models: Record<string, string[]> = {
            claude: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
            openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            gemini: ['gemini-1.5-pro', 'gemini-1.5-flash'],
          };
          return models[answers.provider] || [];
        },
      },
    ]);

    const spinner = ora('Creating prompt...').start();

    try {
      const prompt = await promptManager.create({
        name: answers.name || options.name,
        description: answers.description,
        category: answers.category || options.category,
        priority: 'medium',
        template: {
          metadata: {
            id: answers.name || options.name,
            version: '1.0.0',
            author: 'user',
            tags: [],
            description: answers.description,
          },
          sections: [
            {
              id: 'main',
              type: 'static',
              content: 'Enter your prompt template here...',
              order: 0,
            },
          ],
        },
        variables: [],
        examples: [],
        version: '1.0.0',
        author: 'user',
        tags: [],
        model_config: {
          provider: answers.provider,
          model: answers.model,
          temperature: 0.7,
          max_tokens: 4096,
        },
        metrics: {},
        is_active: true,
        is_template: false,
      });

      spinner.succeed(chalk.green('Prompt created successfully!'));
      console.log(chalk.gray(`\nID: ${prompt.id}`));
      console.log(chalk.gray(`Name: ${prompt.name}`));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to create prompt'));
      console.error(chalk.red(error.message));
    }
  });

program
  .command('list')
  .description('List all prompts')
  .option('-c, --category <category>', 'Filter by category')
  .option('-t, --tag <tag>', 'Filter by tag')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n📚 Prompt Library\n'));

    const prompts = await promptManager.list({
      category: options.category,
      tags: options.tag ? [options.tag] : undefined,
    });

    if (prompts.length === 0) {
      console.log(chalk.gray('No prompts found.'));
      return;
    }

    prompts.forEach((prompt) => {
      console.log(chalk.bold(prompt.name));
      console.log(chalk.gray(`  ID: ${prompt.id}`));
      console.log(chalk.gray(`  Category: ${prompt.category}`));
      console.log(chalk.gray(`  Model: ${prompt.model_config.model}`));
      console.log(chalk.gray(`  Version: ${prompt.version}`));
      console.log();
    });
  });

program
  .command('show <id>')
  .description('Show prompt details')
  .action(async (id) => {
    const prompt = await promptManager.read(id);

    if (!prompt) {
      console.log(chalk.red('Prompt not found.'));
      return;
    }

    console.log(chalk.blue.bold('\n📄 Prompt Details\n'));
    console.log(chalk.bold('Name:'), prompt.name);
    console.log(chalk.bold('ID:'), prompt.id);
    console.log(chalk.bold('Category:'), prompt.category);
    console.log(chalk.bold('Version:'), prompt.version);
    console.log(chalk.bold('Model:'), prompt.model_config.model);
    console.log(chalk.bold('Provider:'), prompt.model_config.provider);
    console.log(chalk.bold('Temperature:'), prompt.model_config.temperature);
    console.log(chalk.bold('Max Tokens:'), prompt.model_config.max_tokens);
    console.log();
    console.log(chalk.bold('Description:'));
    console.log(chalk.gray(prompt.description));
    console.log();
    console.log(chalk.bold('Tags:'), prompt.tags.join(', ') || 'None');
    console.log();
    console.log(chalk.bold('Template:'));
    console.log(chalk.gray(JSON.stringify(prompt.template, null, 2)));
  });

program
  .command('run <id>')
  .description('Execute a prompt')
  .option('-v, --variables <json>', 'Variables as JSON string')
  .action(async (id, options) => {
    const prompt = await promptManager.read(id);

    if (!prompt) {
      console.log(chalk.red('Prompt not found.'));
      return;
    }

    console.log(chalk.blue.bold(`\n🚀 Running Prompt: ${prompt.name}\n`));

    const variables = options.variables ? JSON.parse(options.variables) : {};

    const spinner = ora('Generating response...').start();

    try {
      initializeProviders();

      const provider = globalRegistry.get(prompt.model_config.provider);
      if (!provider) {
        throw new Error(`Provider not found: ${prompt.model_config.provider}`);
      }

      const response = await provider.complete({
        prompt_id: prompt.id,
        template: prompt.template,
        variables,
        model_config: prompt.model_config,
      });

      spinner.succeed(chalk.green('Response generated!'));
      console.log();
      console.log(chalk.bold('Output:'));
      console.log(response.content);
      console.log();
      console.log(chalk.gray(`Tokens: ${response.tokens.total} (in: ${response.tokens.input}, out: ${response.tokens.output})`));
      console.log(chalk.gray(`Latency: ${response.latency_ms}ms`));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to generate response'));
      console.error(chalk.red(error.message));
    }
  });

program
  .command('test <id>')
  .description('Test a prompt')
  .action(async (id) => {
    console.log(chalk.blue.bold('\n🧪 Testing Prompt\n'));

    const prompt = await promptManager.read(id);
    if (!prompt) {
      console.log(chalk.red('Prompt not found.'));
      return;
    }

    console.log(chalk.gray('Running validation tests...'));
    
    const validation = await promptManager.validate(prompt);

    if (validation.valid) {
      console.log(chalk.green('✓ All validation tests passed'));
    } else {
      console.log(chalk.red('✗ Validation failed:'));
      validation.errors.forEach((err) => {
        console.log(chalk.red(`  - ${err}`));
      });
    }

    if (validation.warnings && validation.warnings.length > 0) {
      console.log(chalk.yellow('\nWarnings:'));
      validation.warnings.forEach((warn) => {
        console.log(chalk.yellow(`  - ${warn}`));
      });
    }
  });

program
  .command('version <id>')
  .description('Create a new version of a prompt')
  .option('-m, --message <message>', 'Version message')
  .action(async (id, options) => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: 'Version message:',
        default: options.message,
        when: !options.message,
      },
    ]);

    const spinner = ora('Creating version...').start();

    try {
      const version = await promptManager.version(id, answers.message || options.message);
      spinner.succeed(chalk.green('Version created successfully!'));
      console.log(chalk.gray(`Version: ${version.version}`));
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to create version'));
      console.error(chalk.red(error.message));
    }
  });

program
  .command('search <query>')
  .description('Search prompts')
  .action(async (query) => {
    console.log(chalk.blue.bold('\n🔍 Search Results\n'));

    const prompts = await promptManager.search(query);

    if (prompts.length === 0) {
      console.log(chalk.gray('No prompts found matching your query.'));
      return;
    }

    prompts.forEach((prompt) => {
      console.log(chalk.bold(prompt.name));
      console.log(chalk.gray(`  ${prompt.description}`));
      console.log();
    });
  });

program.parse();
