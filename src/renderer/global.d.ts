import type {
  AutomationProgress,
  Credentials,
  CSVRow,
  LogEntry,
  StartAutomationRequest,
} from '../shared/types';

declare global {
  interface Window {
    electronAPI: {
      // CSV
      loadCSV: () => Promise<{ success: boolean; data?: CSVRow[]; error?: string; filePath?: string }>;
      saveCSV: (data: CSVRow[]) => Promise<{ success: boolean; error?: string }>;

      // Credenciales
      saveCredentials: (credentials: Credentials) => Promise<boolean>;
      loadCredentials: () => Promise<Credentials | null>;
      clearCredentials: () => Promise<boolean>;

      // Config
      getConfig: (key: string) => Promise<unknown>;
      setConfig: (key: string, value: unknown) => Promise<boolean>;

      // Automatización
      startAutomation: (request: StartAutomationRequest) => Promise<{ success: boolean; error?: string }>;
      stopAutomation: () => Promise<{ success: boolean }>;
      pauseAutomation: () => Promise<{ success: boolean }>;

      // Eventos
      onAutomationProgress: (callback: (progress: AutomationProgress) => void) => () => void;
      onAutomationLog: (callback: (log: LogEntry) => void) => () => void;
      onAutomationComplete: (callback: (result: { success: boolean }) => void) => () => void;
      onAutomationError: (callback: (error: { error: string }) => void) => () => void;
    };
  }
}

export {};
