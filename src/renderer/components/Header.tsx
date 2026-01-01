import type { AutomationProgress } from '../../shared/types';

interface HeaderProps {
  status: AutomationProgress['status'];
  progress: AutomationProgress | null;
}

export default function Header({ status, progress }: HeaderProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'bg-emerald-500';
      case 'paused': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running': return 'En ejecución';
      case 'paused': return 'Pausado';
      case 'error': return 'Error';
      case 'completed': return 'Completado';
      default: return 'Inactivo';
    }
  };

  const progressPercent = progress 
    ? Math.round((progress.currentDay / progress.totalDays) * 100) 
    : 0;

  return (
    <header className="bg-dark-200/90 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-primary-500/30">
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Replicon Automator</h1>
              <p className="text-xs text-slate-400">v3.0 - Powered by Playwright</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Progress Bar */}
          {status === 'running' && progress && (
            <div className="flex items-center gap-3">
              <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-sm text-slate-300 min-w-[50px]">
                {progressPercent}%
              </span>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${status === 'running' ? 'animate-pulse' : ''}`} />
            <span className="text-sm text-slate-300">{getStatusText()}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
