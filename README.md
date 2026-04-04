# AI Prompt Framework

一个简洁、高效的AI提示词工程框架，提供易用的API和强大的功能。

## 特性

- 🚀 **简单易用** - 提供直观的API，快速上手
- 💪 **功能强大** - 支持提示词管理、模板引擎、对话管理、智能代理
- 🔧 **高度可扩展** - 模块化设计，易于扩展
- 📦 **零依赖** - 核心功能无需外部依赖
- 🧪 **完全测试** - 100%测试覆盖率

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
  content: '你好，{{name}}！',
  variables: { name: '世界' }
});

// 执行提示词
const result = await framework.execute(prompt.id);
console.log(result.result);
```

### 使用Easy API

```typescript
import { createEasyAPI } from 'ai-prompt-framework';

const api = createEasyAPI();

// 快速执行
const result = await api.quick('翻译成英文：{{text}}', { text: '你好' });

// 预设功能
await api.translate('你好世界');
await api.summarize('长文本内容...');
await api.codeReview('const x = 1;', 'TypeScript');

// 构建器模式
await api
  .prompt('my-prompt')
  .content('Hello {{name}}')
  .variables({ name: 'World' })
  .execute();

// 批量操作
await api.batch([
  { content: '任务1' },
  { content: '任务2' }
]);
```

### 模板引擎

```typescript
const framework = new PromptFramework();

// 创建模板
const template = await framework.createTemplate({
  name: 'email-template',
  content: '亲爱的{{name}}，\n\n{{message}}\n\n祝好！',
  variables: ['name', 'message']
});

// 填充模板
const prompt = await framework.fillTemplate(template.id, {
  name: '张三',
  message: '这是一封测试邮件。'
});
```

### 对话管理

```typescript
const framework = new PromptFramework();

// 创建对话
const conversation = await framework.createConversation({
  name: 'chat-session',
  systemPrompt: '你是一个友好的AI助手。'
});

// 发送消息
const response = await framework.chat(conversation.id, '你好！');
console.log(response);
```

### 智能代理

```typescript
const framework = new PromptFramework();

// 创建代理
const agent = await framework.createAgent({
  name: 'code-assistant',
  type: 'assistant',
  capabilities: ['code-review', 'refactoring'],
  systemPrompt: '你是一个代码助手。'
});

// 执行任务
const result = await framework.executeAgent(agent.id, {
  task: 'review-code',
  code: 'const x = 1;'
});
```

## API文档

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

简化API，提供便捷的快捷方法。

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
- `prompt(name)` - 提示词构建器
- `template(name)` - 模板构建器
- `conversation(name)` - 对话构建器
- `agent(name)` - 代理构建器

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
│   ├── easy-api.ts        # 简化API
│   └── types/
│       └── framework.ts   # 类型定义
├── tests/
│   └── framework.test.ts  # 测试文件
├── dist/                  # 编译输出
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## 测试结果

✅ 所有测试通过 (15/15)

- PromptFramework: 9个测试通过
  - 创建提示词
  - 执行提示词
  - 创建模板
  - 填充模板
  - 创建对话
  - 发送消息
  - 创建代理
  - 执行代理
  - 获取统计

- EasyAPI: 6个测试通过
  - 快速执行
  - 翻译文本
  - 总结文本
  - 代码审查
  - 构建器模式
  - 批量操作

## 版本历史

### v3.1.0 (2026-04-03)

- 🎉 简化架构，提高稳定性
- ✨ 优化Easy API，提供更多便捷方法
- 🧪 完善测试覆盖
- 📚 更新文档和示例

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题或建议，请提交Issue。
