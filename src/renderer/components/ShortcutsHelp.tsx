/**
 * Shortcuts Help Modal
 * Muestra los atajos de teclado disponibles
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useShortcutsList } from '../hooks/useKeyboardShortcuts';
import { useTranslation } from '@/i18n';

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps): React.ReactElement | null {
  const shortcuts = useShortcutsList();
  const { t } = useTranslation();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            ⌨️ {t('shortcuts.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map(({ key, description }) => (
            <div 
              key={key}
              className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <span className="text-gray-600 dark:text-gray-300">{description}</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                {key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {t('shortcuts.list.showShortcuts')}: <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">?</kbd>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook para manejar el modal de shortcuts
 */
export function useShortcutsHelp(): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
} {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Listener para ? key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          toggle();
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggle]);

  return { isOpen, open, close, toggle };
}
