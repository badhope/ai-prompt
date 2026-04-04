# 软件集成指南

## 概述

AI Prompt Framework 可以轻松集成到您的软件中，让每次用户提问都能自动应用优化的提示词工程技巧。

## 快速开始

### 1. 基础集成

```typescript
import { createIntegration } from 'ai-prompt-framework';

// 创建集成实例
const integration = createIntegration({
  autoOptimize: true,      // 启用自动优化
  enableContext: true,     // 启用上下文记忆
  maxContextLength: 10     // 最大保存 10 轮对话
});

// 使用
const result = await integration.ask('如何学习 TypeScript?');
console.log(result.content);
```

### 2. 在现有软件中使用

#### 方案 A: 封装为服务

```typescript
// services/aiService.ts
import { createIntegration } from 'ai-prompt-framework';

class AIService {
  private integration = createIntegration();

  async handleUserQuestion(question: string) {
    const result = await this.integration.ask(question);
    return {
      answer: result.content,
      metadata: {
        optimized: result.optimized,
        duration: result.duration,
        promptUsed: result.promptUsed
      }
    };
  }
}

export const aiService = new AIService();
```

#### 方案 B: 中间件方式

```typescript
// middleware/aiPrompt.ts
import { createIntegration } from 'ai-prompt-framework';

const integration = createIntegration();

export async function aiPromptMiddleware(req, res, next) {
  const originalAsk = req.user.ask;
  
  req.user.ask = async (question) => {
    const result = await integration.ask(question);
    return result.content;
  };
  
  next();
}
```

### 3. 使用预设场景

```typescript
// 代码审查
const codeReview = await integration.askWithScenario(
  'function add(a, b) { return a + b; }',
  'code'
);

// 文本翻译
const translation = await integration.askWithScenario(
  '你好世界',
  'translation'
);

// 数据分析
const analysis = await integration.askWithScenario(
  '销售额增长了 20%',
  'analysis'
);
```

### 4. 自定义提示词增强

```typescript
const customIntegration = createIntegration({
  customEnhancer: (question, context) => {
    // 添加您的自定义逻辑
    return `
      角色：你是一位经验丰富的专家
      任务：${question}
      要求：详细、专业、提供示例
    `;
  }
});
```

## 配置选项

### IntegrationConfig

```typescript
interface IntegrationConfig {
  /** 是否启用自动优化 */
  autoOptimize?: boolean;
  
  /** 是否启用上下文记忆 */
  enableContext?: boolean;
  
  /** 最大上下文长度 */
  maxContextLength?: number;
  
  /** 默认提示词模板 */
  defaultTemplate?: string;
  
  /** 自定义提示词增强函数 */
  customEnhancer?: (input: string, context?: any) => string;
}
```

## 使用场景

### 1. 客服系统

```typescript
const integration = createIntegration({
  defaultTemplate: '作为客服代表，请专业、友好地回答：{{question}}'
});

app.post('/api/support', async (req, res) => {
  const result = await integration.ask(req.body.question);
  res.json({ answer: result.content });
});
```

### 2. 教育平台

```typescript
const integration = createIntegration({
  customEnhancer: (question) => {
    return `作为老师，请用简单易懂的方式解释：${question}`;
  }
});
```

### 3. 开发工具

```typescript
const integration = createIntegration({
  defaultTemplate: '作为资深程序员，请分析代码并提供改进建议：{{code}}'
});

// 使用
const result = await integration.quickAsk(code, 'code');
```

### 4. 内容创作

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

## API 参考

### ask(question, context?)

处理用户问题并获取 AI 回复。

```typescript
const result = await integration.ask('问题内容');
console.log(result.content);
```

### quickAsk(question, templateName, variables?)

使用预设模板快速提问。

```typescript
const result = await integration.quickAsk(
  '解释闭包',
  'code'
);
```

### askWithScenario(question, scenario, options?)

使用预设场景提问。

```typescript
const result = await integration.askWithScenario(
  code,
  'code'  // 'code' | 'writing' | 'analysis' | 'translation' | 'creative'
);
```

### batchAsk(questions)

批量处理问题。

```typescript
const results = await integration.batchAsk([
  '问题 1',
  '问题 2',
  '问题 3'
]);
```

### getHistory(conversationId?)

获取对话历史。

```typescript
const history = integration.getHistory();
```

### clearHistory(conversationId?)

清空对话历史。

```typescript
integration.clearHistory();
```

## 最佳实践

### 1. 根据场景选择合适的模板

```typescript
// 代码相关
await integration.askWithScenario(code, 'code');

// 写作相关
await integration.askWithScenario(text, 'writing');

// 翻译相关
await integration.askWithScenario(text, 'translation');
```

### 2. 利用上下文提升对话质量

```typescript
const integration = createIntegration({
  enableContext: true,
  maxContextLength: 20  // 保存更多上下文
});
```

### 3. 自定义优化逻辑

```typescript
const integration = createIntegration({
  customEnhancer: (question) => {
    // 根据您的业务逻辑定制
    return enhanceQuestion(question);
  }
});
```

### 4. 监控性能

```typescript
const result = await integration.ask(question);
console.log('耗时:', result.duration, 'ms');
console.log('是否优化:', result.optimized);
```

## 完整示例

```typescript
import { createIntegration } from 'ai-prompt-framework';

// 创建集成实例
const integration = createIntegration({
  autoOptimize: true,
  enableContext: true,
  maxContextLength: 10,
  defaultTemplate: '请作为专家详细回答：{{question}}'
});

// 处理用户问题
async function handleUserQuestion(question: string) {
  try {
    const result = await integration.ask(question);
    
    return {
      success: true,
      answer: result.content,
      metadata: {
        optimized: result.optimized,
        duration: result.duration,
        promptUsed: result.promptUsed
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 使用
const response = await handleUserQuestion('如何学习 React?');
console.log(response.answer);
```

## 注意事项

1. **性能优化**: 对于高频使用的场景，建议使用缓存
2. **上下文管理**: 定期清理不再需要的对话历史
3. **错误处理**: 始终捕获和处理可能的错误
4. **安全性**: 不要将敏感信息传递给 AI

## 故障排除

### 问题：回答质量不高

**解决方案**:
- 检查是否启用了 `autoOptimize`
- 使用 `customEnhancer` 添加更多上下文
- 选择合适的场景模板

### 问题：响应速度慢

**解决方案**:
- 减少 `maxContextLength`
- 使用 `batchAsk` 批量处理
- 考虑使用缓存

### 问题：上下文丢失

**解决方案**:
- 确保 `enableContext` 为 `true`
- 检查 `maxContextLength` 是否足够大
- 使用正确的 `conversationId`

## 更多资源

- [API 文档](API_DOCUMENTATION.md)
- [示例代码](examples/software-integration.ts)
- [快速开始](QUICK_START.md)
