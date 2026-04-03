# 🚀 部署指南

> **AI Prompt Engineering Framework 部署文档** - v3.1.0

---

## 📋 目录

- [部署前准备](#部署前准备)
- [部署方式](#部署方式)
- [环境配置](#环境配置)
- [监控与日志](#监控与日志)
- [故障排查](#故障排查)

---

## 🎯 部署前准备

### 系统要求

| 组件 | 要求 |
|------|------|
| Node.js | 18+ |
| npm | 9+ |
| Docker | 20+ |
| Docker Compose | 2+ |
| 内存 | 最低 512MB |
| 存储 | 最低 1GB |

### 必需的密钥

```bash
# API密钥
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# Docker Hub（可选）
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password

# NPM（可选）
NPM_TOKEN=your-npm-token

# Snyk（可选）
SNYK_TOKEN=your-snyk-token
```

---

## 🚀 部署方式

### 方式1：Docker Compose（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/badhope/ai-prompt.git
cd ai-prompt

# 2. 配置环境变量
cp .env.example .env
nano .env

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 检查状态
docker-compose ps
```

**服务访问**:
- 应用: http://localhost:3000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

### 方式2：Docker 单独部署

```bash
# 1. 构建镜像
docker build -t ai-prompt-framework:latest .

# 2. 运行容器
docker run -d \
  --name ai-prompt-framework \
  -p 3000:3000 \
  -e OPENAI_API_KEY=sk-... \
  -e CLAUDE_API_KEY=sk-ant-... \
  -v $(pwd)/data:/app/data \
  ai-prompt-framework:latest

# 3. 查看日志
docker logs -f ai-prompt-framework
```

### 方式3：NPM 包部署

```bash
# 1. 安装依赖
npm install ai-prompt-framework

# 2. 创建配置文件
touch prompt.config.js

# 3. 编写启动脚本
cat > server.js << EOF
const { PromptFramework } = require('ai-prompt-framework');

const framework = new PromptFramework({
  providers: {
    openaiApiKey: process.env.OPENAI_API_KEY
  }
});

// 启动服务...
EOF

# 4. 运行
node server.js
```

### 方式4：源码部署

```bash
# 1. 克隆仓库
git clone https://github.com/badhope/ai-prompt.git
cd ai-prompt

# 2. 安装依赖
npm install

# 3. 构建
npm run build

# 4. 配置环境变量
export OPENAI_API_KEY=sk-...
export CLAUDE_API_KEY=sk-ant-...

# 5. 运行
npm start
```

---

## ⚙️ 环境配置

### 基础配置

```env
# 应用配置
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# 数据库
DATABASE_URL=/app/data/prompts.db

# API密钥
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

### 安全配置

```env
# 安全
ENABLE_INJECTION_DETECTION=true
ENABLE_PII_FILTER=true
MAX_INPUT_LENGTH=10000

# 认证
AUTH_TYPE=api-key
JWT_SECRET=your-jwt-secret
```

### 性能配置

```env
# 缓存
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# 限流
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100

# 预算
DAILY_BUDGET=100
MONTHLY_BUDGET=1000
```

### 监控配置

```env
# Prometheus
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090

# Grafana
GRAFANA_ENABLED=true
GRAFANA_PORT=3001

# 日志
LOG_FORMAT=json
LOG_OUTPUT=file
LOG_FILE=/app/logs/app.log
```

---

## 📊 监控与日志

### 健康检查

```bash
# 检查应用状态
curl http://localhost:3000/health

# 检查Prometheus
curl http://localhost:9090/-/healthy

# 检查Grafana
curl http://localhost:3001/api/health
```

### 日志查看

```bash
# Docker Compose日志
docker-compose logs -f ai-prompt-framework

# Docker日志
docker logs -f ai-prompt-framework

# 应用日志
tail -f logs/app.log
```

### Prometheus指标

访问 `http://localhost:9090` 查看指标:

- `ai_prompt_requests_total` - 总请求数
- `ai_prompt_duration_seconds` - 请求持续时间
- `ai_prompt_errors_total` - 错误总数
- `ai_prompt_cost_total` - 总成本

### Grafana仪表板

1. 访问 `http://localhost:3001`
2. 登录 (admin/admin)
3. 添加数据源: Prometheus
4. 导入仪表板: `grafana-dashboard.json`

---

## 🔧 故障排查

### 常见问题

#### 1. 容器无法启动

```bash
# 检查日志
docker-compose logs ai-prompt-framework

# 检查配置
docker-compose config

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

#### 2. API密钥无效

```bash
# 验证环境变量
docker-compose exec ai-prompt-framework env | grep API_KEY

# 更新配置
nano .env
docker-compose restart
```

#### 3. 数据库错误

```bash
# 检查数据库文件
ls -la data/prompts.db

# 重建数据库
rm data/prompts.db
docker-compose restart
```

#### 4. 内存不足

```bash
# 检查内存使用
docker stats ai-prompt-framework

# 增加内存限制
docker-compose.yml:
  services:
    ai-prompt-framework:
      deploy:
        resources:
          limits:
            memory: 1G
```

#### 5. 网络问题

```bash
# 检查网络
docker network ls
docker network inspect ai-prompt-network

# 重建网络
docker-compose down
docker-compose up -d
```

---

## 🔄 更新与维护

### 更新应用

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建
docker-compose build

# 3. 重启服务
docker-compose up -d
```

### 备份数据

```bash
# 备份数据库
cp data/prompts.db data/prompts.db.backup

# 备份日志
tar -czf logs-backup.tar.gz logs/
```

### 清理资源

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的卷
docker volume prune
```

---

## 📈 性能优化

### 生产环境建议

1. **资源限制**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
       reservations:
         cpus: '1'
         memory: 1G
   ```

2. **健康检查**
   ```yaml
   healthcheck:
     test: ["CMD", "node", "-e", "..."]
     interval: 30s
     timeout: 10s
     retries: 3
     start_period: 40s
   ```

3. **日志轮转**
   ```yaml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

4. **安全配置**
   ```yaml
   security_opt:
     - no-new-privileges:true
   read_only: true
   ```

---

## 🎯 检查清单

部署前检查:

- [ ] 环境变量已配置
- [ ] API密钥已设置
- [ ] 数据目录已创建
- [ ] 端口未被占用
- [ ] Docker已安装
- [ ] 网络已配置

部署后检查:

- [ ] 服务正常运行
- [ ] 健康检查通过
- [ ] 日志无错误
- [ ] 监控正常
- [ ] API可访问

---

## 📞 支持

遇到问题？

1. 查看 [故障排查](#故障排查) 部分
2. 检查 [GitHub Issues](https://github.com/badhope/ai-prompt/issues)
3. 阅读 [文档](./docs/)
4. 提交新 Issue

---

*最后更新: 2026-04-03 • 版本 3.1.0*
