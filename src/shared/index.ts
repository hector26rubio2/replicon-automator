/**
 * Barrel principal para módulo shared (common)
 * Single entry-point para types, utils, constants e IPC
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Utils
export * from './utils';

// Config helpers
export * from './config-helpers';

// IPC
export { IPC, type IpcChannel } from './ipc';

// Validation (Zod schemas)
export * from './validation';

// Retry utilities
export * from './retry';
