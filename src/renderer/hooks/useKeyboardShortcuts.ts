import { useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n';

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        if (event.key !== 'Escape') return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function useAppShortcuts(actions: {
  onSave?: () => void;
  onLoad?: () => void;
  onRun?: () => void;
  onStop?: () => void;
  onToggleTheme?: () => void;
  onToggleLanguage?: () => void;
  onGoToTab?: (tab: number) => void;
  onExportLogs?: () => void;
  onOpenCommandPalette?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}): void {
  const { t } = useTranslation();
  const shortcuts: Shortcut[] = [];

  if (actions.onSave) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      action: actions.onSave,
      description: t('shortcuts.saveCSV'),
    });
  }

  if (actions.onLoad) {
    shortcuts.push({
      key: 'o',
      ctrl: true,
      action: actions.onLoad,
      description: t('shortcuts.openCSV'),
    });
  }

  if (actions.onRun) {
    shortcuts.push({
      key: 'r',
      ctrl: true,
      action: actions.onRun,
      description: t('shortcuts.runAutomation'),
    });
  }

  if (actions.onStop) {
    shortcuts.push({
      key: 'Escape',
      action: actions.onStop,
      description: t('shortcuts.stopAutomation'),
    });
  }

  if (actions.onToggleTheme) {
    shortcuts.push({
      key: 't',
      ctrl: true,
      shift: true,
      action: actions.onToggleTheme,
      description: t('shortcuts.changeTheme'),
    });
  }

  if (actions.onToggleLanguage) {
    shortcuts.push({
      key: 'l',
      ctrl: true,
      shift: true,
      action: actions.onToggleLanguage,
      description: t('shortcuts.changeLanguage'),
    });
  }

  if (actions.onOpenCommandPalette) {
    shortcuts.push({
      key: 'k',
      ctrl: true,
      action: actions.onOpenCommandPalette,
      description: t('shortcuts.openCommandPalette'),
    });
  }

  if (actions.onGoToTab) {
    for (let i = 1; i <= 4; i++) {
      shortcuts.push({
        key: String(i),
        ctrl: true,
        action: () => actions.onGoToTab!(i - 1),
        description: `${t('shortcuts.goToTab')} ${i}`,
      });
    }
  }

  if (actions.onExportLogs) {
    shortcuts.push({
      key: 'e',
      ctrl: true,
      shift: true,
      action: actions.onExportLogs,
      description: t('shortcuts.exportLogs'),
    });
  }

  if (actions.onUndo) {
    shortcuts.push({
      key: 'z',
      ctrl: true,
      action: actions.onUndo,
      description: t('shortcuts.undo'),
    });
  }

  if (actions.onRedo) {
    shortcuts.push({
      key: 'y',
      ctrl: true,
      action: actions.onRedo,
      description: t('shortcuts.redo'),
    });
    shortcuts.push({
      key: 'z',
      ctrl: true,
      shift: true,
      action: actions.onRedo,
      description: t('shortcuts.redo'),
    });
  }

  useKeyboardShortcuts(shortcuts);
}

export function useShortcutsList(): { key: string; description: string }[] {
  const { t } = useTranslation();
  
  return [
    { key: 'Ctrl+K', description: t('shortcuts.openCommandPalette') },
    { key: 'Ctrl+S', description: t('shortcuts.saveCSV') },
    { key: 'Ctrl+O', description: t('shortcuts.openCSV') },
    { key: 'Ctrl+R', description: t('shortcuts.runAutomation') },
    { key: 'Escape', description: t('shortcuts.stopAutomation') },
    { key: 'Ctrl+Z', description: t('shortcuts.undo') },
    { key: 'Ctrl+Y', description: t('shortcuts.redo') },
    { key: 'Ctrl+Shift+T', description: t('shortcuts.changeTheme') },
    { key: 'Ctrl+Shift+L', description: t('shortcuts.languageToggle') },
    { key: 'Ctrl+1-4', description: t('shortcuts.changeTab') },
    { key: 'Ctrl+Shift+E', description: t('shortcuts.exportLogs') },
  ];
}
