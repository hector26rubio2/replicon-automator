import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react';
import { Header, TabNavigation, ToastProvider, useToast, ErrorBoundary, DropZone, NetworkStatusIndicator, NetworkErrorBanner, AnimatedTab, SkipToContent, UpdateChecker } from './components';
import { ThemeToggle } from './components/ThemeToggle';
import { ShortcutsHelp, useShortcutsHelp } from './components/ShortcutsHelp';
import { useAutomation, useCSV, useConfig, useExitConfirmation } from './hooks';
import { useAppShortcuts } from './hooks/useKeyboardShortcuts';
import { useThemeStore } from './stores/theme-store';
import { useUnsavedChangesStore } from './stores/unsaved-changes-store';
import { ToastContainer } from './components/ui/ToastContainer';
import { CommandPalette, useCommandPalette, type Command } from './components/CommandPalette';
import { OnboardingTour } from './components/OnboardingTour';
import { LanguageSelectorCompact } from './components/LanguageSelector';
import { SoundToggle } from './components/SoundSettings';
import { useTranslation } from './i18n';
import type { Credentials } from '@shared/types';

const AutomationTab = lazy(() => import('./components/tabs/automation/AutomationTab'));
const CSVEditorTab = lazy(() => import('./components/tabs/csv-editor/CSVEditorTab'));
const ConfigTab = lazy(() => import('./components/tabs/config/ConfigTab'));
const LogsTab = lazy(() => import('./components/tabs/logs/LogsTab'));

type TabId = 'automation' | 'csv-editor' | 'config' | 'dashboard';

function TabLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse text-slate-400 dark:text-slate-400">Loading...</div>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('automation');
  const [credentials, setCredentials] = useState<Credentials>({ email: '', password: '', rememberMe: false });
  const { showToast } = useToast();
  const automation = useAutomation();
  const csv = useCSV(showToast);
  const config = useConfig();
  const { toggleTheme } = useThemeStore();
  const shortcutsHelp = useShortcutsHelp();
  const commandPalette = useCommandPalette();
  const { setUnsavedChanges } = useUnsavedChangesStore();
  const { language, setLanguage, t } = useTranslation();

  useExitConfirmation();

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'es' ? 'en' : 'es');
  }, [language, setLanguage]);

  useEffect(() => { window.electronAPI.loadCredentials().then(s => s && setCredentials(s)); }, []);

  const tabs = useMemo(() => [
    { id: 'automation' as TabId, label: t('nav.automation'), icon: '🚀' },
    { id: 'csv-editor' as TabId, label: t('nav.csv'), icon: '📝' },
    { id: 'config' as TabId, label: t('nav.config'), icon: '⚙️' },
    { id: 'dashboard' as TabId, label: t('nav.dashboard'), icon: '📊' },
  ], [t, language]);

  const handleStart = useCallback(async () => {
    if (!csv.data?.length) {
      showToast('warning', t('csv.loadFirst'));
      return;
    }
    if (!credentials.email || !credentials.password) {
      showToast('warning', t('automation.configureFirst'));
      return;
    }
    if (credentials.rememberMe) await window.electronAPI.saveCredentials(credentials);
    await automation.start({ credentials, csvData: csv.data, horarios: config.horarios, mappings: config.mappings, config: config.appConfig });
  }, [csv.data, credentials, config, automation, showToast, t]);

  const handleGoToTab = useCallback((index: number) => {
    const tabIds: TabId[] = ['automation', 'csv-editor', 'config', 'dashboard'];
    if (index >= 0 && index < tabIds.length) {
      setActiveTab(tabIds[index]);
    }
  }, []);

  useEffect(() => {
    setUnsavedChanges('csv', (csv.data?.length ?? 0) > 0);
  }, [csv.data, setUnsavedChanges]);

  const commands: Command[] = useMemo(() => [
    { id: 'run', label: t('automation.startButton'), icon: '🚀', shortcut: 'Ctrl+R', category: t('nav.automation'), action: handleStart },
    { id: 'stop', label: t('automation.stopButton'), icon: '⏹️', category: t('nav.automation'), action: automation.stop },
    { id: 'load-csv', label: t('csv.loadFile'), icon: '📂', shortcut: 'Ctrl+O', category: t('common.info'), action: csv.loadCSV },
    { id: 'save-csv', label: t('csv.saveFile'), icon: '💾', shortcut: 'Ctrl+S', category: t('common.info'), action: csv.saveCSV },
    { id: 'tab-automation', label: `${t('shortcuts.list.tab1')}`, icon: '🚀', shortcut: 'Ctrl+1', category: t('shortcuts.navigation'), action: () => setActiveTab('automation') },
    { id: 'tab-csv', label: `${t('shortcuts.list.tab2')}`, icon: '📝', shortcut: 'Ctrl+2', category: t('shortcuts.navigation'), action: () => setActiveTab('csv-editor') },
    { id: 'tab-config', label: `${t('shortcuts.list.tab3')}`, icon: '⚙️', shortcut: 'Ctrl+3', category: t('shortcuts.navigation'), action: () => setActiveTab('config') },
    { id: 'tab-dashboard', label: `${t('shortcuts.list.tab4')}`, icon: '📊', shortcut: 'Ctrl+4', category: t('shortcuts.navigation'), action: () => setActiveTab('dashboard') },
    { id: 'toggle-theme', label: t('shortcuts.list.toggleTheme'), icon: '🌓', shortcut: 'Ctrl+Shift+T', category: t('config.app.title'), action: toggleTheme },
    { id: 'toggle-language', label: `${t('config.app.language')} (ES/EN)`, icon: '🌐', shortcut: 'Ctrl+Shift+L', category: t('config.app.title'), action: toggleLanguage },
    { id: 'shortcuts', label: t('shortcuts.title'), icon: '⌨️', shortcut: '?', category: t('common.info'), action: shortcutsHelp.open },
  ], [handleStart, automation.stop, csv.loadCSV, csv.saveCSV, toggleTheme, toggleLanguage, shortcutsHelp.open, t]);

  useAppShortcuts({
    onSave: csv.saveCSV,
    onLoad: csv.loadCSV,
    onRun: handleStart,
    onStop: automation.stop,
    onToggleTheme: toggleTheme,
    onToggleLanguage: toggleLanguage,
    onGoToTab: handleGoToTab,
    onOpenCommandPalette: commandPalette.open,
    onUndo: csv.undo,
    onRedo: csv.redo,
  });

  const handleFileDrop = useCallback((file: File) => {
    if (file.name.toLowerCase().endsWith('.csv')) {
      csv.loadCSVFromFile(file);
    }
  }, [csv]);

  return (
    <DropZone onFileDrop={handleFileDrop} className="h-screen flex flex-col bg-white dark:bg-dark-200 text-gray-900 dark:text-gray-100 transition-colors overflow-hidden">
      <SkipToContent targetId="main-content" />
      <div className="flex-shrink-0 z-40 bg-white dark:bg-dark-200 shadow-sm">
        <Header status={automation.status} progress={automation.progress}>
          <div className="flex items-center gap-2">
            <NetworkStatusIndicator />
            <SoundToggle />
            <LanguageSelectorCompact />
            <ThemeToggle />
          </div>
        </Header>
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <main id="main-content" className="flex-1 p-6 overflow-auto min-h-0" role="main" aria-label={t('nav.' + activeTab)}>
        <NetworkErrorBanner />
        <Suspense fallback={<TabLoader />}>
          {/* Keep CSVEditorTab mounted to preserve state */}
          <div className={activeTab === 'automation' ? '' : 'hidden'}>
            <AnimatedTab activeKey="automation">
              <AutomationTab credentials={credentials} onCredentialsChange={setCredentials} csvData={csv.data} csvFileName={csv.fileName} onLoadCSV={csv.loadCSV} onStartAutomation={handleStart} onStopAutomation={automation.stop} onPauseAutomation={automation.togglePause} status={automation.status} progress={automation.progress} isPaused={automation.isPaused} logs={automation.logs} />
            </AnimatedTab>
          </div>
          <div className={activeTab === 'csv-editor' ? '' : 'hidden'}>
            <AnimatedTab activeKey="csv-editor">
              <CSVEditorTab data={csv.data} onDataChange={csv.setData} onLoadCSV={csv.loadCSV} onSaveCSV={csv.saveCSV} mappings={config.mappings} />
            </AnimatedTab>
          </div>
          <div className={activeTab === 'config' ? '' : 'hidden'}>
            <AnimatedTab activeKey="config">
              <ConfigTab horarios={config.horarios} onHorariosChange={config.setHorarios} mappings={config.mappings} onMappingsChange={config.setMappings} appConfig={config.appConfig} onAppConfigChange={config.setAppConfig} />
            </AnimatedTab>
          </div>
          <div className={activeTab === 'dashboard' ? '' : 'hidden'}>
            <AnimatedTab activeKey="dashboard">
              <LogsTab />
            </AnimatedTab>
          </div>
        </Suspense>
      </main>
      <footer className="flex-shrink-0 py-4 px-6 text-center text-slate-500 dark:text-slate-400 text-sm bg-gray-50 dark:bg-dark-300 border-t border-slate-200 dark:border-slate-700 flex items-center justify-center gap-4">
        <span className="font-medium">Replicon Automator</span>
        <UpdateChecker />
        {csv.canUndo && (
          <button onClick={csv.undo} className="text-xs hover:text-primary-500 transition-colors" data-tooltip={`${t('common.undo')} (Ctrl+Z)`}>
            ↩️ {t('common.undo')}
          </button>
        )}
        {csv.canRedo && (
          <button onClick={csv.redo} className="text-xs hover:text-primary-500 transition-colors" data-tooltip={`${t('common.redo')} (Ctrl+Y)`}>
            ↪️ {t('common.redo')}
          </button>
        )}
        <button 
          onClick={shortcutsHelp.open}
          className="text-xs hover:text-primary-500 transition-colors"
          data-tooltip={t('shortcuts.title')}
        >
          ⌨️ {t('shortcuts.title')}
        </button>
      </footer>
      <ShortcutsHelp isOpen={shortcutsHelp.isOpen} onClose={shortcutsHelp.close} />
      <CommandPalette commands={commands} isOpen={commandPalette.isOpen} onClose={commandPalette.close} />
      <ToastContainer />
      <OnboardingTour />
    </DropZone>
  );
}

export default function App() {
  useEffect(() => {
    const theme = useThemeStore.getState().resolvedTheme;
    document.documentElement.classList.add(theme);
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}
