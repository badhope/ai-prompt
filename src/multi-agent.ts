/**
 * 多智能体架构 - 统一调度系统
 * 
 * 将不同功能分配给专门的智能体，由主智能体统一调度
 */

import { PromptFramework } from './index';
import type { Agent, AgentConfig } from './types/framework';

export interface SpecializedAgent extends Agent {
  specialty: string;
  keywords: string[];
  priority: number;
}

export interface AgentTask {
  type: string;
  content: string;
  context?: any;
  preferredAgent?: string;
}

export interface AgentResponse {
  agentId: string;
  agentName: string;
  specialty: string;
  result: string;
  confidence: number;
  duration: number;
}

export class MultiAgentOrchestrator {
  private framework: PromptFramework;
  private agents: Map<string, SpecializedAgent> = new Map();
  private taskHistory: Array<{
    task: AgentTask;
    response: AgentResponse;
    timestamp: Date;
  }> = [];

  constructor() {
    this.framework = new PromptFramework();
    this.initializeAgents();
  }

  /**
   * 初始化专门的智能体
   */
  private async initializeAgents(): Promise<void> {
    // 代码专家
    await this.registerAgent({
      name: '代码专家',
      type: 'code-expert',
      specialty: 'code',
      keywords: ['代码', '编程', '函数', '类', 'bug', '调试', '优化', '重构', 'API'],
      priority: 10,
      systemPrompt: '你是资深软件工程师，精通多种编程语言和架构设计。',
      capabilities: ['code-review', 'debugging', 'optimization', 'refactoring']
    });

    // 文档专家
    await this.registerAgent({
      name: '文档专家',
      type: 'doc-expert',
      specialty: 'documentation',
      keywords: ['文档', '说明', 'README', '注释', '文档生成'],
      priority: 8,
      systemPrompt: '你是技术文档专家，擅长编写清晰、详细的技术文档。',
      capabilities: ['documentation', 'readme', 'api-docs']
    });

    // 测试专家
    await this.registerAgent({
      name: '测试专家',
      type: 'test-expert',
      specialty: 'testing',
      keywords: ['测试', '单元测试', '集成测试', '测试用例', '覆盖率'],
      priority: 8,
      systemPrompt: '你是测试专家，擅长编写全面的测试用例和测试策略。',
      capabilities: ['unit-tests', 'integration-tests', 'test-coverage']
    });

    // 翻译专家
    await this.registerAgent({
      name: '翻译专家',
      type: 'translation-expert',
      specialty: 'translation',
      keywords: ['翻译', '英文', '中文', '语言', '多语言'],
      priority: 7,
      systemPrompt: '你是专业翻译，精通多种语言，能准确传达原文含义。',
      capabilities: ['translation', 'localization']
    });

    // 数据分析专家
    await this.registerAgent({
      name: '数据分析专家',
      type: 'data-expert',
      specialty: 'analysis',
      keywords: ['分析', '数据', '统计', '报表', '可视化', '趋势'],
      priority: 8,
      systemPrompt: '你是数据分析师，擅长从数据中发现洞察和趋势。',
      capabilities: ['data-analysis', 'visualization', 'statistics']
    });

    // 架构设计专家
    await this.registerAgent({
      name: '架构设计专家',
      type: 'architecture-expert',
      specialty: 'architecture',
      keywords: ['架构', '设计', '系统', '微服务', '分布式', '性能'],
      priority: 9,
      systemPrompt: '你是系统架构师，擅长设计可扩展、高性能的系统架构。',
      capabilities: ['architecture-design', 'system-design', 'performance-optimization']
    });

    // 安全专家
    await this.registerAgent({
      name: '安全专家',
      type: 'security-expert',
      specialty: 'security',
      keywords: ['安全', '漏洞', '加密', '认证', '授权', '攻击'],
      priority: 9,
      systemPrompt: '你是安全专家，擅长识别和修复安全漏洞。',
      capabilities: ['security-audit', 'vulnerability-detection', 'encryption']
    });

    // 通用助手（后备）
    await this.registerAgent({
      name: '通用助手',
      type: 'general-assistant',
      specialty: 'general',
      keywords: [],
      priority: 1,
      systemPrompt: '你是友好的AI助手，可以处理各种通用问题。',
      capabilities: ['general-qa', 'chat', 'assistance']
    });
  }

  /**
   * 注册智能体
   */
  async registerAgent(config: AgentConfig & Partial<SpecializedAgent>): Promise<SpecializedAgent> {
    const agent = await this.framework.createAgent(config) as SpecializedAgent;
    
    agent.specialty = config.specialty || 'general';
    agent.keywords = config.keywords || [];
    agent.priority = config.priority || 1;
    
    this.agents.set(agent.id, agent);
    return agent;
  }

  /**
   * 分析任务并选择最佳智能体
   */
  selectBestAgent(task: AgentTask): SpecializedAgent {
    // 1. 如果指定了特定智能体，直接使用
    if (task.preferredAgent) {
      const agent = Array.from(this.agents.values())
        .find(a => a.name === task.preferredAgent || a.type === task.preferredAgent);
      if (agent) return agent;
    }

    // 2. 根据任务类型选择
    if (task.type) {
      const agent = Array.from(this.agents.values())
        .find(a => a.specialty === task.type);
      if (agent) return agent;
    }

    // 3. 根据关键词匹配
    const content = task.content.toLowerCase();
    let bestMatch: SpecializedAgent | null = null;
    let maxScore = 0;

    for (const agent of this.agents.values()) {
      let score = 0;
      
      // 关键词匹配
      for (const keyword of agent.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          score += 10;
        }
      }
      
      // 加上优先级权重
      score += agent.priority;
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = agent;
      }
    }

    // 4. 返回最佳匹配或通用助手
    return bestMatch || Array.from(this.agents.values())
      .find(a => a.specialty === 'general')!;
  }

  /**
   * 执行任务
   */
  async executeTask(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();
    
    // 选择最佳智能体
    const agent = this.selectBestAgent(task);
    
    // 执行任务
    const result = await this.framework.executeAgent(agent.id, {
      task: task.type,
      content: task.content,
      context: task.context
    }) as { result: string };

    const response: AgentResponse = {
      agentId: agent.id,
      agentName: agent.name,
      specialty: agent.specialty,
      result: result.result,
      confidence: this.calculateConfidence(task, agent),
      duration: Date.now() - startTime
    };

    // 记录历史
    this.taskHistory.push({
      task,
      response,
      timestamp: new Date()
    });

    return response;
  }

  /**
   * 批量执行任务
   */
  async executeBatch(tasks: AgentTask[]): Promise<AgentResponse[]> {
    return Promise.all(tasks.map(task => this.executeTask(task)));
  }

  /**
   * 获取智能体列表
   */
  getAgents(): SpecializedAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * 获取任务历史
   */
  getHistory(limit: number = 10): Array<{
    task: AgentTask;
    response: AgentResponse;
    timestamp: Date;
  }> {
    return this.taskHistory.slice(-limit);
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(task: AgentTask, agent: SpecializedAgent): number {
    let confidence = 0.5; // 基础置信度

    // 如果明确指定了智能体
    if (task.preferredAgent && 
        (agent.name === task.preferredAgent || agent.type === task.preferredAgent)) {
      confidence += 0.3;
    }

    // 如果任务类型匹配
    if (task.type && agent.specialty === task.type) {
      confidence += 0.2;
    }

    // 关键词匹配度
    const content = task.content.toLowerCase();
    const matchedKeywords = agent.keywords.filter(k => 
      content.includes(k.toLowerCase())
    ).length;
    confidence += Math.min(matchedKeywords * 0.05, 0.2);

    return Math.min(confidence, 1.0);
  }
}

/**
 * 创建多智能体编排器
 */
export function createMultiAgentOrchestrator(): MultiAgentOrchestrator {
  return new MultiAgentOrchestrator();
}
