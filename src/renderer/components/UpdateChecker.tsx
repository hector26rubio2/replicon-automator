import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n';
import { useToast } from './ui';

interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export function UpdateChecker() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [version, setVersion] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null);

  useEffect(() => {
    window.electronAPI.getAppVersion().then(setVersion);
    
    const cleanup = window.electronAPI.onUpdateProgress((progress) => {
      setDownloadProgress(progress);
    });

    return cleanup;
  }, []);

  const handleCheckUpdates = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result.updateAvailable) {
        showToast('info', `🎉 ${t('updates.available')}: v${result.version}`);
      } else {
        showToast('success', `✅ ${t('updates.upToDate')}`);
      }
    } catch {
      showToast('error', t('updates.error'));
    } finally {
      setIsChecking(false);
    }
  }, [showToast, t]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (downloadProgress && downloadProgress.percent < 100) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="animate-pulse">⬇️</span>
        <div className="w-24 h-1.5 bg-gray-200 dark:bg-dark-300 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${downloadProgress.percent}%` }}
          />
        </div>
        <span className="text-gray-500 dark:text-slate-400">
          {downloadProgress.percent.toFixed(0)}%
        </span>
        <span className="text-gray-400 dark:text-slate-500">
          ({formatBytes(downloadProgress.bytesPerSecond)}/s)
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={handleCheckUpdates}
      disabled={isChecking}
      className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
      data-tooltip={t('updates.checkForUpdates')}
    >
      {isChecking ? (
        <>
          <span className="animate-spin">🔄</span>
          {t('updates.checking')}
        </>
      ) : (
        <>
          <span>🔄</span>
          v{version}
        </>
      )}
    </button>
  );
}
