import 'dotenv/config';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import { PlaywrightAutomation, CSVService, CredentialsService, trayService, notificationService, updaterService } from './services';
import { createLogger, loadEnvConfig } from './utils';
import type { AppConfig, AccountMappings, ConfigKey } from '@shared/types';
import { DEFAULT_HORARIOS } from '@shared/constants';
import { IPC } from '@shared/ipc';

const logger = createLogger('Main');

// Cargar configuración de entorno
const envConfig = loadEnvConfig();

const defaultConfigFromEnv: AppConfig = {
  loginUrl: envConfig.loginUrl,
  timeout: envConfig.timeout,
  headless: envConfig.headless,
  autoSave: envConfig.autoSave,
};

function loadDefaultMappings(): AccountMappings {
  try {
    const candidates = [
      // Dev: running from repo root
      path.join(process.cwd(), 'assets', 'default-mappings.json'),
      // Packaged: resourcesPath points to the app's resources
      path.join(process.resourcesPath, 'assets', 'default-mappings.json'),
    ];

    const filePath = candidates.find((p) => fs.existsSync(p));
    if (!filePath) {
      logger.warn('No se encontró default-mappings.json');
      return {};
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    logger.info('Mappings cargados desde', filePath);
    return (parsed ?? {}) as AccountMappings;
  } catch (error) {
    logger.error('Error cargando default-mappings.json', error);
    return {};
  }
}

const defaultMappingsFromJson = loadDefaultMappings();

const store = new Store({
  defaults: {
    config: defaultConfigFromEnv,
    mappings: defaultMappingsFromJson,
    horarios: DEFAULT_HORARIOS,
  }
});

let mainWindow: BrowserWindow | null = null;
let automation: PlaywrightAutomation | null = null;

function createWindow() {
  logger.info('Creando ventana principal...');
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
    icon: path.join(__dirname, '../../assets/icon.ico'),
    titleBarStyle: 'default',
    show: envConfig.isDev,
    backgroundColor: '#0f172a',
  });

  // Cargar la aplicación
  if (envConfig.isDev) {
    const devUrl = 'http://localhost:5173';

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Replicon Automator - Dev</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px}
      .card{max-width:900px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px}
      h1{font-size:18px;margin:0 0 8px 0}
      .muted{color:#94a3b8}
      code{background:#0b1220;border:1px solid #1f2937;border-radius:6px;padding:2px 6px}
      pre{background:#0b1220;border:1px solid #1f2937;border-radius:8px;padding:12px;overflow:auto}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Electron abrió, pero el Renderer no está disponible</h1>
      <div class="muted">No se pudo cargar <code>${devUrl}</code></div>
      <pre>URL: ${validatedURL}
Error: ${errorCode} - ${errorDescription}</pre>
      <div class="muted">Esta pantalla se auto-actualiza y entrará a la app apenas Vite responda.</div>
    </div>
    <script>
      const devUrl = ${JSON.stringify(devUrl)};
      async function ping() {
        try {
          await fetch(devUrl, { mode: 'no-cors' });
          location.href = devUrl;
        } catch {
          // keep waiting
        }
      }
      setInterval(ping, 500);
    </script>
  </body>
</html>`;

      mainWindow?.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    });

    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  if (!envConfig.isDev) {
    mainWindow.once('ready-to-show', () => {
      mainWindow?.show();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
function setupIPCHandlers() {
  const csvService = new CSVService();
  const credentialsService = new CredentialsService();
  const allowedConfigKeys = new Set<ConfigKey>(['horarios', 'mappings', 'config']);

  // Cargar CSV
  ipcMain.handle(IPC.CSV_LOAD, async () => {
    if (!mainWindow) {
      return { success: false, error: 'Window not available' };
    }
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Operación cancelada' };
    }

    return csvService.loadCSV(result.filePaths[0]);
  });

  // Guardar CSV
  ipcMain.handle(IPC.CSV_SAVE, async (_, data) => {
    if (!mainWindow) {
      return { success: false, error: 'Window not available' };
    }
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      defaultPath: 'replicon_data.csv',
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Operación cancelada' };
    }

    return csvService.saveCSV(result.filePath, data);
  });

  // Credenciales
  ipcMain.handle(IPC.CREDENTIALS_SAVE, async (_, credentials) => {
    return credentialsService.saveCredentials(credentials);
  });

  ipcMain.handle(IPC.CREDENTIALS_LOAD, async () => {
    return credentialsService.loadCredentials();
  });

  ipcMain.handle(IPC.CREDENTIALS_CLEAR, async () => {
    return credentialsService.clearCredentials();
  });

  // Config
  ipcMain.handle(IPC.CONFIG_GET, async (_, key) => {
    if (!allowedConfigKeys.has(key as ConfigKey)) {
      return null;
    }
    return store.get(key as ConfigKey);
  });

  ipcMain.handle(IPC.CONFIG_SET, async (_, key, value) => {
    if (!allowedConfigKeys.has(key as ConfigKey)) {
      return false;
    }
    store.set(key as ConfigKey, value);
    return true;
  });

  // Automatización
  ipcMain.handle(IPC.AUTOMATION_START, async (_, request) => {
    if (automation) {
      return { success: false, error: 'Ya hay una automatización en ejecución' };
    }

    automation = new PlaywrightAutomation(
      request.config,
      (progress) => {
        mainWindow?.webContents.send(IPC.AUTOMATION_PROGRESS, progress);
      },
      (log) => {
        mainWindow?.webContents.send(IPC.AUTOMATION_LOG, log);
      }
    );

    // Update tray status
    trayService.setStatus('running');

    try {
      await automation.start(request.credentials, request.csvData, request.horarios, request.mappings);
      mainWindow?.webContents.send(IPC.AUTOMATION_COMPLETE, { success: true });
      trayService.setStatus('completed');
      trayService.showNotification('Automation Completed', 'The automation process has finished successfully.');
      return { success: true };
    } catch (error) {
      mainWindow?.webContents.send(IPC.AUTOMATION_ERROR, { error: String(error) });
      trayService.setStatus('error');
      trayService.showNotification('Automation Error', String(error));
      return { success: false, error: String(error) };
    } finally {
      automation = null;
    }
  });

  ipcMain.handle(IPC.AUTOMATION_STOP, async () => {
    if (automation) {
      await automation.stop();
      automation = null;
      trayService.setStatus('idle');
    }
    return { success: true };
  });

  ipcMain.handle(IPC.AUTOMATION_PAUSE, async () => {
    if (automation) {
      automation.togglePause();
    }
    return { success: true };
  });

  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await updaterService.checkForUpdates(false);
      return { success: true, ...result };
    } catch {
      return { success: false, updateAvailable: false, version: updaterService.getCurrentVersion() };
    }
  });

  ipcMain.handle('get-app-version', () => {
    return updaterService.getCurrentVersion();
  });

  ipcMain.handle('install-update', () => {
    updaterService.installUpdate();
    return { success: true };
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  setupIPCHandlers();
  
  // Initialize system tray
  if (mainWindow) {
    trayService.initialize(mainWindow);
    updaterService.initialize(mainWindow);
  }

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

app.on('before-quit', async () => {
  if (automation) {
    await automation.stop();
  }
});
