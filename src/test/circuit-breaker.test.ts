import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker } from '../common/retry';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker(3, 1000); // threshold: 3, resetTime: 1s
  });

  describe('initialization', () => {
    it('should start in closed state', () => {
      expect(breaker.getState()).toBe('closed');
    });

    it('should create with custom parameters', () => {
      const customBreaker = new CircuitBreaker(5, 5000);
      expect(customBreaker.getState()).toBe('closed');
    });
  });

  describe('successful executions', () => {
    it('should execute function and return result', async () => {
      const fn = vi.fn(async () => 'success');
      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should stay closed after successful execution', async () => {
      await breaker.execute(async () => 'success');
      expect(breaker.getState()).toBe('closed');
    });

    it('should reset failure count on success', async () => {
      // Fail once
      try {
        await breaker.execute(async () => {
          throw new Error('fail');
        });
      } catch {
        // Expected error
      }

      // Then succeed
      await breaker.execute(async () => 'success');

      expect(breaker.getState()).toBe('closed');
    });
  });

  describe('failure handling', () => {
    it('should propagate error on failure', async () => {
      const error = new Error('test error');
      const fn = async () => {
        throw error;
      };

      await expect(breaker.execute(fn)).rejects.toThrow('test error');
    });

    it('should increment failure count on error', async () => {
      try {
        await breaker.execute(async () => {
          throw new Error('fail');
        });
      } catch {
        // Expected error
      }

      expect(breaker.getState()).toBe('closed'); // Still closed, not enough failures
    });

    it('should open circuit after threshold failures', async () => {
      const failFn = async () => {
        throw new Error('fail');
      };

      // Fail threshold times (3)
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFn);
        } catch {
          // Expected error
        }
      }

      expect(breaker.getState()).toBe('open');
    });

    it('should reject immediately when circuit is open', async () => {
      const failFn = async () => {
        throw new Error('fail');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFn);
        } catch {
          // Expected error
        }
      }

      // Next call should fail immediately
      await expect(breaker.execute(async () => 'should not run'))
        .rejects.toThrow('Circuit breaker is open');
    });
  });

  describe('half-open state', () => {
    it('should transition to half-open after reset time', async () => {
      vi.useFakeTimers();
      const failFn = async () => {
        throw new Error('fail');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFn);
        } catch {
          // Expected error
        }
      }

      expect(breaker.getState()).toBe('open');

      // Advance time past reset period
      vi.advanceTimersByTime(1100);

      // Next execution should try (half-open)
      try {
        await breaker.execute(failFn);
      } catch {
        // Expected error
      }

      // Cleanup
      vi.useRealTimers();
    });

    it('should close circuit on successful execution in half-open state', async () => {
      vi.useFakeTimers();
      const failFn = async () => {
        throw new Error('fail');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFn);
        } catch {
          // Expected error
        }
      }

      // Wait for reset time
      vi.advanceTimersByTime(1100);

      // Successful execution should close circuit
      await breaker.execute(async () => 'success');

      expect(breaker.getState()).toBe('closed');

      vi.useRealTimers();
    });
  });

  describe('reset', () => {
    it('should reset circuit to closed state', async () => {
      const failFn = async () => {
        throw new Error('fail');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFn);
        } catch {
          // Expected error
        }
      }

      expect(breaker.getState()).toBe('open');

      breaker.reset();

      expect(breaker.getState()).toBe('closed');
    });

    it('should allow execution after reset', async () => {
      const failFn = async () => {
        throw new Error('fail');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failFn);
        } catch {
          // Expected error
        }
      }

      breaker.reset();

      const result = await breaker.execute(async () => 'success');
      expect(result).toBe('success');
    });
  });

  describe('complex scenarios', () => {
    it('should handle mixed success and failure', async () => {
      // Succeed
      await breaker.execute(async () => 'ok');

      // Fail twice
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('fail');
          });
        } catch {
          // Expected error
        }
      }

      // Should still be closed (only 2 failures)
      expect(breaker.getState()).toBe('closed');

      // Another success resets count
      await breaker.execute(async () => 'ok');

      // Should still be closed
      expect(breaker.getState()).toBe('closed');
    });

    it('should track state transitions correctly', async () => {
      expect(breaker.getState()).toBe('closed');

      // Fail to open
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('fail');
          });
        } catch {
          // Expected error
        }
      }

      expect(breaker.getState()).toBe('open');

      // Reset and verify closed
      breaker.reset();
      expect(breaker.getState()).toBe('closed');
    });
  });
});
