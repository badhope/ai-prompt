import { PromptFramework } from '../src/index';

async function simulateAIAgentUsage() {
  console.log('🤖 模拟AI智能体使用场景\n');

  try {
    const framework = new PromptFramework({
      providers: {
        openaiApiKey: 'sk-agent-key',
        claudeApiKey: 'sk-ant-agent-key'
      }
    });

    console.log('=== 场景1: AI助手对话 ===');
    const conversation = await framework.createConversation({
      name: 'AI助手对话',
      systemPrompt: '你是一个友好的AI助手，擅长回答技术问题。'
    });

    console.log('✅ 创建对话成功:', conversation.id);

    const response1 = await framework.chat(conversation.id, '什么是TypeScript？');
    console.log('🤖 AI回答:', response1);

    const response2 = await framework.chat(conversation.id, '它和JavaScript有什么区别？');
    console.log('🤖 AI回答:', response2);
    console.log('');

    console.log('=== 场景2: 代码生成智能体 ===');
    const codeAgent = await framework.createAgent({
      name: '代码生成智能体',
      type: 'code-generator',
      systemPrompt: '你是一个专业的代码生成助手，能够生成高质量的代码。',
      capabilities: ['code-generation', 'code-review', 'refactoring']
    });

    console.log('✅ 创建智能体成功:', codeAgent.id);

    const codeResult = await framework.executeAgent(codeAgent.id, {
      task: '生成一个TypeScript函数，计算斐波那契数列',
      language: 'TypeScript',
      requirements: ['使用递归', '添加类型注解', '包含注释']
    });

    console.log('🤖 生成的代码:', codeResult);
    console.log('');

    console.log('=== 场景3: 多智能体协作 ===');
    const writerAgent = await framework.createAgent({
      name: '写作智能体',
      type: 'writer',
      systemPrompt: '你是一个专业的内容创作者。',
      capabilities: ['writing', 'editing']
    });

    const reviewerAgent = await framework.createAgent({
      name: '审查智能体',
      type: 'reviewer',
      systemPrompt: '你是一个专业的内容审查员。',
      capabilities: ['review', 'feedback']
    });

    console.log('✅ 创建协作智能体成功');

    const article = await framework.executeAgent(writerAgent.id, {
      task: '写一篇关于AI的文章',
      length: '500字'
    });

    console.log('📝 写作智能体生成:', article);

    const review = await framework.executeAgent(reviewerAgent.id, {
      task: '审查文章',
      content: article
    });

    console.log('🔍 审查智能体反馈:', review);
    console.log('');

    console.log('=== 场景4: 任务规划智能体 ===');
    const plannerAgent = await framework.createAgent({
      name: '任务规划智能体',
      type: 'planner',
      systemPrompt: '你是一个任务规划专家，能够将复杂任务分解为子任务。',
      capabilities: ['planning', 'decomposition', 'scheduling']
    });

    console.log('✅ 创建规划智能体成功:', plannerAgent.id);

    const plan = await framework.executeAgent(plannerAgent.id, {
      task: '开发一个Web应用',
      requirements: ['用户认证', '数据管理', 'API接口']
    });

    console.log('📋 任务规划:', plan);
    console.log('');

    console.log('=== 场景5: ReAct智能体 ===');
    const reactAgent = await framework.createAgent({
      name: 'ReAct智能体',
      type: 'react',
      systemPrompt: '你使用ReAct模式进行推理和行动。',
      capabilities: ['reasoning', 'acting', 'observing']
    });

    console.log('✅ 创建ReAct智能体成功:', reactAgent.id);

    const reactResult = await framework.executeAgent(reactAgent.id, {
      task: '查询北京明天的天气',
      tools: ['weather-api', 'search-engine']
    });

    console.log('🔄 ReAct执行结果:', reactResult);
    console.log('');

    console.log('=== 场景6: 自我反思智能体 ===');
    const reflectionAgent = await framework.createAgent({
      name: '自我反思智能体',
      type: 'reflection',
      systemPrompt: '你能够对自己的输出进行反思和改进。',
      capabilities: ['reflection', 'improvement', 'self-evaluation']
    });

    console.log('✅ 创建反思智能体成功:', reflectionAgent.id);

    const reflectionResult = await framework.executeAgent(reflectionAgent.id, {
      task: '写一首诗',
      iterations: 3
    });

    console.log('🪞 反思改进结果:', reflectionResult);
    console.log('');

    console.log('=== 场景7: 思维树智能体 ===');
    const totAgent = await framework.createAgent({
      name: '思维树智能体',
      type: 'tree-of-thoughts',
      systemPrompt: '你使用思维树方法探索多个解决方案。',
      capabilities: ['exploration', 'evaluation', 'selection']
    });

    console.log('✅ 创建思维树智能体成功:', totAgent.id);

    const totResult = await framework.executeAgent(totAgent.id, {
      problem: '如何提高代码质量？',
      branches: 3,
      depth: 3
    });

    console.log('🌳 思维树结果:', totResult);
    console.log('');

    console.log('=== 场景8: 工具使用智能体 ===');
    const toolAgent = await framework.createAgent({
      name: '工具使用智能体',
      type: 'tool-user',
      systemPrompt: '你能够使用各种工具完成任务。',
      capabilities: ['tool-selection', 'tool-execution', 'result-integration']
    });

    console.log('✅ 创建工具智能体成功:', toolAgent.id);

    await framework.registerTool(toolAgent.id, {
      name: 'calculator',
      description: '执行数学计算',
      execute: async (expression: string) => eval(expression)
    });

    await framework.registerTool(toolAgent.id, {
      name: 'translator',
      description: '翻译文本',
      execute: async (text: string, targetLang: string) => `翻译结果: ${text}`
    });

    const toolResult = await framework.executeAgent(toolAgent.id, {
      task: '计算123*456并翻译成英文'
    });

    console.log('🔧 工具使用结果:', toolResult);
    console.log('');

    console.log('=== 场景9: 记忆增强智能体 ===');
    const memoryAgent = await framework.createAgent({
      name: '记忆增强智能体',
      type: 'memory-augmented',
      systemPrompt: '你拥有长期记忆能力。',
      capabilities: ['memory-storage', 'memory-retrieval', 'context-awareness']
    });

    console.log('✅ 创建记忆智能体成功:', memoryAgent.id);

    await framework.addToMemory(memoryAgent.id, '用户喜欢Python');
    await framework.addToMemory(memoryAgent.id, '用户是初学者');

    const memoryResult = await framework.executeAgent(memoryAgent.id, {
      task: '推荐编程语言'
    });

    console.log('🧠 记忆增强结果:', memoryResult);
    console.log('');

    console.log('=== 场景10: 多模态智能体 ===');
    const multimodalAgent = await framework.createAgent({
      name: '多模态智能体',
      type: 'multimodal',
      systemPrompt: '你能够处理文本、图像和音频。',
      capabilities: ['text-processing', 'image-analysis', 'audio-processing']
    });

    console.log('✅ 创建多模态智能体成功:', multimodalAgent.id);

    const multimodalResult = await framework.executeAgent(multimodalAgent.id, {
      task: '分析这张图片',
      image: 'base64-encoded-image-data',
      text: '请描述图片内容'
    });

    console.log('🎨 多模态结果:', multimodalResult);
    console.log('');

    console.log('✅ 所有AI智能体场景测试完成！\n');

  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

simulateAIAgentUsage().catch(console.error);
