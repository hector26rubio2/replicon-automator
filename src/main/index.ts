import 'dotenv/config';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import { PlaywrightAutomation } from './services/playwright-automation';
import { CSVService } from './services/csv-service';
import { CredentialsService } from './services/credentials-service';
import type { AppConfig, AccountMappings } from '../shared/types';
import { DEFAULT_HORARIOS } from '../shared/constants';

// Store para persistencia
function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
}

const defaultConfigFromEnv: AppConfig = {
  loginUrl: process.env.REPLICON_LOGIN_URL ?? 'https://newshore.okta.com/',
  timeout: (() => {
    const parsed = Number(process.env.REPLICON_TIMEOUT);
    return Number.isFinite(parsed) ? parsed : 45000;
  })(),
  headless: parseBooleanEnv(process.env.REPLICON_HEADLESS, false),
  autoSave: parseBooleanEnv(process.env.REPLICON_AUTOSAVE, true),
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
    if (!filePath) return {};

    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    return (parsed ?? {}) as AccountMappings;
  } catch {
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

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
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
    show: isDev,
    backgroundColor: '#0f172a',
  });

  // Cargar la aplicación
  if (isDev) {
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

  if (!isDev) {
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
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  setupIPCHandlers();

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
