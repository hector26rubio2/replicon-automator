import { vi } from 'vitest';

// Global mock for Electron API
globalThis.window = globalThis.window || {} as any;

(globalThis.window as any).electronAPI = {
  // CSV operations
  loadCSV: vi.fn(async () => ({ success: true, data: [], filePath: '/test.csv' })),
  saveCSV: vi.fn(async () => ({ success: true })),
  
  // Config operations
  getConfig: vi.fn(async () => null),
  setConfig: vi.fn(async () => ({ success: true })),
  
  // Credentials
  loadCredentials: vi.fn(async () => ({ success: true, data: null })),
  saveCredentials: vi.fn(async () => ({ success: true })),
  clearCredentials: vi.fn(async () => ({ success: true })),
  
  // Automation
  startAutomation: vi.fn(async () => ({ success: true })),
  stopAutomation: vi.fn(async () => ({ success: true })),
  pauseAutomation: vi.fn(async () => ({ success: true })),
  
  // Scheduler
  getScheduledTasks: vi.fn(async () => []),
  createScheduledTask: vi.fn(async () => ({ success: true })),
  updateScheduledTask: vi.fn(async () => ({ success: true })),
  deleteScheduledTask: vi.fn(async () => ({ success: true })),
  toggleScheduledTask: vi.fn(async () => ({ success: true })),
  runTaskNow: vi.fn(async () => ({ success: true })),
  
  // Templates
  getTemplates: vi.fn(async () => []),
  saveTemplate: vi.fn(async () => ({ success: true })),
  deleteTemplate: vi.fn(async () => ({ success: true })),
  
  // Logs
  sendLogToMain: vi.fn(),
  
  // Holidays
  getHolidays: vi.fn(async () => []),
  addHoliday: vi.fn(async () => ({ success: true })),
  deleteHoliday: vi.fn(async () => ({ success: true })),
};

export {};
