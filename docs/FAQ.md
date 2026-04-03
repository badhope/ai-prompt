# ❓ 常见问题解答 (FAQ)

> **快速找到答案** - 移动端友好的FAQ文档

---

## 📋 目录

- [快速开始](#快速开始)
- [API使用](#api使用)
- [性能优化](#性能优化)
- [安全相关](#安全相关)
- [成本与计费](#成本与计费)
- [故障排查](#故障排查)
- [移动端开发](#移动端开发)

---

## 🚀 快速开始

### Q1: 如何快速开始使用？

**A:** 三步快速开始：

```bash
# 1. 安装
npm install ai-prompt-framework

# 2. 初始化
import PromptFramework from 'ai-prompt-framework';
const framework = new PromptFramework({
  providers: { claudeApiKey: 'your-key' }
});

# 3. 使用
const response = await framework.providers.get('claude').complete({
  variables: { prompt: '你好' }
});
```

---

### Q2: 支持哪些LLM Provider？

**A:** 目前支持：
- ✅ **Claude** (Anthropic)
- ✅ **OpenAI** (GPT-4, GPT-3.5)
- ✅ **Google Gemini**

即将支持：
- 🔜 **Azure OpenAI**
- 🔜 **AWS Bedrock**
- 🔜 **本地模型** (Ollama, LM Studio)

---

### Q3: 如何获取API Key？

**A:** 
1. **Claude**: https://console.anthropic.com
2. **OpenAI**: https://platform.openai.com
3. **Gemini**: https://makersuite.google.com

---

### Q4: 最小系统要求是什么？

**A:**
- **Node.js**: >= 18.0.0
- **TypeScript**: >= 5.0.0 (可选)
- **内存**: >= 512MB
- **存储**: >= 100MB

---

## 🔌 API使用

### Q5: 如何创建自定义Prompt？

**A:**
```typescript
const prompt = await framework.prompts.create({
  name: '翻译助手',
  content: '将{{text}}翻译为{{language}}',
  variables: {
    text: '',
    language: '英语'
  }
});
```

---

### Q6: 如何使用模板变量？

**A:**
```typescript
// 简单变量
const template = '你好，{{name}}！';

// 条件渲染
const template = `
{{#if vip}}
欢迎VIP用户！
{{else}}
升级VIP享受更多功能。
{{/if}}
`;

// 循环渲染
const template = `
{{#each items}}
- {{name}}: {{price}}
{{/each}}
`;
```

---

### Q7: 如何切换不同的Provider？

**A:**
```typescript
// 方式1：直接获取
const claude = framework.providers.get('claude');
const openai = framework.providers.get('openai');

// 方式2：动态选择
const provider = framework.providers.get(userPreference.provider);
```

---

### Q8: 如何实现流式响应？

**A:**
```typescript
const stream = provider.stream({
  variables: { prompt: '讲个故事' }
});

for await (const chunk of stream) {
  console.log(chunk); // 实时输出
}
```

---

## ⚡ 性能优化

### Q9: 如何提高缓存命中率？

**A:**
```typescript
const framework = new PromptFramework({
  enableCache: true,
  cache: {
    exact: { ttl: 3600 },
    semantic: { 
      ttl: 7200,
      threshold: 0.95  // 提高相似度阈值
    }
  }
});

// 使用稳定的Prompt格式
const prompt = `翻译以下文本：
语言：{{language}}
文本：{{text}}
格式：保持原文格式`;
```

---

### Q10: 如何减少API调用成本？

**A:**
1. **启用缓存**：命中率可达45%
2. **选择合适模型**：简单任务用Haiku
3. **限制Token**：设置max_tokens
4. **批量处理**：减少请求次数

```typescript
// 成本对比
const models = {
  'claude-3-haiku': '$0.25/1M tokens',   // 最便宜
  'claude-3-sonnet': '$3/1M tokens',     // 平衡
  'claude-3-opus': '$15/1M tokens'       // 最贵
};
```

---

### Q11: 如何处理大量并发请求？

**A:**
```typescript
import PQueue from 'p-queue';

const queue = new PQueue({
  concurrency: 10,    // 最大并发
  interval: 1000,     // 时间窗口
  intervalCap: 50     // 窗口内最大请求数
});

const results = await Promise.all(
  requests.map(req => queue.add(() => processRequest(req)))
);
```

---

### Q12: 如何优化移动端性能？

**A:**
```typescript
// 1. 限制Token数
options: { max_tokens: 200 }

// 2. 使用流式响应
const stream = client.stream(request);

// 3. 实现本地缓存
const cached = localStorage.getItem(key);
if (cached) return cached;

// 4. 批量请求
const responses = await Promise.all(requests);
```

---

## 🔐 安全相关

### Q13: 如何防止Prompt注入？

**A:**
```typescript
const framework = new PromptFramework({
  enableSecurity: true,
  security: {
    enableInjectionDetection: true,
    enablePIIFilter: true
  }
});

const { output, validation } = await framework.processWithSecurity(userInput);

if (!validation.valid) {
  throw new Error('输入不安全');
}
```

---

### Q14: 如何保护API Key？

**A:**
```typescript
// ✅ 推荐：环境变量
const apiKey = process.env.ANTHROPIC_API_KEY;

// ✅ 推荐：后端代理
const client = new AIPromptClient({
  baseUrl: 'https://your-backend.com/api'
});

// ❌ 不要：硬编码
const apiKey = 'sk-ant-xxx'; // 危险！
```

---

### Q15: 如何实现权限控制？

**A:**
```typescript
// 创建角色
framework.rbac?.createRole({
  id: 'user',
  permissions: ['prompt:read', 'prompt:execute']
});

// 检查权限
if (!framework.rbac?.hasPermission(userId, 'prompt:create')) {
  throw new Error('权限不足');
}
```

---

### Q16: 如何处理PII信息？

**A:**
```typescript
// 自动检测和脱敏
const { output, piiDetected } = await framework.processWithSecurity(input);

if (piiDetected) {
  console.log('PII已自动脱敏');
}

// 手动处理
function redactPII(text: string) {
  return text
    .replace(/\b[\w.-]+@[\w.-]+\.\w{2,}\b/g, '[EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
}
```

---

## 💰 成本与计费

### Q17: 如何查看成本统计？

**A:**
```typescript
const stats = framework.getCostStats();

console.log('总成本:', stats.totalCost);
console.log('今日成本:', stats.todayCost);
console.log('平均每次:', stats.avgCostPerRequest);
console.log('按Provider:', stats.byProvider);
```

---

### Q18: 如何设置预算限制？

**A:**
```typescript
const framework = new PromptFramework({
  enableCostMonitor: true,
  budget: {
    daily: 100,      // 每日$100
    monthly: 2000,   // 每月$2000
    perUser: 10      // 每用户$10
  }
});

// 设置告警
framework.costs?.setAlertCallback((alert) => {
  if (alert.type === 'budget_exceeded') {
    pauseService();
  }
});
```

---

### Q19: 各Provider的成本对比？

**A:**

| Provider | 模型 | 输入成本 | 输出成本 | 适用场景 |
|----------|------|----------|----------|----------|
| Claude | Haiku | $0.25/1M | $1.25/1M | 简单任务 |
| Claude | Sonnet | $3/1M | $15/1M | 平衡任务 |
| Claude | Opus | $15/1M | $75/1M | 复杂任务 |
| OpenAI | GPT-4 | $30/1M | $60/1M | 通用任务 |
| Gemini | Pro | $0.5/1M | $1.5/1M | 多模态 |

---

### Q20: 如何估算成本？

**A:**
```typescript
// 估算token数
function estimateTokens(text: string): number {
  const englishChars = text.replace(/[^\x00-\x7F]/g, '').length;
  const chineseChars = text.length - englishChars;
  return Math.ceil(englishChars / 4 + chineseChars / 1.5);
}

// 估算成本
const inputTokens = estimateTokens(prompt);
const outputTokens = 500; // 预估输出
const cost = provider.estimateCost(
  { input: inputTokens, output: outputTokens },
  'claude-3-opus'
);

console.log(`预估成本: $${cost}`);
```

---

## 🔧 故障排查

### Q21: API调用失败怎么办？

**A:**
```typescript
try {
  const response = await provider.complete(request);
} catch (error) {
  if (error.code === 401) {
    console.error('API Key无效');
  } else if (error.code === 429) {
    console.error('请求过于频繁，请稍后重试');
  } else if (error.code >= 500) {
    console.error('服务器错误，请稍后重试');
  }
}
```

---

### Q22: 如何处理超时？

**A:**
```typescript
// 设置超时
const response = await Promise.race([
  provider.complete(request),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 30000)
  )
]);

// 或使用AbortController
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000);
```

---

### Q23: 如何查看详细日志？

**A:**
```typescript
const framework = new PromptFramework({
  enableObservability: true
});

// 查看日志
framework.observability.logger?.setLevel('debug');

// 查看指标
const metrics = framework.getMetrics();
console.log(metrics);

// 查看追踪
const traces = framework.observability.tracing?.getTraces();
```

---

### Q24: 如何处理网络错误？

**A:**
```typescript
import { RetryManager } from 'ai-prompt-framework';

const retryManager = new RetryManager({
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2
});

const response = await retryManager.execute(
  () => provider.complete(request),
  {
    shouldRetry: (error) => {
      return error.code === 'ENOTFOUND' || 
             error.code === 'ECONNRESET';
    }
  }
);
```

---

## 📱 移动端开发

### Q25: React Native如何集成？

**A:**
```bash
npm install @ai-prompt/sdk
```

```typescript
import { AIPromptClient } from '@ai-prompt/sdk';

const client = new AIPromptClient({
  baseUrl: 'https://api.ai-prompt.dev/v2',
  apiKey: 'your-key'
});

const response = await client.complete({
  prompt: '你好',
  provider: 'claude'
});
```

---

### Q26: Flutter如何集成？

**A:**
```yaml
# pubspec.yaml
dependencies:
  dio: ^5.0.0
```

```dart
final client = AIPromptClient(
  'https://api.ai-prompt.dev/v2',
  'your-key'
);

final response = await client.complete({
  'prompt': '你好',
  'provider': 'claude',
});
```

---

### Q27: 移动端如何优化流量？

**A:**
```typescript
// 1. 启用压缩（自动）
// 2. 限制Token数
options: { max_tokens: 200 }

// 3. 使用缓存
const cached = await AsyncStorage.getItem(key);

// 4. 批量请求
const responses = await Promise.all(requests);
```

---

### Q28: 移动端如何处理离线？

**A:**
```typescript
import NetInfo from '@react-native-community/netinfo';

// 检测网络状态
const state = await NetInfo.fetch();
if (!state.isConnected) {
  // 使用缓存
  const cached = await getCachedResponse();
  return cached;
}

// 在线请求
const response = await client.complete(request);
await cacheResponse(response);
```

---

### Q29: 移动端如何实现实时聊天？

**A:**
```typescript
const stream = await client.stream({
  prompt: input,
  provider: 'claude'
});

let fullText = '';
for await (const chunk of stream) {
  fullText += chunk;
  updateUI(fullText); // 实时更新
}
```

---

### Q30: 移动端如何保护API Key？

**A:**
```typescript
// ✅ 推荐：使用后端代理
const client = new AIPromptClient({
  baseUrl: 'https://your-backend.com/api'
  // API Key在后端处理
});

// ❌ 不要在客户端存储API Key
// AsyncStorage.setItem('api_key', key); // 危险！
```

---

## 📚 更多资源

- [完整文档](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs)
- [移动端API文档](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/MOBILE_API.md)
- [最佳实践](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/BEST_PRACTICES.md)
- [交互式教程](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/TUTORIALS.md)

---

## 💬 获取帮助

- **GitHub Issues**: https://github.com/your-org/ai-prompt-framework/issues
- **Discord社区**: https://discord.gg/ai-prompt
- **邮件支持**: support@ai-prompt.dev

---

*FAQ版本：v2.0.0*  
*最后更新：2026-04-03*  
*问题总数：30*
