/**
 * Dashboard Stats Component - Estadísticas de automatizaciones
 */

import { useMemo } from 'react';
import { useExecutionHistoryStore, type ExecutionStats } from '../stores/execution-history-store';
import { useTranslation } from '@/i18n';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

function formatDate(timestamp: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subValue?: string;
  color?: 'default' | 'success' | 'warning' | 'error';
}

function StatCard({ icon, label, value, subValue, color = 'default' }: StatCardProps) {
  const colorClasses = {
    default: 'text-gray-900 dark:text-white',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className="bg-gray-50 dark:bg-dark-200 rounded-lg p-4">
      <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-sm mb-1">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
      {subValue && (
        <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{subValue}</p>
      )}
    </div>
  );
}

export function DashboardStats() {
  const { history, getStats, clearHistory } = useExecutionHistoryStore();
  const { t, language } = useTranslation();
  const stats: ExecutionStats = useMemo(() => getStats(), [getStats]);
  const locale = language === 'es' ? 'es' : 'en';

  const successRateColor = stats.successRate >= 80 ? 'success' : stats.successRate >= 50 ? 'warning' : 'error';

  return (
    <div className="card h-full flex flex-col pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-2xl">📊</span>
          {t('dashboard.title')}
        </h2>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="btn btn-secondary text-sm"
            title={t('common.clear')}
          >
            🗑️ {t('common.clear')}
          </button>
        )}
      </div>

      {stats.totalExecutions === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-slate-400">
          <span className="text-4xl mb-2 block">📈</span>
          <p>{t('logs.noLogs')}</p>
          <p className="text-sm mt-1">{t('automation.configureFirst')}</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon="🎯"
              label={t('dashboard.stats.totalExecutions')}
              value={stats.totalExecutions}
              subValue={`${stats.thisMonthExecutions} ${t('dashboard.stats.thisMonth')}`}
            />
            <StatCard
              icon="✅"
              label={t('dashboard.stats.successRate')}
              value={`${stats.successRate.toFixed(0)}%`}
              color={successRateColor}
            />
            <StatCard
              icon="⏱️"
              label={t('dashboard.stats.avgDuration')}
              value={formatDuration(stats.avgDuration)}
            />
            <StatCard
              icon="📝"
              label={t('csv.addRow')}
              value={stats.totalRowsProcessed}
            />
          </div>

          {/* Last execution */}
          {stats.lastExecution && (
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">{t('dashboard.stats.lastExecution')}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className={
                  stats.lastExecution.status === 'success' ? 'text-green-500' :
                  stats.lastExecution.status === 'error' ? 'text-red-500' :
                  'text-amber-500'
                }>
                  {stats.lastExecution.status === 'success' ? '✅' :
                   stats.lastExecution.status === 'error' ? '❌' : '⚠️'}
                </span>
                <span className="text-gray-700 dark:text-slate-300">
                  {formatDate(stats.lastExecution.timestamp, locale)}
                </span>
                <span className="text-gray-500 dark:text-slate-400">
                  {stats.lastExecution.month} {stats.lastExecution.year}
                </span>
                <span className="text-gray-500 dark:text-slate-400">
                  {stats.lastExecution.rowsProcessed}/{stats.lastExecution.rowsTotal} {t('csv.addRow').toLowerCase()}
                </span>
                <span className="text-gray-500 dark:text-slate-400">
                  {formatDuration(stats.lastExecution.duration)}
                </span>
              </div>
            </div>
          )}

          {/* Recent history */}
          {history.length > 1 && (
            <div className="mt-4">
              <details className="group">
                <summary className="text-sm text-gray-500 dark:text-slate-400 cursor-pointer hover:text-gray-700 dark:hover:text-slate-300">
                  {t('dashboard.viewFullHistory')} ({history.length} {t('dashboard.records')})
                </summary>
                <div className="mt-2 max-h-48 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-500 dark:text-slate-400 text-xs">
                      <tr>
                        <th className="text-left py-1">{t('automation.status.idle').split(' ')[0]}</th>
                        <th className="text-left py-1">{t('csv.columns.date')}</th>
                        <th className="text-left py-1">{t('dashboard.month')}</th>
                        <th className="text-left py-1">{t('csv.addRow')}</th>
                        <th className="text-left py-1">{t('dashboard.stats.avgDuration')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-slate-300">
                      {history.slice(0, 20).map((record) => (
                        <tr key={record.id} className="border-t border-gray-100 dark:border-slate-700/50">
                          <td className="py-1">
                            {record.status === 'success' ? '✅' :
                             record.status === 'error' ? '❌' :
                             record.status === 'partial' ? '⚠️' : '🚫'}
                          </td>
                          <td className="py-1">{formatDate(record.timestamp, locale)}</td>
                          <td className="py-1">{record.month} {record.year}</td>
                          <td className="py-1">{record.rowsProcessed}/{record.rowsTotal}</td>
                          <td className="py-1">{formatDuration(record.duration)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DashboardStats;
