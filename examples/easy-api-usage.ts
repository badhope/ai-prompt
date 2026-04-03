import { createEasyAPI } from '../src/easy-api';

async function testEasyAPI() {
  console.log('🎯 测试易用性API\n');

  const api = createEasyAPI({
    providers: {
      openaiApiKey: 'sk-test-key'
    }
  });

  console.log('=== 1. 快速翻译 ===');
  const translation = await api.translate('你好世界');
  console.log('翻译结果:', translation);
  console.log('');

  console.log('=== 2. 快速摘要 ===');
  const summary = await api.summarize('这是一段很长的文本...');
  console.log('摘要结果:', summary);
  console.log('');

  console.log('=== 3. 代码审查 ===');
  const review = await api.codeReview('const x = 1;');
  console.log('审查结果:', review);
  console.log('');

  console.log('=== 4. 链式调用 ===');
  const result = await api
    .prompt('我的提示词')
    .content('翻译成英文：{{text}}')
    .variables({ text: '你好' })
    .execute();
  console.log('链式调用结果:', result);
  console.log('');

  console.log('=== 5. 批量操作 ===');
  const batchResults = await api.batch([
    { content: '翻译：{{text}}', variables: { text: '你好' } },
    { content: '摘要：{{text}}', variables: { text: '长文本...' } }
  ]);
  console.log('批量结果:', batchResults);
  console.log('');

  console.log('=== 6. 流式输出 ===');
  console.log('开始流式输出:');
  for await (const chunk of api.stream('写一首诗')) {
    process.stdout.write(chunk);
  }
  console.log('\n流式输出完成\n');

  console.log('=== 7. 对话 ===');
  const response = await api.chat('你好！');
  console.log('对话响应:', response);
  console.log('');

  console.log('=== 8. 生成文档 ===');
  const doc = await api.generateDoc('function add(a, b) { return a + b; }');
  console.log('生成的文档:', doc);
  console.log('');

  console.log('=== 9. 代码解释 ===');
  const explanation = await api.explain('const x = () => {}');
  console.log('代码解释:', explanation);
  console.log('');

  console.log('=== 10. 重构代码 ===');
  const refactored = await api.refactor('var x = 1');
  console.log('重构后:', refactored);
  console.log('');

  console.log('✅ 所有易用性API测试完成！\n');
}

testEasyAPI().catch(console.error);
