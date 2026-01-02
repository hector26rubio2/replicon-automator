import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export function DevLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    // Escuchar logs del proceso main
    const unsubscribe = window.electronAPI.onMainLog?.((log: { level: string; message: string }) => {
      const newLog: LogEntry = {
        id: idCounter.current++,
        timestamp: new Date().toLocaleTimeString(),
        level: log.level as LogEntry['level'],
        message: log.message,
      };
      setLogs(prev => [...prev.slice(-200), newLog]); // Mantener últimos 200 logs
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll al final
    if (isOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500 bg-red-500/10';
      case 'warn': return 'text-yellow-500 bg-yellow-500/10';
      case 'info': return 'text-blue-500 bg-blue-500/10';
      case 'debug': return 'text-gray-500 bg-gray-500/10';
      default: return 'text-gray-400';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🔧';
      default: return '📝';
    }
  };

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;

  // Solo mostrar en desarrollo
  if (!import.meta.env.DEV) return null;

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all duration-300 ${
          errorCount > 0 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : warnCount > 0
            ? 'bg-yellow-500 hover:bg-yellow-600'
            : 'bg-slate-700 hover:bg-slate-600'
        }`}
        title="Dev Logs"
      >
        <span className="text-xl">📋</span>
        {(errorCount > 0 || warnCount > 0) && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {errorCount || warnCount}
          </span>
        )}
      </button>

      {/* Panel de logs */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-20 md:left-auto md:right-4 md:w-[600px] z-50 bg-slate-900 rounded-lg shadow-2xl border border-slate-700 overflow-hidden max-h-[60vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <h3 className="font-semibold text-white">Dev Logs</h3>
              <span className="text-xs text-slate-400">({logs.length} entries)</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Filtros */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="text-xs bg-slate-700 text-white rounded px-2 py-1 border border-slate-600"
              >
                <option value="all">All</option>
                <option value="error">Errors ({errorCount})</option>
                <option value="warn">Warnings ({warnCount})</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
              <button
                onClick={() => setLogs([])}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
                title="Clear logs"
              >
                🗑️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                No logs yet...
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded ${getLevelColor(log.level)}`}
                >
                  <div className="flex items-start gap-2">
                    <span>{getLevelIcon(log.level)}</span>
                    <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                    <span className="break-all whitespace-pre-wrap">{log.message}</span>
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </>
  );
}
