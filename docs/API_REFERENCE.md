# API Reference

完整的 API 文档,包含所有类、方法和类型的详细说明。

## 目录

- [PromptFramework](#promptframework)
- [EasyAPI](#easyapi)
- [Builder Classes](#builder-classes)
- [Types](#types)
- [Errors](#errors)

---

## PromptFramework

核心框架类,提供提示词管理、模板引擎、对话管理和代理执行功能。

### Constructor

```typescript
new PromptFramework(config?: FrameworkConfig)
```

**参数:**
- `config` (可选): 框架配置对象
  - `dbPath?: string` - 数据库路径(预留)
  - `providers?: ProviderConfig` - LLM提供商配置(预留)
  - `security?: SecurityConfig` - 安全配置
  - `cache?: CacheConfig` - 缓存配置(预留)
  - `budget?: BudgetConfig` - 预算配置

**示例:**
```typescript
const framework = new PromptFramework({
  budget: {
    enabled: true,
    dailyLimit: 10,
    monthlyLimit: 100,
    alertThreshold: 0.8
  }
});
```

---

### Methods

#### createPrompt

创建新的提示词。

```typescript
async createPrompt(config: PromptConfig): Promise<Prompt>
```

**参数:**
- `config.name` (string, 必填): 提示词名称,不能为空
- `config.content` (string, 必填): 提示词内容,不能为空
- `config.variables` (Record<string, unknown>, 可选): 变量映射
- `config.tags` (string[], 可选): 标签数组
- `config.version` (string, 可选): 版本号

**返回:** `Promise<Prompt>` - 创建的提示词对象

**可能错误:**
- `ValidationError`: 当 name 或 content 为空时抛出

**示例:**
```typescript
const prompt = await framework.createPrompt({
  name: 'greeting',
  content: 'Hello {{name}}!',
  variables: { name: 'World' },
  tags: ['greeting', 'simple'],
  version: '1.0'
});
```

---

#### getPrompt

根据 ID 获取提示词。

```typescript
async getPrompt(id: string): Promise<Prompt | undefined>
```

**参数:**
- `id` (string): 提示词 ID

**返回:** `Promise<Prompt | undefined>` - 提示词对象,不存在则返回 undefined

**示例:**
```typescript
const prompt = await framework.getPrompt('prompt-id');
if (prompt) {
  console.log(prompt.content);
}
```

---

#### updatePrompt

更新现有提示词。

```typescript
async updatePrompt(id: string, updates: Partial<PromptConfig>): Promise<Prompt>
```

**参数:**
- `id` (string): 提示词 ID
- `updates` (Partial<PromptConfig>): 要更新的字段

**返回:** `Promise<Prompt>` - 更新后的提示词对象

**可能错误:**
- `NotFoundError`: 当提示词不存在时抛出
- `ValidationError`: 当更新后的 content 为空时抛出

**示例:**
```typescript
const updated = await framework.updatePrompt('prompt-id', {
  content: 'Updated content',
  tags: ['updated']
});
```

---

#### deletePrompt

删除提示词。

```typescript
async deletePrompt(id: string): Promise<void>
```

**参数:**
- `id` (string): 提示词 ID

**返回:** `Promise<void>`

**注意:** 删除不存在的提示词不会抛出错误。

**示例:**
```typescript
await framework.deletePrompt('prompt-id');
```

---

#### execute

执行提示词。

```typescript
async execute(promptId: string): Promise<ExecutionResult>
```

**参数:**
- `promptId` (string): 提示词 ID

**返回:** `Promise<ExecutionResult>` - 执行结果对象
  - `id`: 执行 ID
  - `promptId`: 提示词 ID
  - `result`: 执行结果字符串
  - `tokens`: Token 使用统计
  - `cost`: 成本
  - `duration`: 执行时长(毫秒)
  - `timestamp`: 执行时间

**可能错误:**
- `NotFoundError`: 当提示词不存在时抛出

**示例:**
```typescript
const result = await framework.execute('prompt-id');
console.log(result.result);
console.log(`Cost: $${result.cost}`);
```

---

#### createTemplate

创建模板。

```typescript
async createTemplate(config: TemplateConfig): Promise<Template>
```

**参数:**
- `config.name` (string, 必填): 模板名称,不能为空
- `config.content` (string, 必填): 模板内容,不能为空
- `config.variables` (string[]): 变量名数组

**返回:** `Promise<Template>` - 创建的模板对象

**可能错误:**
- `ValidationError`: 当 name 或 content 为空时抛出

**示例:**
```typescript
const template = await framework.createTemplate({
  name: 'email',
  content: 'Dear {{name}},\n\n{{message}}',
  variables: ['name', 'message']
});
```

---

#### fillTemplate

填充模板生成提示词。

```typescript
async fillTemplate(templateId: string, variables: Record<string, unknown>): Promise<Prompt>
```

**参数:**
- `templateId` (string): 模板 ID
- `variables` (Record<string, unknown>): 变量值映射

**返回:** `Promise<Prompt>` - 生成的提示词对象

**可能错误:**
- `NotFoundError`: 当模板不存在时抛出

**示例:**
```typescript
const prompt = await framework.fillTemplate('template-id', {
  name: 'John',
  message: 'Welcome to our platform!'
});
```

---

#### createConversation

创建对话会话。

```typescript
async createConversation(config: ConversationConfig): Promise<Conversation>
```

**参数:**
- `config.name` (string, 必填): 对话名称,不能为空
- `config.systemPrompt` (string, 可选): 系统提示词

**返回:** `Promise<Conversation>` - 创建的对话对象

**可能错误:**
- `ValidationError`: 当 name 为空时抛出

**示例:**
```typescript
const conversation = await framework.createConversation({
  name: 'customer-support',
  systemPrompt: 'You are a helpful customer support assistant.'
});
```

---

#### chat

在对话中发送消息。

```typescript
async chat(conversationId: string, message: string): Promise<string>
```

**参数:**
- `conversationId` (string): 对话 ID
- `message` (string, 必填): 消息内容,不能为空

**返回:** `Promise<string>` - AI 响应消息

**可能错误:**
- `NotFoundError`: 当对话不存在时抛出
- `ValidationError`: 当 message 为空时抛出

**示例:**
```typescript
const response = await framework.chat('conversation-id', 'Hello!');
console.log(response);
```

---

#### createAgent

创建智能代理。

```typescript
async createAgent(config: AgentConfig): Promise<Agent>
```

**参数:**
- `config.name` (string, 必填): 代理名称,不能为空
- `config.type` (string, 可选): 代理类型
- `config.systemPrompt` (string, 可选): 系统提示词
- `config.capabilities` (string[], 可选): 能力列表

**返回:** `Promise<Agent>` - 创建的代理对象

**可能错误:**
- `ValidationError`: 当 name 为空时抛出

**示例:**
```typescript
const agent = await framework.createAgent({
  name: 'code-reviewer',
  type: 'assistant',
  capabilities: ['code-review', 'refactoring'],
  systemPrompt: 'You are an expert code reviewer.'
});
```

---

#### executeAgent

执行代理任务。

```typescript
async executeAgent(agentId: string, task: unknown): Promise<unknown>
```

**参数:**
- `agentId` (string): 代理 ID
- `task` (unknown): 任务数据

**返回:** `Promise<unknown>` - 任务执行结果

**可能错误:**
- `NotFoundError`: 当代理不存在时抛出

**示例:**
```typescript
const result = await framework.executeAgent('agent-id', {
  task: 'review-code',
  code: 'const x = 1;'
});
```

---

#### getStats

获取框架统计信息。

```typescript
getStats(): Stats
```

**返回:** `Stats` 对象
  - `totalPrompts`: 提示词总数
  - `totalExecutions`: 执行总次数
  - `totalCost`: 总成本
  - `averageDuration`: 平均执行时长(毫秒)

**示例:**
```typescript
const stats = framework.getStats();
console.log(`Total prompts: ${stats.totalPrompts}`);
console.log(`Total executions: ${stats.totalExecutions}`);
```

---

#### getCostBreakdown

获取成本分析。

```typescript
getCostBreakdown(): { daily: number; monthly: number; total: number }
```

**返回:** 成本分析对象
  - `daily`: 今日成本
  - `monthly`: 本月成本
  - `total`: 总成本

**示例:**
```typescript
const breakdown = framework.getCostBreakdown();
console.log(`Today: $${breakdown.daily}`);
console.log(`This month: $${breakdown.monthly}`);
```

---

#### onBudgetAlert

设置预算告警回调。

```typescript
onBudgetAlert(callback: (alert: BudgetAlert) => void): void
```

**参数:**
- `callback`: 告警回调函数
  - `alert.type`: 告警类型 ('daily' | 'monthly' | 'threshold')
  - `alert.currentCost`: 当前成本
  - `alert.limit`: 限制金额
  - `alert.percentage`: 已用百分比
  - `alert.timestamp`: 告警时间

**示例:**
```typescript
framework.onBudgetAlert((alert) => {
  console.warn(`Budget alert: ${alert.type} - ${alert.percentage}% used`);
});
```

---

## EasyAPI

简化 API,提供便捷的快捷方法和构建器模式。

### Factory Function

```typescript
function createEasyAPI(config?: unknown): EasyAPI
```

**示例:**
```typescript
import { createEasyAPI } from 'ai-prompt-framework';

const api = createEasyAPI();
```

---

### Quick Methods

#### quick

快速执行提示词。

```typescript
async quick(content: string, variables?: Record<string, unknown>): Promise<ExecutionResult>
```

**示例:**
```typescript
const result = await api.quick('Translate to English: {{text}}', {
  text: '你好'
});
```

---

#### translate

翻译文本。

```typescript
async translate(text: string, targetLang?: string): Promise<ExecutionResult>
```

**参数:**
- `text`: 要翻译的文本
- `targetLang`: 目标语言,默认 '英文'

**示例:**
```typescript
const result = await api.translate('你好世界', 'Japanese');
```

---

#### summarize

总结文本。

```typescript
async summarize(text: string): Promise<ExecutionResult>
```

**示例:**
```typescript
const result = await api.summarize(longText);
```

---

#### codeReview

代码审查。

```typescript
async codeReview(code: string, language?: string): Promise<ExecutionResult>
```

**参数:**
- `code`: 要审查的代码
- `language`: 编程语言,默认 'TypeScript'

**示例:**
```typescript
const result = await api.codeReview('const x = 1;', 'JavaScript');
```

---

#### generateDoc

生成代码文档。

```typescript
async generateDoc(code: string, language?: string): Promise<ExecutionResult>
```

---

#### explain

解释代码功能。

```typescript
async explain(code: string, language?: string): Promise<ExecutionResult>
```

---

#### refactor

重构代码。

```typescript
async refactor(code: string, language?: string): Promise<ExecutionResult>
```

---

#### writeTest

编写单元测试。

```typescript
async writeTest(code: string, language?: string): Promise<ExecutionResult>
```

---

#### chat

快速对话。

```typescript
async chat(message: string, context?: string): Promise<string>
```

**参数:**
- `message`: 用户消息
- `context`: 上下文/系统提示,默认 '你是一个友好的AI助手。'

---

#### batch

批量执行任务。

```typescript
async batch(tasks: Array<{ content: string; variables?: Record<string, unknown> }>): Promise<ExecutionResult[]>
```

**示例:**
```typescript
const results = await api.batch([
  { content: 'Task 1' },
  { content: 'Task 2 with {{var}}', variables: { var: 'value' } }
]);
```

---

### Builder Methods

#### prompt

创建提示词构建器。

```typescript
prompt(name: string): PromptBuilder
```

**示例:**
```typescript
const result = await api
  .prompt('my-prompt')
  .content('Hello {{name}}')
  .variables({ name: 'World' })
  .tags(['greeting'])
  .version('1.0')
  .execute();
```

---

#### template

创建模板构建器。

```typescript
template(name: string): TemplateBuilder
```

**示例:**
```typescript
const prompt = await api
  .template('email')
  .content('Dear {{name}}, {{message}}')
  .variables(['name', 'message'])
  .fill({ name: 'John', message: 'Hello!' });
```

---

#### conversation

创建对话构建器。

```typescript
conversation(name: string): ConversationBuilder
```

**示例:**
```typescript
const response = await api
  .conversation('support')
  .systemPrompt('You are helpful.')
  .chat('I need help');
```

---

#### agent

创建代理构建器。

```typescript
agent(name: string): AgentBuilder
```

**示例:**
```typescript
const result = await api
  .agent('reviewer')
  .type('assistant')
  .capabilities(['review'])
  .execute({ code: '...' });
```

---

### Utility Methods

#### getStats

获取统计信息。

```typescript
getStats(): Stats
```

---

#### getCostBreakdown

获取成本分析。

```typescript
getCostBreakdown(): { daily: number; monthly: number; total: number }
```

---

#### onBudgetAlert

设置预算告警。

```typescript
onBudgetAlert(callback: (alert: BudgetAlert) => void): void
```

---

## Builder Classes

### PromptBuilder

提示词构建器,支持链式调用。

**Methods:**
- `content(content: string): this`
- `variables(variables: Record<string, unknown>): this`
- `tags(tags: string[]): this`
- `version(version: string): this`
- `create(): Promise<Prompt>`
- `execute(): Promise<ExecutionResult>`

---

### TemplateBuilder

模板构建器。

**Methods:**
- `content(content: string): this`
- `variables(variables: string[]): this`
- `create(): Promise<Template>`
- `fill(variables: Record<string, unknown>): Promise<Prompt>`

---

### ConversationBuilder

对话构建器。

**Methods:**
- `systemPrompt(prompt: string): this`
- `create(): Promise<Conversation>`
- `chat(message: string): Promise<string>`

---

### AgentBuilder

代理构建器。

**Methods:**
- `type(type: string): this`
- `systemPrompt(prompt: string): this`
- `capabilities(capabilities: string[]): this`
- `create(): Promise<Agent>`
- `execute(task: unknown): Promise<unknown>`

---

## Types

### PromptConfig

```typescript
interface PromptConfig {
  name: string;
  content: string;
  variables?: Record<string, unknown>;
  tags?: string[];
  version?: string;
}
```

---

### Prompt

```typescript
interface Prompt extends PromptConfig {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### TemplateConfig

```typescript
interface TemplateConfig {
  name: string;
  content: string;
  variables: string[];
}
```

---

### ExecutionResult

```typescript
interface ExecutionResult {
  id: string;
  promptId: string;
  result: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  duration: number;
  timestamp: Date;
}
```

---

### Stats

```typescript
interface Stats {
  totalPrompts: number;
  totalExecutions: number;
  totalCost: number;
  averageDuration: number;
}
```

---

### BudgetAlert

```typescript
interface BudgetAlert {
  type: 'daily' | 'monthly' | 'threshold';
  currentCost: number;
  limit: number;
  percentage: number;
  timestamp: Date;
}
```

---

## Errors

### FrameworkError

基础错误类。

```typescript
class FrameworkError extends Error {
  constructor(message: string, code: string, details?: unknown);
  code: string;
  details?: unknown;
}
```

---

### ValidationError

验证错误,当输入无效时抛出。

```typescript
class ValidationError extends FrameworkError {
  constructor(field: string, message: string);
}
```

**常见场景:**
- 创建提示词时 name 或 content 为空
- 发送消息时 message 为空
- 更新提示词时 content 为空字符串

---

### NotFoundError

资源未找到错误。

```typescript
class NotFoundError extends FrameworkError {
  constructor(resource: string, id: string);
}
```

**常见场景:**
- 执行不存在的提示词
- 填充不存在的模板
- 向不存在的对话发送消息
- 执行不存在的代理

---

## 最佳实践

### 错误处理

```typescript
import { ValidationError, NotFoundError } from 'ai-prompt-framework';

try {
  const prompt = await framework.createPrompt({
    name: '',
    content: 'test'
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Validation failed: ${error.message}`);
  } else if (error instanceof NotFoundError) {
    console.error(`Resource not found: ${error.message}`);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### 使用构建器模式

```typescript
// 推荐: 使用构建器模式
const result = await api
  .prompt('translation')
  .content('Translate to {{lang}}: {{text}}')
  .variables({ lang: 'English', text: '你好' })
  .tags(['translation'])
  .execute();

// 而非
const prompt = await framework.createPrompt({
  name: 'translation',
  content: 'Translate to English: 你好',
  tags: ['translation']
});
const result = await framework.execute(prompt.id);
```

### 批量操作

```typescript
// 推荐: 使用批量操作
const results = await api.batch([
  { content: 'Task 1' },
  { content: 'Task 2' },
  { content: 'Task 3' }
]);

// 而非循环执行
for (const task of tasks) {
  await api.quick(task.content);
}
```

### 监控成本

```typescript
// 设置预算告警
framework.onBudgetAlert((alert) => {
  console.warn(
    `Budget alert: ${alert.type} - ` +
    `$${alert.currentCost} / $${alert.limit} ` +
    `(${alert.percentage.toFixed(2)}%)`
  );
});

// 定期检查成本
const breakdown = framework.getCostBreakdown();
console.log(`Daily: $${breakdown.daily}`);
console.log(`Monthly: $${breakdown.monthly}`);
```
