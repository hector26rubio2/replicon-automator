/**
 * Unified Credentials Service - Servicio unificado de credenciales
 * Usa safeStorage de Electron cuando está disponible, con fallback a cifrado básico
 */

import { safeStorage } from 'electron';
import Store from 'electron-store';
import type { Credentials } from '../../shared/types';
import { createLogger } from '../utils';

const logger = createLogger('CredentialsService');

// Store para credenciales encriptadas
const store = new Store<{
  credentials?: {
    email: string;
    password: string;
    rememberMe: boolean;
    encrypted: boolean;
  };
}>({
  name: 'secure-credentials-v2',
});

/**
 * Check if OS-level encryption is available
 */
export function isEncryptionAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

/**
 * Encrypt a string using safeStorage or fallback to base64
 */
function encryptString(value: string): string {
  if (isEncryptionAvailable()) {
    return safeStorage.encryptString(value).toString('base64');
  }
  // Fallback: simple base64 (not secure, but maintains functionality)
  return Buffer.from(value).toString('base64');
}

/**
 * Decrypt a string using safeStorage or fallback from base64
 */
function decryptString(encrypted: string, wasEncrypted: boolean): string {
  if (wasEncrypted && isEncryptionAvailable()) {
    const buffer = Buffer.from(encrypted, 'base64');
    return safeStorage.decryptString(buffer);
  }
  // Fallback: decode from base64
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

/**
 * Save credentials securely
 */
export function saveCredentials(credentials: Credentials): boolean {
  try {
    if (!credentials.rememberMe) {
      clearCredentials();
      return true;
    }

    const encrypted = isEncryptionAvailable();
    
    store.set('credentials', {
      email: encryptString(credentials.email),
      password: encryptString(credentials.password),
      rememberMe: true,
      encrypted,
    });

    logger.info(`Credentials saved (encrypted: ${encrypted})`);
    return true;
  } catch (error) {
    logger.error('Error saving credentials', error);
    return false;
  }
}

/**
 * Load saved credentials
 */
export function loadCredentials(): Credentials | null {
  try {
    const saved = store.get('credentials');
    if (!saved) return null;

    return {
      email: decryptString(saved.email, saved.encrypted),
      password: decryptString(saved.password, saved.encrypted),
      rememberMe: saved.rememberMe,
    };
  } catch (error) {
    logger.error('Error loading credentials', error);
    // Clear corrupted credentials
    clearCredentials();
    return null;
  }
}

/**
 * Clear saved credentials
 */
export function clearCredentials(): boolean {
  try {
    store.delete('credentials');
    logger.info('Credentials cleared');
    return true;
  } catch (error) {
    logger.error('Error clearing credentials', error);
    return false;
  }
}

/**
 * Check if credentials exist
 */
export function hasCredentials(): boolean {
  return store.has('credentials');
}

/**
 * Migrate from old credentials format
 */
export async function migrateCredentials(): Promise<void> {
  try {
    // Check old store
    const oldStore = new Store({ name: 'credentials' });
    const oldCreds = oldStore.get('credentials') as {
      email: string;
      password: string;
      rememberMe: boolean;
    } | undefined;

    if (oldCreds && !hasCredentials()) {
      // Migrate to new format
      const password = Buffer.from(oldCreds.password, 'base64').toString('utf-8');
      saveCredentials({
        email: oldCreds.email,
        password,
        rememberMe: oldCreds.rememberMe,
      });
      
      // Clear old store
      oldStore.delete('credentials');
      logger.info('Migrated credentials to new secure format');
    }
  } catch (error) {
    logger.warn('Could not migrate old credentials', error);
  }
}

// Export class for backward compatibility
export class CredentialsService {
  saveCredentials = (creds: Credentials) => saveCredentials(creds);
  loadCredentials = () => loadCredentials();
  clearCredentials = () => clearCredentials();
  hasCredentials = () => hasCredentials();
  isEncryptionAvailable = () => isEncryptionAvailable();
}

// Singleton instance
export const credentialsService = new CredentialsService();
