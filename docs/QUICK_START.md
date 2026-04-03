# 🚀 快速开始指南 - 5分钟上手

> **零门槛快速上手** - 适合所有开发者

---

## 📦 安装

```bash
npm install ai-prompt-framework
# 或
yarn add ai-prompt-framework
# 或
pnpm add ai-prompt-framework
```

---

## ⚡ 5分钟快速开始

### 方式1：最简单的使用（推荐新手）

```typescript
import { PromptFramework } from 'ai-prompt-framework';

// 1. 创建框架实例（自动配置）
const framework = new PromptFramework();

// 2. 创建一个提示词
const prompt = await framework.createPrompt({
  name: '我的第一个提示词',
  content: '请帮我写一篇关于{{topic}}的文章',
  variables: { topic: '人工智能' }
});

// 3. 使用提示词
const result = await framework.execute(prompt.id);
console.log(result);
```

### 方式2：使用模板（推荐中级用户）

```typescript
import { PromptFramework } from 'ai-prompt-framework';

const framework = new PromptFramework({
  providers: {
    openaiApiKey: process.env.OPENAI_API_KEY
  }
});

// 使用内置模板
const template = await framework.useTemplate('code-review');

// 填充变量
const prompt = await template.fill({
  language: 'TypeScript',
  code: 'const x = 1;'
});

// 执行
const review = await framework.execute(prompt.id);
```

### 方式3：链式调用（推荐高级用户）

```typescript
import { PromptFramework } from 'ai-prompt-framework';

const framework = new PromptFramework();

// 链式调用
const result = await framework
  .createPrompt({
    name: '快速提示词',
    content: '翻译成英文：{{text}}'
  })
  .then(prompt => prompt.fill({ text: '你好世界' }))
  .then(prompt => framework.execute(prompt.id));
```

---

## 🎯 常见使用场景

### 场景1：代码审查助手

```typescript
import { PromptFramework } from 'ai-prompt-framework';

const framework = new PromptFramework({
  providers: {
    claudeApiKey: process.env.CLAUDE_API_KEY
  }
});

// 创建代码审查提示词
const codeReviewPrompt = await framework.createPrompt({
  name: '代码审查',
  content: `
请审查以下{{language}}代码：

\`\`\`{{language}}
{{code}}
\`\`\`

请提供：
1. 代码质量评分（1-10）
2. 潜在问题
3. 改进建议
  `,
  variables: {
    language: 'TypeScript',
    code: 'const sum = (a, b) => a + b;'
  }
});

const review = await framework.execute(codeReviewPrompt.id);
console.log(review);
```

### 场景2：多语言翻译

```typescript
import { PromptFramework } from 'ai-prompt-framework';

const framework = new PromptFramework();

// 创建翻译模板
const translateTemplate = await framework.createTemplate({
  name: '多语言翻译',
  content: '将以下{{sourceLang}}文本翻译成{{targetLang}}：\n\n{{text}}',
  variables: ['sourceLang', 'targetLang', 'text']
});

// 批量翻译
const texts = ['你好', '世界', '人工智能'];
const translations = await Promise.all(
  texts.map(text => 
    framework
      .useTemplate(translateTemplate.id)
      .fill({ sourceLang: '中文', targetLang: '英文', text })
      .then(p => framework.execute(p.id))
  )
);
```

### 场景3：AI智能体对话

```typescript
import { PromptFramework } from 'ai-prompt-framework';

const framework = new PromptFramework();

// 创建对话上下文
const conversation = await framework.createConversation({
  name: 'AI助手对话',
  systemPrompt: '你是一个友好的AI助手，擅长回答技术问题。'
});

// 多轮对话
const response1 = await framework.chat(conversation.id, '什么是TypeScript？');
const response2 = await framework.chat(conversation.id, '它和JavaScript有什么区别？');
const response3 = await framework.chat(conversation.id, '请给我一个示例代码');

console.log({ response1, response2, response3 });
```

---

## 🔧 配置选项

### 最小配置

```typescript
const framework = new PromptFramework();
```

### 完整配置

```typescript
const framework = new PromptFramework({
  // 数据库配置
  dbPath: './prompts.db',
  
  // AI提供商配置
  providers: {
    openaiApiKey: 'sk-...',
    claudeApiKey: 'sk-ant-...',
    geminiApiKey: '...'
  },
  
  // 安全配置
  security: {
    enableInjectionDetection: true,
    enablePIIFilter: true,
    maxInputLength: 10000
  },
  
  // 缓存配置
  cache: {
    exact: { ttl: 3600, maxSize: 1000 },
    semantic: { ttl: 7200, threshold: 0.95 }
  },
  
  // 预算配置
  budget: {
    daily: 100,
    monthly: 1000
  }
});
```

---

## 🎨 使用模板库

### 内置模板

```typescript
// 查看所有内置模板
const templates = await framework.listTemplates();
console.log(templates);

// 使用内置模板
const template = await framework.useTemplate('code-review');
const prompt = await template.fill({
  language: 'Python',
  code: 'def hello(): print("Hello")'
});
```

### 创建自定义模板

```typescript
// 创建可复用的模板
const myTemplate = await framework.createTemplate({
  name: '技术文档生成器',
  content: `
# {{title}}

## 概述
{{description}}

## 功能特性
{{features}}

## 使用示例
\`\`\`{{language}}
{{example}}
\`\`\`
  `,
  variables: ['title', 'description', 'features', 'language', 'example'],
  tags: ['documentation', 'technical']
});
```

---

## 📊 管理和监控

### 查看使用统计

```typescript
// 获取统计信息
const stats = await framework.getStats();
console.log(stats);
// {
//   totalPrompts: 150,
//   totalExecutions: 1200,
//   totalCost: 15.50,
//   avgResponseTime: 1.2
// }
```

### 成本监控

```typescript
// 设置预算告警
framework.onBudgetAlert((alert) => {
  console.log(`预算告警：${alert.message}`);
  console.log(`当前花费：$${alert.currentCost}`);
});

// 查看成本明细
const costs = await framework.getCostBreakdown();
console.log(costs);
```

---

## 🚨 错误处理

### 基本错误处理

```typescript
import { ValidationError, RateLimitError } from 'ai-prompt-framework';

try {
  const result = await framework.execute(promptId);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('输入验证失败:', error.details);
  } else if (error instanceof RateLimitError) {
    console.log(`速率限制，请${error.retryAfter}秒后重试`);
  } else {
    console.log('执行失败:', error.message);
  }
}
```

---

## 🎓 进阶用法

### 版本控制

```typescript
// 创建提示词版本
const v1 = await framework.createPrompt({
  name: '翻译助手',
  content: '翻译：{{text}}',
  version: '1.0.0'
});

// 更新并创建新版本
const v2 = await framework.updatePrompt(v1.id, {
  content: '请将以下文本翻译成英文：{{text}}',
  version: '2.0.0'
});

// 版本回退
await framework.rollback(v1.id, '1.0.0');
```

### 批量操作

```typescript
// 批量创建提示词
const prompts = await framework.batchCreate([
  { name: '翻译', content: '翻译：{{text}}' },
  { name: '摘要', content: '摘要：{{text}}' },
  { name: '改写', content: '改写：{{text}}' }
]);

// 批量执行
const results = await framework.batchExecute(prompts.map(p => p.id));
```

---

## 💡 最佳实践

### 1. 使用环境变量

```typescript
// .env 文件
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...

// 代码中
const framework = new PromptFramework({
  providers: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    claudeApiKey: process.env.CLAUDE_API_KEY
  }
});
```

### 2. 使用TypeScript类型

```typescript
import { PromptFramework, Prompt, Template } from 'ai-prompt-framework';

const framework = new PromptFramework();

// 类型安全的变量
interface MyVariables {
  topic: string;
  language: string;
}

const prompt: Prompt<MyVariables> = await framework.createPrompt({
  name: '文章生成',
  content: '写一篇关于{{topic}}的{{language}}文章',
  variables: { topic: 'AI', language: '中文' }
});
```

### 3. 使用异步迭代器

```typescript
// 流式响应
for await (const chunk of framework.stream(promptId)) {
  process.stdout.write(chunk);
}
```

---

## 🆘 常见问题

### Q: 如何切换AI提供商？

```typescript
// 指定提供商
const result = await framework.execute(promptId, {
  provider: 'claude',
  model: 'claude-3-opus-20240229'
});
```

### Q: 如何优化性能？

```typescript
// 启用缓存
const framework = new PromptFramework({
  enableCache: true,
  cache: {
    exact: { ttl: 3600 },
    semantic: { ttl: 7200 }
  }
});
```

### Q: 如何保护敏感信息？

```typescript
// 启用安全功能
const framework = new PromptFramework({
  enableSecurity: true,
  security: {
    enablePIIFilter: true,
    enableInjectionDetection: true
  }
});
```

---

## 📚 下一步

- [完整API文档](./MOBILE_API.md)
- [最佳实践指南](./BEST_PRACTICES.md)
- [交互式教程](./TUTORIALS.md)
- [常见问题解答](./FAQ.md)

---

*最后更新：2026-04-03*
