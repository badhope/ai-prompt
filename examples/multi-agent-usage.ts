/**
 * 多智能体架构使用示例
 * 
 * 演示如何使用不同的智能体处理不同类型的任务
 */

import { createMultiAgentOrchestrator } from '../src/multi-agent';

async function main() {
  console.log('=== 多智能体架构使用示例 ===\n');

  // 创建多智能体编排器
  const orchestrator = createMultiAgentOrchestrator();

  // 查看可用的智能体
  console.log('📋 已注册的智能体：');
  const agents = orchestrator.getAgents();
  agents.forEach(agent => {
    console.log(`  - ${agent.name} (${agent.specialty})`);
    console.log(`    关键词: ${agent.keywords.join(', ') || '无'}`);
    console.log(`    优先级: ${agent.priority}`);
  });
  console.log();

  // ============================================
  // 场景 1: 自动选择智能体
  // ============================================
  console.log('场景 1: 自动选择智能体');
  
  const task1 = {
    type: 'question',
    content: '这段代码有bug吗？function add(a, b) { return a - b; }'
  };
  
  const response1 = await orchestrator.executeTask(task1);
  console.log(`问题: ${task1.content}`);
  console.log(`使用的智能体: ${response1.agentName} (${response1.specialty})`);
  console.log(`置信度: ${(response1.confidence * 100).toFixed(0)}%`);
  console.log(`回答: ${response1.result.substring(0, 100)}...`);
  console.log();

  // ============================================
  // 场景 2: 指定特定智能体
  // ============================================
  console.log('场景 2: 指定特定智能体');
  
  const task2 = {
    type: 'question',
    content: '如何写单元测试？',
    preferredAgent: '测试专家'
  };
  
  const response2 = await orchestrator.executeTask(task2);
  console.log(`问题: ${task2.content}`);
  console.log(`使用的智能体: ${response2.agentName}`);
  console.log(`回答: ${response2.result.substring(0, 100)}...`);
  console.log();

  // ============================================
  // 场景 3: 不同任务使用不同智能体
  // ============================================
  console.log('场景 3: 不同任务自动路由到不同智能体');
  
  const tasks = [
    { type: 'question', content: '帮我优化这段代码的性能' },
    { type: 'question', content: '翻译成英文：你好世界' },
    { type: 'question', content: '分析这份数据的趋势' },
    { type: 'question', content: '设计一个微服务架构' },
    { type: 'question', content: '检查代码中的安全漏洞' }
  ];

  for (const task of tasks) {
    const response = await orchestrator.executeTask(task);
    console.log(`问题: ${task.content}`);
    console.log(`  → 智能体: ${response.agentName}`);
    console.log(`  → 置信度: ${(response.confidence * 100).toFixed(0)}%`);
    console.log();
  }

  // ============================================
  // 场景 4: 批量处理
  // ============================================
  console.log('场景 4: 批量处理多个任务');
  
  const batchTasks = [
    { type: 'code', content: '审查这个函数' },
    { type: 'documentation', content: '生成API文档' },
    { type: 'testing', content: '编写测试用例' }
  ];

  const batchResponses = await orchestrator.executeBatch(batchTasks);
  console.log('批量处理结果：');
  batchResponses.forEach((response, index) => {
    console.log(`  任务 ${index + 1}: ${batchTasks[index].content}`);
    console.log(`    → ${response.agentName} (${response.duration}ms)`);
  });
  console.log();

  // ============================================
  // 场景 5: 查看历史记录
  // ============================================
  console.log('场景 5: 任务历史记录');
  const history = orchestrator.getHistory(5);
  console.log(`最近 ${history.length} 个任务：`);
  history.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.task.content.substring(0, 30)}...`);
    console.log(`     → ${item.response.agentName} (${item.response.duration}ms)`);
  });
}

main().catch(console.error);
