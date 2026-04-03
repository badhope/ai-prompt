# 📱 移动端快速开始指南

> **5分钟在移动端集成AI Prompt Framework** - 专为移动开发者优化

---

## 🎯 适用平台

- ✅ React Native
- ✅ Flutter
- ✅ iOS (Swift)
- ✅ Android (Kotlin)
- ✅ Web (PWA)

---

## 📦 快速集成

### React Native

#### 1. 安装SDK

```bash
npm install @ai-prompt/sdk
# 或
yarn add @ai-prompt/sdk
```

#### 2. 初始化客户端

```typescript
import { AIPromptClient } from '@ai-prompt/sdk';

const client = new AIPromptClient({
  baseUrl: 'https://api.ai-prompt.dev/v2',
  apiKey: 'your-api-key', // 建议通过后端代理获取
  timeout: 30000
});
```

#### 3. 基础使用

```typescript
// 简单补全
const response = await client.complete({
  prompt: '你好，AI！',
  provider: 'claude',
  options: {
    max_tokens: 200
  }
});

if (response.success) {
  console.log(response.data.content);
}
```

#### 4. 流式响应（推荐）

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';

export default function ChatApp() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');

  const handleSend = async () => {
    setResponse('');
    
    try {
      const stream = await client.stream({
        prompt: input,
        provider: 'claude',
        options: { max_tokens: 500 }
      });

      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setResponse(fullText); // 实时更新UI
      }
    } catch (error) {
      setResponse('Error: ' + error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="输入消息..."
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button title="发送" onPress={handleSend} />
      <Text style={{ marginTop: 20 }}>{response}</Text>
    </View>
  );
}
```

---

### Flutter

#### 1. 添加依赖

```yaml
# pubspec.yaml
dependencies:
  dio: ^5.0.0
```

#### 2. 创建客户端

```dart
import 'package:dio/dio.dart';

class AIPromptClient {
  final Dio _dio;
  
  AIPromptClient(String baseUrl, String apiKey) 
    : _dio = Dio(BaseOptions(
        baseUrl: baseUrl,
        headers: {'Authorization': 'Bearer $apiKey'},
        connectTimeout: Duration(seconds: 30),
        receiveTimeout: Duration(seconds: 30),
      ));

  Future<Map<String, dynamic>> complete(Map<String, dynamic> request) async {
    try {
      final response = await _dio.post('/api/complete', data: request);
      return response.data;
    } catch (e) {
      throw Exception('请求失败: $e');
    }
  }

  Stream<String> stream(Map<String, dynamic> request) async* {
    try {
      final response = await _dio.post(
        '/api/stream',
        data: request,
        options: Options(responseType: ResponseType.stream),
      );

      await for (final chunk in response.data.stream) {
        final text = String.fromCharCodes(chunk);
        final lines = text.split('\n');
        
        for (final line in lines) {
          if (line.startsWith('data: ') && line != 'data: [DONE]') {
            try {
              final json = jsonDecode(line.substring(6));
              if (json['content'] != null) {
                yield json['content'];
              }
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      throw Exception('流式请求失败: $e');
    }
  }
}
```

#### 3. 使用示例

```dart
import 'package:flutter/material.dart';

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: ChatScreen(),
    );
  }
}

class ChatScreen extends StatefulWidget {
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final client = AIPromptClient('https://api.ai-prompt.dev/v2', 'your-key');
  final TextEditingController _controller = TextEditingController();
  String _response = '';
  bool _loading = false;

  Future<void> _sendMessage() async {
    setState(() {
      _loading = true;
      _response = '';
    });

    try {
      await for (final chunk in client.stream({
        'prompt': _controller.text,
        'provider': 'claude',
        'options': {'max_tokens': 500},
      })) {
        setState(() {
          _response += chunk;
        });
      }
    } catch (e) {
      setState(() {
        _response = '错误: $e';
      });
    } finally {
      setState(() {
        _loading = false;
      });
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
            TextField(
              controller: _controller,
              decoration: InputDecoration(
                hintText: '输入消息...',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loading ? null : _sendMessage,
              child: Text(_loading ? '处理中...' : '发送'),
            ),
            SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                child: Text(_response),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

### iOS (Swift)

#### 1. 使用URLSession

```swift
import Foundation

class AIPromptClient {
    private let baseURL: String
    private let apiKey: String
    
    init(baseURL: String, apiKey: String) {
        self.baseURL = baseURL
        self.apiKey = apiKey
    }
    
    func complete(prompt: String, completion: @escaping (Result<String, Error>) -> Void) {
        let url = URL(string: "\(baseURL)/api/complete")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        
        let body: [String: Any] = [
            "prompt": prompt,
            "provider": "claude",
            "options": ["max_tokens": 500]
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let success = json["success"] as? Bool,
                  success,
                  let result = json["data"] as? [String: Any],
                  let content = result["content"] as? String else {
                completion(.failure(NSError(domain: "API Error", code: -1)))
                return
            }
            
            completion(.success(content))
        }.resume()
    }
}
```

#### 2. SwiftUI示例

```swift
import SwiftUI

struct ChatView: View {
    @State private var input: String = ""
    @State private var response: String = ""
    @State private var isLoading: Bool = false
    
    private let client = AIPromptClient(
        baseURL: "https://api.ai-prompt.dev/v2",
        apiKey: "your-api-key"
    )
    
    var body: some View {
        VStack(spacing: 20) {
            TextField("输入消息...", text: $input)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()
            
            Button(action: sendMessage) {
                if isLoading {
                    ProgressView()
                } else {
                    Text("发送")
                }
            }
            .disabled(input.isEmpty || isLoading)
            .padding()
            
            ScrollView {
                Text(response)
                    .padding()
            }
        }
    }
    
    func sendMessage() {
        isLoading = true
        response = ""
        
        client.complete(prompt: input) { result in
            DispatchQueue.main.async {
                isLoading = false
                
                switch result {
                case .success(let content):
                    response = content
                case .failure(let error):
                    response = "错误: \(error.localizedDescription)"
                }
            }
        }
    }
}
```

---

### Android (Kotlin)

#### 1. 使用OkHttp

```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class AIPromptClient(
    private val baseURL: String,
    private val apiKey: String
) {
    private val client = OkHttpClient()
    private val JSON = "application/json; charset=utf-8".toMediaType()
    
    fun complete(prompt: String, callback: (Result<String>) -> Unit) {
        val json = JSONObject().apply {
            put("prompt", prompt)
            put("provider", "claude")
            put("options", JSONObject().apply {
                put("max_tokens", 500)
            })
        }
        
        val body = json.toString().toRequestBody(JSON)
        val request = Request.Builder()
            .url("$baseURL/api/complete")
            .post(body)
            .addHeader("Authorization", "Bearer $apiKey")
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(e))
            }
            
            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) {
                        callback(Result.failure(Exception("HTTP ${response.code}")))
                        return
                    }
                    
                    val responseBody = response.body?.string()
                    val json = JSONObject(responseBody)
                    
                    if (json.getBoolean("success")) {
                        val content = json.getJSONObject("data").getString("content")
                        callback(Result.success(content))
                    } else {
                        callback(Result.failure(Exception(json.getString("error"))))
                    }
                }
            }
        })
    }
}
```

#### 2. Jetpack Compose示例

```kotlin
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ChatScreen() {
    var input by remember { mutableStateOf("") }
    var response by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    
    val client = remember {
        AIPromptClient(
            baseURL = "https://api.ai-prompt.dev/v2",
            apiKey = "your-api-key"
        )
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        OutlinedTextField(
            value = input,
            onValueChange = { input = it },
            label = { Text("输入消息...") },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(
            onClick = {
                isLoading = true
                response = ""
                
                client.complete(input) { result ->
                    isLoading = false
                    
                    result.onSuccess { content ->
                        response = content
                    }.onFailure { error ->
                        response = "错误: ${error.message}"
                    }
                }
            },
            enabled = input.isNotEmpty() && !isLoading,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Text("发送")
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = response,
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .verticalScroll(rememberScrollState())
        )
    }
}
```

---

## 🎨 UI最佳实践

### 1. 加载状态

```typescript
// ✅ 推荐：显示加载状态
const [loading, setLoading] = useState(false);

const handleSend = async () => {
  setLoading(true);
  try {
    const response = await client.complete({ prompt: input });
    // 处理响应
  } finally {
    setLoading(false);
  }
};

// UI
<Button disabled={loading}>
  {loading ? <Spinner /> : '发送'}
</Button>
```

### 2. 错误处理

```typescript
// ✅ 推荐：友好的错误提示
const [error, setError] = useState<string | null>(null);

try {
  const response = await client.complete({ prompt: input });
  if (!response.success) {
    setError(response.error || '请求失败');
    return;
  }
  // 处理成功响应
} catch (err) {
  setError('网络错误，请检查连接');
}

// UI
{error && (
  <View style={styles.errorBanner}>
    <Text style={styles.errorText}>{error}</Text>
    <Button title="重试" onPress={handleRetry} />
  </View>
)}
```

### 3. 离线支持

```typescript
// ✅ 推荐：离线检测
import NetInfo from '@react-native-community/netinfo';

const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsOnline(state.isConnected ?? false);
  });
  
  return () => unsubscribe();
}, []);

// 使用
if (!isOnline) {
  showOfflineMessage();
  return;
}
```

### 4. 响应式布局

```typescript
// ✅ 推荐：适配不同屏幕尺寸
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

const styles = StyleSheet.create({
  container: {
    padding: isTablet ? 24 : 16,
    maxWidth: isTablet ? 600 : '100%',
  },
  input: {
    fontSize: isTablet ? 18 : 16,
  }
});
```

---

## ⚡ 性能优化

### 1. 限制Token数量

```typescript
// ✅ 移动端建议限制token数
const response = await client.complete({
  prompt: input,
  options: {
    max_tokens: 200 // 移动端建议200-500
  }
});
```

### 2. 使用缓存

```typescript
// ✅ 实现本地缓存
import AsyncStorage from '@react-native-async-storage/async-storage';

const getCachedResponse = async (key: string) => {
  const cached = await AsyncStorage.getItem(key);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
};

const cacheResponse = async (key: string, data: any) => {
  await AsyncStorage.setItem(key, JSON.stringify(data));
};

// 使用
const cacheKey = `prompt_${hash(input)}`;
const cached = await getCachedResponse(cacheKey);
if (cached) {
  return cached;
}

const response = await client.complete({ prompt: input });
await cacheResponse(cacheKey, response);
```

### 3. 请求取消

```typescript
// ✅ 实现请求取消
const controller = new AbortController();

const handleCancel = () => {
  controller.abort();
};

// 在请求中使用
const response = await fetch(url, {
  signal: controller.signal
});
```

---

## 🔐 安全建议

### 1. API Key保护

```typescript
// ❌ 不要硬编码API Key
const client = new AIPromptClient({
  apiKey: 'sk-xxx' // 危险！
});

// ✅ 使用环境变量或后端代理
const client = new AIPromptClient({
  baseUrl: 'https://your-backend.com/api',
  // 后端处理API Key
});
```

### 2. 输入验证

```typescript
// ✅ 验证用户输入
const validateInput = (input: string): boolean => {
  if (!input || input.trim().length === 0) {
    return false;
  }
  if (input.length > 1000) {
    return false;
  }
  return true;
};

if (!validateInput(userInput)) {
  showError('输入无效');
  return;
}
```

---

## 📚 相关资源

- [移动端API文档](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/MOBILE_API.md)
- [交互式教程](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/TUTORIALS.md)
- [最佳实践](file:///c:/Users/X1882/Desktop/github/ai-prompt/docs/BEST_PRACTICES.md)
- [示例代码](https://github.com/your-org/ai-prompt-examples)

---

## 💬 获取帮助

- **文档**：https://docs.ai-prompt.dev
- **社区**：https://discord.gg/ai-prompt
- **GitHub**：https://github.com/your-org/ai-prompt-framework

---

*指南版本：v2.0.0*  
*最后更新：2026-04-03*  
*专为移动端优化*
