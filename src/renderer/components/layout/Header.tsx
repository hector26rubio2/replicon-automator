import type { AutomationProgress } from '@shared/types';
import type { ReactNode } from 'react';
import { getStatusColor, getStatusTranslationKey, getProgressPercent } from '../../utils/status';
import { useTranslation } from '@/i18n';

interface HeaderProps {
  status: AutomationProgress['status'];
  progress: AutomationProgress | null;
  children?: ReactNode;
}

export default function Header({ status, progress, children }: HeaderProps) {
  const { t } = useTranslation();
  const progressPercent = getProgressPercent(progress);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-dark-200/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-6 py-4 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-primary-500/30">
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('header.title')}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('header.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Progress Bar */}
          {status === 'running' && progress && (
            <div className="flex items-center gap-3" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
              <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300 min-w-[50px]">
                {progressPercent}%
              </span>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-2" aria-live="polite">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} ${status === 'running' ? 'animate-pulse' : ''}`} />
            <span className="text-sm text-slate-600 dark:text-slate-300">{t(getStatusTranslationKey(status))}</span>
          </div>

          {/* Extra controls (theme toggle, etc.) */}
          {children}
        </div>
      </div>
    </header>
  );
}
