import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: resolveTheme('system'),

      setTheme: (theme: Theme) => {
        const resolvedTheme = resolveTheme(theme);
        set({ theme, resolvedTheme });
        applyTheme(resolvedTheme);
      },

      toggleTheme: () => {
        const current = get().resolvedTheme;
        const next = current === 'dark' ? 'light' : 'dark';
        set({ theme: next, resolvedTheme: next });
        applyTheme(next);
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = resolveTheme(state.theme);
          state.resolvedTheme = resolved;
          applyTheme(resolved, true);
        }
      },
    }
  )
);

function applyTheme(theme: 'light' | 'dark', skipTransition = false): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    
    // Solo skip transition en carga inicial
    if (skipTransition) {
      root.classList.add('no-transitions');
    }
    
    // Aplicar tema
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    
    // Remover no-transitions después de un frame
    if (skipTransition) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.classList.remove('no-transitions');
        });
      });
    }
  }
}

if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const state = useThemeStore.getState();
    if (state.theme === 'system') {
      const newTheme = e.matches ? 'dark' : 'light';
      useThemeStore.setState({ resolvedTheme: newTheme });
      applyTheme(newTheme);
    }
  });
}
