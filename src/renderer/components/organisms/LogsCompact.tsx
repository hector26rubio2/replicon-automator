import { memo, useMemo, useRef, useEffect, useState } from 'react';
import type { LogEntry } from '@shared/types';
import { formatTimestamp } from '@shared/utils';
import { useTranslation } from '@/i18n';
interface LogsCompactProps {
  logs: LogEntry[];
}
const LOG_LEVEL_CONFIG = {
  success: { icon: '✅', color: 'text-emerald-600 dark:text-emerald-400' },
  error: { icon: '❌', color: 'text-red-600 dark:text-red-400' },
  warning: { icon: '⚠️', color: 'text-amber-600 dark:text-amber-400' },
  info: { icon: 'ℹ️', color: 'text-gray-700 dark:text-slate-300' },
} as const;

const LogItem = memo(function LogItem({ log, onView }: { log: LogEntry; onView: () => void }) {
  const config = LOG_LEVEL_CONFIG[log.level] ?? LOG_LEVEL_CONFIG.info;
  const { t } = useTranslation();

  return (
    <div
      className="flex gap-2 py-1 border-b border-gray-200 dark:border-slate-800/50 text-xs group hover:bg-gray-100 dark:hover:bg-slate-800/30 transition-colors"
      title={log.message}
    >
      <span className="text-gray-400 dark:text-slate-500 shrink-0">
        [{formatTimestamp(new Date(log.timestamp))}]
      </span>
      <span className="shrink-0">{config.icon}</span>
      <span className={`${config.color} truncate min-w-0 flex-1`}>{log.message}</span>
      <button
        onClick={onView}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
        title={t('logsExt.viewDetails')}
        aria-label={t('logsExt.viewDetails')}
      >
        👁️
      </button>
    </div>
  );
});

const LogDetailModal = memo(function LogDetailModal({
  log,
  onClose,
}: {
  log: LogEntry | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  if (!log) return null;

  const config = LOG_LEVEL_CONFIG[log.level] ?? LOG_LEVEL_CONFIG.info;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-200 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-dark-200 border-b border-gray-200 dark:border-slate-700 p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>{config.icon}</span>
            {t('logsExt.logDetail')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 text-xl"
            aria-label={t('logsExt.close')}
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <span className="text-xs text-gray-500 dark:text-slate-400">
              {t('logsExt.timestamp')}:
            </span>
            <p className="text-sm text-gray-700 dark:text-slate-300 font-mono">
              {formatTimestamp(new Date(log.timestamp))}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-slate-400">{t('logsExt.level')}:</span>
            <p className={`text-sm font-medium ${config.color}`}>{log.level.toUpperCase()}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-slate-400">
              {t('logsExt.message')}:
            </span>
            <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap break-words mt-1 bg-gray-50 dark:bg-dark-300 p-3 rounded">
              {log.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
export function LogsCompact({ logs = [] }: LogsCompactProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs?.length]);
  const visibleLogs = useMemo(() => logs?.slice(-50) ?? [], [logs]);
  return (
    <div className="card h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-2xl">📋</span>
          {t('logsExt.activityLog')}
        </h2>
        <span className="text-gray-500 dark:text-slate-500 text-xs">
          {logs?.length ?? 0} {t('logsExt.entries')}
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 bg-gray-50 dark:bg-dark-300 rounded-lg p-3 overflow-auto font-mono min-h-0"
        role="log"
        aria-live="polite"
        aria-label={t('logsExt.activityLog')}
      >
        {visibleLogs.length > 0 ? (
          <div className="space-y-0.5">
            {(logs?.length ?? 0) > 50 && (
              <div className="text-gray-500 dark:text-slate-500 text-xs mb-2 text-center">
                {t('logsExt.showing')} 50 {t('logsExt.of')} {logs?.length ?? 0}
              </div>
            )}
            {visibleLogs.map((log, index) => (
              <LogItem
                key={`${log.timestamp}-${index}`}
                log={log}
                onView={() => setSelectedLog(log)}
              />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-slate-500">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">{t('logsExt.noLogsYet')}</p>
            <p className="text-xs mt-1">{t('logsExt.logsWillAppear')}</p>
          </div>
        )}
      </div>
      <div className="flex gap-4 text-xs mt-2 text-gray-500 dark:text-slate-400" role="list">
        {Object.entries(LOG_LEVEL_CONFIG).map(([level, config]) => (
          <div key={level} className="flex items-center gap-1" role="listitem">
            <span>{config.icon}</span>
            <span className={config.color}>{t(`logsExt.levels.${level}`)}</span>
          </div>
        ))}
      </div>

      <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
export default LogsCompact;
