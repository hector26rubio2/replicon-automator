import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore } from '../toast-store';

describe('Toast Store', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with empty toasts', () => {
      const { toasts } = useToastStore.getState();
      expect(toasts).toEqual([]);
    });

    it('should have maxToasts set to 5', () => {
      const { maxToasts } = useToastStore.getState();
      expect(maxToasts).toBe(5);
    });
  });

  describe('addToast', () => {
    it('should add a toast', () => {
      const { addToast, toasts } = useToastStore.getState();
      
      const id = addToast({ type: 'info', title: 'Test' });
      
      expect(id).toBeTruthy();
      expect(useToastStore.getState().toasts).toHaveLength(1);
      expect(useToastStore.getState().toasts[0].title).toBe('Test');
    });

    it('should assign unique id', () => {
      const { addToast } = useToastStore.getState();
      
      const id1 = addToast({ type: 'info', title: 'Test 1' });
      const id2 = addToast({ type: 'info', title: 'Test 2' });
      
      expect(id1).not.toBe(id2);
    });

    it('should limit toasts to maxToasts', () => {
      const { addToast } = useToastStore.getState();
      
      for (let i = 0; i < 10; i++) {
        addToast({ type: 'info', title: `Toast ${i}` });
      }
      
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(5);
    });

    it('should set default duration for success', () => {
      const { addToast } = useToastStore.getState();
      
      addToast({ type: 'success', title: 'Success' });
      
      const { toasts } = useToastStore.getState();
      expect(toasts[0].duration).toBe(4000);
    });

    it('should set default duration for error', () => {
      const { addToast } = useToastStore.getState();
      
      addToast({ type: 'error', title: 'Error' });
      
      const { toasts } = useToastStore.getState();
      expect(toasts[0].duration).toBe(6000);
    });

    it('should use custom duration if provided', () => {
      const { addToast } = useToastStore.getState();
      
      addToast({ type: 'info', title: 'Custom', duration: 10000 });
      
      const { toasts } = useToastStore.getState();
      expect(toasts[0].duration).toBe(10000);
    });

    it('should auto-remove after duration', () => {
      const { addToast } = useToastStore.getState();
      
      addToast({ type: 'success', title: 'Auto remove', duration: 1000 });
      
      expect(useToastStore.getState().toasts).toHaveLength(1);
      
      vi.advanceTimersByTime(1000);
      
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('removeToast', () => {
    it('should remove specific toast', () => {
      const { addToast, removeToast } = useToastStore.getState();
      
      const id = addToast({ type: 'info', title: 'Remove me' });
      expect(useToastStore.getState().toasts).toHaveLength(1);
      
      removeToast(id);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should not affect other toasts', () => {
      const { addToast, removeToast } = useToastStore.getState();
      
      const id1 = addToast({ type: 'info', title: 'Keep me' });
      const id2 = addToast({ type: 'info', title: 'Remove me' });
      
      removeToast(id2);
      
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].id).toBe(id1);
    });
  });

  describe('updateToast', () => {
    it('should update toast properties', () => {
      const { addToast, updateToast } = useToastStore.getState();
      
      const id = addToast({ type: 'loading', title: 'Loading...' });
      
      updateToast(id, { type: 'success', title: 'Complete!' });
      
      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].title).toBe('Complete!');
    });

    it('should update progress', () => {
      const { addToast, updateToast } = useToastStore.getState();
      
      const id = addToast({ type: 'loading', title: 'Processing' });
      
      updateToast(id, { progress: 50 });
      
      const { toasts } = useToastStore.getState();
      expect(toasts[0].progress).toBe(50);
    });
  });

  describe('clearAll', () => {
    it('should remove all toasts', () => {
      const { addToast, clearAll } = useToastStore.getState();
      
      addToast({ type: 'info', title: 'Toast 1' });
      addToast({ type: 'info', title: 'Toast 2' });
      addToast({ type: 'info', title: 'Toast 3' });
      
      expect(useToastStore.getState().toasts).toHaveLength(3);
      
      clearAll();
      
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('convenience methods', () => {
    it('should create success toast', () => {
      const { success } = useToastStore.getState();
      
      success('Success!', 'It worked');
      
      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].title).toBe('Success!');
      expect(toasts[0].message).toBe('It worked');
    });

    it('should create error toast', () => {
      const { error } = useToastStore.getState();
      
      error('Error!', 'Something failed');
      
      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].title).toBe('Error!');
    });

    it('should create warning toast', () => {
      const { warning } = useToastStore.getState();
      
      warning('Warning!');
      
      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('warning');
    });

    it('should create info toast', () => {
      const { info } = useToastStore.getState();
      
      info('Info');
      
      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('info');
    });

    it('should create loading toast', () => {
      const { loading } = useToastStore.getState();
      
      loading('Loading...');
      
      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('loading');
      expect(toasts[0].duration).toBe(0);
    });
  });

  describe('promise', () => {
    it('should show loading then success', async () => {
      const { promise } = useToastStore.getState();
      
      const mockPromise = Promise.resolve('done');
      
      await promise(mockPromise, {
        loading: 'Loading...',
        success: 'Done!',
        error: 'Failed',
      });
      
      const { toasts } = useToastStore.getState();
      // Should have at least one toast (success)
      expect(toasts.length).toBeGreaterThan(0);
      // Find success toast
      const successToast = toasts.find(t => t.type === 'success');
      expect(successToast).toBeDefined();
    });

    it('should show loading then error', async () => {
      const { promise } = useToastStore.getState();
      
      const mockPromise = Promise.reject(new Error('fail'));
      
      try {
        await promise(mockPromise, {
          loading: 'Loading...',
          success: 'Done!',
          error: 'Failed',
        });
      } catch {}
      
      const { toasts } = useToastStore.getState();
      // Should have at least one toast (error)
      expect(toasts.length).toBeGreaterThan(0);
      // Find error toast
      const errorToast = toasts.find(t => t.type === 'error');
      expect(errorToast).toBeDefined();
    });
  });
});
