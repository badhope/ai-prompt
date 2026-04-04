import { PromptFramework } from '../src/index';

async function main() {
  console.log('=== AI Prompt Framework - 开发者使用示例 ===\n');

  const framework = new PromptFramework();

  // 1. 创建和执行提示词
  console.log('1. 创建和执行提示词');
  const prompt = await framework.createPrompt({
    name: 'greeting',
    content: '你好，{{name}}！欢迎来到{{place}}。',
    variables: { name: '开发者', place: 'AI Prompt Framework' }
  });
  console.log('创建的提示词:', prompt);

  const result = await framework.execute(prompt.id);
  console.log('执行结果:', result.result);
  console.log();

  // 2. 使用模板
  console.log('2. 使用模板');
  const template = await framework.createTemplate({
    name: 'email-template',
    content: '亲爱的{{name}}，\n\n{{message}}\n\n祝好！\n{{sender}}',
    variables: ['name', 'message', 'sender']
  });

  const filledPrompt = await framework.fillTemplate(template.id, {
    name: '张三',
    message: '这是一封测试邮件。',
    sender: '李四'
  });
  console.log('填充后的内容:', filledPrompt.content);
  console.log();

  // 3. 对话管理
  console.log('3. 对话管理');
  const conversation = await framework.createConversation({
    name: 'support-chat',
    systemPrompt: '你是一个友好的客服助手。'
  });

  const response1 = await framework.chat(conversation.id, '你好，我想咨询一个问题。');
  console.log('用户: 你好，我想咨询一个问题。');
  console.log('助手:', response1);

  const response2 = await framework.chat(conversation.id, '如何使用这个框架？');
  console.log('用户: 如何使用这个框架？');
  console.log('助手:', response2);
  console.log();

  // 4. 智能代理
  console.log('4. 智能代理');
  const agent = await framework.createAgent({
    name: 'code-reviewer',
    type: 'assistant',
    capabilities: ['code-review', 'refactoring', 'documentation'],
    systemPrompt: '你是一个专业的代码审查助手。'
  });

  const agentResult = await framework.executeAgent(agent.id, {
    task: 'review-code',
    code: 'const x = 1;',
    language: 'TypeScript'
  });
  console.log('代理执行结果:', agentResult);
  console.log();

  // 5. 统计信息
  console.log('5. 统计信息');
  const stats = framework.getStats();
  console.log('统计信息:', stats);
}

main().catch(console.error);
