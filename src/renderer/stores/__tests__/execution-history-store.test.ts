import { describe, it, expect, beforeEach } from 'vitest';
import { useExecutionHistoryStore } from '../execution-history-store';

describe('Execution History Store', () => {
  beforeEach(() => {
    useExecutionHistoryStore.setState({ history: [] });
  });

  describe('Initial State', () => {
    it('should initialize with empty history', () => {
      const { history } = useExecutionHistoryStore.getState();
      expect(history).toEqual([]);
    });
  });

  describe('addExecution', () => {
    it('should add execution record with generated ID', () => {
      const { addExecution } = useExecutionHistoryStore.getState();

      addExecution({
        status: 'success',
        duration: 1000,
        rowsProcessed: 5,
        rowsTotal: 5,
        month: 'January',
        year: 2024,
      });

      const { history } = useExecutionHistoryStore.getState();
      expect(history.length).toBe(1);
      expect(history[0].id).toBeDefined();
      expect(typeof history[0].id).toBe('string');
    });

    it('should add execution with timestamp', () => {
      const { addExecution } = useExecutionHistoryStore.getState();
      const before = Date.now();

      addExecution({
        status: 'success',
        duration: 500,
        rowsProcessed: 3,
        rowsTotal: 3,
        month: 'February',
        year: 2024,
      });

      const { history } = useExecutionHistoryStore.getState();
      expect(history[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(history[0].timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should add execution with all provided fields', () => {
      const { addExecution } = useExecutionHistoryStore.getState();

      addExecution({
        status: 'partial',
        duration: 2000,
        rowsProcessed: 3,
        rowsTotal: 5,
        errorMessage: 'Some rows failed',
        csvFileName: 'data.csv',
        month: 'March',
        year: 2024,
      });

      const { history } = useExecutionHistoryStore.getState();
      expect(history[0].status).toBe('partial');
      expect(history[0].duration).toBe(2000);
      expect(history[0].rowsProcessed).toBe(3);
      expect(history[0].rowsTotal).toBe(5);
      expect(history[0].errorMessage).toBe('Some rows failed');
      expect(history[0].csvFileName).toBe('data.csv');
      expect(history[0].month).toBe('March');
      expect(history[0].year).toBe(2024);
    });

    it('should add new executions at the beginning', () => {
      const { addExecution } = useExecutionHistoryStore.getState();

      addExecution({
        status: 'success',
        duration: 100,
        rowsProcessed: 1,
        rowsTotal: 1,
        month: 'First',
        year: 2024,
      });

      addExecution({
        status: 'success',
        duration: 200,
        rowsProcessed: 2,
        rowsTotal: 2,
        month: 'Second',
        year: 2024,
      });

      const { history } = useExecutionHistoryStore.getState();
      expect(history[0].month).toBe('Second');
      expect(history[1].month).toBe('First');
    });

    it('should limit history to 100 records', () => {
      const { addExecution } = useExecutionHistoryStore.getState();

      // Add 105 records
      for (let i = 0; i < 105; i++) {
        addExecution({
          status: 'success',
          duration: 100,
          rowsProcessed: 1,
          rowsTotal: 1,
          month: `Month ${i}`,
          year: 2024,
        });
      }

      const { history } = useExecutionHistoryStore.getState();
      expect(history.length).toBe(100);
      expect(history[0].month).toBe('Month 104'); // Most recent
      expect(history[99].month).toBe('Month 5'); // Oldest kept
    });

    it('should handle different status types', () => {
      const { addExecution } = useExecutionHistoryStore.getState();

      addExecution({ status: 'success', duration: 100, rowsProcessed: 5, rowsTotal: 5, month: 'Jan', year: 2024 });
      addExecution({ status: 'error', duration: 50, rowsProcessed: 0, rowsTotal: 5, month: 'Feb', year: 2024 });
      addExecution({ status: 'partial', duration: 150, rowsProcessed: 3, rowsTotal: 5, month: 'Mar', year: 2024 });
      addExecution({ status: 'cancelled', duration: 25, rowsProcessed: 1, rowsTotal: 5, month: 'Apr', year: 2024 });

      const { history } = useExecutionHistoryStore.getState();
      expect(history[0].status).toBe('cancelled');
      expect(history[1].status).toBe('partial');
      expect(history[2].status).toBe('error');
      expect(history[3].status).toBe('success');
    });
  });

  describe('clearHistory', () => {
    it('should clear all execution records', () => {
      const { addExecution, clearHistory } = useExecutionHistoryStore.getState();

      addExecution({ status: 'success', duration: 100, rowsProcessed: 5, rowsTotal: 5, month: 'Jan', year: 2024 });
      addExecution({ status: 'success', duration: 200, rowsProcessed: 3, rowsTotal: 3, month: 'Feb', year: 2024 });

      clearHistory();

      const { history } = useExecutionHistoryStore.getState();
      expect(history).toEqual([]);
    });

    it('should allow adding new records after clear', () => {
      const { addExecution, clearHistory } = useExecutionHistoryStore.getState();

      addExecution({ status: 'success', duration: 100, rowsProcessed: 5, rowsTotal: 5, month: 'Jan', year: 2024 });
      clearHistory();
      addExecution({ status: 'success', duration: 200, rowsProcessed: 3, rowsTotal: 3, month: 'Feb', year: 2024 });

      const { history } = useExecutionHistoryStore.getState();
      expect(history.length).toBe(1);
      expect(history[0].month).toBe('Feb');
    });
  });

  describe('getStats', () => {
    it('should return zero stats for empty history', () => {
      const { getStats } = useExecutionHistoryStore.getState();

      const stats = getStats();

      expect(stats.totalExecutions).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.avgDuration).toBe(0);
      expect(stats.totalRowsProcessed).toBe(0);
      expect(stats.lastExecution).toBeUndefined();
      expect(stats.thisMonthExecutions).toBe(0);
    });

    it('should calculate total executions', () => {
      const { addExecution, getStats } = useExecutionHistoryStore.getState();

      addExecution({ status: 'success', duration: 100, rowsProcessed: 5, rowsTotal: 5, month: 'Jan', year: 2024 });
      addExecution({ status: 'error', duration: 50, rowsProcessed: 0, rowsTotal: 5, month: 'Feb', year: 2024 });

      const stats = getStats();
      expect(stats.totalExecutions).toBe(2);
    });

    it('should calculate success rate', () => {
      const { addExecution, getStats } = useExecutionHistoryStore.getState();

      addExecution({ status: 'success', duration: 100, rowsProcessed: 5, rowsTotal: 5, month: 'Jan', year: 2024 });
      addExecution({ status: 'success', duration: 100, rowsProcessed: 5, rowsTotal: 5, month: 'Feb', year: 2024 });
      addExecution({ status: 'error', duration: 50, rowsProcessed: 0, rowsTotal: 5, month: 'Mar', year: 2024 });
      addExecution({ status: 'partial', duration: 75, rowsProcessed: 3, rowsTotal: 5, month: 'Apr', year: 2024 });

      const stats = getStats();
      expect(stats.successRate).toBe(50); // 2 out of 4 successful
    });

    it('should calculate 100% success rate when all successful', () => {
      const { addExecution, getStats } = useExecutionHistoryStore.getState();

      addExecution({ status: 'success', duration: 100, rowsProcessed: 5, rowsTotal: 5, month: 'Jan', year: 2024 });
      addExecution({ status: 'success', duration: 100, rowsProcessed: 5, rowsTotal: 5, month: 'Feb', year: 2024 });

      const stats = getStats();
      expect(stats.successRate).toBe(100);
    });

    it('should calculate 0% success rate when all failed', () => {
      const { addExecution, getStats } = useExecutionHistoryStore.getState();

      addExecution({ status: 'error', duration: 50, rowsProcessed: 0, rowsTotal: 5, month: 'Jan', year: 2024 });
      addExecution({ status: 'cancelled', duration: 25, rowsProcessed: 1, rowsTotal: 5, month: 'Feb', year: 2024 });

      const stats = getStats();
      expect(stats.successRate).toBe(0);
    });

    it('should calculate average duration', () => {
      const { addExecution, getStats } = useExecutionHistoryStore.getState();

      addExecution({ status: 'success', duration: 100, rowsProcessed: 5, rowsTotal: 5, month: 'Jan', year: 2024 });
      addExecution({ status: 'success', duration: 200, rowsProcessed: 5, rowsTotal: 5, month: 'Feb', year: 2024 });
      addExecution({ status: 'success', duration: 300, rowsProcessed: 5, rowsTotal: 5, month: 'Mar', year: 2024 });

      const stats = getStats();
      expect(stats.avgDuration).toBe(200); // (100 + 200 + 300) / 3
    });

    it('should calculate total rows processed', () => {
      const { addExecution, getStats } = useExecutionHistoryStore.getState();

      addExecution({ status: 'success', duration: 100, rowsProcessed: 5, rowsTotal: 5, month: 'Jan', year: 2024 });
      addExecution({ status: 'partial', duration: 100, rowsProcessed: 3, rowsTotal: 5, month: 'Feb', year: 2024 });
      addExecution({ status: 'success', duration: 100, rowsProcessed: 7, rowsTotal: 7, month: 'Mar', year: 2024 });

      const stats = getStats();
      expect(stats.totalRowsProcessed).toBe(15); // 5 + 3 + 7
    });

    it('should identify last execution', () => {
      const { addExecution, getStats } = useExecutionHistoryStore.getState();

      addExecution({ status: 'success', duration: 100, rowsProcessed: 5, rowsTotal: 5, month: 'Jan', year: 2024 });
      addExecution({ status: 'error', duration: 50, rowsProcessed: 0, rowsTotal: 5, month: 'Feb', year: 2024 });

      const stats = getStats();
      expect(stats.lastExecution).toBeDefined();
      expect(stats.lastExecution?.month).toBe('Feb');
      expect(stats.lastExecution?.status).toBe('error');
    });

    it('should count executions from current month', () => {
      const { getStats } = useExecutionHistoryStore.getState();
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Add some executions with current month/year timestamp
      const currentMonthTimestamp = now.getTime();
      useExecutionHistoryStore.setState({
        history: [
          {
            id: '1',
            timestamp: currentMonthTimestamp,
            status: 'success',
            duration: 100,
            rowsProcessed: 5,
            rowsTotal: 5,
            month: 'Current',
            year: currentYear,
          },
          {
            id: '2',
            timestamp: currentMonthTimestamp - 1000,
            status: 'success',
            duration: 100,
            rowsProcessed: 5,
            rowsTotal: 5,
            month: 'Current',
            year: currentYear,
          },
          {
            id: '3',
            timestamp: new Date(currentYear, currentMonth - 1, 1).getTime(), // Previous month
            status: 'success',
            duration: 100,
            rowsProcessed: 5,
            rowsTotal: 5,
            month: 'Previous',
            year: currentYear,
          },
        ],
      });

      const stats = getStats();
      expect(stats.thisMonthExecutions).toBe(2);
    });

    it('should handle year boundaries for month counting', () => {
      const { getStats } = useExecutionHistoryStore.getState();
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      useExecutionHistoryStore.setState({
        history: [
          {
            id: '1',
            timestamp: new Date(currentYear, currentMonth, 1).getTime(),
            status: 'success',
            duration: 100,
            rowsProcessed: 5,
            rowsTotal: 5,
            month: 'Current',
            year: currentYear,
          },
          {
            id: '2',
            timestamp: new Date(currentYear - 1, currentMonth, 1).getTime(), // Same month, different year
            status: 'success',
            duration: 100,
            rowsProcessed: 5,
            rowsTotal: 5,
            month: 'Current',
            year: currentYear - 1,
          },
        ],
      });

      const stats = getStats();
      expect(stats.thisMonthExecutions).toBe(1); // Only current year counts
    });
  });

  describe('Edge Cases', () => {
    it('should handle execution with zero duration', () => {
      const { addExecution, getStats } = useExecutionHistoryStore.getState();

      addExecution({ status: 'success', duration: 0, rowsProcessed: 5, rowsTotal: 5, month: 'Jan', year: 2024 });

      const stats = getStats();
      expect(stats.avgDuration).toBe(0);
    });

    it('should handle execution with zero rows', () => {
      const { addExecution, getStats } = useExecutionHistoryStore.getState();

      addExecution({ status: 'error', duration: 100, rowsProcessed: 0, rowsTotal: 0, month: 'Jan', year: 2024 });

      const stats = getStats();
      expect(stats.totalRowsProcessed).toBe(0);
    });

    it('should handle mixed durations for average', () => {
      const { addExecution, getStats } = useExecutionHistoryStore.getState();

      addExecution({ status: 'success', duration: 0, rowsProcessed: 5, rowsTotal: 5, month: 'Jan', year: 2024 });
      addExecution({ status: 'success', duration: 1000, rowsProcessed: 5, rowsTotal: 5, month: 'Feb', year: 2024 });
      addExecution({ status: 'success', duration: 500, rowsProcessed: 5, rowsTotal: 5, month: 'Mar', year: 2024 });

      const stats = getStats();
      expect(stats.avgDuration).toBe(500); // (0 + 1000 + 500) / 3
    });

    it('should generate unique IDs for each execution', () => {
      const { addExecution } = useExecutionHistoryStore.getState();

      addExecution({ status: 'success', duration: 100, rowsProcessed: 5, rowsTotal: 5, month: 'Jan', year: 2024 });
      addExecution({ status: 'success', duration: 100, rowsProcessed: 5, rowsTotal: 5, month: 'Jan', year: 2024 });

      const { history } = useExecutionHistoryStore.getState();
      expect(history[0].id).not.toBe(history[1].id);
    });
  });
});
