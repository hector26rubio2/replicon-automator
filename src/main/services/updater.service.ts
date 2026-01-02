import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, dialog, app } from 'electron';
import { notificationService } from './notification.service';
import { createLogger } from '../utils';
import { t } from '../i18n';

const logger = createLogger('AutoUpdater');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

export interface UpdaterCallbacks {
  onCheckingForUpdate?: () => void;
  onUpdateAvailable?: (info: UpdateInfo) => void;
  onUpdateNotAvailable?: (info: UpdateInfo) => void;
  onDownloadProgress?: (progress: ProgressInfo) => void;
  onUpdateDownloaded?: (info: UpdateInfo) => void;
  onError?: (error: Error) => void;
}

class UpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private isChecking = false;
  private updateDownloaded = false;
  private lastUpdateInfo: UpdateInfo | null = null;
  private updateAvailable = false;
  private dialogShowing = false; // Evitar múltiples diálogos
  private isDownloading = false; // Evitar múltiples descargas

  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // En modo desarrollo, permitir probar el updater
    if (isDev) {
      autoUpdater.forceDevUpdateConfig = true;
    }

    autoUpdater.logger = {
      info: (msg: string) => logger.info(String(msg)),
      warn: (msg: string) => logger.warn(String(msg)),
      error: (msg: string) => logger.error(String(msg)),
      debug: (msg: string) => logger.info(String(msg)),
    };

    this.setupListeners();

    setTimeout(() => this.checkForUpdates(true), 5000);

    setInterval(() => this.checkForUpdates(true), 4 * 60 * 60 * 1000);
  }

  private setupListeners(): void {
    autoUpdater.on('checking-for-update', () => {
      logger.info('Checking for updates...');
      this.isChecking = true;
    });

    autoUpdater.on('update-available', async (info: UpdateInfo) => {
      logger.info(`Update available: ${info.version}`);
      this.isChecking = false;
      this.updateAvailable = true;
      this.lastUpdateInfo = info;

      // Solo mostrar diálogo si no hay otro abierto
      if (this.dialogShowing) return;
      this.dialogShowing = true;

      if (this.mainWindow && this.mainWindow.isVisible()) {
        const result = await dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: t('updates.availableTitle'),
          message: t('updates.availableMessage', { version: info.version }),
          detail: t('updates.availableDetail', { version: info.version, currentVersion: app.getVersion() }),
          buttons: [t('updates.download'), t('updates.later')],
          defaultId: 0,
          cancelId: 1,
        });

        this.dialogShowing = false;

        if (result.response === 0) {
          this.downloadUpdate();
        }
      } else {
        this.dialogShowing = false;
        notificationService.info(
          t('updates.available'),
          t('updates.availableDesc', { version: info.version }),
          () => this.downloadUpdate()
        );
      }
    });

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      logger.info(`No updates available. Current version: ${info.version}`);
      this.isChecking = false;
      this.updateAvailable = false;
      this.lastUpdateInfo = info;
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      const percent = Math.round(progress.percent);
      logger.info(`Download progress: ${percent}%`);

      this.mainWindow?.webContents.send('update-download-progress', {
        percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      });

      this.mainWindow?.setProgressBar(progress.percent / 100);
    });

    autoUpdater.on('update-downloaded', async (info: UpdateInfo) => {
      logger.info(`Update downloaded: ${info.version}`);
      
      // Evitar procesar si ya estaba marcado como descargado
      if (this.updateDownloaded) {
        logger.info('Update already marked as downloaded, skipping dialog');
        return;
      }
      
      this.updateDownloaded = true;
      this.isDownloading = false;
      this.lastUpdateInfo = info;

      this.mainWindow?.setProgressBar(-1);

      // Notificar al renderer que la actualización está lista
      this.mainWindow?.webContents.send('update-downloaded', {
        version: info.version,
      });

      // Solo mostrar diálogo si no hay otro abierto
      if (this.dialogShowing) return;
      this.dialogShowing = true;

      if (this.mainWindow && this.mainWindow.isVisible()) {
        const result = await dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: t('updates.installTitle'),
          message: t('updates.installMessage', { version: info.version }),
          detail: t('updates.installDetail'),
          buttons: [t('updates.restartNow'), t('updates.later')],
          defaultId: 0,
          cancelId: 1,
        });

        this.dialogShowing = false;

        if (result.response === 0) {
          this.installUpdate();
        }
      } else {
        this.dialogShowing = false;
        notificationService.success(
          t('updates.ready'),
          t('updates.readyDesc', { version: info.version }),
          () => this.installUpdate()
        );
      }
    });

    autoUpdater.on('error', (error: Error) => {
      logger.error('Auto-updater error:', error);
      this.isChecking = false;
      this.mainWindow?.setProgressBar(-1);
    });
  }

  async checkForUpdates(silent = false): Promise<{ updateAvailable: boolean; version: string }> {
    // Si ya hay una actualización descargada, mostrar diálogo de instalación
    if (this.updateDownloaded && this.lastUpdateInfo) {
      logger.info('Update already downloaded, showing install dialog');
      this.showInstallDialog(this.lastUpdateInfo);
      return { 
        updateAvailable: true, 
        version: this.lastUpdateInfo.version 
      };
    }

    // Si ya está verificando, esperar un momento y retornar estado actual
    if (this.isChecking) {
      logger.info('Already checking for updates, returning current state');
      return { 
        updateAvailable: this.updateAvailable, 
        version: this.lastUpdateInfo?.version || app.getVersion() 
      };
    }

    try {
      this.updateAvailable = false;
      this.isChecking = true;
      
      const result = await autoUpdater.checkForUpdates();

      // Esperar un momento para que los eventos se procesen
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.isChecking = false; // Asegurar que se resetea

      return {
        updateAvailable: this.updateAvailable,
        version: result?.updateInfo?.version || app.getVersion()
      };
    } catch (error) {
      logger.error('Failed to check for updates:', error);
      this.isChecking = false;
      if (!silent) {
        notificationService.error(
          t('updates.checkError'),
          t('updates.checkErrorDesc')
        );
      }
      throw error;
    }
  }

  private async showInstallDialog(info: UpdateInfo): Promise<void> {
    if (this.dialogShowing) return;
    this.dialogShowing = true;

    if (this.mainWindow && this.mainWindow.isVisible()) {
      const result = await dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: t('updates.installTitle'),
        message: t('updates.installMessage', { version: info.version }),
        detail: t('updates.installDetail'),
        buttons: [t('updates.restartNow'), t('updates.later')],
        defaultId: 0,
        cancelId: 1,
      });

      this.dialogShowing = false;

      if (result.response === 0) {
        this.installUpdate();
      }
    } else {
      this.dialogShowing = false;
    }
  }

  async downloadUpdate(): Promise<void> {
    // Si ya está descargada o descargando, no hacer nada
    if (this.updateDownloaded) {
      logger.info('Update already downloaded, skipping download');
      return;
    }

    if (this.isDownloading) {
      logger.info('Download already in progress, skipping');
      return;
    }

    this.isDownloading = true;

    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      logger.error('Failed to download update:', error);
      this.isDownloading = false;
      notificationService.error(
        t('updates.downloadError'),
        t('updates.downloadErrorDesc')
      );
    }
  }

  installUpdate(): void {
    if (this.updateDownloaded) {
      autoUpdater.quitAndInstall(false, true);
    }
  }

  // Llamar antes de cerrar la app
  async promptInstallOnQuit(): Promise<boolean> {
    if (!this.updateDownloaded || !this.lastUpdateInfo) {
      return true; // Permitir cerrar
    }

    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return true;
    }

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'question',
      title: t('updates.installBeforeQuit'),
      message: t('updates.installBeforeQuitMessage', { version: this.lastUpdateInfo.version }),
      detail: t('updates.installBeforeQuitDetail'),
      buttons: [t('updates.installAndQuit'), t('updates.quitWithoutUpdate'), t('common.cancel')],
      defaultId: 0,
      cancelId: 2,
    });

    if (result.response === 0) {
      // Instalar y cerrar
      this.installUpdate();
      return false; // No cerrar manualmente, el installer lo hace
    } else if (result.response === 1) {
      // Cerrar sin actualizar
      return true;
    } else {
      // Cancelar
      return false;
    }
  }

  isUpdateDownloaded(): boolean {
    return this.updateDownloaded;
  }

  getCurrentVersion(): string {
    return app.getVersion();
  }
}

export const updaterService = new UpdaterService();
