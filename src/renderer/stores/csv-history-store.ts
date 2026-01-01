/**
 * CSV History Store - Undo/Redo functionality for CSV editor
 * Maintains a history stack for CSV data changes
 */
import { create } from 'zustand';
import type { CSVRow } from '@shared/types';

interface CSVHistoryState {
  // Past states (for undo)
  past: CSVRow[][];
  // Future states (for redo)
  future: CSVRow[][];
  // Current state reference
  current: CSVRow[] | null;
  // Maximum history size
  maxHistory: number;
  
  // Actions
  /**
   * Push current state to history and set new state
   */
  pushState: (newState: CSVRow[]) => void;
  
  /**
   * Initialize with a state (doesn't add to history)
   */
  initialize: (state: CSVRow[] | null) => void;
  
  /**
   * Undo - go back one step
   */
  undo: () => CSVRow[] | null;
  
  /**
   * Redo - go forward one step
   */
  redo: () => CSVRow[] | null;
  
  /**
   * Check if undo is available
   */
  canUndo: () => boolean;
  
  /**
   * Check if redo is available
   */
  canRedo: () => boolean;
  
  /**
   * Clear all history
   */
  clearHistory: () => void;
  
  /**
   * Get history info
   */
  getHistoryInfo: () => { undoSteps: number; redoSteps: number };
}

export const useCSVHistoryStore = create<CSVHistoryState>((set, get) => ({
  past: [],
  future: [],
  current: null,
  maxHistory: 50,
  
  pushState: (newState: CSVRow[]) => {
    const { current, past, maxHistory } = get();
    
    // If current exists, push it to past
    if (current !== null) {
      const newPast = [...past, current];
      // Trim to max history
      if (newPast.length > maxHistory) {
        newPast.shift();
      }
      
      set({
        past: newPast,
        current: newState,
        future: [], // Clear redo stack on new change
      });
    } else {
      set({ current: newState, future: [] });
    }
  },
  
  initialize: (state: CSVRow[] | null) => {
    set({
      current: state,
      past: [],
      future: [],
    });
  },
  
  undo: () => {
    const { past, current, future } = get();
    
    if (past.length === 0) return null;
    
    const newPast = [...past];
    const previous = newPast.pop();
    if (!previous) return null;
    
    set({
      past: newPast,
      current: previous,
      future: current ? [current, ...future] : future,
    });
    
    return previous;
  },
  
  redo: () => {
    const { past, current, future } = get();
    
    if (future.length === 0) return null;
    
    const [next, ...newFuture] = future;
    
    set({
      past: current ? [...past, current] : past,
      current: next,
      future: newFuture,
    });
    
    return next;
  },
  
  canUndo: () => {
    return get().past.length > 0;
  },
  
  canRedo: () => {
    return get().future.length > 0;
  },
  
  clearHistory: () => {
    set({
      past: [],
      future: [],
    });
  },
  
  getHistoryInfo: () => {
    const { past, future } = get();
    return {
      undoSteps: past.length,
      redoSteps: future.length,
    };
  },
}));
