import { createEasyAPI } from '../src/easy-api';

async function main() {
  console.log('=== AI Prompt Framework - Easy API 使用示例 ===\n');

  const api = createEasyAPI();

  // 1. 快速执行
  console.log('1. 快速执行');
  const quickResult = await api.quick('翻译成英文：{{text}}', { text: '你好世界' });
  console.log('快速执行结果:', quickResult.result);
  console.log();

  // 2. 翻译功能
  console.log('2. 翻译功能');
  const translateResult = await api.translate('你好，很高兴认识你', '英文');
  console.log('翻译结果:', translateResult.result);
  console.log();

  // 3. 总结功能
  console.log('3. 总结功能');
  const summarizeResult = await api.summarize(
    '这是一个很长的文本，包含了很多信息和细节。我们需要从中提取关键信息。'
  );
  console.log('总结结果:', summarizeResult.result);
  console.log();

  // 4. 代码审查
  console.log('4. 代码审查');
  const codeReviewResult = await api.codeReview(
    'function add(a, b) { return a + b; }',
    'JavaScript'
  );
  console.log('代码审查结果:', codeReviewResult.result);
  console.log();

  // 5. 生成文档
  console.log('5. 生成文档');
  const docResult = await api.generateDoc(
    'function greet(name) { return `Hello, ${name}!`; }',
    'TypeScript'
  );
  console.log('生成文档结果:', docResult.result);
  console.log();

  // 6. 解释代码
  console.log('6. 解释代码');
  const explainResult = await api.explain(
    'const doubled = numbers.map(n => n * 2);',
    'JavaScript'
  );
  console.log('解释结果:', explainResult.result);
  console.log();

  // 7. 使用构建器模式
  console.log('7. 使用构建器模式');
  const builderResult = await api
    .prompt('custom-prompt')
    .content('请分析以下数据：{{data}}')
    .variables({ data: '销售额增长了20%' })
    .tags(['analysis', 'business'])
    .execute();
  console.log('构建器执行结果:', builderResult.result);
  console.log();

  // 8. 批量操作
  console.log('8. 批量操作');
  const batchResults = await api.batch([
    { content: '任务1：分析数据' },
    { content: '任务2：生成报告' },
    { content: '任务3：发送通知' }
  ]);
  console.log('批量操作结果:', batchResults.length, '个任务完成');
  console.log();

  // 9. 快速对话
  console.log('9. 快速对话');
  const chatResponse = await api.chat('你好，请介绍一下你自己', '你是一个AI助手');
  console.log('对话响应:', chatResponse);
  console.log();

  // 10. 获取统计信息
  console.log('10. 获取统计信息');
  const stats = api.getStats();
  console.log('统计信息:', stats);
}

main().catch(console.error);
