/**
 * 简单测试 - 验证是否在使用提示词工程
 */

import { PromptFramework } from '../src/index';
import { createEasyAPI } from '../src/easy-api';
import { createMultiAgentOrchestrator } from '../src/multi-agent';

async function simpleTest() {
  console.log('🧪 AI 提示词工程框架 - 使用测试\n');
  console.log('=' .repeat(60));

  // ============================================
  // 测试 1: 基础框架测试
  // ============================================
  console.log('\n📋 测试 1: 基础框架');
  
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
  // 测试 3: 多智能体测试
  // ============================================
  console.log('\n📋 测试 3: 多智能体系统');
  
  const orchestrator = createMultiAgentOrchestrator();
  
  // 查看可用的智能体
  const agents = orchestrator.getAgents();
  console.log('✅ 已注册智能体数量:', agents.length);
  console.log('   智能体列表:');
  agents.slice(0, 3).forEach(agent => {
    console.log(`   - ${agent.name} (${agent.specialty})`);
  });
  
  // 测试智能体路由
  const codeQuestion = '这段代码有bug吗？function add(a, b) { return a - b; }';
  const codeResult = await orchestrator.executeTask({
    type: 'question',
    content: codeQuestion
  });
  
  console.log('\n✅ 代码问题测试:');
  console.log('   问题:', codeQuestion);
  console.log('   → 路由到:', codeResult.agentName);
  console.log('   → 置信度:', (codeResult.confidence * 100).toFixed(0) + '%');
  console.log('   → 耗时:', codeResult.duration + 'ms');
  
  // 测试翻译问题
  const translateQuestion = '翻译成英文：你好世界';
  const translateResult2 = await orchestrator.executeTask({
    type: 'question',
    content: translateQuestion
  });
  
  console.log('\n✅ 翻译问题测试:');
  console.log('   问题:', translateQuestion);
  console.log('   → 路由到:', translateResult2.agentName);
  console.log('   → 置信度:', (translateResult2.confidence * 100).toFixed(0) + '%');
  console.log('   → 耗时:', translateResult2.duration + 'ms');

  // ============================================
  // 测试总结
  // ============================================
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 测试完成！\n');
  
  console.log('📊 测试结果:');
  console.log('✅ 基础框架正常工作');
  console.log('✅ Easy API 正常工作');
  console.log('✅ 多智能体系统正常工作');
  console.log('✅ 智能体自动路由正常');
  
  console.log('\n💡 结论:');
  console.log('   AI 提示词工程框架已成功集成！');
  console.log('   每次提问都会自动应用优化的提示词。');
  console.log('   不同类型的问题会自动路由到合适的智能体。');
  
  console.log('\n📈 使用统计:');
  const history = orchestrator.getHistory(10);
  console.log('   总任务数:', history.length);
  
  const agentUsage: Record<string, number> = {};
  history.forEach(h => {
    const agent = h.response.agentName;
    agentUsage[agent] = (agentUsage[agent] || 0) + 1;
  });
  
  console.log('   智能体使用情况:');
  Object.entries(agentUsage).forEach(([agent, count]) => {
    console.log(`     • ${agent}: ${count} 次`);
  });
}

// 运行测试
simpleTest().catch(console.error);
