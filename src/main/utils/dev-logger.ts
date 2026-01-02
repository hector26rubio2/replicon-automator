import { BrowserWindow, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let isSetup = false;
let logFilePath: string | null = null;
let isDev = false;

// Niveles que se loguean en producción (solo errores y warnings)
const PROD_LOG_LEVELS = ['error', 'warn', 'fatal'];

// Verificar si el nivel debe loguearse
function shouldLog(level: string): boolean {
  if (isDev) return true; // En dev, loguear todo
  return PROD_LOG_LEVELS.includes(level.toLowerCase());
}

// Limpiar códigos ANSI de color del mensaje
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

// Crear carpeta de logs en C:\RepliconLogs
function initLogFile() {
  try {
    const logDir = 'C:\\RepliconLogs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const date = new Date().toISOString().split('T')[0];
    logFilePath = path.join(logDir, `replicon-${date}.log`);
    writeRaw('='.repeat(60));
    writeRaw(`Session started at ${new Date().toISOString()}`);
    writeRaw(`App version: ${app.getVersion()}`);
    writeRaw(`Is packaged: ${app.isPackaged}`);
    writeRaw(`Platform: ${process.platform}`);
    writeRaw(`Arch: ${process.arch}`);
    writeRaw(`Node: ${process.version}`);
    writeRaw(`Electron: ${process.versions.electron}`);
    writeRaw('='.repeat(60));
  } catch (err) {
    // Can't log to file
  }
}

// Escribir línea sin formato adicional
function writeRaw(message: string) {
  if (!logFilePath) return;
  try {
    const cleanMessage = stripAnsi(message);
    fs.appendFileSync(logFilePath, `${cleanMessage}\n`);
  } catch {
    // Silently fail
  }
}

// Escribir log con timestamp y formato
function writeLog(level: string, source: string, message: string) {
  if (!logFilePath) return;
  if (!shouldLog(level)) return; // Solo loguear niveles permitidos
  
  try {
    const cleanMessage = stripAnsi(message);
    
    // Si el mensaje ya tiene formato de timestamp [2026-...], no agregar otro
    const hasTimestamp = /^\[20\d{2}-\d{2}-\d{2}T/.test(cleanMessage);
    
    if (hasTimestamp) {
      // El mensaje ya tiene formato, solo escribirlo
      fs.appendFileSync(logFilePath, `${cleanMessage}\n`);
    } else {
      const timestamp = new Date().toISOString();
      fs.appendFileSync(logFilePath, `[${timestamp}] [${level.toUpperCase()}] [${source}] ${cleanMessage}\n`);
    }
  } catch {
    // Silently fail
  }
}

// Exportar para uso directo desde otros módulos
export function logToFile(level: string, source: string, message: string) {
  if (!shouldLog(level)) return; // Solo loguear niveles permitidos
  writeLog(level, source, message);
}

export function setMainWindowForLogs(window: BrowserWindow | null) {
  mainWindow = window;
  writeLog('INFO', 'MAIN', 'Main window reference set');
}

function sendLogToRenderer(level: string, message: string) {
  // Escribir a archivo
  writeLog(level, 'MAIN', message);
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('main:log', { level, message });
    } catch {
      // Window may be closing
    }
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
  // Detectar si es desarrollo
  isDev = !app.isPackaged;
  
  // Inicializar archivo de logs siempre (dev y producción)
  initLogFile();
  
  if (isSetup) return;
  isSetup = true;

  // Capturar errores no manejados del proceso main
  process.on('uncaughtException', (error) => {
    writeLog('FATAL', 'MAIN', `Uncaught Exception: ${error.message}`);
    writeLog('FATAL', 'MAIN', `Stack: ${error.stack}`);
    
    // Mostrar diálogo de error en producción
    if (app.isPackaged) {
      const { dialog } = require('electron');
      dialog.showErrorBox('Application Error', `${error.message}\n\nCheck logs at C:\\RepliconLogs for details.`);
    }
  });

  process.on('unhandledRejection', (reason) => {
    writeLog('FATAL', 'MAIN', `Unhandled Rejection: ${String(reason)}`);
    if (reason instanceof Error) {
      writeLog('FATAL', 'MAIN', `Stack: ${reason.stack}`);
    }
  });

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

  writeLog('INFO', 'MAIN', 'Dev logger setup complete');
}

function formatArg(arg: unknown): string {
  if (typeof arg === 'string') return stripAnsi(arg);
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
}
