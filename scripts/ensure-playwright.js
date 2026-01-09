#!/usr/bin/env node
/**
 * Script para asegurar que Playwright esté disponible antes del build
 * Verifica que Playwright esté instalado y disponible en node_modules
 * Se ejecuta en postinstall y antes del build
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const playwrightDir = path.join(projectRoot, 'node_modules', 'playwright');

console.log('🔍 Verificando instalación de Playwright...\n');

// Verificar que Playwright existe en node_modules
if (!fs.existsSync(playwrightDir)) {
  console.log('📦 Playwright no está instalado, instalando...');
  
  const installResult = spawnSync('npm', ['install', 'playwright@^1.40.0', '--save'], {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  
  if (installResult.status !== 0) {
    console.error('❌ Error instalando Playwright');
    process.exit(1);
  }
}

// Verificar que los binarios de Chromium existen
const playwrightContents = fs.readdirSync(playwrightDir);
const hasChromium = playwrightContents.some(dir => dir.startsWith('chromium-'));

if (!hasChromium) {
  console.log('📥 Descargando binarios de Chromium...');
  
  const installBrowsersResult = spawnSync('npx', ['playwright', 'install', 'chromium', '--with-deps'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  
  if (installBrowsersResult.status !== 0) {
    console.error('❌ Error descargando binarios de Chromium');
    process.exit(1);
  }
}

// Verificar nuevamente después de instalación
const finalContents = fs.readdirSync(playwrightDir);
const finalHasChromium = finalContents.some(dir => dir.startsWith('chromium-'));

if (finalHasChromium) {
  console.log('✅ Playwright está listo para usar\n');
} else {
  console.error('❌ Playwright no se pudo preparar correctamente');
  process.exit(1);
}

if (!fs.readdirSync(playwrightDir).some(dir => dir.startsWith('chromium-'))) {
  console.error('❌ Chromium no fue descargado correctamente');
  console.log('   Contenido de node_modules/playwright:');
  console.log(fs.readdirSync(playwrightDir));
  process.exit(1);
}

console.log('\n✅ Playwright está disponible y listo para usar');
console.log('📁 Contenido de Playwright:');
fs.readdirSync(playwrightDir).forEach(item => {
  const fullPath = path.join(playwrightDir, item);
  const isDir = fs.statSync(fullPath).isDirectory();
  console.log(`   ${isDir ? '📂' : '📄'} ${item}`);
});

process.exit(0);
