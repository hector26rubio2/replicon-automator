/**
 * Native Notifications Service
 * Notificaciones del sistema operativo
 */

import { Notification, nativeImage, app } from 'electron';
import * as path from 'path';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: 'success' | 'error' | 'warning' | 'info';
  silent?: boolean;
  onClick?: () => void;
}

const ICON_PATHS: Record<string, string> = {
  success: 'success.png',
  error: 'error.png',
  warning: 'warning.png',
  info: 'info.png',
};

class NotificationService {
  private iconCache: Map<string, Electron.NativeImage> = new Map();

  /**
   * Mostrar notificación nativa
   */
  show(options: NotificationOptions): Notification | null {
    if (!Notification.isSupported()) {
      console.warn('Notifications not supported on this platform');
      return null;
    }

    const notification = new Notification({
      title: options.title,
      body: options.body,
      silent: options.silent ?? false,
      icon: this.getIcon(options.icon),
    });

    if (options.onClick) {
      notification.on('click', options.onClick);
    }

    notification.show();
    return notification;
  }

  /**
   * Notificación de éxito
   */
  success(title: string, body: string, onClick?: () => void): void {
    this.show({ title, body, icon: 'success', onClick });
  }

  /**
   * Notificación de error
   */
  error(title: string, body: string, onClick?: () => void): void {
    this.show({ title, body, icon: 'error', onClick });
  }

  /**
   * Notificación de advertencia
   */
  warning(title: string, body: string, onClick?: () => void): void {
    this.show({ title, body, icon: 'warning', onClick });
  }

  /**
   * Notificación informativa
   */
  info(title: string, body: string, onClick?: () => void): void {
    this.show({ title, body, icon: 'info', onClick });
  }

  /**
   * Notificación de automatización completada
   */
  automationComplete(success: boolean, processed: number, total: number): void {
    if (success) {
      this.success(
        '✅ Automatización Completada',
        `Se procesaron ${processed} de ${total} registros exitosamente.`
      );
    } else {
      this.error(
        '❌ Automatización Fallida',
        `Se procesaron ${processed} de ${total} registros. Revisa los logs.`
      );
    }
  }

  /**
   * Notificación de progreso (cada N registros)
   */
  progressUpdate(current: number, total: number): void {
    // Solo notificar en hitos (25%, 50%, 75%)
    const percentage = (current / total) * 100;
    const milestones = [25, 50, 75];
    
    for (const milestone of milestones) {
      if (percentage >= milestone && percentage < milestone + (100 / total)) {
        this.info(
          '📊 Progreso de Automatización',
          `${milestone}% completado (${current}/${total})`
        );
        break;
      }
    }
  }

  private getIcon(iconType?: string): Electron.NativeImage | undefined {
    if (!iconType) return undefined;

    if (this.iconCache.has(iconType)) {
      return this.iconCache.get(iconType);
    }

    try {
      const iconPath = path.join(app.getAppPath(), 'assets', 'icons', ICON_PATHS[iconType]);
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        this.iconCache.set(iconType, icon);
        return icon;
      }
    } catch {
      // Ignorar si no hay icono
    }

    return undefined;
  }
}

// Singleton
export const notificationService = new NotificationService();
