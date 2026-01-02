import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/ui';
import { useThemeStore } from './stores/theme-store';
import { useI18n } from './i18n';
import './styles/globals.css';

// Inicializar tema e idioma al cargar
const initializeApp = () => {
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
};

initializeApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
