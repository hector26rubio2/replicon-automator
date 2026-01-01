/**
 * Toast Store - Sistema de notificaciones mejorado
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
  progress?: number; // 0-100
  action?: ToastAction;
  dismissible?: boolean;
  createdAt: number;
}

interface ToastState {
  toasts: Toast[];
  maxToasts: number;
  
  // Actions
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id' | 'createdAt'>>) => void;
  clearAll: () => void;
  
  // Convenience methods
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  loading: (title: string, message?: string) => string;
  promise: <T>(
    promise: Promise<T>,
    msgs: { loading: string; success: string; error: string }
  ) => Promise<T>;
}

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
  loading: 0, // Persistent until removed
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  maxToasts: 5,

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const newToast: Toast = {
      ...toast,
      id,
      createdAt: Date.now(),
      duration: toast.duration ?? DEFAULT_DURATIONS[toast.type],
      dismissible: toast.dismissible ?? true,
    };

    set((state) => {
      const toasts = [newToast, ...state.toasts].slice(0, state.maxToasts);
      return { toasts };
    });

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  clearAll: () => set({ toasts: [] }),

  // Convenience methods
  success: (title, message, duration) =>
    get().addToast({ type: 'success', title, message, duration }),

  error: (title, message, duration) =>
    get().addToast({ type: 'error', title, message, duration }),

  warning: (title, message, duration) =>
    get().addToast({ type: 'warning', title, message, duration }),

  info: (title, message, duration) =>
    get().addToast({ type: 'info', title, message, duration }),

  loading: (title, message) =>
    get().addToast({ type: 'loading', title, message, dismissible: false }),

  promise: async (promise, msgs) => {
    const id = get().loading(msgs.loading);
    
    try {
      const result = await promise;
      get().updateToast(id, {
        type: 'success',
        title: msgs.success,
        dismissible: true,
        duration: DEFAULT_DURATIONS.success,
      });
      setTimeout(() => get().removeToast(id), DEFAULT_DURATIONS.success);
      return result;
    } catch (error) {
      get().updateToast(id, {
        type: 'error',
        title: msgs.error,
        message: error instanceof Error ? error.message : undefined,
        dismissible: true,
        duration: DEFAULT_DURATIONS.error,
      });
      setTimeout(() => get().removeToast(id), DEFAULT_DURATIONS.error);
      throw error;
    }
  },
}));
