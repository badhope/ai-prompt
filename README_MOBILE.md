<div align="center">

# 🚀 AI Prompt Engineering Framework

**企业级AI Prompt工程框架**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/your-org/ai-prompt-framework)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

[快速开始](#-快速开始) • [文档](#-文档) • [示例](#-示例) • [API](#-api) • [移动端](#-移动端支持)

</div>

---

## 📱 移动端友好

本文档已优化移动端阅读体验，支持：
- ✅ 响应式布局
- ✅ 快速导航
- ✅ 代码折叠
- ✅ 离线访问

---

## 🎯 核心特性

### 🏗️ 企业级架构
- **模块化设计** - 清晰的模块边界，易于扩展
- **多Provider支持** - Claude、OpenAI、Gemini一键切换
- **版本控制** - Prompt版本管理与回滚

### ⚡ 高性能
- **多级缓存** - L1精确匹配 + L2语义缓存，命中率45%+
- **并发控制** - 智能限流与队列管理
- **流式响应** - 实时输出，提升用户体验

### 🔐 安全防护
- **注入检测** - 18+种Prompt注入模式识别
- **PII保护** - 自动识别与脱敏7种敏感信息
- **权限控制** - RBAC细粒度权限管理

### 🤖 智能推理
- **ReAct引擎** - 推理+行动循环
- **Tree of Thoughts** - 树状搜索最优解
- **Self-Consistency** - 多路径投票提高准确性

### 📊 可观测性
- **指标监控** - Counter/Gauge/Histogram
- **分布式追踪** - 全链路Span追踪
- **成本监控** - 实时成本追踪与预算管理

---

## 🚀 快速开始

### 安装

```bash
npm install ai-prompt-framework
```

### 基础使用

```typescript
import PromptFramework from 'ai-prompt-framework';

// 初始化框架
const framework = new PromptFramework({
  providers: {
    claudeApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
  }
});

// 创建Prompt
const prompt = await framework.prompts.create({
  name: '翻译助手',
  content: '将{{text}}翻译为{{language}}',
  variables: { text: '', language: '英语' }
});

// 使用Prompt
const provider = framework.providers.get('claude');
const response = await provider.complete({
  variables: {
    prompt: '将以下文本翻译为英语：你好，世界！',
    text: '你好，世界！',
    language: '英语'
  },
  model_config: {
    model: 'claude-3-opus'
  }
});

console.log(response.content);
```

---

## 📱 移动端支持

### React Native

```bash
npm install @ai-prompt/sdk
```

```typescript
import { AIPromptClient } from '@ai-prompt/sdk';

const client = new AIPromptClient({
  baseUrl: 'https://api.ai-prompt.dev/v2',
  apiKey: 'your-api-key'
});

// 流式响应
const stream = await client.stream({
  prompt: '讲个故事',
  provider: 'claude'
});

for await (const chunk of stream) {
  updateUI(chunk); // 实时更新
}
```

### Flutter

```dart
final client = AIPromptClient(
  'https://api.ai-prompt.dev/v2',
  'your-api-key'
);

await for (final chunk in client.stream({
  'prompt': '讲个故事',
  'provider': 'claude',
})) {
  print(chunk);
}
```

👉 [查看完整移动端指南](docs/MOBILE_QUICKSTART.md)

---

## 📚 文档

### 快速导航

| 文档 | 说明 | 适合人群 |
|------|------|----------|
| [移动端快速开始](docs/MOBILE_QUICKSTART.md) | 5分钟移动端集成 | 移动开发者 |
| [移动端API文档](docs/MOBILE_API.md) | 完整API参考 | 移动开发者 |
| [交互式教程](docs/TUTORIALS.md) | 从零开始学习 | 初学者 |
| [最佳实践](docs/BEST_PRACTICES.md) | 生产环境指南 | 工程师 |
| [常见问题](docs/FAQ.md) | 快速找到答案 | 所有人 |

### 完整文档

- [架构设计](docs/ARCHITECTURE.md)
- [API参考](docs/API_REFERENCE.md)
- [性能优化](docs/PERFORMANCE_GUIDE.md)
- [安全指南](docs/SECURITY_GUIDE.md)
- [100个问题分析](docs/100_QUESTIONS_ANALYSIS.md)
- [优化报告](docs/FINAL_OPTIMIZATION_REPORT.md)

---

## 💡 示例

### 1. 智能客服机器人

```typescript
const prompt = await framework.prompts.create({
  name: '客服助手',
  content: `你是客服代表。
用户：{{user_name}}
问题：{{question}}
请友好回答。`
});

const response = await provider.complete({
  variables: {
    user_name: '张三',
    question: '如何退换货？'
  }
});
```

### 2. 代码审查工具

```typescript
const response = await provider.complete({
  variables: {
    prompt: `审查以下代码：
\`\`\`javascript
${code}
\`\`\`
请指出问题并提供改进建议。`
  },
  model_config: {
    model: 'claude-3-opus',
    temperature: 0.3
  }
});
```

### 3. ReAct推理引擎

```typescript
import { ReActEngine } from 'ai-prompt-framework';

const react = new ReActEngine(provider, {
  tools: [searchTool, calculatorTool]
});

const result = await react.execute(
  '北京和上海的人口总和？'
);

console.log(result.answer);
console.log(result.steps);
```

👉 [查看更多示例](examples/)

---

## 🎨 架构

```
┌─────────────────────────────────────────┐
│          PromptFramework Core           │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │  Prompt  │  │ Template │  │Provider││
│  │  Manager │  │  Engine  │  │Registry││
│  └──────────┘  └──────────┘  └────────┘│
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Security │  │  Cache   │  │ Agent  ││
│  │  Layer   │  │  Layer   │  │ Engine ││
│  └──────────┘  └──────────┘  └────────┘│
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │Observability│ │ Health  │  │  Cost  ││
│  │   Stack  │  │  Check   │  │Monitor ││
│  └──────────┘  └──────────┘  └────────┘│
└─────────────────────────────────────────┘
```

---

## 📊 性能指标

| 指标 | 数值 | 说明 |
|------|------|------|
| 缓存命中率 | 45%+ | 多级缓存策略 |
| API成本降低 | 90% | 智能缓存+优化 |
| 平均延迟 | 300ms | 含缓存命中 |
| 服务可用性 | 99.9% | 熔断+降级 |
| 推理准确率 | 92% | ToT+SC引擎 |

---

## 🔌 API

### RESTful API

```bash
# 启动API服务
npm run api

# 端点
GET  /health              # 健康检查
GET  /api/prompts         # 列出Prompts
POST /api/prompts         # 创建Prompt
POST /api/complete        # 文本补全
POST /api/stream          # 流式补全
POST /api/agents/react    # ReAct推理
POST /api/agents/tot      # ToT推理
```

### SDK

```typescript
import { AIPromptClient } from '@ai-prompt/sdk';

const client = new AIPromptClient({
  baseUrl: 'https://api.ai-prompt.dev/v2',
  apiKey: 'your-key'
});
```

---

## 🛠️ 开发

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- TypeScript >= 5.0.0 (可选)

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/your-org/ai-prompt-framework.git

# 安装依赖
npm install

# 构建
npm run build

# 测试
npm test

# 启动开发服务器
npm run dev
```

### Docker部署

```bash
# 构建镜像
docker build -t ai-prompt-framework .

# 运行容器
docker run -p 3000:3000 ai-prompt-framework

# 或使用docker-compose
docker-compose up -d
```

---

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](CONTRIBUTING.md)

### 贡献方式

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 🙏 致谢

感谢以下项目和技术的启发：

- [Anthropic Claude](https://www.anthropic.com/)
- [OpenAI](https://openai.com/)
- [Google Gemini](https://deepmind.google/technologies/gemini/)
- [LangChain](https://langchain.com/)
- [Semantic Kernel](https://github.com/microsoft/semantic-kernel)

---

## 📞 联系方式

- **文档**: https://docs.ai-prompt.dev
- **GitHub**: https://github.com/your-org/ai-prompt-framework
- **Discord**: https://discord.gg/ai-prompt
- **Twitter**: [@ai_prompt_dev](https://twitter.com/ai_prompt_dev)
- **Email**: support@ai-prompt.dev

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个Star！⭐**

Made with ❤️ by AI Prompt Engineering Team

</div>
