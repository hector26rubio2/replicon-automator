/**
 * Secure Credentials Service - Encriptación con safeStorage de Electron
 */

import { safeStorage } from 'electron';
import Store from 'electron-store';

interface EncryptedCredentials {
  username: string; // Encrypted
  password: string; // Encrypted
}

const store = new Store<{ encryptedCreds?: EncryptedCredentials }>({
  name: 'secure-credentials',
});

/**
 * Check if encryption is available
 */
export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable();
}

/**
 * Encrypt and save credentials
 */
export function saveSecureCredentials(username: string, password: string): boolean {
  try {
    if (!isEncryptionAvailable()) {
      console.warn('Encryption not available, falling back to plain storage');
      store.set('encryptedCreds', { username, password });
      return true;
    }

    const encryptedUsername = safeStorage.encryptString(username).toString('base64');
    const encryptedPassword = safeStorage.encryptString(password).toString('base64');

    store.set('encryptedCreds', {
      username: encryptedUsername,
      password: encryptedPassword,
    });

    return true;
  } catch (error) {
    console.error('Failed to save secure credentials:', error);
    return false;
  }
}

/**
 * Load and decrypt credentials
 */
export function loadSecureCredentials(): { username: string; password: string } | null {
  try {
    const creds = store.get('encryptedCreds');
    if (!creds) return null;

    if (!isEncryptionAvailable()) {
      // Return as-is if encryption wasn't used
      return creds as { username: string; password: string };
    }

    const usernameBuffer = Buffer.from(creds.username, 'base64');
    const passwordBuffer = Buffer.from(creds.password, 'base64');

    const username = safeStorage.decryptString(usernameBuffer);
    const password = safeStorage.decryptString(passwordBuffer);

    return { username, password };
  } catch (error) {
    console.error('Failed to load secure credentials:', error);
    return null;
  }
}

/**
 * Delete stored credentials
 */
export function deleteSecureCredentials(): void {
  store.delete('encryptedCreds');
}

/**
 * Check if credentials exist
 */
export function hasSecureCredentials(): boolean {
  return store.has('encryptedCreds');
}

/**
 * Migrate from old credentials store to secure storage
 */
export function migrateToSecureStorage(oldUsername: string, oldPassword: string): boolean {
  if (!oldUsername || !oldPassword) return false;
  
  const saved = saveSecureCredentials(oldUsername, oldPassword);
  return saved;
}
