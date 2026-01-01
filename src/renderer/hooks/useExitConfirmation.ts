/**
 * Exit Confirmation Hook
 * Prevents accidental exit when there are unsaved changes
 */
import { useEffect, useCallback } from 'react';
import { useUnsavedChangesStore } from '../stores/unsaved-changes-store';
import { useTranslation } from '../i18n';

export function useExitConfirmation() {
  const hasUnsaved = useUnsavedChangesStore((state) => state.hasUnsavedChanges);
  const changedSections = useUnsavedChangesStore((state) => state.changedSections);
  const { t } = useTranslation();

  // Handle browser/electron beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        const message = t('common.unsavedChanges');
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsaved, t]);

  // Confirmation function for manual checks
  const confirmExit = useCallback(() => {
    if (!hasUnsaved) return true;
    
    const categoryNames = Array.from(changedSections).join(', ');
    const message = `${t('common.unsavedChanges')}\n\n${categoryNames}\n\n${t('common.confirmExit')}`;
    
    return window.confirm(message);
  }, [hasUnsaved, changedSections, t]);

  return { confirmExit, hasUnsavedChanges: hasUnsaved };
}

/**
 * Hook to track and warn about unsaved changes in a specific component
 */
export function useUnsavedChangesWarning(
  category: string,
  hasChanges: boolean,
  onSave?: () => Promise<void> | void
) {
  const { setUnsavedChanges, markSaved } = useUnsavedChangesStore();
  const { t } = useTranslation();

  // Track changes
  useEffect(() => {
    setUnsavedChanges(category, hasChanges);
  }, [category, hasChanges, setUnsavedChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setUnsavedChanges(category, false);
    };
  }, [category, setUnsavedChanges]);

  const saveAndMark = useCallback(async () => {
    if (onSave) {
      await onSave();
      markSaved();
    }
  }, [markSaved, onSave]);

  const confirmDiscard = useCallback(() => {
    if (!hasChanges) return true;
    return window.confirm(t('common.discardChanges'));
  }, [hasChanges, t]);

  return {
    saveAndMark,
    confirmDiscard,
    markSaved,
  };
}
