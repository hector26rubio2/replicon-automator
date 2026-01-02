import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, dialog, app } from 'electron';
import { notificationService } from './notification.service';
import { createLogger } from '../utils';
import { t } from '../i18n';

console.log('[UpdaterService] MODULE LOADED');

const logger = createLogger('AutoUpdater');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
console.log('[UpdaterService] isDev at module level:', isDev);

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

  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
    
    console.log('[UpdaterService] Initializing...');
    console.log('[UpdaterService] isDev:', isDev);
    
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    
    // En modo desarrollo, permitir probar el updater
    if (isDev) {
      autoUpdater.forceDevUpdateConfig = true;
      console.log('[UpdaterService] forceDevUpdateConfig enabled for DEV mode');
    }
    
    autoUpdater.logger = {
      info: (msg: string) => console.log('[AutoUpdater]', String(msg)),
      warn: (msg: string) => console.warn('[AutoUpdater]', String(msg)),
      error: (msg: string) => console.error('[AutoUpdater]', String(msg)),
      debug: (msg: string) => console.log('[AutoUpdater DEBUG]', String(msg)),
    };

    this.setupListeners();
    
    console.log('[UpdaterService] Will check for updates in 5 seconds...');
    setTimeout(() => this.checkForUpdates(true), 5000);
    
    setInterval(() => this.checkForUpdates(true), 4 * 60 * 60 * 1000);
  }

  private setupListeners(): void {
    console.log('[UpdaterService] Setting up listeners...');
    
    autoUpdater.on('checking-for-update', () => {
      console.log('[UpdaterService] EVENT: checking-for-update');
      this.isChecking = true;
    });

    autoUpdater.on('update-available', async (info: UpdateInfo) => {
      console.log('[UpdaterService] EVENT: update-available', info.version);
      this.isChecking = false;
      this.updateAvailable = true;
      this.lastUpdateInfo = info;
      
      notificationService.info(
        t('updates.available'),
        t('updates.availableDesc', { version: info.version }),
        () => this.downloadUpdate()
      );

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

        if (result.response === 0) {
          this.downloadUpdate();
        }
      }
    });

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      console.log('[UpdaterService] EVENT: update-not-available', info.version);
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
      this.updateDownloaded = true;
      this.lastUpdateInfo = info;
      
      this.mainWindow?.setProgressBar(-1);
      
      // Notificar al renderer que la actualización está lista
      this.mainWindow?.webContents.send('update-downloaded', {
        version: info.version,
      });
      
      notificationService.success(
        t('updates.ready'),
        t('updates.readyDesc', { version: info.version }),
        () => this.installUpdate()
      );

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

        if (result.response === 0) {
          this.installUpdate();
        }
      }
    });

    autoUpdater.on('error', (error: Error) => {
      console.error('[UpdaterService] EVENT: error', error.message);
      this.isChecking = false;
      this.mainWindow?.setProgressBar(-1);
    });
    
    console.log('[UpdaterService] All listeners set up');
  }

  async checkForUpdates(silent = false): Promise<{ updateAvailable: boolean; version: string }> {
    console.log('[UpdaterService] checkForUpdates called, silent:', silent);
    
    if (this.isChecking) {
      console.log('[UpdaterService] Already checking, returning cached result');
      return { updateAvailable: this.updateAvailable, version: this.lastUpdateInfo?.version || app.getVersion() };
    }

    try {
      console.log('[UpdaterService] Starting update check...');
      console.log('[UpdaterService] Current version:', app.getVersion());
      console.log('[UpdaterService] Is packaged:', app.isPackaged);
      
      this.updateAvailable = false;
      this.isChecking = true;
      
      console.log('[UpdaterService] Calling autoUpdater.checkForUpdates()...');
      const result = await autoUpdater.checkForUpdates();
      
      console.log('[UpdaterService] Check result:', JSON.stringify(result?.updateInfo));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = { 
        updateAvailable: this.updateAvailable, 
        version: result?.updateInfo?.version || app.getVersion() 
      };
      
      console.log('[UpdaterService] Returning:', JSON.stringify(response));
      
      return response;
    } catch (error) {
      console.error('[UpdaterService] Failed to check for updates:', error);
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

  async downloadUpdate(): Promise<void> {
    try {
      notificationService.info(
        t('updates.downloading'),
        t('updates.downloadingDesc')
      );
      await autoUpdater.downloadUpdate();
    } catch (error) {
      logger.error('Failed to download update:', error);
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

  isUpdateDownloaded(): boolean {
    return this.updateDownloaded;
  }

  getCurrentVersion(): string {
    return app.getVersion();
  }
}

export const updaterService = new UpdaterService();
