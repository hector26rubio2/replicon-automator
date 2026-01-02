import { useEffect, useRef } from 'react';
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
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        if (event.key !== 'Escape') return;
      }

      for (const shortcut of shortcutsRef.current) {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
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
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const key = event.key.toLowerCase();



      // Solo permitir Escape en inputs
      if (isInput && event.key !== 'Escape') return;

      // Ctrl+O - Abrir CSV
      if (ctrl && !shift && key === 'o') {
        event.preventDefault();
        event.stopPropagation();
        if (actionsRef.current.onLoad) {
          actionsRef.current.onLoad();
        }
        return;
      }

      // Ctrl+S - Guardar CSV
      if (ctrl && !shift && key === 's') {
        event.preventDefault();
        event.stopPropagation();
        if (actionsRef.current.onSave) {
          actionsRef.current.onSave();
        }
        return;
      }

      // Ctrl+R - Ejecutar automatización
      if (ctrl && !shift && key === 'r') {
        event.preventDefault();
        event.stopPropagation();
        if (actionsRef.current.onRun) {
          actionsRef.current.onRun();
        }
        return;
      }

      // Escape - Detener automatización
      if (event.key === 'Escape') {
        event.preventDefault();
        if (actionsRef.current.onStop) {
          actionsRef.current.onStop();
        }
        return;
      }

      // Ctrl+Shift+T - Cambiar tema
      if (ctrl && shift && key === 't') {
        event.preventDefault();
        event.stopPropagation();
        if (actionsRef.current.onToggleTheme) {
          actionsRef.current.onToggleTheme();
        }
        return;
      }

      // Ctrl+Shift+L - Cambiar idioma
      if (ctrl && shift && key === 'l') {
        event.preventDefault();
        event.stopPropagation();
        if (actionsRef.current.onToggleLanguage) {
          actionsRef.current.onToggleLanguage();
        }
        return;
      }

      // Ctrl+1-4 - Cambiar pestaña
      if (ctrl && !shift && ['1', '2', '3', '4'].includes(key)) {
        event.preventDefault();
        event.stopPropagation();
        if (actionsRef.current.onGoToTab) {
          actionsRef.current.onGoToTab(parseInt(key) - 1);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);
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
