/**
 * Preload Script - Bridge between Main and Renderer
 * Expone APIs seguras al proceso renderer via contextBridge
 */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IPC } from '@shared/ipc';
import type { 
  StartAutomationRequest, 
  Credentials, 
  CSVRow, 
  AutomationProgress,
  LogEntry,
  ConfigKey 
} from '@shared/types';

interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

// Exponer APIs seguras al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // CSV
  loadCSV: () => ipcRenderer.invoke(IPC.CSV_LOAD),
  saveCSV: (data: CSVRow[]) => ipcRenderer.invoke(IPC.CSV_SAVE, data),

  // Credenciales
  saveCredentials: (credentials: Credentials) => 
    ipcRenderer.invoke(IPC.CREDENTIALS_SAVE, credentials),
  loadCredentials: () => ipcRenderer.invoke(IPC.CREDENTIALS_LOAD),
  clearCredentials: () => ipcRenderer.invoke(IPC.CREDENTIALS_CLEAR),

  // Config
  getConfig: (key: ConfigKey) => ipcRenderer.invoke(IPC.CONFIG_GET, key),
  setConfig: (key: ConfigKey, value: unknown) => ipcRenderer.invoke(IPC.CONFIG_SET, key, value),

  // Automatización
  startAutomation: (request: StartAutomationRequest) => 
    ipcRenderer.invoke(IPC.AUTOMATION_START, request),
  stopAutomation: () => ipcRenderer.invoke(IPC.AUTOMATION_STOP),
  pauseAutomation: () => ipcRenderer.invoke(IPC.AUTOMATION_PAUSE),

  // Eventos de automatización
  onAutomationProgress: (callback: (progress: AutomationProgress) => void) => {
    const handler = (_: IpcRendererEvent, progress: AutomationProgress) => callback(progress);
    ipcRenderer.on(IPC.AUTOMATION_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC.AUTOMATION_PROGRESS, handler);
  },
  onAutomationLog: (callback: (log: LogEntry) => void) => {
    const handler = (_: IpcRendererEvent, log: LogEntry) => callback(log);
    ipcRenderer.on(IPC.AUTOMATION_LOG, handler);
    return () => ipcRenderer.removeListener(IPC.AUTOMATION_LOG, handler);
  },
  onAutomationComplete: (callback: (result: { success: boolean }) => void) => {
    const handler = (_: IpcRendererEvent, result: { success: boolean }) => callback(result);
    ipcRenderer.on(IPC.AUTOMATION_COMPLETE, handler);
    return () => ipcRenderer.removeListener(IPC.AUTOMATION_COMPLETE, handler);
  },
  onAutomationError: (callback: (error: { error: string }) => void) => {
    const handler = (_: IpcRendererEvent, error: { error: string }) => callback(error);
    ipcRenderer.on(IPC.AUTOMATION_ERROR, handler);
    return () => ipcRenderer.removeListener(IPC.AUTOMATION_ERROR, handler);
  },

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateProgress: (callback: (progress: UpdateProgress) => void) => {
    const handler = (_: IpcRendererEvent, progress: UpdateProgress) => callback(progress);
    ipcRenderer.on('update-download-progress', handler);
    return () => ipcRenderer.removeListener('update-download-progress', handler);
  },
});
