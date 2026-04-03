# 📱 移动端 API 文档

> **适配移动端的完整API文档** - 支持iOS、Android、React Native、Flutter等移动端开发

---

## 📋 目录

- [快速开始](#快速开始)
- [认证](#认证)
- [API端点](#api端点)
- [SDK使用](#sdk使用)
- [最佳实践](#最佳实践)
- [错误处理](#错误处理)
- [性能优化](#性能优化)

---

## 🚀 快速开始

### 基础URL

```
https://api.ai-prompt.dev/v2
```

### 移动端优化特性

✅ **轻量级响应** - 优化的JSON结构，减少数据传输  
✅ **压缩支持** - 自动Gzip压缩，节省流量  
✅ **离线缓存** - 支持本地缓存策略  
✅ **流式传输** - 实时流式响应，提升用户体验  
✅ **速率限制** - 智能限流保护  

---

## 🔐 认证

### API Key认证

```http
Authorization: Bearer YOUR_API_KEY
```

### 获取API Key

1. 注册账号：https://ai-prompt.dev/register
2. 创建应用：Dashboard → Applications → Create New
3. 获取密钥：Applications → Your App → API Keys

### 移动端安全建议

⚠️ **重要**：不要在客户端代码中硬编码API Key

**推荐方案**：
- 使用后端代理服务
- 实现Token刷新机制
- 使用环境变量存储密钥

---

## 📡 API端点

### 1. 健康检查

**GET** `/health`

检查服务状态，适合移动端启动时调用。

**响应示例**：
```json
{
  "status": "healthy",
  "timestamp": "2026-04-03T12:00:00Z",
  "version": "2.0.0",
  "uptime": 86400
}
```

**移动端使用**：
```typescript
// 启动时检查
const health = await client.healthCheck();
if (!health.success) {
  // 显示离线提示
  showOfflineMessage();
}
```

---

### 2. Prompt管理

#### 获取Prompt列表

**GET** `/api/prompts`

**查询参数**：
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20，最大100）
- `tag`: 标签筛选

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": "prompt_123",
      "name": "翻译助手",
      "content": "将以下文本翻译为{{target_language}}：{{text}}",
      "variables": {
        "target_language": "英语",
        "text": ""
      },
      "created_at": "2026-04-03T12:00:00Z"
    }
  ],
  "count": 1,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

#### 创建Prompt

**POST** `/api/prompts`

**请求体**：
```json
{
  "name": "我的Prompt",
  "content": "模板内容 {{variable}}",
  "variables": {
    "variable": "默认值"
  }
}
```

---

### 3. 文本补全

**POST** `/api/complete`

**请求体**：
```json
{
  "prompt": "解释量子计算",
  "provider": "claude",
  "model": "claude-3-opus",
  "options": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "completion_123",
    "content": "量子计算是...",
    "model": "claude-3-opus",
    "tokens": {
      "input": 10,
      "output": 500
    },
    "finish_reason": "stop"
  }
}
```

**移动端示例**：
```typescript
const response = await client.complete({
  prompt: '解释量子计算',
  provider: 'claude',
  options: {
    temperature: 0.7,
    max_tokens: 500 // 移动端建议限制token数
  }
});

if (response.success) {
  displayResult(response.data.content);
}
```

---

### 4. 流式补全（推荐）

**POST** `/api/stream`

适合移动端实时显示，提升用户体验。

**请求体**：同`/api/complete`

**响应格式**：Server-Sent Events (SSE)

```
data: {"content": "量"}
data: {"content": "子"}
data: {"content": "计"}
data: {"content": "算"}
data: [DONE]
```

**移动端示例**：
```typescript
// React Native示例
const streamResponse = await client.stream({
  prompt: '写一首诗',
  provider: 'claude'
});

let fullText = '';
for await (const chunk of streamResponse) {
  fullText += chunk;
  updateUI(fullText); // 实时更新UI
}
```

---

### 5. 智能体API

#### ReAct推理

**POST** `/api/agents/react`

**请求体**：
```json
{
  "question": "北京今天天气如何？",
  "tools": [
    {
      "name": "weather",
      "description": "获取天气信息",
      "parameters": {
        "city": "string"
      }
    }
  ]
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "answer": "北京今天晴，温度25°C",
    "steps": [
      {
        "thought": "需要查询天气",
        "action": "weather",
        "observation": "北京：晴，25°C"
      }
    ]
  }
}
```

#### Tree of Thoughts推理

**POST** `/api/agents/tot`

**请求体**：
```json
{
  "problem": "如何优化移动应用性能？",
  "config": {
    "max_depth": 3,
    "branching_factor": 2,
    "search_strategy": "best_first"
  }
}
```

---

### 6. 统计信息

**GET** `/api/stats`

获取使用统计和成本信息。

**响应示例**：
```json
{
  "success": true,
  "data": {
    "cache": {
      "hit_rate": 0.45,
      "size": 1024
    },
    "costs": {
      "total": 12.50,
      "today": 1.20
    },
    "requests": {
      "total": 1000,
      "today": 50
    }
  }
}
```

---

## 📦 SDK使用

### JavaScript/TypeScript SDK

#### 安装

```bash
npm install @ai-prompt/sdk
# 或
yarn add @ai-prompt/sdk
```

#### 初始化

```typescript
import { AIPromptClient } from '@ai-prompt/sdk';

const client = new AIPromptClient({
  baseUrl: 'https://api.ai-prompt.dev/v2',
  apiKey: 'your-api-key',
  timeout: 30000
});
```

#### 基础使用

```typescript
// 文本补全
const result = await client.complete({
  prompt: '你好，世界！',
  provider: 'claude'
});

// 流式补全
const stream = await client.stream({
  prompt: '讲个故事',
  provider: 'openai'
});

for await (const chunk of stream) {
  console.log(chunk);
}

// ReAct推理
const reactResult = await client.executeReAct({
  question: '今天新闻',
  tools: [newsTool]
});
```

---

### React Native示例

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { AIPromptClient } from '@ai-prompt/sdk';

const client = new AIPromptClient({
  baseUrl: 'https://api.ai-prompt.dev/v2',
  apiKey: 'your-api-key'
});

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setResponse('');

    try {
      // 使用流式响应提升体验
      const stream = await client.stream({
        prompt: input,
        provider: 'claude',
        options: {
          max_tokens: 500
        }
      });

      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setResponse(fullText);
      }
    } catch (error) {
      setResponse('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="输入你的问题..."
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button
        title={loading ? "处理中..." : "发送"}
        onPress={handleSubmit}
        disabled={loading}
      />
      <Text style={{ marginTop: 20 }}>{response}</Text>
    </View>
  );
}
```

---

### Flutter示例

```dart
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

class AIPromptClient {
  final Dio _dio;
  
  AIPromptClient(String baseUrl, String apiKey) 
    : _dio = Dio(BaseOptions(
        baseUrl: baseUrl,
        headers: {'Authorization': 'Bearer $apiKey'},
      ));

  Future<Map<String, dynamic>> complete(Map<String, dynamic> request) async {
    final response = await _dio.post('/api/complete', data: request);
    return response.data;
  }

  Stream<String> stream(Map<String, dynamic> request) async* {
    final response = await _dio.post(
      '/api/stream',
      data: request,
      options: Options(responseType: ResponseType.stream),
    );

    await for (final chunk in response.data.stream) {
      final text = String.fromCharCodes(chunk);
      if (text.startsWith('data: ') && text != 'data: [DONE]\n') {
        final json = jsonDecode(text.substring(6));
        if (json['content'] != null) {
          yield json['content'];
        }
      }
    }
  }
}

// 使用示例
class ChatScreen extends StatefulWidget {
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final client = AIPromptClient('https://api.ai-prompt.dev/v2', 'your-key');
  final TextEditingController _controller = TextEditingController();
  String _response = '';

  Future<void> _handleSubmit() async {
    setState(() => _response = '');

    await for (final chunk in client.stream({
      'prompt': _controller.text,
      'provider': 'claude',
    })) {
      setState(() => _response += chunk);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('AI Chat')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(controller: _controller),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _handleSubmit,
              child: Text('发送'),
            ),
            SizedBox(height: 16),
            Text(_response),
          ],
        ),
      ),
    );
  }
}
```

---

## 💡 最佳实践

### 1. 移动端性能优化

#### 限制Token数量

```typescript
// ✅ 推荐：移动端限制token数
await client.complete({
  prompt: '简短解释',
  options: {
    max_tokens: 200 // 移动端建议200-500
  }
});

// ❌ 不推荐：无限制
await client.complete({
  prompt: '详细解释'
});
```

#### 使用缓存

```typescript
// 启用本地缓存
const cachedResponse = localStorage.getItem(cacheKey);
if (cachedResponse) {
  return JSON.parse(cachedResponse);
}

const response = await client.complete(request);
localStorage.setItem(cacheKey, JSON.stringify(response));
```

#### 批量请求

```typescript
// ✅ 推荐：批量处理
const prompts = ['问题1', '问题2', '问题3'];
const responses = await Promise.all(
  prompts.map(p => client.complete({ prompt: p }))
);

// ❌ 不推荐：串行处理
for (const prompt of prompts) {
  await client.complete({ prompt });
}
```

---

### 2. 错误处理

```typescript
try {
  const response = await client.complete(request);
  
  if (!response.success) {
    // 处理业务错误
    if (response.error === 'Rate limit exceeded') {
      showRateLimitWarning();
    } else {
      showError(response.error);
    }
    return;
  }
  
  // 成功处理
  displayResult(response.data);
} catch (error) {
  // 处理网络错误
  if (error.name === 'NetworkError') {
    showOfflineMessage();
  } else {
    showGenericError();
  }
}
```

---

### 3. 离线支持

```typescript
// 检测网络状态
const isOnline = navigator.onLine;

if (!isOnline) {
  // 使用本地缓存
  const cached = await getCachedResponse(prompt);
  if (cached) {
    return cached;
  }
  
  showOfflineMessage();
  return;
}

// 在线请求
const response = await client.complete(request);

// 缓存响应
await cacheResponse(prompt, response);
```

---

### 4. 速率限制处理

```typescript
const response = await client.complete(request);

if (!response.success && response.error === 'Rate limit exceeded') {
  // 指数退避重试
  const retryAfter = response.retryAfter || 60;
  await sleep(retryAfter * 1000);
  
  // 重试请求
  return await client.complete(request);
}
```

---

## ⚠️ 错误处理

### 错误码

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求体格式 |
| 401 | 认证失败 | 检查API Key |
| 403 | 权限不足 | 检查账户权限 |
| 429 | 请求过于频繁 | 实现重试机制 |
| 500 | 服务器错误 | 稍后重试 |
| 503 | 服务不可用 | 检查健康状态 |

### 错误响应格式

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit of 100 requests per minute",
  "retryAfter": 30
}
```

---

## 🚄 性能优化

### 1. 响应压缩

API自动支持Gzip压缩，移动端无需额外配置。

### 2. 连接复用

使用HTTP/2或Keep-Alive复用连接。

### 3. 请求优化

```typescript
// ✅ 使用流式响应
const stream = await client.stream(request);

// ✅ 批量请求
const responses = await Promise.all(requests);

// ✅ 取消不必要的请求
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
```

### 4. 缓存策略

```typescript
// 实现智能缓存
const cacheStrategy = {
  exact: {
    ttl: 3600, // 1小时
    maxSize: 100
  },
  semantic: {
    ttl: 7200, // 2小时
    threshold: 0.95
  }
};
```

---

## 📊 监控与分析

### 使用统计

```typescript
const stats = await client.getStats();

console.log('缓存命中率:', stats.data.cache.hit_rate);
console.log('今日成本:', stats.data.costs.today);
console.log('请求总数:', stats.data.requests.total);
```

### 性能监控

```typescript
const start = Date.now();
const response = await client.complete(request);
const duration = Date.now() - start;

// 上报性能数据
reportMetrics({
  endpoint: '/api/complete',
  duration,
  success: response.success
});
```

---

## 🔗 相关资源

- [JavaScript SDK文档](file:///c:/Users/X1882/Desktop/github/ai-prompt/sdk/javascript)
- [API参考文档](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/API_REFERENCE.md)
- [最佳实践指南](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/BEST_PRACTICES.md)
- [常见问题](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/FAQ.md)

---

## 📞 技术支持

- **文档**：https://docs.ai-prompt.dev
- **GitHub**：https://github.com/your-org/ai-prompt-framework
- **Discord**：https://discord.gg/ai-prompt
- **Email**：support@ai-prompt.dev

---

*文档版本：v2.0.0*  
*最后更新：2026-04-03*  
*适配平台：iOS, Android, React Native, Flutter, Web*
