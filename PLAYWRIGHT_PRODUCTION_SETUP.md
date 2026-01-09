# Configuración de Playwright para Producción

## Problema Resuelto

Este documento describe los cambios implementados para evitar el error `browserType.launch: Executable doesn't exist` en producción y en instalación en PCs nuevas.

## ❌ Problema Original

- Playwright funciona en desarrollo pero falla en producción
- El instalador no incluye los binarios de Chromium
- Cuando se actualiza la app, Playwright se pierde
- La aplicación depende de `npx playwright install` en la máquina del usuario
- Error: `browserType.launch: Executable doesn't exist at ...`
- En la pipeline CI/CD, los binarios de Linux no sirven para Windows

## ✅ Solución Implementada (Enero 2026)

### 1. **Scripts de Preparación para Build**

Se crearon dos scripts que garantizan que Playwright esté listo antes de compilar:

#### `scripts/prepare-playwright-build.js` (Nuevo)

- Verifica que Playwright esté en `node_modules`
- Si falta Chromium, lo descarga automáticamente
- Configura `asarUnpack` en `package.json` si es necesario
- Muestra información detallada de los navegadores disponibles

#### `scripts/ensure-playwright.js` (Mejorado)

- Script rápido para verificar que Playwright está disponible
- Se ejecuta como parte del proceso de build

### 2. **package.json - Scripts Actualizados**

```json
"scripts": {
  "prebuild": "npm run prepare-playwright",
  "build": "npm run prebuild && npm run build:renderer && npm run build:main",
  "prepare-playwright": "node scripts/prepare-playwright-build.js",
  "ensure-playwright": "node scripts/ensure-playwright.js",
  "postinstall": "npx playwright install chromium --with-deps",
  "dist": "npm run clean && npm run build && electron-builder",
  "dist:win": "npm run clean && npm run build && electron-builder --win"
}
```

**¿Qué hace?**

- `prepare-playwright`: Ejecuta verificaciones completas antes de build
- `prebuild`: Corre `prepare-playwright` automáticamente
- `build`: Corre `prebuild` antes de compilar TypeScript
- `postinstall`: Instala Chromium después de `npm install`

### 3. **package.json - electron-builder**

La configuración `asarUnpack` empaqueta node_modules/playwright sin comprimir:

```json
"build": {
  "asarUnpack": [
    "node_modules/playwright/**/*"
  ]
}
```

**¿Qué hace?**

- Los binarios de Chromium se incluyen sin comprimir en el instalador
- Se almacenan en `resources/app.asar.unpacked/node_modules/playwright`
- Electron puede acceder a ellos directamente sin extraer

### 4. **GitHub Actions CI/CD Pipeline**

Se actualizó `.github/workflows/ci-cd.yml` para:

1. Instalar dependencias normales
2. Ejecutar `npm run prepare-playwright` para verificar/descargar Chromium
3. Compilar la app con TypeScript
4. Verificar que Playwright siga en `node_modules`
5. Ejecutar `electron-builder` para empaquetar (que incluye los binarios)

**Flujo en la pipeline:**

```
npm ci (instala)
  ↓
npm run prepare-playwright (verifica/descarga Playwright)
  ↓
npm install chromium para tests (Linux, solo pruebas)
  ↓
npm run validate (tests)
  ↓
npm run build (ejecuta prebuild → prepare-playwright → build:renderer + build:main)
  ↓
Verifica que Playwright esté en node_modules
  ↓
electron-builder (empaqueta con asarUnpack)
  ↓
Verifica que Playwright está en app.asar.unpacked
```

## 🔍 Cómo Funciona en Producción

### En Primera Ejecución Después de Instalar

```javascript
// main/services/browser.ts
const browser = await chromium.launch({
  executablePath: path.join(
    app.getAppPath(),
    'node_modules/playwright/.local-browsers/chromium-xxx/chrome.exe'
  ),
  headless: true,
});
```

Playwright encuentra el ejecutable en:

```
C:\Program Files\Replicon Automator\resources\app.asar.unpacked\node_modules\playwright\chromium-1200\chrome-win64\chrome.exe
```

### En Actualizaciones

1. El instalador incluye los binarios de Chromium más recientes
2. Al actualizar, los binarios se reemplazan automáticamente
3. No es necesario hacer nada en la máquina del usuario

## 📝 Verificación

Para verificar que todo funciona correctamente:

- Incluye args de seguridad para Chromium
- Maneja errores si no encuentra el ejecutable

### 4. **Código de Automatización Actualizado**

Se actualizaron todos los lugares donde se usa `chromium.launch`:

**Antes:**

```typescript
this.browser = await chromium.launch({
  headless: this.config.headless,
  slowMo: 50,
});
```

**Después:**

```typescript
import { getChromiumLaunchOptions } from '../utils';

this.browser = await chromium.launch(
  getChromiumLaunchOptions({
    headless: this.config.headless,
    slowMo: 50,
  })
);
```

**Archivos modificados:**

- ✅ `src/main/services/automation.service.ts`
- ✅ `src/main/services/automation-enhanced.service.ts`
- ✅ `src/main/workers/automation.worker.ts`

## 📋 Verificación de Dependencias

### Playwright en dependencies ✅

```json
"dependencies": {
  "playwright": "^1.40.0"
}
```

**IMPORTANTE:** Playwright debe estar en `dependencies`, NO en `devDependencies`, para que se incluya en el build de producción.

## 🚀 Proceso de Build

### Desarrollo

```bash
npm install          # Instala Playwright + Chromium
npm run dev          # Usa Chromium de node_modules
```

### Producción

```bash
npm install          # Instala dependencias
npm run dist:win     # Ejecuta prebuild → build → electron-builder
```

**Flujo interno:**

1. `npm run prebuild` → `npx playwright install chromium`
2. `npm run build` → Compila TypeScript
3. `electron-builder` → Empaqueta app + copia `playwright` a `resources/`

### Resultado Final

```
Replicon.Automator.Setup.exe
└── resources/
    └── playwright/
        └── chromium-1234/
            └── chrome-win/
                └── chrome.exe  ← Ejecutable empaquetado
```

## 🔍 Validación en Máquina Limpia

Para validar que funciona correctamente:

1. **Máquina de prueba:**

   - Windows sin Node.js instalado
   - Sin Playwright instalado globalmente
   - Sin acceso a internet (opcional: validar offline)

2. **Instalación:**

   ```bash
   # Ejecutar instalador
   Replicon.Automator.Setup.exe
   ```

3. **Verificación:**

   - Abrir la aplicación
   - Intentar ejecutar automatización
   - ✅ Debe funcionar sin pedir `npx playwright install`
   - ✅ No debe buscar Chromium en `AppData\Local\ms-playwright`

4. **Logs a revisar:**
   - Buscar en logs: `"Buscando Chromium en: ..."`
   - Debe mostrar: `"✅ Chromium encontrado en: C:\...\resources\playwright\chromium-...\chrome.exe"`

## 🔧 Troubleshooting

### Error: "No se encontró Chromium en producción"

**Causa:** electron-builder no copió los binarios correctamente

**Solución:**

1. Verificar que existe `node_modules/playwright-core/.local-browsers/chromium-*`
2. Ejecutar `npm run prebuild` manualmente
3. Verificar `extraResources` en `package.json`
4. Reconstruir: `npm run dist:win`

### Error: "Executable doesn't exist"

**Causa:** Ruta incorrecta o binarios faltantes

**Solución:**

1. Revisar logs: `getChromiumExecutablePath()`
2. Verificar estructura en `release/win-unpacked/resources/playwright`
3. Confirmar que `chrome.exe` existe en `chromium-*/chrome-win/`

### Build muy pesado

**Causa:** Los binarios de Chromium pesan ~300MB

**Solución:**

- Es normal, Chromium incluye motor completo
- Alternativas: reducir compresión NSIS, usar formato portable
- **NO eliminar** Chromium del build (romperá funcionalidad)

## 📊 Impacto

### Ventajas

✅ Aplicación funciona offline  
✅ No requiere instalación manual de Playwright  
✅ Experiencia de usuario sin fricción  
✅ Automatización estable en producción

### Desventajas

⚠️ Tamaño del instalador aumenta ~300MB  
⚠️ Tiempo de build aumenta (copia binarios)

## 🎯 Resultado Final

La aplicación Electron ahora:

- ✅ Funciona en producción sin `npx playwright install`
- ✅ Incluye todo lo necesario para automatización
- ✅ Es completamente portable y offline
- ✅ No depende de rutas de usuario como `AppData\Local\ms-playwright`

---

**Fecha de implementación:** 3 de enero de 2026  
**Versión:** 3.1.0+
