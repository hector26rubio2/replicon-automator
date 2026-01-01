import type { LogEntry } from '../../../../shared/types';
import { formatTimestamp } from '../../../../shared/utils';

interface LogsTabProps {
  logs: LogEntry[];
}

export default function LogsTab({ logs }: LogsTabProps) {
  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'text-emerald-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-400';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Registro de Actividad
          </h2>
          <span className="text-slate-500 text-sm">{logs.length} entradas</span>
        </div>

        <div className="bg-dark-300 rounded-lg p-4 max-h-[600px] overflow-auto font-mono text-sm">
          {logs.length > 0 ? (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-3 py-1 border-b border-slate-800/50">
                  <span className="text-slate-500 shrink-0">[{formatTimestamp(new Date(log.timestamp))}]</span>
                  <span className="shrink-0">{getLevelIcon(log.level)}</span>
                  <span className={getLevelColor(log.level)}>{log.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p className="text-4xl mb-2">📭</p>
              <p>No hay registros aún</p>
              <p className="text-xs mt-1">Los logs aparecerán aquí cuando inicies una automatización</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="card bg-dark-200/50">
        <h3 className="font-semibold text-white mb-2">Leyenda</h3>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="text-emerald-400">Éxito</span>
          </div>
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span className="text-slate-300">Info</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-amber-400">Advertencia</span>
          </div>
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span className="text-red-400">Error</span>
          </div>
        </div>
      </div>
    </div>
  );
}
