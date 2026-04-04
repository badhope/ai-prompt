# 如何在整个软件中启用 AI 提示词工程

## 🎯 目标

让整个软件的每一次 AI 交互都自动使用提示词工程优化。

## 📦 方案一：全局初始化（推荐）

### 步骤 1: 在软件入口处初始化

```typescript
// main.ts 或 index.ts（软件入口文件）
import { initializeGlobal } from 'ai-prompt-framework';

// 在软件启动时初始化
initializeGlobal({
  enabled: true,           // 启用框架
  mode: 'multi',          // 使用多智能体模式
  autoOptimize: true,     // 自动优化
  enableContext: true,    // 启用上下文
  logLevel: 'info'        // 日志级别
});

console.log('✅ AI 提示词工程框架已全局启用');
```

### 步骤 2: 在任何地方使用

```typescript
// 任何文件中都可以使用
import { askAI } from 'ai-prompt-framework';

// 处理用户问题
async function handleUserQuestion(question: string) {
  const answer = await askAI(question);
  return answer;
}
```

---

## 📦 方案二：配置文件方式

### 步骤 1: 创建配置文件

在项目根目录创建 `ai-prompt.config.json`：

```json
{
  "aiPromptFramework": {
    "enabled": true,
    "mode": "multi",
    "autoOptimize": true,
    "enableContext": true,
    "logLevel": "info",
    "enableMonitoring": true,
    "agents": {
      "default": "通用助手"
    }
  }
}
```

### 步骤 2: 读取配置并初始化

```typescript
// config.ts
import { readFileSync } from 'fs';
import { initializeGlobal } from 'ai-prompt-framework';

// 读取配置文件
const config = JSON.parse(
  readFileSync('./ai-prompt.config.json', 'utf-8')
);

// 初始化
initializeGlobal(config.aiPromptFramework);
```

---

## 📦 方案三：环境变量方式

### 步骤 1: 设置环境变量

```bash
# .env 文件
AI_PROMPT_ENABLED=true
AI_PROMPT_MODE=multi
AI_PROMPT_AUTO_OPTIMIZE=true
AI_PROMPT_ENABLE_CONTEXT=true
AI_PROMPT_LOG_LEVEL=info
```

### 步骤 2: 读取环境变量

```typescript
// config.ts
import { initializeGlobal } from 'ai-prompt-framework';

initializeGlobal({
  enabled: process.env.AI_PROMPT_ENABLED === 'true',
  mode: process.env.AI_PROMPT_MODE as 'single' | 'multi' | 'hybrid',
  autoOptimize: process.env.AI_PROMPT_AUTO_OPTIMIZE === 'true',
  enableContext: process.env.AI_PROMPT_ENABLE_CONTEXT === 'true',
  logLevel: process.env.AI_PROMPT_LOG_LEVEL as any
});
```

---

## 🔧 实际集成示例

### 示例 1: Web 应用（Express）

```typescript
// app.ts
import express from 'express';
import { initializeGlobal, askAI } from 'ai-prompt-framework';

// 初始化框架
initializeGlobal({
  enabled: true,
  mode: 'multi',
  autoOptimize: true
});

const app = express();

// API 端点
app.post('/api/chat', async (req, res) => {
  const { question } = req.body;
  
  // 自动使用提示词工程
  const answer = await askAI(question);
  
  res.json({ answer });
});

app.listen(3000, () => {
  console.log('✅ 服务器已启动，AI 提示词工程已启用');
});
```

### 示例 2: Electron 应用

```typescript
// main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import { initializeGlobal, askAI } from 'ai-prompt-framework';

// 在应用启动时初始化
app.whenReady().then(() => {
  initializeGlobal({
    enabled: true,
    mode: 'multi'
  });
  
  console.log('✅ AI 提示词工程已启用');
});

// IPC 通信
ipcMain.handle('ask-ai', async (event, question) => {
  return await askAI(question);
});
```

### 示例 3: React 应用

```typescript
// App.tsx
import { useEffect, useState } from 'react';
import { askAI } from 'ai-prompt-framework';

function App() {
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    // 在应用加载时初始化
    import('ai-prompt-framework').then(({ initializeGlobal }) => {
      initializeGlobal({ mode: 'multi' });
    });
  }, []);

  const handleAsk = async (question: string) => {
    const result = await askAI(question);
    setAnswer(result);
  };

  return (
    <div>
      <button onClick={() => handleAsk('问题')}>
        提问
      </button>
      <p>{answer}</p>
    </div>
  );
}
```

### 示例 4: VS Code 扩展

```typescript
// extension.ts
import * as vscode from 'vscode';
import { initializeGlobal, askAI } from 'ai-prompt-framework';

export function activate(context: vscode.ExtensionContext) {
  // 初始化框架
  initializeGlobal({
    enabled: true,
    mode: 'multi',
    logLevel: 'warn'
  });

  // 注册命令
  const disposable = vscode.commands.registerCommand(
    'extension.askAI',
    async () => {
      const question = await vscode.window.showInputBox({
        prompt: '请输入问题'
      });

      if (question) {
        const answer = await askAI(question);
        vscode.window.showInformationMessage(answer);
      }
    }
  );

  context.subscriptions.push(disposable);
}
```

---

## 🧪 验证是否在使用

### 方法 1: 运行测试脚本

```bash
npm run test-framework
```

### 方法 2: 查看日志

```typescript
import { getAIStats } from 'ai-prompt-framework';

// 查看统计信息
const stats = getAIStats();
console.log('优化率:', stats.optimizationRate + '%');
console.log('智能体使用:', stats.agentUsage);
```

### 方法 3: 检查配置

```typescript
import { createGlobalAIPromptSystem } from 'ai-prompt-framework';

const system = createGlobalAIPromptSystem();
const config = system.getConfig();

console.log('是否启用:', config.enabled);
console.log('运行模式:', config.mode);
```

---

## 📊 性能监控

### 实时监控

```typescript
import { getAIStats } from 'ai-prompt-framework';

// 每分钟输出一次统计
setInterval(() => {
  const stats = getAIStats();
  console.log('📊 AI 提示词工程统计:');
  console.log(`   总查询: ${stats.totalQueries}`);
  console.log(`   优化率: ${stats.optimizationRate.toFixed(1)}%`);
  console.log(`   平均耗时: ${stats.averageDuration.toFixed(0)}ms`);
}, 60000);
```

---

## 🎛️ 动态配置

### 运行时更新配置

```typescript
import { createGlobalAIPromptSystem } from 'ai-prompt-framework';

const system = createGlobalAIPromptSystem();

// 动态切换模式
system.updateConfig({
  mode: 'single'  // 切换到单一智能体模式
});

// 动态禁用
system.updateConfig({
  enabled: false
});

// 动态启用
system.updateConfig({
  enabled: true,
  mode: 'multi'
});
```

---

## 🔍 故障排查

### 问题 1: 没有使用提示词优化

**检查**:
```typescript
const config = system.getConfig();
if (!config.enabled) {
  console.log('框架未启用');
}
if (!config.autoOptimize) {
  console.log('自动优化未启用');
}
```

### 问题 2: 智能体路由不正确

**检查**:
```typescript
const result = await system.ask('代码问题');
console.log('使用的智能体:', result.metadata.agent);
console.log('置信度:', result.metadata.confidence);
```

### 问题 3: 性能问题

**检查**:
```typescript
const stats = system.getStats();
if (stats.averageDuration > 1000) {
  console.log('警告: 平均响应时间过长');
}
```

---

## 📝 最佳实践

### 1. 在软件启动时初始化

```typescript
// ✅ 推荐
import { initializeGlobal } from 'ai-prompt-framework';
initializeGlobal({ mode: 'multi' });

// ❌ 不推荐（每次调用都初始化）
async function ask(question) {
  initializeGlobal();  // 不要这样做
  return askAI(question);
}
```

### 2. 使用合适的模式

- **单一模式**: 简单应用，快速响应
- **多智能体模式**: 企业应用，高质量回答
- **混合模式**: 灵活场景

### 3. 监控性能

```typescript
// 定期检查统计信息
const stats = getAIStats();
if (stats.optimizationRate < 90) {
  console.warn('优化率偏低，检查配置');
}
```

---

## ✅ 验证清单

- [ ] 已在软件入口初始化框架
- [ ] 配置文件已正确设置
- [ ] 所有 AI 调用都使用 `askAI()` 函数
- [ ] 统计信息显示优化率 > 90%
- [ ] 日志显示框架已启用
- [ ] 测试脚本运行成功

---

## 🎉 完成！

现在您的整个软件都会自动使用 AI 提示词工程优化！

每次提问都会：
- ✅ 自动优化提示词
- ✅ 自动选择合适的智能体
- ✅ 记录上下文
- ✅ 收集性能数据

**运行测试验证**:
```bash
npm run test-framework
```
