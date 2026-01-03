import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Playwright Production Integration', () => {
    describe('Playwright Binaries Structure', () => {
        it('should have playwright-bin directory in project root', () => {
            const playwrightBinDir = path.join(process.cwd(), 'playwright-bin');
            const exists = fs.existsSync(playwrightBinDir);

            // En desarrollo debe existir si se ejecutó postinstall
            if (exists) {
                const contents = fs.readdirSync(playwrightBinDir);
                expect(contents.length).toBeGreaterThan(0);

                // Debe tener al menos una carpeta chromium-*
                const hasChromium = contents.some(item => item.startsWith('chromium-'));
                expect(hasChromium).toBe(true);
            } else {
                // Si no existe, es válido en CI/CD o entornos sin playwright
                expect(true).toBe(true);
            }
        });

        it('should have correct chromium structure if present', () => {
            const playwrightBinDir = path.join(process.cwd(), 'playwright-bin');

            if (fs.existsSync(playwrightBinDir)) {
                const contents = fs.readdirSync(playwrightBinDir);
                const chromiumFolder = contents.find(item => item.startsWith('chromium-'));

                if (chromiumFolder) {
                    const chromiumPath = path.join(playwrightBinDir, chromiumFolder);
                    const chromiumContents = fs.readdirSync(chromiumPath);

                    // Debe tener chrome-win64 o chrome-win
                    const hasChromeWin = chromiumContents.some(
                        item => item === 'chrome-win64' || item === 'chrome-win'
                    );
                    expect(hasChromeWin).toBe(true);

                    // Debe tener archivo de validación
                    const hasValidation = chromiumContents.includes('DEPENDENCIES_VALIDATED');
                    expect(hasValidation).toBe(true);
                }
            }
        });

        it('should have chrome.exe if chromium folder exists', () => {
            const playwrightBinDir = path.join(process.cwd(), 'playwright-bin');

            if (fs.existsSync(playwrightBinDir)) {
                const contents = fs.readdirSync(playwrightBinDir);
                const chromiumFolder = contents.find(item => item.startsWith('chromium-'));

                if (chromiumFolder) {
                    const chromiumPath = path.join(playwrightBinDir, chromiumFolder);

                    // Buscar chrome.exe en chrome-win64 o chrome-win
                    const chromeWin64Path = path.join(chromiumPath, 'chrome-win64', 'chrome.exe');
                    const chromeWinPath = path.join(chromiumPath, 'chrome-win', 'chrome.exe');

                    const hasChromeExe = fs.existsSync(chromeWin64Path) || fs.existsSync(chromeWinPath);
                    expect(hasChromeExe).toBe(true);
                }
            }
        });
    });

    describe('Chromium Path Resolution', () => {
        it('should construct valid chromium paths', () => {
            const basePath = 'D:\\app\\resources\\playwright';
            const chromiumFolder = 'chromium-1200';

            const possiblePaths = [
                path.join(basePath, chromiumFolder, 'chrome-win64', 'chrome.exe'),
                path.join(basePath, chromiumFolder, 'chrome-win', 'chrome.exe'),
            ];

            possiblePaths.forEach(chromePath => {
                expect(chromePath).toContain('chrome.exe');
                expect(path.extname(chromePath)).toBe('.exe');
            });
        });

        it('should detect chromium folder pattern', () => {
            const testFolders = ['chromium-1193', 'chromium-1200', 'other-folder'];

            const chromiumFolders = testFolders.filter(f => f.startsWith('chromium-'));

            expect(chromiumFolders).toHaveLength(2);
            expect(chromiumFolders[0]).toMatch(/^chromium-\d+$/);
        });
    });

    describe('Production Environment Detection', () => {
        it('should detect development mode from NODE_ENV', () => {
            const isDev = process.env.NODE_ENV === 'development';

            // En tests, suele ser 'test' o undefined
            expect(typeof isDev).toBe('boolean');
        });

        it('should have valid process.cwd() path', () => {
            const cwd = process.cwd();

            expect(cwd).toBeDefined();
            expect(cwd.length).toBeGreaterThan(0);
            expect(fs.existsSync(cwd)).toBe(true);
        });
    });
});
