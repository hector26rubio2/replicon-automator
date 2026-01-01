/**
 * Tray Service - System Tray Icon management
 * Allows minimizing to system tray and shows notifications
 */
import { app, Tray, Menu, nativeImage, BrowserWindow, Notification } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export class TrayService {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private isQuitting = false;

  /**
   * Initialize the tray icon
   */
  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
    
    // Create tray icon
    const iconPath = this.getIconPath();
    const icon = nativeImage.createFromPath(iconPath);
    
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));
    this.tray.setToolTip('Replicon Automator');
    
    // Set up context menu
    this.updateMenu();
    
    // Double-click to show window
    this.tray.on('double-click', () => {
      this.showWindow();
    });

    // Handle window minimize to tray
    this.setupWindowHandlers();
    
    // Handle app quit
    app.on('before-quit', () => {
      this.isQuitting = true;
    });
  }

  /**
   * Get the path to the tray icon
   */
  private getIconPath(): string {
    // Try different locations for icon
    const candidates = [
      path.join(process.cwd(), 'assets', 'icon.ico'),
      path.join(process.cwd(), 'assets', 'icon.png'),
      path.join(process.resourcesPath || '', 'assets', 'icon.ico'),
      path.join(process.resourcesPath || '', 'assets', 'icon.png'),
      path.join(__dirname, '../../assets/icon.ico'),
      path.join(__dirname, '../../assets/icon.png'),
    ];

    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      } catch {
        continue;
      }
    }

    // Return empty string if no icon found - Electron will use default
    return '';
  }

  /**
   * Set up window close/minimize handlers
   */
  private setupWindowHandlers(): void {
    if (!this.mainWindow) return;

    // Override close to minimize to tray (optional - uncomment to enable)
    // this.mainWindow.on('close', (event) => {
    //   if (!this.isQuitting) {
    //     event.preventDefault();
    //     this.hideWindow();
    //   }
    // });

    // Handle minimize
    this.mainWindow.on('minimize', () => {
      // Optionally minimize to tray instead
      // this.hideWindow();
    });
  }

  /**
   * Update the tray context menu
   */
  updateMenu(status?: 'idle' | 'running' | 'completed' | 'error'): void {
    if (!this.tray) return;

    const statusText = status 
      ? status === 'running' ? '🟢 Running' 
        : status === 'completed' ? '✅ Completed'
        : status === 'error' ? '❌ Error'
        : '⚪ Idle'
      : '⚪ Idle';

    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Replicon Automator', 
        enabled: false,
        icon: this.getIconPath() ? nativeImage.createFromPath(this.getIconPath()).resize({ width: 16, height: 16 }) : undefined
      },
      { type: 'separator' },
      { 
        label: statusText, 
        enabled: false 
      },
      { type: 'separator' },
      { 
        label: 'Show Window', 
        click: () => this.showWindow() 
      },
      { 
        label: 'Start Automation', 
        click: () => {
          this.showWindow();
          this.mainWindow?.webContents.send('tray-action', 'start');
        },
        enabled: status !== 'running'
      },
      { 
        label: 'Stop Automation', 
        click: () => {
          this.mainWindow?.webContents.send('tray-action', 'stop');
        },
        enabled: status === 'running'
      },
      { type: 'separator' },
      { 
        label: 'Quit', 
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  /**
   * Show the main window
   */
  showWindow(): void {
    if (!this.mainWindow) return;
    
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
    
    this.mainWindow.show();
    this.mainWindow.focus();
  }

  /**
   * Hide the main window to tray
   */
  hideWindow(): void {
    if (!this.mainWindow) return;
    this.mainWindow.hide();
  }

  /**
   * Show a balloon notification (Windows) or notification
   */
  showNotification(title: string, content: string): void {
    if (!this.tray) return;
    
    // On Windows, use balloon
    if (process.platform === 'win32') {
      this.tray.displayBalloon({
        title,
        content,
        iconType: 'info',
      });
    }
    // On other platforms, use Notification API
    else {
      if (Notification.isSupported()) {
        new Notification({
          title,
          body: content,
        }).show();
      }
    }
  }

  /**
   * Update tray icon to indicate status
   */
  setStatus(status: 'idle' | 'running' | 'completed' | 'error'): void {
    this.updateMenu(status);
    
    // Update tooltip
    const tooltips = {
      idle: 'Replicon Automator - Ready',
      running: 'Replicon Automator - Running...',
      completed: 'Replicon Automator - Completed',
      error: 'Replicon Automator - Error',
    };
    
    this.tray?.setToolTip(tooltips[status]);
  }

  /**
   * Destroy the tray icon
   */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

// Singleton instance
export const trayService = new TrayService();
