# 💡 最佳实践指南

> **生产环境最佳实践** - 确保高性能、高可靠、高安全

---

## 📋 目录

- [性能优化](#性能优化)
- [安全最佳实践](#安全最佳实践)
- [可靠性保障](#可靠性保障)
- [成本控制](#成本控制)
- [监控与告警](#监控与告警)
- [代码规范](#代码规范)

---

## ⚡ 性能优化

### 1. 缓存策略

#### 多级缓存架构

```typescript
const framework = new PromptFramework({
  enableCache: true,
  cache: {
    // L1: 精确匹配缓存（快速）
    exact: {
      ttl: 3600,        // 1小时
      maxSize: 1000     // 最多1000条
    },
    
    // L2: 语义相似缓存（智能）
    semantic: {
      ttl: 7200,        // 2小时
      threshold: 0.95,  // 相似度阈值
      maxSize: 500
    }
  }
});
```

#### 缓存预热

```typescript
// 启动时预热常用Prompt
async function warmupCache() {
  const hotPrompts = await getHotPrompts();
  
  await Promise.all(
    hotPrompts.map(prompt => 
      framework.cacheLayer?.set(
        prompt.key,
        prompt.response
      )
    )
  );
}
```

#### 缓存命中率监控

```typescript
// 定期检查缓存效果
setInterval(() => {
  const stats = await framework.getCacheStats();
  
  if (stats.hit_rate < 0.3) {
    console.warn('缓存命中率过低:', stats.hit_rate);
    // 调整缓存策略
  }
}, 60000);
```

---

### 2. 并发控制

#### 请求队列

```typescript
import PQueue from 'p-queue';

const queue = new PQueue({
  concurrency: 10,      // 最大并发数
  interval: 1000,       // 时间窗口
  intervalCap: 50       // 窗口内最大请求数
});

async function processWithQueue(request) {
  return queue.add(() => 
    framework.providers.get('claude').complete(request)
  );
}
```

#### 批量请求优化

```typescript
// ✅ 推荐：批量处理
async function batchProcess(items: string[]) {
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}

// ❌ 不推荐：一次性处理大量请求
async function processAll(items: string[]) {
  return Promise.all(items.map(processItem));
}
```

---

### 3. 流式响应

#### 实时流式处理

```typescript
// ✅ 推荐：流式响应提升用户体验
async function streamResponse(prompt: string) {
  const stream = provider.stream({
    variables: { prompt },
    model_config: { model: 'claude-3-opus' }
  });
  
  let fullText = '';
  for await (const chunk of stream) {
    fullText += chunk;
    yield fullText; // 实时返回
  }
}

// 使用
for await (const text of streamResponse('讲个故事')) {
  updateUI(text);
}
```

---

### 4. Token优化

#### 精确控制Token数量

```typescript
// ✅ 根据任务类型设置合适的token数
const tokenLimits = {
  'simple': 100,      // 简单问答
  'moderate': 500,    // 中等复杂度
  'complex': 2000,    // 复杂任务
  'creative': 1000    // 创意写作
};

const response = await provider.complete({
  variables: { prompt },
  model_config: {
    model: 'claude-3-opus',
    max_tokens: tokenLimits[taskType]
  }
});
```

#### Token估算

```typescript
// 估算输入token数
function estimateTokens(text: string): number {
  // 粗略估算：英文约4字符=1token，中文约1.5字符=1token
  const englishChars = text.replace(/[^\x00-\x7F]/g, '').length;
  const chineseChars = text.length - englishChars;
  
  return Math.ceil(englishChars / 4 + chineseChars / 1.5);
}

// 使用
const estimatedTokens = estimateTokens(prompt);
if (estimatedTokens > 10000) {
  console.warn('输入过长，建议分段处理');
}
```

---

## 🔐 安全最佳实践

### 1. API Key管理

#### 环境变量存储

```typescript
// ✅ 推荐：使用环境变量
const framework = new PromptFramework({
  providers: {
    claudeApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
  }
});

// ❌ 不要硬编码
const framework = new PromptFramework({
  providers: {
    claudeApiKey: 'sk-ant-xxx', // 危险！
  }
});
```

#### 密钥轮换

```typescript
// 实现密钥轮换机制
class KeyManager {
  private keys: string[];
  private currentIndex = 0;
  
  constructor(keys: string[]) {
    this.keys = keys;
  }
  
  getNextKey(): string {
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }
}

const keyManager = new KeyManager([
  process.env.ANTHROPIC_API_KEY_1,
  process.env.ANTHROPIC_API_KEY_2,
]);
```

---

### 2. 输入验证

#### Prompt注入防护

```typescript
// ✅ 启用安全层
const framework = new PromptFramework({
  enableSecurity: true,
  security: {
    enableInjectionDetection: true,
    enablePIIFilter: true,
    maxInputLength: 10000
  }
});

// 处理用户输入
const { output, validation } = await framework.processWithSecurity(userInput);

if (!validation.valid) {
  throw new Error('输入验证失败: ' + validation.errors.join(', '));
}
```

#### 输入长度限制

```typescript
// ✅ 限制输入长度
const MAX_INPUT_LENGTH = 10000;

function validateInput(input: string): void {
  if (!input || input.trim().length === 0) {
    throw new Error('输入不能为空');
  }
  
  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error(`输入长度超过限制（${MAX_INPUT_LENGTH}字符）`);
  }
  
  // 检查特殊字符
  if (/<script|javascript:|on\w+=/i.test(input)) {
    throw new Error('输入包含不安全内容');
  }
}
```

---

### 3. PII保护

#### 自动PII检测

```typescript
// 启用PII检测
const { output, piiDetected } = await framework.processWithSecurity(userInput);

if (piiDetected) {
  console.warn('检测到PII信息，已自动脱敏');
}

// 使用脱敏后的输出
const response = await provider.complete({
  variables: { prompt: output }
});
```

#### 手动PII处理

```typescript
// 自定义PII处理规则
const piiPatterns = {
  email: /\b[\w.-]+@[\w.-]+\.\w{2,}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g
};

function redactPII(text: string): string {
  let redacted = text;
  
  for (const [type, pattern] of Object.entries(piiPatterns)) {
    redacted = redacted.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
  }
  
  return redacted;
}
```

---

### 4. 权限控制

#### RBAC实现

```typescript
// 配置RBAC
const framework = new PromptFramework({
  enableSecurity: true
});

// 创建角色
framework.rbac?.createRole({
  id: 'user',
  name: '普通用户',
  permissions: ['prompt:read', 'prompt:execute']
});

framework.rbac?.createRole({
  id: 'admin',
  name: '管理员',
  permissions: ['prompt:*', 'user:*', 'system:*']
});

// 检查权限
function checkPermission(userId: string, action: string): boolean {
  return framework.rbac?.hasPermission(userId, action) ?? false;
}

// 使用
if (!checkPermission(userId, 'prompt:create')) {
  throw new Error('权限不足');
}
```

---

## 🛡️ 可靠性保障

### 1. 重试机制

#### 指数退避重试

```typescript
import { RetryManager } from 'ai-prompt-framework';

const retryManager = new RetryManager({
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true
});

const response = await retryManager.execute(
  () => provider.complete(request),
  {
    shouldRetry: (error) => {
      // 只重试可恢复的错误
      return error.code === 429 || error.code >= 500;
    }
  }
);
```

---

### 2. 熔断器

#### 自动熔断保护

```typescript
import { CircuitBreaker } from 'ai-prompt-framework';

const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,      // 失败阈值
  successThreshold: 2,      // 成功阈值
  timeout: 60000,           // 熔断超时
  monitoringPeriod: 10000   // 监控周期
});

const response = await circuitBreaker.execute(
  () => provider.complete(request)
);

if (!response) {
  // 熔断器打开，使用降级方案
  return fallbackResponse();
}
```

---

### 3. 降级策略

#### 多级降级

```typescript
async function completeWithFallback(request) {
  try {
    // 尝试主Provider
    return await provider.complete(request);
  } catch (error) {
    console.warn('主Provider失败，切换备用Provider');
    
    try {
      // 尝试备用Provider
      const backupProvider = framework.providers.get('openai');
      return await backupProvider.complete(request);
    } catch (backupError) {
      console.warn('备用Provider失败，使用缓存');
      
      // 尝试缓存
      const cached = await framework.cacheLayer?.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      // 最终降级：返回默认响应
      return getDefaultResponse();
    }
  }
}
```

---

### 4. 健康检查

#### 定期健康检查

```typescript
// 启动健康检查
setInterval(async () => {
  const health = await framework.health?.checkHealth(
    () => checkDatabase(),
    () => checkCache(),
    () => checkProviders()
  );
  
  if (health?.status !== 'healthy') {
    alertTeam('服务健康检查失败', health);
  }
}, 30000);

// 暴露健康检查端点
app.get('/health', async (req, res) => {
  const health = await framework.health?.checkHealth();
  res.status(health?.status === 'healthy' ? 200 : 503).json(health);
});
```

---

## 💰 成本控制

### 1. 成本监控

#### 实时成本追踪

```typescript
const framework = new PromptFramework({
  enableCostMonitor: true,
  budget: {
    daily: 100,      // 每日预算$100
    monthly: 2000,   // 每月预算$2000
    perUser: 10      // 每用户限额$10
  }
});

// 记录成本
framework.costs?.recordCost({
  id: Date.now().toString(),
  timestamp: new Date(),
  provider: 'claude',
  model: 'claude-3-opus',
  inputTokens: 100,
  outputTokens: 500,
  cost: 0.015
});

// 查看统计
const stats = framework.getCostStats();
console.log('今日成本:', stats.todayCost);
console.log('本月成本:', stats.monthlyCost);
```

---

### 2. 预算告警

#### 成本告警机制

```typescript
// 设置告警回调
framework.costs?.setAlertCallback((alert) => {
  if (alert.type === 'budget_exceeded') {
    sendAlert(`预算超支: ${alert.message}`);
    // 暂停服务或降级
    pauseService();
  }
  
  if (alert.type === 'budget_warning') {
    sendWarning(`预算预警: ${alert.message}`);
  }
});
```

---

### 3. 成本优化

#### 模型选择策略

```typescript
// 根据任务复杂度选择合适的模型
function selectModel(taskComplexity: 'simple' | 'moderate' | 'complex'): string {
  const modelMap = {
    'simple': 'claude-3-haiku',      // 快速、便宜
    'moderate': 'claude-3-sonnet',   // 平衡
    'complex': 'claude-3-opus'       // 最强、最贵
  };
  
  return modelMap[taskComplexity];
}

// 成本对比
const modelCosts = {
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },  // 每1K token
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-opus': { input: 0.015, output: 0.075 }
};
```

---

## 📊 监控与告警

### 1. 指标收集

#### 关键指标

```typescript
// 启用指标收集
const framework = new PromptFramework({
  enableObservability: true
});

// 记录自定义指标
framework.observability.metrics?.counter('requests_total', 1, {
  provider: 'claude',
  model: 'claude-3-opus'
});

framework.observability.metrics?.histogram('request_duration', duration, {
  endpoint: '/api/complete'
});

// 获取指标
const metrics = framework.getMetrics();
```

---

### 2. 分布式追踪

#### 全链路追踪

```typescript
// 创建Span
const span = framework.observability.tracing?.startSpan('complete_request', {
  provider: 'claude',
  model: 'claude-3-opus'
});

try {
  const response = await provider.complete(request);
  span?.setTag('success', true);
  return response;
} catch (error) {
  span?.setTag('error', true);
  span?.log({ error: error.message });
  throw error;
} finally {
  span?.finish();
}
```

---

### 3. 日志管理

#### 结构化日志

```typescript
// 使用结构化日志
framework.observability.logger?.info('Request completed', {
  requestId: '123',
  provider: 'claude',
  duration: 1234,
  tokens: { input: 100, output: 500 }
});

framework.observability.logger?.error('Request failed', {
  requestId: '123',
  error: error.message,
  stack: error.stack
});
```

---

## 📝 代码规范

### 1. 错误处理

```typescript
// ✅ 推荐：完善的错误处理
try {
  const response = await provider.complete(request);
  
  if (!response.success) {
    logger.error('API error', { error: response.error });
    throw new APIError(response.error);
  }
  
  return response.data;
} catch (error) {
  if (error instanceof NetworkError) {
    // 网络错误
    logger.warn('Network error', { error: error.message });
    throw new ServiceUnavailableError('服务暂时不可用');
  } else if (error instanceof RateLimitError) {
    // 限流错误
    logger.warn('Rate limit exceeded', { retryAfter: error.retryAfter });
    throw new TooManyRequestsError('请求过于频繁');
  } else {
    // 未知错误
    logger.error('Unknown error', { error: error.message });
    throw new InternalServerError('内部错误');
  }
}
```

---

### 2. 类型安全

```typescript
// ✅ 使用TypeScript类型
import { 
  Prompt, 
  CompletionRequest, 
  CompletionResponse 
} from 'ai-prompt-framework';

async function processPrompt(
  prompt: Prompt
): Promise<CompletionResponse> {
  const request: CompletionRequest = {
    prompt: prompt.content,
    variables: prompt.variables,
    provider: 'claude'
  };
  
  return await provider.complete(request);
}
```

---

### 3. 单元测试

```typescript
import { describe, it, expect } from 'vitest';

describe('PromptFramework', () => {
  it('should create prompt', async () => {
    const framework = new PromptFramework();
    
    const prompt = await framework.prompts.create({
      name: 'Test Prompt',
      content: 'Hello {{name}}',
      variables: { name: 'World' }
    });
    
    expect(prompt.id).toBeDefined();
    expect(prompt.name).toBe('Test Prompt');
  });
  
  it('should handle errors', async () => {
    const framework = new PromptFramework();
    
    await expect(
      framework.prompts.get('non-existent')
    ).rejects.toThrow('Prompt not found');
  });
});
```

---

## 📚 相关资源

- [性能优化指南](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/PERFORMANCE_GUIDE.md)
- [安全最佳实践](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/SECURITY_GUIDE.md)
- [API参考文档](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/API_REFERENCE.md)

---

*指南版本：v2.0.0*  
*最后更新：2026-04-03*
