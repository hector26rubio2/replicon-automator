/**
 * Theme Toggle Component
 * Botón para cambiar entre temas
 */

import React from 'react';
import { useThemeStore, Theme } from '../stores/theme-store';
import { useTranslation } from '@/i18n';

const THEME_ICONS: Record<Theme, string> = {
  light: '☀️',
  dark: '🌙',
  system: '💻',
};

export function ThemeToggle(): React.ReactElement {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();

  const getThemeLabel = (themeKey: Theme): string => {
    switch (themeKey) {
      case 'light': return t('theme.light');
      case 'dark': return t('theme.dark');
      case 'system': return t('theme.system');
      default: return themeKey;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Shift+Click para ciclar entre todos los modos
      const modes: Theme[] = ['light', 'dark', 'system'];
      const currentIndex = modes.indexOf(theme);
      const nextIndex = (currentIndex + 1) % modes.length;
      setTheme(modes[nextIndex]);
    } else {
      // Click normal para toggle light/dark
      toggleTheme();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={`${t('theme.current')}: ${getThemeLabel(theme)} (${getThemeLabel(resolvedTheme)})\n${t('theme.clickToChange')}`}
      aria-label={`${t('theme.current')}: ${getThemeLabel(theme)}`}
    >
      <span className="text-xl">{THEME_ICONS[theme]}</span>
      {theme === 'system' && (
        <span className="text-xs ml-1 opacity-50">
          ({resolvedTheme === 'dark' ? '🌙' : '☀️'})
        </span>
      )}
    </button>
  );
}

/**
 * Theme Selector con dropdown
 */
export function ThemeSelector(): React.ReactElement {
  const { theme, setTheme } = useThemeStore();
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">{t('theme.label')}</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option value="light">☀️ {t('theme.light')}</option>
        <option value="dark">🌙 {t('theme.dark')}</option>
        <option value="system">💻 {t('theme.system')}</option>
      </select>
    </div>
  );
}
