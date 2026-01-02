import { BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;

export function setMainWindowForLogs(window: BrowserWindow | null) {
  mainWindow = window;
}

function sendLogToRenderer(level: string, message: string) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('main:log', { level, message });
  }
}

// Interceptar console.log, console.error, etc.
const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

export function setupDevLogger() {
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) return;

  console.log = (...args: unknown[]) => {
    originalConsole.log(...args);
    sendLogToRenderer('info', args.map(formatArg).join(' '));
  };

  console.info = (...args: unknown[]) => {
    originalConsole.info(...args);
    sendLogToRenderer('info', args.map(formatArg).join(' '));
  };

  console.warn = (...args: unknown[]) => {
    originalConsole.warn(...args);
    sendLogToRenderer('warn', args.map(formatArg).join(' '));
  };

  console.error = (...args: unknown[]) => {
    originalConsole.error(...args);
    sendLogToRenderer('error', args.map(formatArg).join(' '));
  };

  console.debug = (...args: unknown[]) => {
    originalConsole.debug(...args);
    sendLogToRenderer('debug', args.map(formatArg).join(' '));
  };
}

function formatArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
}
