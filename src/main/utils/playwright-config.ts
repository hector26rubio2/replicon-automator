/**
 * Configuración de Playwright para producción
 * Maneja las rutas de Chromium empaquetado con electron-builder
 */
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { createLogger } from './logger';

const logger = createLogger('PlaywrightConfig');

/**
 * Obtiene la ruta del ejecutable de Chromium para producción
 * En desarrollo: usa la instalación local de node_modules
 * En producción: usa el Chromium empaquetado en process.resourcesPath
 */
export function getChromiumExecutablePath(): string | undefined {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
        logger.info('Modo desarrollo: usando Chromium de node_modules');
        return undefined; // Playwright usará la ruta por defecto
    }

    // En producción, buscar el ejecutable de Chromium en resourcesPath
    const resourcesPath = process.resourcesPath;
    logger.info(`Buscando Chromium en: ${resourcesPath}`);

    // Ruta donde electron-builder copia los binarios de Playwright
    const playwrightPath = path.join(resourcesPath, 'playwright');

    // Rutas posibles para el ejecutable de Chromium en Windows
    const possiblePaths = [
        // Playwright >= 1.40 (chrome-win64 en versiones nuevas)
        path.join(playwrightPath, 'chromium-*', 'chrome-win64', 'chrome.exe'),
        // Versiones anteriores (chrome-win)
        path.join(playwrightPath, 'chromium-*', 'chrome-win', 'chrome.exe'),
        // Estructura alternativa
        path.join(playwrightPath, 'chromium', 'chrome-win64', 'chrome.exe'),
    ];

    // Buscar la carpeta chromium-* dinámicamente
    try {
        logger.info(`Verificando si existe: ${playwrightPath}`);

        if (fs.existsSync(playwrightPath)) {
            const files = fs.readdirSync(playwrightPath);
            logger.info(`Archivos en playwright: ${files.join(', ')}`);

            const chromiumFolder = files.find(f => f.startsWith('chromium-'));

            if (chromiumFolder) {
                logger.info(`Carpeta chromium encontrada: ${chromiumFolder}`);

                // Intentar primero chrome-win64 (versión nueva)
                let chromePath = path.join(
                    playwrightPath,
                    chromiumFolder,
                    'chrome-win64',
                    'chrome.exe'
                );
                logger.info(`Probando ruta: ${chromePath}`);

                if (fs.existsSync(chromePath)) {
                    logger.info(`✅ Chromium encontrado en: ${chromePath}`);
                    return chromePath;
                }

                // Fallback a chrome-win (versión antigua)
                chromePath = path.join(
                    playwrightPath,
                    chromiumFolder,
                    'chrome-win',
                    'chrome.exe'
                );
                logger.info(`Probando ruta alternativa: ${chromePath}`);

                if (fs.existsSync(chromePath)) {
                    logger.info(`✅ Chromium encontrado en: ${chromePath}`);
                    return chromePath;
                }

                logger.error(`❌ chrome.exe no encontrado en ninguna ubicación dentro de ${chromiumFolder}`);
            } else {
                logger.error(`❌ No se encontró carpeta chromium-* en ${playwrightPath}`);
            }
        } else {
            logger.error(`❌ La ruta playwright no existe: ${playwrightPath}`);
            logger.error(`process.resourcesPath = ${resourcesPath}`);
        }
    } catch (error) {
        logger.error('Error buscando Chromium:', error);
    }

    // Fallback: buscar en las rutas posibles
    for (const testPath of possiblePaths) {
        const resolved = resolveWildcard(testPath);
        if (resolved && fs.existsSync(resolved)) {
            logger.info(`✅ Chromium encontrado (fallback): ${resolved}`);
            return resolved;
        }
    }

    // Si no se encuentra, loguear error detallado
    logger.error('❌ No se encontró el ejecutable de Chromium en producción');
    logger.error(`Rutas buscadas:`);
    logger.error(`  - ${playwrightPath}`);
    possiblePaths.forEach(p => logger.error(`  - ${p}`));

    throw new Error(
        'No se encontró el ejecutable de Chromium. ' +
        'Asegúrate de que el build incluya los binarios de Playwright correctamente.'
    );
}

/**
 * Resuelve rutas con wildcards (chromium-*)
 */
function resolveWildcard(pathPattern: string): string | null {
    const parts = pathPattern.split(path.sep);
    const wildcardIndex = parts.findIndex(p => p.includes('*'));

    if (wildcardIndex === -1) {
        return pathPattern;
    }

    const basePath = parts.slice(0, wildcardIndex).join(path.sep);
    const wildcardPart = parts[wildcardIndex];
    const remainingParts = parts.slice(wildcardIndex + 1);

    try {
        if (!fs.existsSync(basePath)) {
            return null;
        }

        const files = fs.readdirSync(basePath);
        const pattern = wildcardPart.replace('*', '.*');
        const regex = new RegExp(`^${pattern}$`);

        const match = files.find(f => regex.test(f));
        if (match) {
            return path.join(basePath, match, ...remainingParts);
        }
    } catch {
        return null;
    }

    return null;
}

/**
 * Opciones de configuración para chromium.launch
 */
export interface ChromiumLaunchOptions {
    headless?: boolean;
    slowMo?: number;
    args?: string[];
    timeout?: number;
}

/**
 * Obtiene las opciones completas para chromium.launch
 * Incluye executablePath en producción
 */
export function getChromiumLaunchOptions(
    options: ChromiumLaunchOptions = {}
): ChromiumLaunchOptions & { executablePath?: string } {
    const executablePath = getChromiumExecutablePath();

    const launchOptions: ChromiumLaunchOptions & { executablePath?: string } = {
        headless: options.headless ?? true,
        slowMo: options.slowMo ?? 50,
        args: options.args ?? [
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
    };

    if (executablePath) {
        launchOptions.executablePath = executablePath;
    }

    return launchOptions;
}
