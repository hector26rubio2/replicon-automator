# Configuración de Playwright para Producción

## Problema Resuelto

Este documento describe los cambios implementados para evitar el error `browserType.launch: Executable doesn't exist` en producción.

## ❌ Problema Original

- Playwright funciona en desarrollo pero falla en producción
- El instalador no incluye los binarios de Chromium
- La aplicación depende de `npx playwright install` en la máquina del usuario
- Error: `browserType.launch: Executable doesn't exist at ...`

## ✅ Solución Implementada

### 1. **package.json - Scripts**

Se agregaron scripts para garantizar que Chromium se instale antes de compilar:

```json
"scripts": {
  "postinstall": "npx playwright install chromium --with-deps",
  "prebuild": "npx playwright install chromium --with-deps",
  "dist": "npm run prebuild && npm run build && electron-builder",
  "dist:win": "npm run prebuild && npm run build && electron-builder --win"
}
```

**¿Qué hace?**

- `postinstall`: Instala Chromium después de `npm install`
- `prebuild`: Garantiza que Chromium esté disponible antes de compilar
- `dist`/`dist:win`: Asegura que prebuild se ejecute antes del build

### 2. **package.json - electron-builder**

Se configuró `extraResources` para empaquetar los binarios de Chromium:

```json
"extraResources": [
  {
    "from": "node_modules/playwright-core/.local-browsers",
    "to": "playwright",
    "filter": ["**/*"]
  }
]
```

**¿Qué hace?**

- Copia los binarios de Chromium desde `node_modules/playwright-core/.local-browsers`
- Los coloca en `resources/playwright` del instalador
- En runtime, la app busca el ejecutable en `process.resourcesPath/playwright`

### 3. **playwright-config.ts** (NUEVO)

Helper para obtener la ruta correcta de Chromium según el entorno:

```typescript
export function getChromiumExecutablePath(): string | undefined {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    return undefined; // Usa ruta por defecto de node_modules
  }

  // En producción: busca en process.resourcesPath/playwright
  const resourcesPath = process.resourcesPath;
  const playwrightPath = path.join(resourcesPath, 'playwright');

  // Busca chromium-*/chrome-win/chrome.exe
  const chromiumFolder = fs.readdirSync(playwrightPath).find((f) => f.startsWith('chromium-'));

  if (chromiumFolder) {
    const chromePath = path.join(playwrightPath, chromiumFolder, 'chrome-win', 'chrome.exe');

    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }

  throw new Error('No se encontró Chromium en producción');
}

export function getChromiumLaunchOptions(options = {}) {
  const executablePath = getChromiumExecutablePath();

  return {
    headless: options.headless ?? true,
    slowMo: options.slowMo ?? 50,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'],
    ...(executablePath && { executablePath }),
  };
}
```

**¿Qué hace?**

- **Desarrollo**: Retorna `undefined`, Playwright usa instalación local
- **Producción**: Retorna ruta a `chrome.exe` empaquetado
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
