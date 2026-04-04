# AI Prompt Framework

一个简洁、高效的 AI 提示词工程框架，提供易用的 API 和强大的功能。

## 特性

- 🚀 **简单易用** - 提供直观的 API，快速上手
- 💪 **功能丰富** - 支持提示词管理、模板引擎、对话管理、智能代理
- 🔧 **高度可扩展** - 模块化设计，易于扩展
- 📦 **TypeScript 支持** - 完整的类型定义
- 🧪 **全面测试** - 高测试覆盖率
- 🎯 **软件集成** - 轻松集成到您的软件中

## 安装

```bash
npm install ai-prompt-framework
```

## 快速开始

### 基础使用

```typescript
import { PromptFramework } from 'ai-prompt-framework';

const framework = new PromptFramework();

// 创建提示词
const prompt = await framework.createPrompt({
  name: 'greeting',
  content: '你好，{{name}}!',
  variables: { name: '世界' }
});

// 执行提示词
const result = await framework.execute(prompt.id);
console.log(result.result);
```

### 软件集成（推荐）✨

```typescript
import { createIntegration } from 'ai-prompt-framework';

// 创建集成实例
const integration = createIntegration({
  autoOptimize: true,
  enableContext: true
});

// 每次用户提问时自动应用提示词工程
const result = await integration.ask('如何学习 TypeScript?');
console.log('回答:', result.content);
console.log('使用的提示词:', result.promptUsed);
console.log('耗时:', result.duration, 'ms');
```

### 使用 Easy API

```typescript
import { createEasyAPI } from 'ai-prompt-framework';

const api = createEasyAPI();

// 快速执行
const result = await api.quick('翻译成英文：{{text}}', { text: '你好' });

// 预设功能
await api.translate('你好世界');
await api.summarize('长文本内容...');
await api.codeReview('const x = 1;', 'TypeScript');
```

## 软件集成方案

### 1. 直接集成

```typescript
// 在您的软件中
import { createIntegration } from 'ai-prompt-framework';

const integration = createIntegration();

// 处理用户问题
app.post('/api/ask', async (req, res) => {
  const result = await integration.ask(req.body.question);
  res.json({
    answer: result.content,
    metadata: {
      optimized: result.optimized,
      duration: result.duration
    }
  });
});
```

### 2. 封装为服务

```typescript
// services/aiService.ts
import { createIntegration } from 'ai-prompt-framework';

class AIService {
  private integration = createIntegration();

  async answer(question: string) {
    const result = await this.integration.ask(question);
    return result.content;
  }
}

export const aiService = new AIService();
```

### 3. 使用预设场景

```typescript
// 代码审查
const codeReview = await integration.askWithScenario(
  code,
  'code'
);

// 文本翻译
const translation = await integration.askWithScenario(
  text,
  'translation'
);

// 数据分析
const analysis = await integration.askWithScenario(
  data,
  'analysis'
);
```

## API 文档

### PromptFramework

核心框架类，提供所有基础功能。

#### 方法

- `createPrompt(config)` - 创建提示词
- `getPrompt(id)` - 获取提示词
- `updatePrompt(id, updates)` - 更新提示词
- `deletePrompt(id)` - 删除提示词
- `execute(promptId)` - 执行提示词
- `createTemplate(config)` - 创建模板
- `fillTemplate(templateId, variables)` - 填充模板
- `createConversation(config)` - 创建对话
- `chat(conversationId, message)` - 发送消息
- `createAgent(config)` - 创建代理
- `executeAgent(agentId, task)` - 执行代理任务
- `getStats()` - 获取统计信息

### EasyAPI

简化 API，提供便捷的快捷方法。

#### 方法

- `quick(content, variables?)` - 快速执行
- `translate(text, targetLang?)` - 翻译文本
- `summarize(text)` - 总结文本
- `codeReview(code, language?)` - 代码审查
- `generateDoc(code, language?)` - 生成文档
- `explain(code, language?)` - 解释代码
- `refactor(code, language?)` - 重构代码
- `writeTest(code, language?)` - 编写测试
- `chat(message, context?)` - 快速对话
- `batch(tasks)` - 批量操作

### PromptIntegration（新增）

软件集成层，自动应用提示词工程。

#### 方法

- `ask(question, context?)` - 处理用户问题
- `quickAsk(question, template, variables?)` - 使用模板快速提问
- `askWithScenario(question, scenario, options?)` - 使用预设场景
- `batchAsk(questions)` - 批量处理问题
- `getHistory(conversationId?)` - 获取对话历史
- `clearHistory(conversationId?)` - 清空对话历史

#### 配置选项

```typescript
interface IntegrationConfig {
  autoOptimize?: boolean;        // 是否启用自动优化
  enableContext?: boolean;       // 是否启用上下文记忆
  maxContextLength?: number;     // 最大上下文长度
  defaultTemplate?: string;      // 默认提示词模板
  customEnhancer?: Function;     // 自定义提示词增强函数
}
```

## 使用场景

### 客服系统

```typescript
const integration = createIntegration({
  defaultTemplate: '作为客服代表，请专业、友好地回答：{{question}}'
});
```

### 教育平台

```typescript
const integration = createIntegration({
  customEnhancer: (question) => {
    return `作为老师，请用简单易懂的方式解释：${question}`;
  }
});
```

### 开发工具

```typescript
const integration = createIntegration({
  defaultTemplate: '作为资深程序员，请分析代码并提供改进建议：{{code}}'
});
```

### 内容创作

```typescript
const integration = createIntegration({
  customEnhancer: (question) => {
    return `作为专业作家，请创作以下内容：${question}
    
    要求：
    - 语言生动有趣
    - 结构清晰
    - 提供具体示例
    `;
  }
});
```

## 开发

### 安装依赖

```bash
npm install
```

### 运行测试

```bash
npm test
```

### 构建项目

```bash
npm run build
```

### 类型检查

```bash
npm run typecheck
```

## 项目结构

```
ai-prompt-framework/
├── src/
│   ├── index.ts           # 核心框架
│   ├── easy-api.ts        # 简化 API
│   ├── integration.ts     # 软件集成层
│   └── types/
│       └── framework.ts   # 类型定义
├── examples/
│   ├── software-integration.ts  # 软件集成示例
│   └── ...
├── docs/
│   ├── INTEGRATION_GUIDE.md  # 集成指南
│   └── ...
├── tests/
│   └── framework.test.ts  # 测试文件
├── dist/                  # 编译输出
└── package.json
```

## 测试结果

✅ 所有测试通过 (15/15)

- PromptFramework: 9 个测试通过
- EasyAPI: 6 个测试通过

## 版本历史

### v4.0.0 (2026-04-03)

- ✨ 新增软件集成层
- 🎯 自动提示词优化
- 💡 上下文记忆支持
- 📚 完善集成文档

### v3.1.0 (2026-04-03)

- 🎉 简化架构，提高稳定性
- ✨ 优化 Easy API，提供更多便捷方法
- 🧪 完善测试覆盖
- 📚 更新文档和示例

## 许可证

MIT License

## 贡献

在贡献代码前，请阅读 [贡献指南](CONTRIBUTING.md)。

## 联系方式

如有问题或建议，请提交 Issue。

## 相关文档

- [集成指南](docs/INTEGRATION_GUIDE.md) - 详细的软件集成指南
- [集成示例](examples/software-integration.ts) - 完整的使用示例
- [API 文档](docs/API.md) - 完整的 API 参考
