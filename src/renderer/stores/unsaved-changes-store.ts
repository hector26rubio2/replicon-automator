/**
 * Unsaved Changes Store - Gestión de cambios sin guardar
 */

import { create } from 'zustand';

interface UnsavedChangesState {
  hasUnsavedChanges: boolean;
  changedSections: Set<string>;
  setUnsavedChanges: (section: string, hasChanges: boolean) => void;
  markSaved: () => void;
  markAllSaved: () => void;
}

export const useUnsavedChangesStore = create<UnsavedChangesState>((set, get) => ({
  hasUnsavedChanges: false,
  changedSections: new Set(),

  setUnsavedChanges: (section: string, hasChanges: boolean) => {
    const current = get().changedSections;
    const next = new Set(current);
    
    if (hasChanges) {
      next.add(section);
    } else {
      next.delete(section);
    }
    
    set({
      changedSections: next,
      hasUnsavedChanges: next.size > 0,
    });
    
    // Update window title
    updateWindowTitle(next.size > 0);
  },

  markSaved: () => {
    set({
      hasUnsavedChanges: false,
      changedSections: new Set(),
    });
    updateWindowTitle(false);
  },

  markAllSaved: () => {
    set({
      hasUnsavedChanges: false,
      changedSections: new Set(),
    });
    updateWindowTitle(false);
  },
}));

function updateWindowTitle(hasUnsaved: boolean): void {
  if (typeof document !== 'undefined') {
    const baseTitle = 'Replicon Automator';
    document.title = hasUnsaved ? `● ${baseTitle}` : baseTitle;
  }
}

// Prevent accidental page close with unsaved changes
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (e) => {
    const { hasUnsavedChanges } = useUnsavedChangesStore.getState();
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '¿Tienes cambios sin guardar. ¿Seguro que quieres salir?';
      return e.returnValue;
    }
  });
}
