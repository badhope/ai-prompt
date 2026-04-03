import { PromptFramework } from '../src/index';
import { ValidationError } from '../src/errors';

async function simulateDeveloperUsage() {
  console.log('👨‍💻 模拟开发者使用场景\n');

  try {
    console.log('=== 场景1: 新手开发者第一次使用 ===');
    const framework1 = new PromptFramework();
    
    const prompt1 = await framework1.createPrompt({
      name: '我的第一个提示词',
      content: '请帮我写一篇关于{{topic}}的文章',
      variables: { topic: '人工智能' }
    });
    
    console.log('✅ 创建提示词成功:', prompt1.id);
    console.log('📝 提示词内容:', prompt1.content);
    console.log('');

    console.log('=== 场景2: 中级开发者使用模板 ===');
    const framework2 = new PromptFramework({
      providers: {
        openaiApiKey: 'sk-test-key'
      }
    });

    const template = await framework2.createTemplate({
      name: '代码审查模板',
      content: `
请审查以下{{language}}代码：

\`\`\`{{language}}
{{code}}
\`\`\`

请提供：
1. 代码质量评分
2. 潜在问题
3. 改进建议
      `,
      variables: ['language', 'code']
    });

    console.log('✅ 创建模板成功:', template.id);

    const filledPrompt = await framework2.fillTemplate(template.id, {
      language: 'TypeScript',
      code: 'const sum = (a, b) => a + b;'
    });

    console.log('✅ 填充模板成功:', filledPrompt.id);
    console.log('');

    console.log('=== 场景3: 高级开发者批量操作 ===');
    const prompts = await framework2.batchCreatePrompts([
      { name: '翻译助手', content: '翻译：{{text}}' },
      { name: '摘要助手', content: '摘要：{{text}}' },
      { name: '改写助手', content: '改写：{{text}}' }
    ]);

    console.log('✅ 批量创建成功:', prompts.length, '个提示词');
    console.log('');

    console.log('=== 场景4: 企业开发者使用完整功能 ===');
    const framework3 = new PromptFramework({
      dbPath: './enterprise.db',
      providers: {
        openaiApiKey: 'sk-enterprise-key',
        claudeApiKey: 'sk-ant-enterprise-key'
      },
      security: {
        enableInjectionDetection: true,
        enablePIIFilter: true,
        maxInputLength: 10000
      },
      cache: {
        exact: { ttl: 3600, maxSize: 1000 },
        semantic: { ttl: 7200, threshold: 0.95 }
      },
      budget: {
        daily: 100,
        monthly: 1000
      }
    });

    console.log('✅ 企业配置初始化成功');

    const enterprisePrompt = await framework3.createPrompt({
      name: '企业级提示词',
      content: '分析以下业务数据：{{data}}',
      variables: { data: '销售数据...' },
      tags: ['business', 'analytics']
    });

    console.log('✅ 创建企业提示词成功:', enterprisePrompt.id);

    const stats = await framework3.getStats();
    console.log('📊 统计信息:', stats);
    console.log('');

    console.log('=== 场景5: 错误处理和调试 ===');
    try {
      await framework3.createPrompt({
        name: '',
        content: ''
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log('⚠️ 验证错误:', error.message);
        console.log('📋 错误详情:', error.details);
      }
    }
    console.log('');

    console.log('=== 场景6: 版本控制 ===');
    const versionedPrompt = await framework3.createPrompt({
      name: '版本化提示词',
      content: '版本1',
      version: '1.0.0'
    });

    console.log('✅ 创建版本1成功:', versionedPrompt.version);

    const updatedPrompt = await framework3.updatePrompt(versionedPrompt.id, {
      content: '版本2',
      version: '2.0.0'
    });

    console.log('✅ 更新到版本2成功:', updatedPrompt.version);

    const versions = await framework3.listVersions(versionedPrompt.id);
    console.log('📋 所有版本:', versions);
    console.log('');

    console.log('=== 场景7: 多语言支持 ===');
    const multilangPrompt = await framework3.createPrompt({
      name: '多语言提示词',
      content: '请用{{language}}回答：{{question}}',
      variables: {
        language: '中文',
        question: '什么是AI？'
      }
    });

    console.log('✅ 创建多语言提示词成功:', multilangPrompt.id);
    console.log('');

    console.log('=== 场景8: 链式调用 ===');
    const chainResult = await framework3
      .prompt('快速提示词')
      .content('翻译成英文：{{text}}')
      .fill({ text: '你好世界' })
      .execute();

    console.log('✅ 链式调用成功:', chainResult);
    console.log('');

    console.log('=== 场景9: 流式响应 ===');
    console.log('开始流式输出:');
    const streamPrompt = await framework3.createPrompt({
      name: '流式提示词',
      content: '写一首关于AI的诗'
    });

    for await (const chunk of framework3.stream(streamPrompt.id)) {
      process.stdout.write(chunk);
    }
    console.log('\n✅ 流式输出完成\n');

    console.log('=== 场景10: 成本监控 ===');
    framework3.onBudgetAlert((alert) => {
      console.log('💰 预算告警:', alert.message);
    });

    const costBreakdown = await framework3.getCostBreakdown();
    console.log('💰 成本明细:', costBreakdown);
    console.log('');

  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

simulateDeveloperUsage().catch(console.error);
