import { app, BrowserWindow, ipcMain, dialog, nativeImage, globalShortcut } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import { PlaywrightAutomation, CSVService, CredentialsService } from './services';
import { DEFAULT_CONFIG, DEFAULT_MAPPINGS, DEFAULT_HORARIOS } from '../shared/constants';

// Store para persistencia
const store = new Store({
  defaults: {
    config: DEFAULT_CONFIG,
    mappings: DEFAULT_MAPPINGS,
    horarios: DEFAULT_HORARIOS,
  }
});

let mainWindow: BrowserWindow | null = null;
let automation: PlaywrightAutomation | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  // En desarrollo, usar process.cwd() que apunta al directorio del proyecto
  // En producción, usar __dirname que apunta al directorio de compilación
  const iconPath = isDev 
    ? path.join(process.cwd(), 'assets', 'icon.ico')
    : path.join(__dirname, '..', '..', '..', 'assets', 'icon.ico');

  console.log('Icon path:', iconPath);
  console.log('Icon exists:', fs.existsSync(iconPath));

  // Crear nativeImage para el icono
  let appIcon;
  if (fs.existsSync(iconPath)) {
    appIcon = nativeImage.createFromPath(iconPath);
    console.log('Icon loaded, isEmpty:', appIcon.isEmpty());
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: appIcon || iconPath,
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#0f172a',
  });

  // Establecer icono de la aplicación en Windows
  if (process.platform === 'win32' && appIcon) {
    app.setAppUserModelId('com.hdrt.replicon-automator');
  }

  // Cargar la aplicación
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
function setupIPCHandlers() {
  const csvService = new CSVService();
  const credentialsService = new CredentialsService();

  // Cargar CSV
  ipcMain.handle('csv:load', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Operación cancelada' };
    }

    return csvService.loadCSV(result.filePaths[0]);
  });

  // Guardar CSV
  ipcMain.handle('csv:save', async (_, data) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      defaultPath: 'replicon_data.csv',
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Operación cancelada' };
    }

    return csvService.saveCSV(result.filePath, data);
  });

  // Credenciales
  ipcMain.handle('credentials:save', async (_, credentials) => {
    return credentialsService.saveCredentials(credentials);
  });

  ipcMain.handle('credentials:load', async () => {
    return credentialsService.loadCredentials();
  });

  ipcMain.handle('credentials:clear', async () => {
    return credentialsService.clearCredentials();
  });

  // Config
  ipcMain.handle('config:get', async (_, key) => {
    return store.get(key);
  });

  ipcMain.handle('config:set', async (_, key, value) => {
    store.set(key, value);
    return true;
  });

  // Automatización
  ipcMain.handle('automation:start', async (_, request) => {
    if (automation) {
      return { success: false, error: 'Ya hay una automatización en ejecución' };
    }

    automation = new PlaywrightAutomation(
      request.config,
      (progress) => {
        mainWindow?.webContents.send('automation:progress', progress);
      },
      (log) => {
        mainWindow?.webContents.send('automation:log', log);
      }
    );

    try {
      await automation.start(request.credentials, request.csvData, request.horarios, request.mappings);
      mainWindow?.webContents.send('automation:complete', { success: true });
      return { success: true };
    } catch (error) {
      mainWindow?.webContents.send('automation:error', { error: String(error) });
      return { success: false, error: String(error) };
    } finally {
      automation = null;
    }
  });

  ipcMain.handle('automation:stop', async () => {
    if (automation) {
      await automation.stop();
      automation = null;
    }
    return { success: true };
  });

  ipcMain.handle('automation:pause', async () => {
    if (automation) {
      automation.togglePause();
    }
    return { success: true };
  });

  // App version and updates
  ipcMain.handle('app:version', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:check-updates', async () => {
    // En desarrollo, simular que no hay actualizaciones
    if (isDev) {
      return { updateAvailable: false };
    }
    
    try {
      // Para producción, implementar con electron-updater
      // TODO: Integrar electron-updater cuando esté configurado
      return { updateAvailable: false };
    } catch {
      return { updateAvailable: false };
    }
  });
}

// Setup global keyboard shortcuts
function setupGlobalShortcuts() {
  // Ctrl+O - Abrir CSV
  globalShortcut.register('CommandOrControl+O', () => {
    mainWindow?.webContents.send('shortcut:load-csv');
  });

  // Ctrl+S - Guardar CSV
  globalShortcut.register('CommandOrControl+S', () => {
    mainWindow?.webContents.send('shortcut:save-csv');
  });

  // Ctrl+R - Ejecutar automatización
  globalShortcut.register('CommandOrControl+R', () => {
    mainWindow?.webContents.send('shortcut:run-automation');
  });

  // Ctrl+Shift+T - Cambiar tema
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    mainWindow?.webContents.send('shortcut:toggle-theme');
  });

  // Ctrl+Shift+L - Cambiar idioma
  globalShortcut.register('CommandOrControl+Shift+L', () => {
    mainWindow?.webContents.send('shortcut:toggle-language');
  });

  // Ctrl+1,2,3,4 - Cambiar pestaña
  globalShortcut.register('CommandOrControl+1', () => {
    mainWindow?.webContents.send('shortcut:go-to-tab', 0);
  });
  globalShortcut.register('CommandOrControl+2', () => {
    mainWindow?.webContents.send('shortcut:go-to-tab', 1);
  });
  globalShortcut.register('CommandOrControl+3', () => {
    mainWindow?.webContents.send('shortcut:go-to-tab', 2);
  });
  globalShortcut.register('CommandOrControl+4', () => {
    mainWindow?.webContents.send('shortcut:go-to-tab', 3);
  });

  // ? - Mostrar atajos (Shift+/)
  globalShortcut.register('Shift+/', () => {
    mainWindow?.webContents.send('shortcut:show-shortcuts');
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  setupIPCHandlers();
  setupGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Desregistrar todos los atajos globales
  globalShortcut.unregisterAll();
});

app.on('before-quit', async () => {
  if (automation) {
    await automation.stop();
  }
});
