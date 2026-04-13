/**
 * 提示词优化器 - Token 节省演示
 * 
 * 展示：同样的效果，更少的 token
 */

import { createOptimizer, createIntegration } from '../src/index';

function showTokenComparison(original: string, optimized: string, saved: number, rate: number) {
  console.log('┌─────────────────────────────────────────────────────┐');
  console.log(`│ 原始: ${original.length} 字 │ 优化后: ${optimized.length} 字 │ 节省: ${saved} token │`);
  console.log(`│ 压缩率: ${(rate * 100).toFixed(0)}%                                             │`);
  console.log('├─────────────────────────────────────────────────────┤');
  console.log(`│ 原: ${original.substring(0, 42)}...`);
  console.log(`│ 优: ${optimized.substring(0, 42)}...`);
  console.log('└─────────────────────────────────────────────────────┘');
}

async function main() {
  console.log('\n🚀 提示词优化器 - Token 极致节省演示');
  console.log('=' .repeat(60));

  const optimizer = createOptimizer();

  const testCases = [
    '请你帮我详细的解释一下这段代码，然后麻烦一步一步的告诉我如何改进，非常感谢你',
    '麻烦你帮我翻译一下这段话成英文，可以吗？谢谢你的帮助',
    '我想要请你帮我进行专业的代码审查，尽可能的找出所有问题',
    '接下来希望你能够认真的帮我分析这个数据，然后提供相应的结论',
  ];

  console.log('\n📊 Lv2 标准压缩 - 兼顾可读性与 token 效率');
  console.log('=' .repeat(60));

  testCases.forEach(text => {
    const result = optimizer.optimize(text, { compressLevel: 2 });
    showTokenComparison(result.original, result.optimized, result.tokenSaved, result.compressionRate);
  });

  console.log('\n🔥 Lv3 极限压缩 - 追求极致省 token');
  console.log('=' .repeat(60));

  testCases.forEach(text => {
    const result = optimizer.optimize(text, { compressLevel: 3, enableCoT: true });
    showTokenComparison(result.original, result.optimized, result.tokenSaved, result.compressionRate);
  });

  console.log('\n🎯 内置场景 - 自动角色 + 思维链');
  console.log('=' .repeat(60));

  const scenarios = [
    { q: '这段代码有bug吗？function add(a, b) { return a - b; }', role: 'review' },
    { q: '你好世界', role: 'translate' },
  ];

  scenarios.forEach(({ q, role }) => {
    const result = optimizer.optimize(q, { compressLevel: 2, role, enableCoT: true });
    console.log(`\n场景: ${role}`);
    console.log(`最终: ${result.optimized}`);
  });

  console.log('\n🔗 集成层 - 全自动优化，无感获得 token 节省');
  console.log('=' .repeat(60));

  const integration = createIntegration({ compressLevel: 2 });
  const answer = await integration.ask('请你帮我详细的解释一下什么是闭包，谢谢');

  console.log(`原始问题: ${answer.promptOriginal}`);
  console.log(`实际发送: ${answer.promptUsed}`);
  console.log(`压缩级别: Lv${answer.compressLevel}`);
  console.log(`节省 Token: ${answer.tokenSaved}`);
  console.log(`压缩率: ${(answer.compressionRate * 100).toFixed(0)}%`);

  console.log('\n✅ 演示完成！');
  console.log('\n💡 核心价值:');
  console.log('   • 同样的输出质量，更少的成本');
  console.log('   • 去掉所有无用的礼貌用语、冗余修饰');
  console.log('   • LLM 只看指令，不 care 你有没有说"谢谢"');
  console.log('   • 平均节省 30%-50% 的 input token');
}

main().catch(console.error);
