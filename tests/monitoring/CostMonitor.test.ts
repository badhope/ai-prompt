import { describe, it, expect, beforeEach } from 'vitest';
import { CostMonitor } from '../src/monitoring/CostMonitor';

describe('CostMonitor', () => {
  let monitor: CostMonitor;

  beforeEach(() => {
    monitor = new CostMonitor({
      daily: 10,
      monthly: 100,
    });
  });

  describe('recordCost', () => {
    it('should record cost correctly', () => {
      monitor.recordCost({
        id: '1',
        timestamp: new Date(),
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.5,
      });

      const stats = monitor.getStats();
      expect(stats.totalCost).toBe(0.5);
      expect(stats.totalRequests).toBe(1);
      expect(stats.totalInputTokens).toBe(100);
      expect(stats.totalOutputTokens).toBe(50);
    });

    it('should track costs by provider', () => {
      monitor.recordCost({
        id: '1',
        timestamp: new Date(),
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.5,
      });

      monitor.recordCost({
        id: '2',
        timestamp: new Date(),
        provider: 'claude',
        model: 'claude-3',
        inputTokens: 200,
        outputTokens: 100,
        cost: 1.0,
      });

      const stats = monitor.getStats();
      expect(stats.byProvider['openai']).toBe(0.5);
      expect(stats.byProvider['claude']).toBe(1.0);
    });

    it('should track costs by model', () => {
      monitor.recordCost({
        id: '1',
        timestamp: new Date(),
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.5,
      });

      const stats = monitor.getStats();
      expect(stats.byModel['gpt-4']).toBe(0.5);
    });

    it('should track costs by user', () => {
      monitor.recordCost({
        id: '1',
        timestamp: new Date(),
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.5,
        userId: 'user1',
      });

      const userCost = monitor.getUserCost('user1');
      expect(userCost).toBe(0.5);
    });
  });

  describe('budget alerts', () => {
    it('should trigger alert when daily budget exceeded', () => {
      const alerts: any[] = [];
      monitor.onAlert(alert => alerts.push(alert));

      monitor.recordCost({
        id: '1',
        timestamp: new Date(),
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 100,
        outputTokens: 50,
        cost: 15,
      });

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('budget_exceeded');
      expect(alerts[0].threshold).toBe(10);
    });

    it('should trigger alert when monthly budget exceeded', () => {
      const alerts: any[] = [];
      monitor.onAlert(alert => alerts.push(alert));

      for (let i = 0; i < 11; i++) {
        monitor.recordCost({
          id: String(i),
          timestamp: new Date(),
          provider: 'openai',
          model: 'gpt-4',
          inputTokens: 100,
          outputTokens: 50,
          cost: 10,
        });
      }

      const monthlyAlerts = alerts.filter(a => 
        a.message.includes('Monthly budget exceeded')
      );
      expect(monthlyAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('getDailyCost', () => {
    it('should return daily cost', () => {
      monitor.recordCost({
        id: '1',
        timestamp: new Date(),
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 100,
        outputTokens: 50,
        cost: 5,
      });

      const dailyCost = monitor.getDailyCost();
      expect(dailyCost).toBe(5);
    });
  });

  describe('getMonthlyCost', () => {
    it('should return monthly cost', () => {
      monitor.recordCost({
        id: '1',
        timestamp: new Date(),
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 100,
        outputTokens: 50,
        cost: 5,
      });

      const monthlyCost = monitor.getMonthlyCost();
      expect(monthlyCost).toBe(5);
    });
  });

  describe('memory management', () => {
    it('should limit records to maxRecords', () => {
      const smallMonitor = new CostMonitor({ daily: 1000, monthly: 10000 });
      (smallMonitor as any).maxRecords = 10;

      for (let i = 0; i < 20; i++) {
        smallMonitor.recordCost({
          id: String(i),
          timestamp: new Date(),
          provider: 'openai',
          model: 'gpt-4',
          inputTokens: 100,
          outputTokens: 50,
          cost: 1,
        });
      }

      const records = smallMonitor.getRecentRecords(100);
      expect(records.length).toBeLessThanOrEqual(10);
    });
  });
});
