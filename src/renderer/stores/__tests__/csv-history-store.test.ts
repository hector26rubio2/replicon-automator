import { describe, it, expect, beforeEach } from 'vitest';
import { useCSVHistoryStore } from '../csv-history-store';
import type { CSVRow } from '../../../common/types';

describe('CSV History Store', () => {
  beforeEach(() => {
    useCSVHistoryStore.setState({
      past: [],
      future: [],
      current: null,
    });
  });

  const sampleRow1: CSVRow = { cuenta: 'AV', proyecto: 'MS', extras: '' };
  const sampleRow2: CSVRow = { cuenta: 'JM', proyecto: 'PR', extras: '' };
  const sampleRow3: CSVRow = { cuenta: 'H', proyecto: 'VAC', extras: '' };

  describe('initialization', () => {
    it('should initialize with empty history', () => {
      const { past, future, current } = useCSVHistoryStore.getState();
      
      expect(past).toEqual([]);
      expect(future).toEqual([]);
      expect(current).toBeNull();
    });

    it('should have maxHistory set', () => {
      const { maxHistory } = useCSVHistoryStore.getState();
      
      expect(maxHistory).toBe(50);
    });
  });

  describe('initialize', () => {
    it('should set initial state', () => {
      const { initialize } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      
      const { current, past, future } = useCSVHistoryStore.getState();
      expect(current).toEqual([sampleRow1]);
      expect(past).toEqual([]);
      expect(future).toEqual([]);
    });

    it('should clear history', () => {
      const { pushState, initialize } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      pushState([sampleRow2]);
      
      initialize([sampleRow3]);
      
      const { past, future } = useCSVHistoryStore.getState();
      expect(past).toEqual([]);
      expect(future).toEqual([]);
    });
  });

  describe('pushState', () => {
    it('should add new state to history', () => {
      const { initialize, pushState } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      pushState([sampleRow2]);
      
      const { current, past } = useCSVHistoryStore.getState();
      expect(current).toEqual([sampleRow2]);
      expect(past).toHaveLength(1);
      expect(past[0]).toEqual([sampleRow1]);
    });

    it('should clear future when pushing new state', () => {
      const { initialize, pushState, undo } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      pushState([sampleRow2]);
      undo();
      pushState([sampleRow3]);
      
      const { future } = useCSVHistoryStore.getState();
      expect(future).toEqual([]);
    });

    it('should limit history to maxHistory', () => {
      const { initialize, pushState } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      
      for (let i = 0; i < 60; i++) {
        pushState([{ ...sampleRow1, proyecto: `P${i}` }]);
      }
      
      const { past } = useCSVHistoryStore.getState();
      expect(past.length).toBeLessThanOrEqual(50);
    });
  });

  describe('undo', () => {
    it('should undo to previous state', () => {
      const { initialize, pushState, undo } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      pushState([sampleRow2]);
      
      const result = undo();
      
      expect(result).toEqual([sampleRow1]);
      expect(useCSVHistoryStore.getState().current).toEqual([sampleRow1]);
    });

    it('should move current to future', () => {
      const { initialize, pushState, undo } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      pushState([sampleRow2]);
      undo();
      
      const { future } = useCSVHistoryStore.getState();
      expect(future[0]).toEqual([sampleRow2]);
    });

    it('should return null when no history', () => {
      const { undo } = useCSVHistoryStore.getState();
      
      const result = undo();
      
      expect(result).toBeNull();
    });
  });

  describe('redo', () => {
    it('should redo to next state', () => {
      const { initialize, pushState, undo, redo } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      pushState([sampleRow2]);
      undo();
      
      const result = redo();
      
      expect(result).toEqual([sampleRow2]);
      expect(useCSVHistoryStore.getState().current).toEqual([sampleRow2]);
    });

    it('should move current to past', () => {
      const { initialize, pushState, undo, redo } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      pushState([sampleRow2]);
      undo();
      redo();
      
      const { past } = useCSVHistoryStore.getState();
      expect(past).toContainEqual([sampleRow1]);
    });

    it('should return null when no future', () => {
      const { redo } = useCSVHistoryStore.getState();
      
      const result = redo();
      
      expect(result).toBeNull();
    });
  });

  describe('canUndo', () => {
    it('should return false initially', () => {
      const { canUndo } = useCSVHistoryStore.getState();
      
      expect(canUndo()).toBe(false);
    });

    it('should return true after push', () => {
      const { initialize, pushState, canUndo } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      pushState([sampleRow2]);
      
      expect(canUndo()).toBe(true);
    });

    it('should return false after undo all', () => {
      const { initialize, pushState, undo, canUndo } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      pushState([sampleRow2]);
      undo();
      
      expect(canUndo()).toBe(false);
    });
  });

  describe('canRedo', () => {
    it('should return false initially', () => {
      const { canRedo } = useCSVHistoryStore.getState();
      
      expect(canRedo()).toBe(false);
    });

    it('should return true after undo', () => {
      const { initialize, pushState, undo, canRedo } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      pushState([sampleRow2]);
      undo();
      
      expect(canRedo()).toBe(true);
    });

    it('should return false after redo all', () => {
      const { initialize, pushState, undo, redo, canRedo } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      pushState([sampleRow2]);
      undo();
      redo();
      
      expect(canRedo()).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear past and future', () => {
      const { initialize, pushState, undo, clearHistory } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      pushState([sampleRow2]);
      undo();
      
      clearHistory();
      
      const { past, future } = useCSVHistoryStore.getState();
      expect(past).toEqual([]);
      expect(future).toEqual([]);
    });
  });

  describe('getHistoryInfo', () => {
    it('should return history counts', () => {
      const { initialize, pushState, undo, getHistoryInfo } = useCSVHistoryStore.getState();
      
      initialize([sampleRow1]);
      pushState([sampleRow2]);
      pushState([sampleRow3]);
      undo();
      
      const info = getHistoryInfo();
      
      expect(info.undoSteps).toBe(1);
      expect(info.redoSteps).toBe(1);
    });
  });
});
