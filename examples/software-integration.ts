/**
 * 软件集成示例
 * 
 * 演示如何在您的软件中使用 AI 提示词工程
 */

import { createIntegration } from '../src/integration';

async function main() {
  console.log('=== AI 提示词工程 - 软件集成示例 ===\n');

  const integration = createIntegration({
    autoOptimize: true,
    enableContext: true,
    maxContextLength: 10
  });

  // ============================================
  // 场景 1: 直接提问 - 自动优化提示词
  // ============================================
  console.log('场景 1: 直接提问（自动优化）');
  const result1 = await integration.ask('如何学习 TypeScript?');
  console.log('问题：如何学习 TypeScript?');
  console.log('优化后的提示词:', result1.promptUsed);
  console.log('回答:', result1.content.substring(0, 100) + '...');
  console.log('耗时:', result1.duration, 'ms\n');

  // ============================================
  // 场景 2: 使用自定义模板
  // ============================================
  console.log('场景 2: 使用自定义提示词模板');
  const result2 = await integration.withTemplate(
    '请作为资深程序员，帮我审查以下代码：{{code}}',
    { code: 'function add(a, b) { return a + b; }' }
  );
  console.log('模板内容:', result2.promptUsed);
  console.log('审查结果:', result2.content.substring(0, 100) + '...\n');

  // ============================================
  // 场景 3: 批量处理问题
  // ============================================
  console.log('场景 3: 批量处理');
  const batchResults = await integration.batch([
    '什么是 AI?',
    '什么是机器学习？',
    '什么是深度学习？'
  ]);
  console.log('批量处理了', batchResults.length, '个问题');
  console.log('第一个问题回答:', batchResults[0].content.substring(0, 50) + '...\n');

  // ============================================
  // 场景 4: 上下文对话
  // ============================================
  console.log('场景 4: 多轮对话（上下文记忆）');
  const q1 = await integration.ask('什么是 TypeScript?');
  console.log('问：什么是 TypeScript?');
  console.log('答:', q1.content.substring(0, 80) + '...');

  const q2 = await integration.ask('它和 JavaScript 有什么区别？');
  console.log('问：它和 JavaScript 有什么区别？');
  console.log('答:', q2.content.substring(0, 80) + '...');

  console.log('\n对话历史条数:', integration.getHistory().length);

  // ============================================
  // 场景 5: 自定义提示词增强函数
  // ============================================
  console.log('\n场景 5: 自定义提示词增强');
  const customIntegration = createIntegration({
    customEnhancer: (question: string) => {
      return `你是一位经验丰富的技术专家，请用专业、详细的方式回答：${question}`;
    }
  });

  const customResult = await customIntegration.ask('React Hooks 如何使用？');
  console.log('自定义增强后的提示词:', customResult.promptUsed.substring(0, 80) + '...');
  console.log('回答:', customResult.content.substring(0, 100) + '...');

  console.log('\n=== 所有示例执行完成 ===');
  console.log('✅ 提示词自动优化');
  console.log('✅ 模板引擎');
  console.log('✅ 批量处理');
  console.log('✅ 上下文记忆');
  console.log('✅ 自定义增强');
}

main().catch(console.error);
