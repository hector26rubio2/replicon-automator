/**
 * Execution History Store - Historial persistente de ejecuciones
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ExecutionRecord {
  id: string;
  timestamp: number;
  status: 'success' | 'error' | 'partial' | 'cancelled';
  duration: number; // ms
  rowsProcessed: number;
  rowsTotal: number;
  errorMessage?: string;
  csvFileName?: string;
  month: string;
  year: number;
}

interface ExecutionHistoryState {
  history: ExecutionRecord[];
  addExecution: (record: Omit<ExecutionRecord, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  getStats: () => ExecutionStats;
}

export interface ExecutionStats {
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  totalRowsProcessed: number;
  lastExecution?: ExecutionRecord;
  thisMonthExecutions: number;
}

export const useExecutionHistoryStore = create<ExecutionHistoryState>()(
  persist(
    (set, get) => ({
      history: [],

      addExecution: (record) => {
        const newRecord: ExecutionRecord = {
          ...record,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        
        set((state) => ({
          history: [newRecord, ...state.history].slice(0, 100), // Keep last 100
        }));
      },

      clearHistory: () => set({ history: [] }),

      getStats: () => {
        const { history } = get();
        
        if (history.length === 0) {
          return {
            totalExecutions: 0,
            successRate: 0,
            avgDuration: 0,
            totalRowsProcessed: 0,
            thisMonthExecutions: 0,
          };
        }

        const successful = history.filter((r) => r.status === 'success').length;
        const totalDuration = history.reduce((sum, r) => sum + r.duration, 0);
        const totalRows = history.reduce((sum, r) => sum + r.rowsProcessed, 0);

        // This month
        const now = new Date();
        const thisMonth = history.filter((r) => {
          const d = new Date(r.timestamp);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        return {
          totalExecutions: history.length,
          successRate: (successful / history.length) * 100,
          avgDuration: totalDuration / history.length,
          totalRowsProcessed: totalRows,
          lastExecution: history[0],
          thisMonthExecutions: thisMonth,
        };
      },
    }),
    {
      name: 'execution-history',
    }
  )
);
