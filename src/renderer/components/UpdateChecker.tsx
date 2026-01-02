import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n';
import { useToast } from './ui';

export function UpdateChecker() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [version, setVersion] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    window.electronAPI.getAppVersion().then(setVersion);
  }, []);

  const handleCheckUpdates = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result.updateAvailable) {
        showToast('info', `${t('updates.available')}: v${result.version}`);
      } else {
        showToast('success', t('updates.upToDate'));
      }
    } catch {
      showToast('error', t('updates.error'));
    } finally {
      setIsChecking(false);
    }
  }, [showToast, t]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-slate-400">
        v{version}
      </span>
      <button
        onClick={handleCheckUpdates}
        disabled={isChecking}
        className="text-xs text-gray-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
        title={t('updates.checkForUpdates')}
      >
        {isChecking ? '⏳' : '🔄'}
      </button>
    </div>
  );
}
