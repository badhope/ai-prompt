# 贡献指南

感谢你对 AI Prompt Framework 项目的兴趣!我们欢迎各种形式的贡献,包括 bug 修复、功能增强、文档改进等。

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交 Pull Request](#提交-pull-request)
- [报告 Bug](#报告-bug)
- [请求新功能](#请求新功能)

---

## 行为准则

请保持尊重和专业的态度。我们致力于营造一个开放、友好的社区环境。

---

## 如何贡献

### 1. Fork 项目

点击 GitHub 页面右上角的 "Fork" 按钮。

### 2. 克隆仓库

```bash
git clone https://github.com/YOUR_USERNAME/ai-prompt.git
cd ai-prompt
```

### 3. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 4. 进行修改

遵循[代码规范](#代码规范)进行开发。

### 5. 运行测试

```bash
npm test
npm run test:coverage
```

确保所有测试通过且覆盖率符合要求。

### 6. 提交更改

```bash
git add .
git commit -m "feat: add new feature"  # 遵循 Conventional Commits
```

### 7. 推送到你的 Fork

```bash
git push origin feature/your-feature-name
```

### 8. 创建 Pull Request

在 GitHub 上创建 Pull Request,描述你的更改。

---

## 开发环境设置

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
npm run build
```

### 运行测试

```bash
npm test           # 运行测试
npm run test:watch # 监听模式
npm run test:coverage # 查看覆盖率
```

### 代码检查

```bash
npm run lint       # 检查代码
npm run lint:fix   # 自动修复
npm run format     # 格式化代码
```

### 类型检查

```bash
npm run typecheck
```

---

## 代码规范

### TypeScript

- 开启严格模式,不使用 `any` 类型
- 为所有公共 API 添加类型注解
- 使用接口而非类型别名(除非必要)

### 命名规范

- 类和接口: PascalCase (`PromptFramework`, `ExecutionResult`)
- 函数和变量: camelCase (`createPrompt`, `executeAgent`)
- 常量: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- 文件名: kebab-case (`framework.test.ts`)

### 代码风格

- 使用 2 空格缩进
- 使用单引号
- 语句末尾加分号
- 最大行宽 100 字符

项目已配置 ESLint 和 Prettier,请运行 `npm run lint:fix` 和 `npm run format` 确保代码符合规范。

### 注释

- 为公共 API 添加 JSDoc 注释
- 解释复杂的业务逻辑
- 避免显而易见的注释

```typescript
/**
 * 创建新的提示词
 * @param config - 提示词配置
 * @returns 创建的提示词对象
 * @throws {ValidationError} 当 name 或 content 为空时
 */
async createPrompt(config: PromptConfig): Promise<Prompt> {
  // 验证输入
  if (!config.name || config.name.trim() === '') {
    throw new ValidationError('name', 'Prompt name cannot be empty');
  }
  // ...
}
```

### 测试

- 为新功能编写单元测试
- 覆盖边界条件和异常路径
- 测试文件命名为 `*.test.ts`
- 使用描述性的测试用例名称

```typescript
describe('PromptFramework', () => {
  describe('createPrompt', () => {
    it('should create a prompt with valid config', async () => {
      // 测试正常场景
    });

    it('should throw ValidationError when name is empty', async () => {
      // 测试边界条件
    });
  });
});
```

---

## 提交 Pull Request

### PR 标题

使用 Conventional Commits 格式:

```
<type>: <description>

Examples:
feat: add budget monitoring feature
fix: handle empty prompt name validation
docs: update API reference
test: add performance tests
```

**Type 类型:**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式(不影响功能)
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具链相关

### PR 描述

包含以下内容:

1. **更改类型**: feat / fix / docs / etc.
2. **背景**: 为什么需要这个更改
3. **实现**: 如何实现(如适用)
4. **测试**: 如何测试更改
5. **截图**: UI 更改的截图(如适用)

### 检查清单

在提交 PR 前,请确认:

- [ ] 代码遵循项目规范
- [ ] 添加了必要的测试
- [ ] 所有测试通过
- [ ] 更新了文档(如需要)
- [ ]  commits 遵循 Conventional Commits
- [ ] 没有合并冲突

---

## 报告 Bug

### 创建 Issue

1. 检查是否已有相同的 Issue
2. 使用 Bug Report 模板
3. 包含以下信息:
   - 清晰的标题
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息(Node.js 版本、操作系统等)
   - 代码示例(如可能)

### 示例

```markdown
**Bug**: createPrompt 不接受空字符串作为 name

**复现步骤**:
1. 调用 framework.createPrompt({ name: '', content: 'test' })
2. 观察行为

**预期行为**: 应该抛出 ValidationError

**实际行为**: 创建了 name 为空的提示词

**环境**:
- Node.js: 18.17.0
- OS: macOS 13.0
- Package version: 4.0.0
```

---

## 请求新功能

### 创建 Feature Request

1. 检查是否已有类似的功能请求
2. 使用 Feature Request 模板
3. 包含以下信息:
   - 清晰的标题
   - 功能描述
   - 使用场景
   - 可能的实现方案(可选)

### 示例

```markdown
**Feature**: 添加提示词导出功能

**描述**:
希望能够将提示词导出为 JSON 或 YAML 格式。

**使用场景**:
- 备份提示词
- 在不同环境间迁移
- 版本控制

**可能的实现**:
添加 exportPrompts(format: 'json' | 'yaml') 方法
```

---

## 发布流程

维护者将负责发布新版本。发布前会:

1. 更新 CHANGELOG.md
2.  bump 版本号(遵循语义化版本)
3. 运行完整测试套件
4. 构建并验证包
5. 发布到 NPM
6. 创建 Git Tag

---

## 联系方式

- GitHub Issues: 报告 bug 或请求功能
- GitHub Discussions: 一般讨论和问题

感谢你的贡献!
