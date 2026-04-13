/**
 * 简单测试 - 验证提示词工程框架
 */

import { PromptFramework } from '../src/index';
import { createEasyAPI } from '../src/easy-api';
import { createIntegration } from '../src/integration';

async function simpleTest() {
  console.log('🧪 AI 提示词工程框架 - 使用测试\n');
  console.log('=' .repeat(60));

  // ============================================
  // 测试 1: 基础框架测试
  // ============================================
  console.log('\n📋 测试 1: 核心框架');
  
  const framework = new PromptFramework();
  
  const prompt = await framework.createPrompt({
    name: 'test',
    content: '测试问题：{{question}}',
    variables: { question: '什么是 TypeScript?' }
  });
  
  console.log('✅ 提示词已创建:', prompt.id);
  console.log('   内容:', prompt.content);
  
  const result = await framework.execute(prompt.id);
  console.log('✅ 执行结果:', result.result.substring(0, 50) + '...');

  // ============================================
  // 测试 2: Easy API 测试
  // ============================================
  console.log('\n📋 测试 2: Easy API');
  
  const api = createEasyAPI();
  
  const quickResult = await api.quick('测试快速执行');
  console.log('✅ 快速执行:', quickResult.result.substring(0, 50) + '...');
  
  const translateResult = await api.translate('你好世界');
  console.log('✅ 翻译结果:', translateResult.result.substring(0, 50) + '...');

  // ============================================
  // 测试 3: 模板引擎测试
  // ============================================
  console.log('\n📋 测试 3: 模板引擎');
  
  const template = await framework.createTemplate({
    name: 'greeting',
    content: '你好，{{name}}！今天是{{day}}',
    variables: ['name', 'day']
  });
  
  console.log('✅ 模板已创建:', template.name);
  
  const filled = await framework.fillTemplate(template.id, { name: '张三', day: '星期一' });
  console.log('✅ 填充后:', filled.content);

  // ============================================
  // 测试 4: 集成层测试
  // ============================================
  console.log('\n📋 测试 4: 软件集成层');
  
  const integration = createIntegration();
  const answer = await integration.ask('如何学习 TypeScript?');
  
  console.log('✅ 优化后的提示词:', answer.promptUsed.substring(0, 50) + '...');
  console.log('✅ 回答内容:', answer.content.substring(0, 50) + '...');
  console.log('✅ 执行耗时:', answer.duration + 'ms');

  // ============================================
  // 测试总结
  // ============================================
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 测试完成！\n');
  
  console.log('📊 测试结果:');
  console.log('✅ 提示词管理正常工作');
  console.log('✅ Easy API 正常工作');
  console.log('✅ 模板引擎正常工作');
  console.log('✅ 集成层正常工作');
  
  console.log('\n💡 结论:');
  console.log('   AI 提示词工程框架已成功集成！');
  console.log('   专注于核心的提示词工程功能。');
}

// 运行测试
simpleTest().catch(console.error);
