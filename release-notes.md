## ✨ v4.0.0 - 重大重构升级

### 🎯 核心定位
纯提示词工程框架 - 不是 Agent 编排框架，不是 RAG，是把"写提示词"这件事做到极致。

### 🚀 4 大新增核心模块

1. **🔋 Token 优化器** - 平均节省 30-50% Token
   - Lv0-Lv3 四级压缩
   - 自动中英文双语识别
   - 删除所有冗余礼貌用语、修饰词

2. **🧠 高级思维链** - 学术界 SOTA 技术内置
   - Minimal: 6 字触发深度思考
   - Structured: 结构化思考流程
   - Self-Consistency: 多角度推理
   - Least-to-Most: 拆解子问题

3. **🔧 工具调用框架**
   - OpenAI 格式 100% 兼容
   - 自动 JSON Schema 生成
   - 内置工具执行引擎
   - 3 个内置工具: search / calculate / get_time

4. **🤖 轻量 Agent 模式**
   - 内置 ReAct: Query → Thought → Tool → Observation → Answer
   - 3 种 Agent 模式: react / planact / simple
   - 自动角色注入，自动优化 prompt

### 💎 核心特性

| 特性 | 说明 |
|------|------|
| 📦 **零依赖** | 纯 TypeScript，任何环境运行 |
| 🌍 **双语原生** | EN/ZH 自动识别，指令优化 |
| ✅ **74 测试** | 100% 通过，生产级质量 |
| 📄 **类型完美** | TypeScript 零错误 |
| 🏗️ **分层架构** | 想用哪层用哪层 |

### 📦 安装

```bash
# 直接从 GitHub 安装，不需要 npm！
npm install badhope/ai-prompt
```

### 🚀 一分钟上手

```typescript
import { optimizePrompt, createAgent, createToolkit } from 'ai-prompt-framework';

// 1. Token 优化 - 立省 40%
const result = optimizePrompt(
  "请你帮我详细的解释一下，谢谢！",
  { compressLevel: 3, cot: 'minimal' }
);

// 2. 工具调用 - 一键生成 OpenAI Schema
const tools = createToolkit().toOpenAIFormat();

// 3. Agent 模式 - 完整 ReAct 循环
const agent = createAgent({ language: 'zh' });
const answer = await agent.run("256 * 256 + 1000 等于多少");
```

---

**This is not another LLM wrapper.**

> 别人还在写 100 个字的提示词，你的用户用 50 个字就得到同样的效果——这就是核心竞争力。
