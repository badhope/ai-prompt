# 🎓 交互式教程

> **从零开始学习AI Prompt Engineering Framework** - 适合移动端阅读的分步教程

---

## 📚 教程目录

1. [5分钟快速开始](#5分钟快速开始)
2. [基础概念](#基础概念)
3. [Prompt管理](#prompt管理)
4. [模板引擎](#模板引擎)
5. [多Provider使用](#多provider使用)
6. [智能体推理](#智能体推理)
7. [性能优化](#性能优化)
8. [实战项目](#实战项目)

---

## 🚀 5分钟快速开始

### 步骤1：安装依赖

```bash
npm install ai-prompt-framework
```

### 步骤2：初始化框架

```typescript
import PromptFramework from 'ai-prompt-framework';

const framework = new PromptFramework({
  providers: {
    claudeApiKey: process.env.ANTHROPIC_API_KEY,
  }
});
```

### 步骤3：创建第一个Prompt

```typescript
const prompt = await framework.prompts.create({
  name: '翻译助手',
  content: '将以下文本翻译为{{target_language}}：\n\n{{text}}',
  variables: {
    target_language: '英语',
    text: ''
  }
});

console.log('创建成功:', prompt.id);
```

### 步骤4：使用Prompt生成内容

```typescript
const provider = framework.providers.get('claude');

const response = await provider.complete({
  variables: {
    prompt: '将以下文本翻译为英语：\n\n你好，世界！',
    target_language: '英语',
    text: '你好，世界！'
  },
  model_config: {
    model: 'claude-3-opus'
  }
});

console.log('翻译结果:', response.content);
```

### ✅ 完成！

恭喜你完成了第一个AI Prompt应用！

---

## 📖 基础概念

### 什么是Prompt Engineering？

Prompt Engineering是设计和优化AI模型输入提示词的技术，目的是获得更准确、更有用的输出。

### 核心组件

#### 1. Prompt（提示词）

```typescript
interface Prompt {
  id: string;              // 唯一标识
  name: string;            // 名称
  content: string;         // 内容模板
  variables?: object;      // 变量定义
  metadata?: object;       // 元数据
  created_at: string;      // 创建时间
  updated_at: string;      // 更新时间
}
```

#### 2. Template（模板）

```typescript
// 静态模板
const staticTemplate = '你是一个AI助手。';

// 动态模板（带变量）
const dynamicTemplate = '你是一个{{role}}，专门帮助用户解决{{domain}}问题。';

// 使用模板引擎
const rendered = framework.templates.render(dynamicTemplate, {
  role: 'Python专家',
  domain: '编程'
});
// 输出：你是一个Python专家，专门帮助用户解决编程问题。
```

#### 3. Provider（提供商）

```typescript
// 支持的Provider
type Provider = 'claude' | 'openai' | 'gemini';

// 获取Provider
const claude = framework.providers.get('claude');
const openai = framework.providers.get('openai');
const gemini = framework.providers.get('gemini');
```

---

## 📝 Prompt管理

### 创建Prompt

```typescript
const prompt = await framework.prompts.create({
  name: '代码审查助手',
  content: `你是一个专业的代码审查专家。请审查以下代码：

\`\`\`{{language}}
{{code}}
\`\`\`

请从以下方面进行审查：
1. 代码质量
2. 性能优化
3. 安全隐患
4. 最佳实践`,
  variables: {
    language: 'javascript',
    code: ''
  },
  metadata: {
    category: 'development',
    tags: ['code-review', 'best-practices']
  }
});
```

### 查询Prompt

```typescript
// 获取单个Prompt
const prompt = await framework.prompts.get('prompt_id');

// 列出所有Prompt
const prompts = await framework.prompts.list();

// 按标签筛选
const tagged = prompts.filter(p => 
  p.metadata?.tags?.includes('code-review')
);
```

### 更新Prompt

```typescript
const updated = await framework.prompts.update('prompt_id', {
  content: '新的模板内容...',
  variables: {
    // 更新的变量
  }
});
```

### 版本管理

```typescript
// 创建新版本
const newVersion = await framework.prompts.createVersion('prompt_id', {
  content: '更新后的内容',
  version: '2.0'
});

// 获取版本历史
const versions = await framework.prompts.getVersions('prompt_id');

// 回滚到特定版本
await framework.prompts.rollback('prompt_id', '1.0');
```

---

## 🎨 模板引擎

### 变量替换

```typescript
const template = '你好，{{name}}！欢迎来到{{city}}。';

const result = framework.templates.render(template, {
  name: '张三',
  city: '北京'
});

console.log(result);
// 输出：你好，张三！欢迎来到北京。
```

### 条件渲染

```typescript
const template = `
{{#if premium}}
感谢您的会员支持！
{{else}}
升级到会员享受更多功能。
{{/if}}
`;

console.log(framework.templates.render(template, { premium: true }));
// 输出：感谢您的会员支持！

console.log(framework.templates.render(template, { premium: false }));
// 输出：升级到会员享受更多功能。
```

### 循环渲染

```typescript
const template = `
购物清单：
{{#each items}}
- {{name}} x {{quantity}}
{{/each}}
`;

const result = framework.templates.render(template, {
  items: [
    { name: '苹果', quantity: 5 },
    { name: '香蕉', quantity: 3 },
    { name: '橙子', quantity: 2 }
  ]
});

console.log(result);
// 输出：
// 购物清单：
// - 苹果 x 5
// - 香蕉 x 3
// - 橙子 x 2
```

### 高级功能

```typescript
// 过滤器
const template = '{{text | uppercase}}';
const result = framework.templates.render(template, {
  text: 'hello world'
});
// 输出：HELLO WORLD

// 默认值
const template = '{{name | default: "匿名用户"}}';
const result = framework.templates.render(template, {});
// 输出：匿名用户

// 链式过滤器
const template = '{{text | trim | uppercase | truncate: 10}}';
```

---

## 🔄 多Provider使用

### Provider对比

| Provider | 模型 | 特点 | 适用场景 |
|----------|------|------|----------|
| Claude | claude-3-opus | 长文本、推理强 | 复杂任务、代码生成 |
| OpenAI | gpt-4-turbo | 通用性强 | 对话、创意写作 |
| Gemini | gemini-pro | 多模态 | 图像理解、混合任务 |

### 切换Provider

```typescript
// 方式1：直接获取
const claude = framework.providers.get('claude');
const openai = framework.providers.get('openai');

// 方式2：动态选择
function getProvider(task: string) {
  const providerMap = {
    'code': 'claude',
    'creative': 'openai',
    'multimodal': 'gemini'
  };
  
  return framework.providers.get(providerMap[task] || 'claude');
}

// 使用
const provider = getProvider('code');
const response = await provider.complete({
  variables: { prompt: '写一个排序算法' },
  model_config: { model: 'claude-3-opus' }
});
```

### Provider配置

```typescript
// 自定义配置
const provider = framework.providers.get('claude');

await provider.complete({
  variables: { prompt: '你好' },
  model_config: {
    model: 'claude-3-opus',
    temperature: 0.7,      // 创造性 (0-1)
    max_tokens: 1000,      // 最大输出token
    top_p: 0.9,            // 核采样
    stream: false          // 是否流式
  }
});
```

### 成本优化

```typescript
// 估算成本
const tokens = { input: 100, output: 500 };
const cost = provider.estimateCost(tokens, 'claude-3-opus');
console.log(`预估成本: $${cost}`);

// 使用缓存降低成本
const cacheKey = 'prompt_cache_key';
const cached = await framework.cacheLayer?.get(cacheKey);

if (cached) {
  console.log('使用缓存，节省成本！');
  return cached;
}

const response = await provider.complete(request);
await framework.cacheLayer?.set(cacheKey, response);
```

---

## 🤖 智能体推理

### ReAct引擎

ReAct (Reasoning + Acting) 是一种结合推理和行动的智能体模式。

```typescript
import { ReActEngine } from 'ai-prompt-framework';

const react = new ReActEngine(provider, {
  tools: [
    {
      name: 'search',
      description: '搜索互联网信息',
      parameters: {
        query: 'string'
      },
      execute: async (params) => {
        // 实现搜索逻辑
        return await searchInternet(params.query);
      }
    },
    {
      name: 'calculator',
      description: '执行数学计算',
      parameters: {
        expression: 'string'
      },
      execute: async (params) => {
        return eval(params.expression);
      }
    }
  ]
});

// 执行ReAct推理
const result = await react.execute(
  '北京和上海的人口总和是多少？'
);

console.log(result.answer);
console.log(result.steps); // 查看推理步骤
```

### Tree of Thoughts引擎

ToT (Tree of Thoughts) 通过树状搜索找到最优解。

```typescript
import { TreeOfThoughtsEngine } from 'ai-prompt-framework';

const tot = new TreeOfThoughtsEngine(provider, {
  max_depth: 5,
  branching_factor: 3,
  search_strategy: 'best_first',
  pruning_threshold: 0.3
});

const result = await tot.solve(
  '如何设计一个高并发的电商系统？'
);

console.log('最优方案:', result.solution);
console.log('推理路径:', result.best_path);
console.log('总思考数:', result.total_thoughts);
```

### Self-Consistency引擎

通过多次采样和投票提高准确性。

```typescript
import { SelfConsistencyEngine } from 'ai-prompt-framework';

const sc = new SelfConsistencyEngine(provider, {
  num_samples: 5,
  temperature: 0.7
});

const result = await sc.solve('这道数学题的答案是什么？');

console.log('最终答案:', result.answer);
console.log('置信度:', result.confidence);
console.log('所有答案:', result.all_answers);
```

---

## ⚡ 性能优化

### 1. 使用缓存

```typescript
// 启用多级缓存
const framework = new PromptFramework({
  enableCache: true,
  cache: {
    exact: { ttl: 3600 },      // 精确匹配缓存
    semantic: { ttl: 7200 }    // 语义相似缓存
  }
});

// 查看缓存统计
const stats = await framework.getCacheStats();
console.log('缓存命中率:', stats.hit_rate);
```

### 2. 并发控制

```typescript
// 批量请求
const prompts = ['问题1', '问题2', '问题3'];

const responses = await Promise.all(
  prompts.map(p => provider.complete({
    variables: { prompt: p },
    model_config: { model: 'claude-3-opus' }
  }))
);
```

### 3. 流式响应

```typescript
// 使用流式响应提升用户体验
const stream = provider.stream({
  variables: { prompt: '讲一个故事' },
  model_config: { model: 'claude-3-opus' }
});

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### 4. 成本监控

```typescript
// 查看成本统计
const costStats = framework.getCostStats();

console.log('总成本:', costStats.totalCost);
console.log('平均每次请求:', costStats.avgCostPerRequest);
console.log('按Provider分布:', costStats.byProvider);
```

---

## 🎯 实战项目

### 项目1：智能客服机器人

```typescript
import PromptFramework, { ReActEngine } from 'ai-prompt-framework';

const framework = new PromptFramework({
  providers: {
    claudeApiKey: process.env.ANTHROPIC_API_KEY
  }
});

// 创建客服Prompt
const customerServicePrompt = await framework.prompts.create({
  name: '智能客服',
  content: `你是一个专业的客服代表。请根据以下信息回答用户问题：

用户信息：
- 姓名：{{user_name}}
- 会员等级：{{membership_level}}

用户问题：{{question}}

请提供友好、专业的回答。`,
  variables: {
    user_name: '',
    membership_level: '普通会员',
    question: ''
  }
});

// 实现客服逻辑
async function handleCustomerQuestion(
  userName: string,
  question: string
) {
  const provider = framework.providers.get('claude');
  
  const response = await provider.complete({
    variables: {
      user_name: userName,
      membership_level: 'VIP',
      question: question
    },
    model_config: {
      model: 'claude-3-opus',
      temperature: 0.7
    }
  });
  
  return response.content;
}

// 使用
const answer = await handleCustomerQuestion(
  '张三',
  '如何退换货？'
);
console.log(answer);
```

### 项目2：代码审查工具

```typescript
async function reviewCode(code: string, language: string) {
  const prompt = await framework.prompts.get('code-review-prompt');
  const provider = framework.providers.get('claude');
  
  const response = await provider.complete({
    variables: {
      language: language,
      code: code
    },
    model_config: {
      model: 'claude-3-opus',
      temperature: 0.3 // 低温度保证一致性
    }
  });
  
  return {
    review: response.content,
    tokens: response.tokens,
    cost: provider.estimateCost(response.tokens, 'claude-3-opus')
  };
}

// 使用
const result = await reviewCode(`
function sort(arr) {
  return arr.sort();
}
`, 'javascript');

console.log('审查结果:', result.review);
console.log('成本:', result.cost);
```

### 项目3：多语言翻译系统

```typescript
async function translate(
  text: string,
  sourceLang: string,
  targetLang: string
) {
  const provider = framework.providers.get('claude');
  
  const response = await provider.complete({
    variables: {
      prompt: `将以下${sourceLang}文本翻译为${targetLang}：

${text}

请提供：
1. 翻译结果
2. 关键词汇解释
3. 文化背景说明（如适用）`
    },
    model_config: {
      model: 'claude-3-opus',
      temperature: 0.5
    }
  });
  
  return response.content;
}

// 使用
const translation = await translate(
  'The early bird catches the worm.',
  '英语',
  '中文'
);
console.log(translation);
```

---

## 📚 进阶学习

### 推荐阅读

1. [API参考文档](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/API_REFERENCE.md)
2. [最佳实践指南](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/BEST_PRACTICES.md)
3. [性能优化指南](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/PERFORMANCE_GUIDE.md)
4. [安全最佳实践](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/SECURITY_GUIDE.md)

### 示例代码

- [GitHub仓库](https://github.com/your-org/ai-prompt-framework)
- [示例项目](https://github.com/your-org/ai-prompt-examples)
- [在线演示](https://demo.ai-prompt.dev)

---

## 💬 获取帮助

- **文档**：https://docs.ai-prompt.dev
- **社区**：https://discord.gg/ai-prompt
- **问题反馈**：https://github.com/your-org/ai-prompt-framework/issues

---

*教程版本：v2.0.0*  
*最后更新：2026-04-03*  
*适合移动端阅读*
