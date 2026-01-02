import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: 'main' | 'renderer';
}

export function DevLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    const isDev = import.meta.env.DEV;
    
    // Escuchar logs del proceso main
    const unsubscribe = window.electronAPI.onMainLog?.((log: { level: string; message: string }) => {
      // En producción, solo capturar errores
      if (!isDev && log.level !== 'error') return;
      
      const newLog: LogEntry = {
        id: idCounter.current++,
        timestamp: new Date().toLocaleTimeString(),
        level: log.level as LogEntry['level'],
        message: `[Main] ${log.message}`,
        source: 'main',
      };
      setLogs(prev => [...prev.slice(-200), newLog]);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  // Interceptar console del renderer
  useEffect(() => {
    const isDev = import.meta.env.DEV;

    const originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };

    const addLog = (level: LogEntry['level'], args: unknown[]) => {
      // En producción, solo capturar errores
      if (!isDev && level !== 'error') return;
      
      const message = args.map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
        try { return JSON.stringify(arg); } catch { return String(arg); }
      }).join(' ');

      const newLog: LogEntry = {
        id: idCounter.current++,
        timestamp: new Date().toLocaleTimeString(),
        level,
        message: `[Renderer] ${message}`,
        source: 'renderer',
      };
      setLogs(prev => [...prev.slice(-200), newLog]);
    };

    // Siempre interceptar para poder capturar errores en producción también
    console.log = (...args) => { originalConsole.log(...args); addLog('info', args); };
    console.info = (...args) => { originalConsole.info(...args); addLog('info', args); };
    console.warn = (...args) => { originalConsole.warn(...args); addLog('warn', args); };
    console.error = (...args) => { originalConsole.error(...args); addLog('error', args); };
    console.debug = (...args) => { originalConsole.debug(...args); addLog('debug', args); };

    return () => {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;
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

  const isDev = import.meta.env.DEV;

  // En producción, solo mostrar si hay errores
  if (!isDev && errorCount === 0) return null;

  // En producción, solo mostrar errores
  const displayLogs = isDev ? filteredLogs : logs.filter(l => l.level === 'error');

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-4 z-50 p-3 rounded-full shadow-lg transition-all duration-300 border-2 ${
          errorCount > 0 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse border-red-400' 
            : warnCount > 0
            ? 'bg-yellow-500 hover:bg-yellow-600 border-yellow-400'
            : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-500'
        }`}
        title={t('devLogs.title')}
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
        <div className="fixed inset-x-4 bottom-36 md:left-auto md:right-4 md:w-[600px] z-50 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[60vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <h3 className="font-semibold text-slate-900 dark:text-white">{t('devLogs.title')}</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">({logs.length} {t('devLogs.entries')})</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Filtros - solo en desarrollo */}
              {isDev && (
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  className="text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded px-2 py-1 border border-slate-300 dark:border-slate-600"
                >
                  <option value="all">{t('devLogs.filters.all')}</option>
                  <option value="error">{t('devLogs.filters.errors')} ({errorCount})</option>
                  <option value="warn">{t('devLogs.filters.warnings')} ({warnCount})</option>
                  <option value="info">{t('devLogs.filters.info')}</option>
                  <option value="debug">{t('devLogs.filters.debug')}</option>
                </select>
              )}
              <button
                onClick={() => setLogs([])}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1"
                title={t('devLogs.clear')}
              >
                🗑️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 bg-slate-50 dark:bg-slate-900">
            {displayLogs.length === 0 ? (
              <div className="text-center text-slate-500 dark:text-slate-500 py-8">
                {t('devLogs.noLogs')}
              </div>
            ) : (
              displayLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded ${getLevelColor(log.level)}`}
                >
                  <div className="flex items-start gap-2">
                    <span>{getLevelIcon(log.level)}</span>
                    <span className="text-slate-500 dark:text-slate-500 shrink-0">{log.timestamp}</span>
                    <span className="break-all whitespace-pre-wrap text-slate-900 dark:text-slate-200">{log.message}</span>
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
