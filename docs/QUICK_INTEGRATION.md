# 快速使用指南 - 软件集成

## 是的，完全可以做到！✨

这个 AI 提示词工程已经专门设计了**软件集成层**，让您可以在软件中轻松使用，每次用户提问都能自动应用优化的提示词。

## 三步快速集成

### 步骤 1: 安装

```bash
npm install ai-prompt-framework
```

### 步骤 2: 创建集成实例

```typescript
import { createIntegration } from 'ai-prompt-framework';

const integration = createIntegration({
  autoOptimize: true,      // 启用自动优化
  enableContext: true      // 启用上下文记忆
});
```

### 步骤 3: 使用

```typescript
// 处理用户问题
const result = await integration.ask('如何学习 TypeScript?');
console.log('回答:', result.content);
```

## 实际应用场景

### 场景 1: 客服系统

```typescript
import { createIntegration } from 'ai-prompt-framework';

const integration = createIntegration();

// 在您的 API 中
app.post('/api/support', async (req, res) => {
  const result = await integration.ask(req.body.question);
  
  res.json({
    answer: result.content,
    optimized: result.optimized,
    duration: result.duration
  });
});
```

**效果**: 用户每次提问都会自动应用客服话术优化

### 场景 2: 教育平台

```typescript
const integration = createIntegration({
  customEnhancer: (question) => {
    return `作为老师，请用简单易懂的方式解释：${question}
    
    要求：
    - 分步骤说明
    - 提供示例
    - 避免专业术语`;
  }
});

// 学生提问
const answer = await integration.ask('什么是递归？');
```

**效果**: 自动以老师的角色和教学方式进行回答

### 场景 3: 开发工具

```typescript
const integration = createIntegration();

// 代码审查
const review = await integration.askWithScenario(
  code,
  'code'
);

// 文档生成
const docs = await integration.quickAsk(
  code,
  'code'
);
```

**效果**: 自动以资深程序员的视角分析代码

### 场景 4: 内容创作

```typescript
const integration = createIntegration({
  customEnhancer: (question) => {
    return `作为专业作家，请创作：${question}
    
    风格：生动有趣
    结构：清晰明了
    要求：提供具体示例`;
  }
});

const content = await integration.ask('写一篇关于 AI 的文章');
```

**效果**: 自动以专业作家的水平创作内容

## 核心功能

### 1. 自动优化

```typescript
const integration = createIntegration({
  autoOptimize: true  // 启用自动优化
});

const result = await integration.ask('代码怎么写？');
// 自动优化为：
// "作为资深程序员，请详细说明代码怎么写。
// 回答要条理清晰，提供具体示例，避免歧义。"
```

### 2. 上下文记忆

```typescript
const integration = createIntegration({
  enableContext: true,
  maxContextLength: 10
});

await integration.ask('什么是 TypeScript?');
await integration.ask('它和 JavaScript 有什么区别？');
// 第二次提问会自动包含第一次的上下文
```

### 3. 预设场景

```typescript
// 代码相关
await integration.askWithScenario(code, 'code');

// 写作相关
await integration.askWithScenario(text, 'writing');

// 翻译相关
await integration.askWithScenario(text, 'translation');

// 分析相关
await integration.askWithScenario(data, 'analysis');

// 创意相关
await integration.askWithScenario(idea, 'creative');
```

### 4. 批量处理

```typescript
const results = await integration.batchAsk([
  '问题 1',
  '问题 2',
  '问题 3'
]);
```

## 完整示例

```typescript
import { createIntegration } from 'ai-prompt-framework';

// 创建集成
const integration = createIntegration({
  autoOptimize: true,
  enableContext: true,
  maxContextLength: 10
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
console.log('回答:', response.answer);
console.log('是否优化:', response.metadata.optimized);
console.log('耗时:', response.metadata.duration, 'ms');
```

## 配置选项

```typescript
const integration = createIntegration({
  // 是否启用自动优化（默认：true）
  autoOptimize: true,
  
  // 是否启用上下文记忆（默认：true）
  enableContext: true,
  
  // 最大上下文长度（默认：10）
  maxContextLength: 10,
  
  // 默认提示词模板
  defaultTemplate: '请详细回答以下问题：{{question}}',
  
  // 自定义提示词增强函数
  customEnhancer: (question, context) => {
    // 您的自定义逻辑
    return enhancedQuestion;
  }
});
```

## 性能优化建议

1. **启用缓存**: 对于常见问题，使用缓存避免重复调用
2. **批量处理**: 多个问题使用 `batchAsk` 批量处理
3. **合理设置上下文长度**: 根据内存情况调整 `maxContextLength`
4. **监控性能**: 使用 `result.duration` 监控响应时间

## 故障排除

### 问题：回答质量不高

**解决方案**:
- 确保启用了 `autoOptimize`
- 使用 `customEnhancer` 添加更多上下文
- 选择合适的场景：`askWithScenario`

### 问题：响应速度慢

**解决方案**:
- 减少 `maxContextLength`
- 使用批量处理：`batchAsk`
- 考虑添加缓存机制

### 问题：上下文丢失

**解决方案**:
- 确保 `enableContext` 为 `true`
- 检查 `maxContextLength` 是否足够
- 使用正确的 `conversationId`

## 更多资源

- [完整集成指南](docs/INTEGRATION_GUIDE.md)
- [使用示例](examples/software-integration.ts)
- [API 文档](README.md#api-文档)

## 总结

✅ **可以轻松集成到您的软件中**  
✅ **每次提问都会自动应用提示词工程**  
✅ **支持自定义优化逻辑**  
✅ **提供多种预设场景**  
✅ **完整的类型支持和文档**

现在就开始使用吧！🚀
