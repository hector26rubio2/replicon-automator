import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useThemeStore } from './stores/theme-store';
import { useI18n } from './i18n';
import './styles/globals.css';

// Helper para enviar logs al main process (para archivo)
const sendLog = (level: string, source: string, message: string) => {
  window.electronAPI?.sendLogToMain?.(level, source, message);
};

// Capturar errores globales del renderer
window.onerror = (message, source, lineno, colno, error) => {
  const errorMsg = `${message} at ${source}:${lineno}:${colno} - ${error?.stack || error}`;
  console.error(`[RENDERER ERROR] ${errorMsg}`);
  sendLog('ERROR', 'GlobalError', errorMsg);
  return false;
};

window.onunhandledrejection = (event) => {
  const errorMsg = event.reason?.stack || event.reason?.message || String(event.reason);
  console.error('[RENDERER UNHANDLED REJECTION]', errorMsg);
  sendLog('ERROR', 'UnhandledRejection', errorMsg);
};

// Log de inicio
console.log('[Renderer] Starting renderer process...');
sendLog('INFO', 'Main', 'Starting renderer process');

// Inicializar tema e idioma al cargar
const initializeApp = () => {
  console.log('[Renderer] Initializing app...');
  sendLog('INFO', 'Main', 'Initializing app');
  
  // Forzar la hidratación del store de tema
  const themeState = useThemeStore.getState();
  const resolvedTheme = themeState.theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : themeState.theme;
  
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(resolvedTheme);
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  
  // Forzar la hidratación del store de idioma
  const langState = useI18n.getState();
  document.documentElement.lang = langState.language;
  console.log('[Renderer] App initialized');
  sendLog('INFO', 'Main', 'App initialized');
};

initializeApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
