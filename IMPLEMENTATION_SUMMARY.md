# Solución: Problema de Playwright en Instalaciones Nuevas y Actualizaciones

## 🎯 Problema Identificado

Cuando se instala la app en una PC nueva o se actualiza a una nueva versión, **Playwright no se incluye correctamente**, causando que la app falle al intentar automatizar Replicon.

## ✅ Soluciones Implementadas

### 1. **Nuevo Script: `ensure-playwright.js`** (Mejorado)

**Ubicación:** `scripts/ensure-playwright.js`

- Verifica que Playwright esté instalado en `node_modules`
- Si falta, lo instala automáticamente
- Descarga los binarios de Chromium
- Se ejecuta en:
  - `postinstall` (cuando se hace `npm install`)
  - Antes de compilar (`npm run build`)

### 2. **Nuevo Servicio: `playwright-runtime-check.service.ts`**

**Ubicación:** `src/main/services/playwright-runtime-check.service.ts`

- Se ejecuta **cuando la app inicia**
- Verifica que Playwright esté disponible
- Busca en las rutas correctas (desarrollo vs producción)
- Registra advertencias si falta (importante después de actualizar)
- Obtiene la ruta al ejecutable de Chromium

**Integración en `src/main/index.ts`:**

```typescript
playwrightRuntimeCheckService.initialize();
```

### 3. **Actualización de `package.json`**

**Nuevos scripts:**

```json
{
  "scripts": {
    "ensure-playwright": "node scripts/ensure-playwright.js",
    "copy:playwright": "node scripts/copy-playwright-bins.js",
    "diagnose:playwright": "node scripts/diagnose-playwright.js",
    "build": "npm run ensure-playwright && npm run prebuild && npm run build:renderer && npm run build:main && npm run copy:playwright",
    "postinstall": "npm run ensure-playwright"
  }
}
```

**Flujo mejorado:**

1. `npm install` → Ejecuta `ensure-playwright` (postinstall)
2. `npm run build` →
   - Verifica Playwright
   - Prepara para build
   - Compila renderer y main
   - **Copia binarios a `playwright-bin/`**
3. `electron-builder` empaqueta todo incluyendo los binarios

### 4. **Documento de Referencia**

**Ubicación:** `docs/PLAYWRIGHT_BUILD_GUIDE.md`

- Explicación completa del proceso
- Qué incluye cada instalador
- Checklist pre-release
- Procedimiento de recuperación si falla

## 🚀 Cómo Usarlo

### Para Desarrollo

```bash
npm install                   # Instala y asegura Playwright
npm run ensure-playwright     # Verifica estado
npm run diagnose:playwright   # Diagnostica problemas
npm run build                 # Build completo
```

### Para Crear un Release

```bash
npm install
npm run clean && npm run dist:win    # Crea instalador
```

### Para Diagnosticar Problemas

```bash
npm run diagnose:playwright   # Muestra estado de Playwright
```

## 📦 Qué Se Incluye en Cada Instalador

El archivo `.exe` ahora contiene:

✅ **Incluidos automáticamente:**

- Código compilado (`dist/`)
- Playwright en node_modules
- Copia de respaldo en `playwright-bin/`
- Assets (iconos, recursos)

✅ **Verificación en tiempo de ejecución:**

- Si falta Playwright, la app lo detecta al iniciar
- Registra advertencia en logs

## 🔄 Flujo Después de Actualizar

Cuando un usuario instala una actualización:

1. **Instalador ejecuta** → Extrae archivos incluyendo Playwright
2. **App inicia** → `playwrightRuntimeCheckService` verifica disponibilidad
3. **Si falta** → Se registra en logs (usuario puede reinstalar si es necesario)
4. **Si existe** → App funciona normalmente

## 📝 Archivos Modificados/Creados

```
✅ CREADOS:
- src/main/services/playwright-runtime-check.service.ts
- docs/PLAYWRIGHT_BUILD_GUIDE.md

✅ MODIFICADOS:
- package.json (scripts mejorados)
- src/main/index.ts (integración del servicio)
- src/main/services/index.ts (exportación del nuevo servicio)
- scripts/ensure-playwright.js (mejorado)

✅ EXISTENTES (sin cambios necesarios):
- scripts/copy-playwright-bins.js
- scripts/prepare-playwright-build.js
- scripts/diagnose-playwright.js
```

## 🧪 Testing

Para verificar que todo funciona:

```bash
# 1. Limpiar y reinstalar
npm run clean
npm install

# 2. Diagnosticar
npm run diagnose:playwright

# 3. Build
npm run dist:win

# 4. Verificar que el .exe incluye Playwright ✅
```

## 🎓 Resumen para el Usuario Final

**Si tu usuario reporta que la app no funciona después de actualizar:**

1. **Opción 1 (Recomendada):** Desinstala y reinstala desde el nuevo `.exe`
2. **Opción 2:** Ejecuta `npx playwright install chromium --with-deps` si tiene Node.js

---

**Implementado:** 9 de enero de 2026
