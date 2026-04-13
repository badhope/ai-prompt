# 🚀 全平台发布指南

> 所有平台都是 **一行命令发布**，开箱即用。

---

## 📋 发布前检查

```bash
# 确保所有检查通过
npm run typecheck && npm run build && npm run test
```

---

## 🔧 一行命令发布的平台

| 平台 | 命令 | 备注 | 搜索曝光度 |
|------|------|------|-----------|
| **📦 npm** | `npm run release` | 最主流的 JS/TS 包平台 | ⭐⭐⭐⭐⭐ |
| **🦕 JSR.io** | `npm run release:jsr` | Deno 官方新 registry，原生 TS | ⭐⭐⭐⭐✨ |
| **⚡ pnpm** | `pnpm publish --access public` | 和 npm 同源 | ⭐⭐⭐⭐⭐ |
| **📦 yarn** | `yarn publish --access public` | 和 npm 同源 | ⭐⭐⭐⭐⭐ |
| **🐙 GitHub Packages** | 见下方 | GitHub 内置包管理 | ⭐⭐⭐⭐ |
| **🟨 deno.land/x** | 见下方 | Deno 生态 | ⭐⭐⭐⭐ |

---

## 🚀 各个平台详细发布指南

### 1️⃣ npm - 必发！最大曝光平台

```bash
# 登录 npm (首次需要)
npm login

# 发布 - 自动清理、构建、测试、发布
npm run release
```

✅ **发布后地址**: https://npmjs.com/package/ai-prompt-framework

---

### 2️⃣ JSR.io - 新兴高质量 TS 包平台

```bash
# 自动发布，支持去重和类型检查
npm run release:jsr
```

✅ 优势:
- 原生 TypeScript，不需要 dist
- 自动文档生成
- Deno/Node/Bun 通用
- 无 namespace 污染

✅ **发布后地址**: https://jsr.io/@ai/prompt-framework

---

### 3️⃣ GitHub Packages

```bash
# 登录 GitHub Packages
npm login --scope=@badhope --registry=https://npm.pkg.github.com

# 发布
npm publish --access public
```

---

### 4️⃣ deno.land/x

**首次发布需要：**

1. 去 https://deno.land/x
2. 点击 "Add a module"
3. 选择这个 GitHub 仓库
4. 设置入口为: `src/index.ts`

✅ **以后每次打 tag 自动发布**

---

## 📝 各个平台发布文案模板

### npm / GitHub 版本发布标题

```
🚀 ai-prompt-framework v4.0.0

Enterprise-grade Prompt Engineering Toolkit
```

### Release Notes 详细说明

```markdown
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
npm install ai-prompt-framework
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

**Full Changelog**: https://github.com/badhope/ai-prompt/commits/main
```

---

## 🔍 SEO 关键词 - 让用户找到你

**用户搜索的词，我们都有：**

| 搜索热词 | 是否包含 |
|---------|---------|
| ai prompt engineering | ✅ |
| prompt optimization | ✅ |
| token saving | ✅ |
| chain of thought | ✅ |
| function calling | ✅ |
| tool calling | ✅ |
| react agent | ✅ |
| openai function call | ✅ |
| prompt template typescript | ✅ |
| zero dependency ai | ✅ |

---

## 📊 发布后验证

发布后，在以下地方能搜到你的项目：

| 平台 | 搜索方式 |
|------|---------|
| npm | https://www.npmjs.com/search?q=ai%20prompt%20engineering |
| jsr | https://jsr.io/search?q=prompt |
| GitHub Topics | https://github.com/topics/prompt-engineering |
| Openbase | https://openbase.com/search?q=ai+prompt |

---

## 🎯 发布顺序建议

```
1. ✅ npm run release          (最最重要！)
2. ✅ npm run release:jsr      (高质量新平台)
3. ✅ GitHub Release           (配上前文的 Release Notes)
4. 🕒 deno.land/x              (手动设置一次，以后自动)
```

---

## 💡 一句话总结

> **This is not another LLM wrapper.**
>
> This is the **prompt engineering toolkit** that saves you 30-50% API cost, automatically.
> 这不是又一个 LLM 封装。
> 这是真的帮你省 30-50% API 费用的提示词工程工具包。

---

### 中文 Slogan

**别人还在写 100 个字的提示词，你的用户用 50 个字就得到同样的效果——这就是核心竞争力。**
