import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../src/security/RateLimiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      windowMs: 1000,
      maxRequests: 5,
    });
  });

  describe('check', () => {
    it('should allow requests within limit', () => {
      for (let i = 0; i < 5; i++) {
        const result = limiter.check('user1');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
        limiter.record('user1');
      }
    });

    it('should deny requests over limit', () => {
      for (let i = 0; i < 5; i++) {
        limiter.record('user1');
      }

      const result = limiter.check('user1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should track different identifiers separately', () => {
      for (let i = 0; i < 5; i++) {
        limiter.record('user1');
      }

      const result1 = limiter.check('user1');
      expect(result1.allowed).toBe(false);

      const result2 = limiter.check('user2');
      expect(result2.allowed).toBe(true);
    });

    it('should reset after window expires', async () => {
      for (let i = 0; i < 5; i++) {
        limiter.record('user1');
      }

      const result1 = limiter.check('user1');
      expect(result1.allowed).toBe(false);

      await new Promise(resolve => setTimeout(resolve, 1100));

      const result2 = limiter.check('user1');
      expect(result2.allowed).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset limit for specific identifier', () => {
      for (let i = 0; i < 5; i++) {
        limiter.record('user1');
      }

      limiter.reset('user1');

      const result = limiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('resetAll', () => {
    it('should reset all limits', () => {
      for (let i = 0; i < 5; i++) {
        limiter.record('user1');
        limiter.record('user2');
      }

      limiter.resetAll();

      expect(limiter.check('user1').allowed).toBe(true);
      expect(limiter.check('user2').allowed).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return correct stats', () => {
      for (let i = 0; i < 3; i++) {
        limiter.record('user1');
      }

      const stats = limiter.getStats('user1');
      expect(stats.current).toBe(3);
      expect(stats.limit).toBe(5);
      expect(stats.remaining).toBe(2);
    });
  });
});
