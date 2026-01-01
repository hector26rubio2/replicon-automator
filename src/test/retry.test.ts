/**
 * Tests para retry utilities
 */

import { describe, it, expect, vi } from 'vitest';
import { withRetry, CircuitBreaker } from '@shared/retry';

describe('withRetry', () => {
  it('should succeed on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');
    
    const result = await withRetry(fn, {
      maxAttempts: 3,
      initialDelayMs: 10,
    });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    
    await expect(
      withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 })
    ).rejects.toThrow('always fails');
    
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should call onRetry callback', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    await withRetry(fn, {
      maxAttempts: 2,
      initialDelayMs: 10,
      onRetry,
    });
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), 10);
  });

  it('should respect retryCondition', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('non-retryable'));
    
    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
        retryCondition: () => false, // Never retry
      })
    ).rejects.toThrow('non-retryable');
    
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('CircuitBreaker', () => {
  it('should start in closed state', () => {
    const breaker = new CircuitBreaker();
    expect(breaker.getState()).toBe('closed');
  });

  it('should allow execution in closed state', async () => {
    const breaker = new CircuitBreaker();
    const result = await breaker.execute(() => Promise.resolve('success'));
    expect(result).toBe('success');
  });

  it('should open after threshold failures', async () => {
    const breaker = new CircuitBreaker(3, 1000);
    
    for (let i = 0; i < 3; i++) {
      await expect(
        breaker.execute(() => Promise.reject(new Error('fail')))
      ).rejects.toThrow();
    }
    
    expect(breaker.getState()).toBe('open');
  });

  it('should reject when open', async () => {
    const breaker = new CircuitBreaker(1, 10000);
    
    await expect(
      breaker.execute(() => Promise.reject(new Error('fail')))
    ).rejects.toThrow();
    
    await expect(
      breaker.execute(() => Promise.resolve('success'))
    ).rejects.toThrow('Circuit breaker is open');
  });

  it('should reset on success', async () => {
    const breaker = new CircuitBreaker(3);
    
    // Fail twice (but not enough to open)
    await expect(breaker.execute(() => Promise.reject(new Error()))).rejects.toThrow();
    await expect(breaker.execute(() => Promise.reject(new Error()))).rejects.toThrow();
    
    // Succeed - should reset counter
    await breaker.execute(() => Promise.resolve('ok'));
    
    // Fail twice more - circuit should still be closed
    await expect(breaker.execute(() => Promise.reject(new Error()))).rejects.toThrow();
    await expect(breaker.execute(() => Promise.reject(new Error()))).rejects.toThrow();
    
    expect(breaker.getState()).toBe('closed');
  });
});
