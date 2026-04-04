/**
 * 软件集成示例
 * 
 * 演示如何在您的软件中使用 AI 提示词工程
 */

import { createIntegration } from '../src/integration';

async function main() {
  console.log('=== AI 提示词工程 - 软件集成示例 ===\n');

  // 1. 创建集成实例
  const integration = createIntegration({
    autoOptimize: true,      // 启用自动优化
    enableContext: true,     // 启用上下文记忆
    maxContextLength: 10     // 最大保存 10 轮对话
  });

  // ============================================
  // 场景 1: 直接提问
  // ============================================
  console.log('场景 1: 直接提问');
  const result1 = await integration.ask('如何学习 TypeScript?');
  console.log('问题：如何学习 TypeScript?');
  console.log('优化后的提示词:', result1.promptUsed);
  console.log('回答:', result1.content.substring(0, 100) + '...');
  console.log('耗时:', result1.duration, 'ms\n');

  // ============================================
  // 场景 2: 代码相关问题
  // ============================================
  console.log('场景 2: 代码审查');
  const result2 = await integration.askWithScenario(
    'function add(a, b) { return a + b; }',
    'code'
  );
  console.log('代码:', 'function add(a, b) { return a + b; }');
  console.log('审查结果:', result2.substring(0, 100) + '...\n');

  // ============================================
  // 场景 3: 文本翻译
  // ============================================
  console.log('场景 3: 文本翻译');
  const result3 = await integration.askWithScenario(
    '你好，很高兴认识你',
    'translation'
  );
  console.log('翻译结果:', result3.substring(0, 100) + '...\n');

  // ============================================
  // 场景 4: 使用预设模板
  // ============================================
  console.log('场景 4: 使用模板');
  const result4 = await integration.quickAsk(
    '解释一下什么是闭包',
    'code'
  );
  console.log('闭包解释:', result4.substring(0, 100) + '...\n');

  // ============================================
  // 场景 5: 批量处理
  // ============================================
  console.log('场景 5: 批量处理问题');
  const batchResults = await integration.batchAsk([
    '什么是 AI?',
    '什么是机器学习？',
    '什么是深度学习？'
  ]);
  console.log('批量处理了', batchResults.length, '个问题');
  console.log('第一个问题回答:', batchResults[0].content.substring(0, 50) + '...\n');

  // ============================================
  // 场景 6: 上下文对话
  // ============================================
  console.log('场景 6: 多轮对话');
  const q1 = await integration.ask('什么是 TypeScript?');
  console.log('问：什么是 TypeScript?');
  console.log('答:', q1.content.substring(0, 80) + '...');

  const q2 = await integration.ask('它和 JavaScript 有什么区别？');
  console.log('问：它和 JavaScript 有什么区别？');
  console.log('答:', q2.content.substring(0, 80) + '...');

  console.log('\n对话历史长度:', integration.getHistory().length);

  // ============================================
  // 场景 7: 自定义提示词增强
  // ============================================
  console.log('\n场景 7: 自定义提示词增强');
  const customIntegration = createIntegration({
    customEnhancer: (question) => {
      // 添加详细的角色和任务说明
      return `你是一位经验丰富的专家，请用专业、详细的方式回答：${question}`;
    }
  });

  const customResult = await customIntegration.ask('React Hooks 如何使用？');
  console.log('自定义增强后的回答:', customResult.content.substring(0, 100) + '...');
}

main().catch(console.error);
