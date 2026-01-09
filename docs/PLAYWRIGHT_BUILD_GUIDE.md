# Guía de Actualización - Qué Incluir en Nuevas Versiones

## 📋 Resumen

Cuando se publica una **nueva versión** (update) de la aplicación, es crítico que los **binarios de Playwright** se incluyan en el paquete, de lo contrario la app fallará al intentar automatizar Replicon.

## ✅ Qué Necesitas Hacer En Cada Actualización

### 1. **Antes de hacer el Build**

```bash
npm install                    # Instala dependencias incluyendo Playwright
npm run ensure-playwright      # Verifica/descarga binarios de Chromium
```

### 2. **Durante el Build**

```bash
npm run dist:win              # Crea el instalador para Windows
```

**¿Qué sucede internamente?**

- `npm run build` ejecuta:
  - `npm run ensure-playwright` → Verifica Playwright está en node_modules
  - `npm run prebuild` → Prepara Playwright para el build
  - `npm run build:renderer` + `npm run build:main` → Compila la app
  - `npm run copy:playwright` → **COPIA los binarios a `playwright-bin/`**
- `electron-builder` lee la config en `package.json` y:
  - Incluye `dist/**/*` (código compilado)
  - Incluye `node_modules/playwright/**/*` (Playwright desde node_modules)
  - Incluye `playwright-bin/` como recurso (copia de respaldo)

### 3. **Archivos Críticos a Incluir**

El instalador `.exe` debe contener:

```
✅ INCLUIDOS AUTOMÁTICAMENTE:
├── dist/                          (código compilado)
├── node_modules/playwright/       (Playwright en node_modules)
├── playwright-bin/                (Copia de respaldo de binarios)
├── assets/                        (iconos y recursos)
└── package.json

❌ NO INCLUIDOS (configuración de desarrollo):
├── src/                           (código fuente TS/TSX)
├── node_modules/                  (excepto playwright)
└── .env.development
```

## 🔧 Scripts Disponibles Para Verificación

```bash
# Ver estado de Playwright
npm run diagnose:playwright

# Asegurar que Playwright está disponible
npm run ensure-playwright

# Copiar binarios a playwright-bin/
npm run copy:playwright

# Build completo con validación
npm run dist:win
```

## 📦 Configuración de electron-builder

La configuración en `package.json` que asegura la inclusión:

```json
{
  "build": {
    "asarUnpack": ["node_modules/playwright/**/*"],
    "extraResources": [
      {
        "from": "playwright-bin",
        "to": "playwright",
        "filter": ["**/*", "!**/*.pdb", "!**/DEPENDENCIES*", "!**/INSTALLATION*"]
      }
    ]
  }
}
```

## 🚀 Flujo Completo Recomendado

```bash
# 1. Preparar ambiente
npm install
npm run ensure-playwright

# 2. Validar que todo funciona
npm run test
npm run validate

# 3. Crear build
npm run dist:win

# 4. Verificar que el .exe tiene Playwright (opcional)
# Extraer el .exe y buscar carpetas "chromium-*" dentro
```

## ⚠️ Si la App Falla Después de Actualizar

**Síntomas:**

- Error al intentar automatizar Replicon
- "Playwright not found" en logs
- La app se abre pero no puede hacer nada

**Solución para usuarios:**

1. Desinstala la app completamente
2. Reinstala desde el nuevo `.exe`
3. Si sigue fallando, ejecuta:
   ```bash
   npx playwright install chromium --with-deps
   ```

**Para desarrollador:**

1. Verifica que el build incluya Playwright:
   ```bash
   npm run diagnose:playwright
   ```
2. Si falta, ejecuta el build nuevamente:
   ```bash
   npm run clean && npm run dist:win
   ```

## 📝 Checklist Pre-Release

- [ ] `npm install` sin errores
- [ ] `npm run diagnose:playwright` muestra ✅ Chromium
- [ ] `npm run validate` pasa (lint, typecheck, tests)
- [ ] `npm run dist:win` completa sin errores
- [ ] Versión actualizada en `package.json`
- [ ] CHANGELOG.md actualizado
- [ ] Archivo `.exe` generado en `release/`

## 🔗 Archivos Relacionados

- `scripts/ensure-playwright.js` - Verifica/instala Playwright
- `scripts/prepare-playwright-build.js` - Prepara binarios para build
- `scripts/copy-playwright-bins.js` - Copia a directorio `playwright-bin/`
- `scripts/diagnose-playwright.js` - Diagnóstico de estado
- `src/main/services/playwright-runtime-check.service.ts` - Verifica en tiempo de ejecución

---

**Última actualización:** 9 de enero de 2026
