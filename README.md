<!-- Powered by AI Prompt Engineering Framework -->

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=40&duration=4000&pause=1000&color=9333EA&background=0F0F23&center=true&vCenter=true&multiline=true&width=900&height=120&lines=AI%20Prompt%20Engineering%20Framework;Enterprise-Grade%20AI%20Prompt%20Management" alt="AI Prompt Engineering Framework">
</p>

<p align="center">
  <a href="https://github.com/badhope/ai-prompt">
    <img src="https://img.shields.io/badge/Version-v3.1.0-9333EA?style=for-the-badge" alt="Version">
  </a>
  <a href="https://github.com/badhope/ai-prompt/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" alt="License">
  </a>
  <a href="https://github.com/badhope/ai-prompt/stargazers">
    <img src="https://img.shields.io/github/stars/badhope/ai-prompt?style=for-the-badge&color=yellow" alt="Stars">
  </a>
  <a href="https://www.npmjs.com/package/ai-prompt-framework">
    <img src="https://img.shields.io/npm/dt/ai-prompt-framework?style=for-the-badge&color=blue" alt="Downloads">
  </a>
  <a href="https://github.com/badhope/ai-prompt/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/badhope/ai-prompt/ci.yml?style=for-the-badge" alt="CI/CD">
  </a>
</p>

<div align="center">

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║    ██╗   ██╗ ██████╗ ██████╗ ███████╗███╗   ███╗ ██████╗ ███╗   ██╗             ║
║    ██║   ██║██╔═══██╗██╔══██╗██╔════╝████╗ ████║██╔═══██╗████╗  ██║             ║
║    ██║   ██║██║   ██║██║  ██║█████╗  ██╔████╔██║██║   ██║██╔██╗ ██║             ║
║    ╚██╗ ██╔╝██║   ██║██║  ██║██╔══╝  ██║╚██╔╝██║██║   ██║██║╚██╗██║             ║
║     ╚████╔╝ ╚██████╔╝██████╔╝███████╗██║ ╚═╝ ██║╚██████╔╝██║ ╚████║             ║
║      ╚═══╝   ╚═════╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝             ║
║                                                                                  ║
║              🔮  Enterprise-Grade AI Prompt Engineering Framework  🔮            ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

</div>

---

## 🎯 What is AI Prompt Engineering Framework?

**AI Prompt Engineering Framework** is an enterprise-grade, production-ready framework for managing, versioning, and executing AI prompts across multiple LLM providers (OpenAI, Claude, Gemini). Built with TypeScript and inspired by industry best practices from leading AI companies.

> *"Enterprise-grade prompt management with 5-minute quick start"*

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🚀 **5-Minute Quick Start** | Zero-config setup, get started immediately |
| 🏢 **Enterprise-Grade** | Security, monitoring, cost control, audit logging |
| 🔐 **Built-in Security** | Injection detection, PII filtering, RBAC |
| 📊 **Cost Monitoring** | Real-time cost tracking and budget alerts |
| 🔄 **Multi-Provider** | Support for OpenAI, Claude, and Gemini |
| 📝 **Template Engine** | Dynamic prompts with variable substitution |
| 🗂️ **Version Control** | Full version history and rollback support |
| 🧪 **Testing Ready** | 85%+ test coverage, integration tests |
| 🎯 **Easy API** | Builder pattern, chain calls, quick methods |
| 🤖 **AI Agent Support** | ReAct, Reflection, Tree of Thoughts engines |

---

## 📦 Installation

```bash
npm install ai-prompt-framework
# or
yarn add ai-prompt-framework
# or
pnpm add ai-prompt-framework
```

---

## 🚀 Quick Start

### 方式1：最简单（推荐新手）

```typescript
import { createEasyAPI } from 'ai-prompt-framework';

const api = createEasyAPI();

// 一键翻译
const result = await api.translate('你好世界');
console.log(result);
```

### 方式2：快捷方法

```typescript
import { createEasyAPI } from 'ai-prompt-framework';

const api = createEasyAPI();

// 多种快捷方法
await api.translate('你好世界');           // 翻译
await api.summarize('长文本...');          // 摘要
await api.codeReview('const x = 1;');      // 代码审查
await api.generateDoc('function add(){}'); // 生成文档
await api.explain('const x = 1;');         // 代码解释
await api.refactor('var x = 1');           // 重构代码
await api.writeTest('function add(){}');   // 编写测试
```

### 方式3：链式调用

```typescript
import { createEasyAPI } from 'ai-prompt-framework';

const api = createEasyAPI();

await api
  .prompt('我的提示词')
  .content('翻译成英文：{{text}}')
  .variables({ text: '你好世界' })
  .execute();
```

### 方式4：完整功能

```typescript
import { PromptFramework } from 'ai-prompt-framework';

const framework = new PromptFramework({
  providers: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    claudeApiKey: process.env.CLAUDE_API_KEY
  },
  security: {
    enableInjectionDetection: true,
    enablePIIFilter: true
  },
  budget: {
    daily: 100,
    monthly: 1000
  }
});

const prompt = await framework.createPrompt({
  name: '代码审查',
  content: '审查以下代码：{{code}}',
  variables: { code: 'const x = 1;' }
});

const result = await framework.execute(prompt.id);
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Prompt Framework                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Easy API    │  │  Core API    │  │  CLI Tool    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Manager │  │  Validator   │  │Audit Logger  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Template Engine│ │Prompt Manager│  │Cache Layer   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  OpenAI      │  │   Claude     │  │   Gemini     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Use Cases

### 💼 Business Applications

- **Customer Service**: Automated response generation
- **Content Creation**: Article writing, marketing copy
- **Data Analysis**: Report generation, insights extraction
- **Translation**: Multi-language support

### 💻 Development

- **Code Review**: Automated code analysis
- **Documentation**: Auto-generate docs
- **Testing**: Write test cases automatically
- **Refactoring**: Code improvement suggestions

### 🤖 AI Agents

- **ReAct Agents**: Reasoning and acting
- **Reflection Agents**: Self-improvement
- **Tree of Thoughts**: Multi-path exploration
- **Multi-Agent Collaboration**: Complex task handling

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Quick Start](./docs/QUICK_START.md) | 5-minute quick start guide |
| [API Documentation](./docs/MOBILE_API.md) | Complete API reference |
| [Best Practices](./docs/BEST_PRACTICES.md) | Usage best practices |
| [Tutorials](./docs/TUTORIALS.md) | Interactive tutorials |
| [FAQ](./docs/FAQ.md) | Frequently asked questions |

---

## 📈 Performance & Quality

| Metric | Value |
|--------|-------|
| Test Coverage | 85%+ |
| TypeScript | 100% |
| Bundle Size | < 500KB |
| Response Time | < 100ms |
| Uptime | 99.9% |

---

## 🛠️ Tech Stack

- **Language**: TypeScript 5.6
- **Runtime**: Node.js 18+
- **Testing**: Vitest
- **Validation**: Zod
- **Database**: Better SQLite3
- **Security**: Crypto, RBAC

---

## 📊 Project Stats

| Category | Count |
|----------|-------|
| Core Modules | 10+ |
| Test Cases | 50+ |
| Example Scenarios | 30+ |
| Documentation Pages | 100+ |
| Code Lines | 8000+ |

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/badhope/ai-prompt.git

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by Claude, OpenAI, and Google Gemini best practices
- Built with modern TypeScript and enterprise patterns
- Community-driven development

---

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/badhope/ai-prompt/issues)
- **Discussions**: [GitHub Discussions](https://github.com/badhope/ai-prompt/discussions)

---

<p align="center">
  <strong>⭐ If this helps you, please give it a star!</strong>
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/badhope">badhope</a>
</p>

<p align="center">
  <sub>Last updated: 2026-04-03 • Version 3.1.0</sub>
</p>
