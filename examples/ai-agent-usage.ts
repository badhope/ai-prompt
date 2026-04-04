import { PromptFramework } from '../src/index';

async function main() {
  console.log('=== AI Prompt Framework - AI Agent 使用示例 ===\n');

  const framework = new PromptFramework();

  // 1. 创建代码审查代理
  console.log('1. 创建代码审查代理');
  const codeReviewer = await framework.createAgent({
    name: 'code-reviewer',
    type: 'code-assistant',
    capabilities: ['code-review', 'bug-detection', 'optimization'],
    systemPrompt: '你是一个专业的代码审查助手，擅长发现代码问题和提供改进建议。'
  });

  const reviewResult = await framework.executeAgent(codeReviewer.id, {
    task: 'review-code',
    code: `
      function calculateTotal(items) {
        let total = 0;
        for (let i = 0; i < items.length; i++) {
          total = total + items[i].price * items[i].quantity;
        }
        return total;
      }
    `,
    language: 'JavaScript'
  });
  console.log('代码审查结果:', reviewResult);
  console.log();

  // 2. 创建文档生成代理
  console.log('2. 创建文档生成代理');
  const docGenerator = await framework.createAgent({
    name: 'doc-generator',
    type: 'documentation-assistant',
    capabilities: ['api-docs', 'readme', 'tutorial'],
    systemPrompt: '你是一个技术文档专家，擅长编写清晰、详细的文档。'
  });

  const docResult = await framework.executeAgent(docGenerator.id, {
    task: 'generate-api-docs',
    code: `
      export class UserService {
        async getUser(id: string): Promise<User> {
          return this.db.users.find(id);
        }
        
        async createUser(data: CreateUserDTO): Promise<User> {
          return this.db.users.create(data);
        }
      }
    `,
    language: 'TypeScript'
  });
  console.log('文档生成结果:', docResult);
  console.log();

  // 3. 创建测试生成代理
  console.log('3. 创建测试生成代理');
  const testGenerator = await framework.createAgent({
    name: 'test-generator',
    type: 'testing-assistant',
    capabilities: ['unit-tests', 'integration-tests', 'e2e-tests'],
    systemPrompt: '你是一个测试专家，擅长编写全面的测试用例。'
  });

  const testResult = await framework.executeAgent(testGenerator.id, {
    task: 'generate-unit-tests',
    code: `
      export function validateEmail(email: string): boolean {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      }
    `,
    language: 'TypeScript',
    framework: 'vitest'
  });
  console.log('测试生成结果:', testResult);
  console.log();

  // 4. 创建重构代理
  console.log('4. 创建重构代理');
  const refactorAgent = await framework.createAgent({
    name: 'refactor-agent',
    type: 'refactoring-assistant',
    capabilities: ['code-refactoring', 'performance-optimization', 'clean-code'],
    systemPrompt: '你是一个代码重构专家，擅长优化代码结构和性能。'
  });

  const refactorResult = await framework.executeAgent(refactorAgent.id, {
    task: 'refactor-code',
    code: `
      function processData(data) {
        var result = [];
        for (var i = 0; i < data.length; i++) {
          if (data[i].active) {
            result.push({
              name: data[i].name,
              value: data[i].value * 2
            });
          }
        }
        return result;
      }
    `,
    language: 'JavaScript',
    goals: ['modernize', 'optimize', 'clean-code']
  });
  console.log('重构结果:', refactorResult);
  console.log();

  // 5. 创建多任务代理
  console.log('5. 创建多任务代理');
  const multiTaskAgent = await framework.createAgent({
    name: 'multi-task-agent',
    type: 'general-assistant',
    capabilities: ['analysis', 'generation', 'transformation'],
    systemPrompt: '你是一个多功能的AI助手，可以处理各种任务。'
  });

  const multiTaskResult = await framework.executeAgent(multiTaskAgent.id, {
    tasks: [
      { type: 'analyze', data: '分析这段代码的性能' },
      { type: 'generate', data: '生成优化建议' },
      { type: 'transform', data: '提供重构方案' }
    ]
  });
  console.log('多任务执行结果:', multiTaskResult);
  console.log();

  // 6. 获取统计信息
  console.log('6. 获取统计信息');
  const stats = framework.getStats();
  console.log('框架统计:', stats);
}

main().catch(console.error);
