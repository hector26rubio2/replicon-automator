/**
 * Servicio para manejo de credenciales
 */

import Store from 'electron-store';
import type { Credentials } from '@shared/types';
import { createLogger } from '@main/utils';

const logger = createLogger('CredentialsService');

const store = new Store({
  name: 'credentials',
  encryptionKey: 'replicon-automator-v3-secure-key',
});

export class CredentialsService {
  /**
   * Guardar credenciales de forma segura
   */
  saveCredentials(credentials: Credentials): boolean {
    try {
      if (!credentials.rememberMe) {
        this.clearCredentials();
        return true;
      }

      store.set('credentials', {
        email: credentials.email,
        password: Buffer.from(credentials.password).toString('base64'),
        rememberMe: true,
      });

      return true;
    } catch (error) {
      logger.error('Error saving credentials', error);
      return false;
    }
  }

  /**
   * Cargar credenciales guardadas
   */
  loadCredentials(): Credentials | null {
    try {
      const saved = store.get('credentials') as {
        email: string;
        password: string;
        rememberMe: boolean;
      } | undefined;

      if (!saved) return null;

      return {
        email: saved.email,
        password: Buffer.from(saved.password, 'base64').toString('utf-8'),
        rememberMe: saved.rememberMe,
      };
    } catch (error) {
      logger.error('Error loading credentials', error);
      return null;
    }
  }

  /**
   * Eliminar credenciales guardadas
   */
  clearCredentials(): boolean {
    try {
      store.delete('credentials');
      logger.info('Credentials cleared');
      return true;
    } catch (error) {
      logger.error('Error clearing credentials', error);
      return false;
    }
  }
}
