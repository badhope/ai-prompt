export interface CostRecord {
  id: string;
  timestamp: Date;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface CostBudget {
  daily: number;
  monthly: number;
  perUser?: number;
}

export interface CostStats {
  totalCost: number;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgCostPerRequest: number;
  avgCostPerToken: number;
  byProvider: Record<string, number>;
  byModel: Record<string, number>;
  byUser?: Record<string, number>;
}

export interface CostAlert {
  type: 'budget_exceeded' | 'threshold_reached' | 'unusual_spike';
  message: string;
  currentCost: number;
  threshold?: number;
  timestamp: Date;
}

export class CostMonitor {
  private records: CostRecord[] = [];
  private budget: CostBudget;
  private alertCallbacks: ((alert: CostAlert) => void)[] = [];
  private dailyCosts: Map<string, number> = new Map();
  private monthlyCosts: Map<string, number> = new Map();
  private maxRecords: number = 10000;

  constructor(budget?: Partial<CostBudget>) {
    this.budget = {
      daily: 100,
      monthly: 1000,
      ...budget,
    };
  }

  recordCost(record: CostRecord): void {
    this.records.push(record);
    
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }

    const dateKey = this.getDateKey(record.timestamp);
    const monthKey = this.getMonthKey(record.timestamp);

    this.dailyCosts.set(dateKey, (this.dailyCosts.get(dateKey) || 0) + record.cost);
    this.monthlyCosts.set(monthKey, (this.monthlyCosts.get(monthKey) || 0) + record.cost);

    this.cleanupOldData();
    this.checkBudget(record);
  }

  private cleanupOldData(): void {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    for (const [key] of this.dailyCosts) {
      const [year, month, day] = key.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (date < thirtyDaysAgo) {
        this.dailyCosts.delete(key);
      }
    }

    for (const [key] of this.monthlyCosts) {
      const [year, month] = key.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      if (date < twelveMonthsAgo) {
        this.monthlyCosts.delete(key);
      }
    }
  }

  private checkBudget(record: CostRecord): void {
    const dateKey = this.getDateKey(record.timestamp);
    const monthKey = this.getMonthKey(record.timestamp);

    const dailyCost = this.dailyCosts.get(dateKey) || 0;
    const monthlyCost = this.monthlyCosts.get(monthKey) || 0;

    if (dailyCost >= this.budget.daily) {
      this.triggerAlert({
        type: 'budget_exceeded',
        message: `Daily budget exceeded: $${dailyCost.toFixed(2)} / $${this.budget.daily}`,
        currentCost: dailyCost,
        threshold: this.budget.daily,
        timestamp: new Date(),
      });
    }

    if (monthlyCost >= this.budget.monthly) {
      this.triggerAlert({
        type: 'budget_exceeded',
        message: `Monthly budget exceeded: $${monthlyCost.toFixed(2)} / $${this.budget.monthly}`,
        currentCost: monthlyCost,
        threshold: this.budget.monthly,
        timestamp: new Date(),
      });
    }

    if (this.budget.perUser && record.userId) {
      const userCost = this.getUserCost(record.userId);
      if (userCost >= this.budget.perUser) {
        this.triggerAlert({
          type: 'budget_exceeded',
          message: `User budget exceeded for ${record.userId}: $${userCost.toFixed(2)} / $${this.budget.perUser}`,
          currentCost: userCost,
          threshold: this.budget.perUser,
          timestamp: new Date(),
        });
      }
    }
  }

  getStats(startDate?: Date, endDate?: Date): CostStats {
    let filteredRecords = this.records;

    if (startDate) {
      filteredRecords = filteredRecords.filter(r => r.timestamp >= startDate);
    }

    if (endDate) {
      filteredRecords = filteredRecords.filter(r => r.timestamp <= endDate);
    }

    const totalCost = filteredRecords.reduce((sum, r) => sum + r.cost, 0);
    const totalRequests = filteredRecords.length;
    const totalInputTokens = filteredRecords.reduce((sum, r) => sum + r.inputTokens, 0);
    const totalOutputTokens = filteredRecords.reduce((sum, r) => sum + r.outputTokens, 0);

    const byProvider: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    filteredRecords.forEach(r => {
      byProvider[r.provider] = (byProvider[r.provider] || 0) + r.cost;
      byModel[r.model] = (byModel[r.model] || 0) + r.cost;
      if (r.userId) {
        byUser[r.userId] = (byUser[r.userId] || 0) + r.cost;
      }
    });

    return {
      totalCost,
      totalRequests,
      totalInputTokens,
      totalOutputTokens,
      avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      avgCostPerToken: 
        totalInputTokens + totalOutputTokens > 0 
          ? totalCost / (totalInputTokens + totalOutputTokens) 
          : 0,
      byProvider,
      byModel,
      byUser: Object.keys(byUser).length > 0 ? byUser : undefined,
    };
  }

  getDailyCost(date?: Date): number {
    const dateKey = date ? this.getDateKey(date) : this.getDateKey(new Date());
    return this.dailyCosts.get(dateKey) || 0;
  }

  getMonthlyCost(date?: Date): number {
    const monthKey = date ? this.getMonthKey(date) : this.getMonthKey(new Date());
    return this.monthlyCosts.get(monthKey) || 0;
  }

  getUserCost(userId: string): number {
    return this.records
      .filter(r => r.userId === userId)
      .reduce((sum, r) => sum + r.cost, 0);
  }

  getRecentRecords(limit: number = 100): CostRecord[] {
    return this.records.slice(-limit);
  }

  setBudget(budget: Partial<CostBudget>): void {
    this.budget = { ...this.budget, ...budget };
  }

  getBudget(): CostBudget {
    return { ...this.budget };
  }

  onAlert(callback: (alert: CostAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  private triggerAlert(alert: CostAlert): void {
    this.alertCallbacks.forEach(callback => callback(alert));
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  clearRecords(): void {
    this.records = [];
    this.dailyCosts.clear();
    this.monthlyCosts.clear();
  }
}
