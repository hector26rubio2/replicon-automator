# 💎 GitHub Free Tier - Guía Maestra de Optimización

## Aprovecha al MÁXIMO los recursos gratuitos (Sin gastar un centavo)

> **🎯 Objetivo:** Configurar un entorno DevOps profesional usando ÚNICAMENTE la capa gratuita de GitHub.

---

## 📊 RECURSOS GRATUITOS DISPONIBLES

| Recurso           | Límite Gratuito    | Uso en este Proyecto      |
| ----------------- | ------------------ | ------------------------- |
| GitHub Actions    | 2,000 min/mes      | ~400 min/mes (optimizado) |
| GitHub Packages   | 500 MB storage     | ~200 MB (caché npm)       |
| GitHub Pages      | 1 GB/mes bandwidth | Docs + Coverage           |
| Git LFS           | 1 GB storage       | No usado                  |
| Codespaces        | 60 horas/mes       | Desarrollo remoto         |
| Security Features | Ilimitado          | CodeQL + Dependabot       |
| Projects          | Ilimitado          | Kanban completo           |

---

## 🚀 1. GITHUB ACTIONS - Optimización de Minutos

### ✅ Configuración Actual (Ahorro: ~70% de minutos)

```yaml
# 📁 .github/workflows/ci-cd.yml

# CRÍTICO: Cancelar builds duplicados
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # Ahorra ~200 min/mes

# Caché optimizada (ahorra ~5 min por build)
- name: Cache node modules
  uses: actions/cache@v4
  id: cache-node-modules  # ← Verificar hits
  with:
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# Caché de Playwright (ahorra ~2 min)
- name: Cache Playwright browsers
  uses: actions/cache@v4
  id: cache-playwright
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}

# Caché de Wine (ahorra ~2 min)
- name: Cache Wine installation
  uses: actions/cache@v4
  id: cache-wine
  with:
    path: |
      /opt/wine-stable
      ~/.wine
    key: ${{ runner.os }}-wine-9.0

# Instalaciones condicionales (saltar si hay caché)
- name: Install dependencies
  if: steps.cache-node-modules.outputs.cache-hit != 'true'
  run: npm ci

- name: Install Playwright
  if: steps.cache-playwright.outputs.cache-hit != 'true'
  run: npx playwright install chromium --with-deps

- name: Install Wine
  if: steps.cache-wine.outputs.cache-hit != 'true'
  run: |
    # Instalación de Wine solo si no está en caché
```

### 📉 Consumo de Minutos Estimado

| Workflow               | Sin Optimización | Con Optimización | Ahorro |
| ---------------------- | ---------------- | ---------------- | ------ |
| CI/CD (build completo) | ~25 min          | ~8 min           | 68%    |
| Quick Validation       | N/A              | ~2 min           | -      |
| Coverage Report        | ~10 min          | ~3 min           | 70%    |
| CodeQL                 | ~15 min          | ~15 min\*        | -      |
| Docs Deployment        | ~5 min           | ~1 min           | 80%    |

\*CodeQL no consume minutos en repos públicos

**Total mensual:**

- 4 releases/mes × 8 min = 32 min
- 20 PRs/mes × 2 min (quick) = 40 min
- 20 PRs/mes × 3 min (coverage) = 60 min
- 4 deploys/mes × 1 min = 4 min
- **TOTAL: ~136 min/mes (< 7% del límite)**

---

## 📦 2. GITHUB PACKAGES - Caché de Dependencias

### ✅ Uso Óptimo (Sin Docker, solo npm caché)

```yaml
# NO usamos GitHub Packages para Docker (consume mucho espacio)
# SÍ usamos para caché de npm (más eficiente)

- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    # Caché se almacena en GitHub Packages automáticamente
```

**Ventajas:**

- ✅ Restauración instantánea de node_modules
- ✅ Compartido entre workflows
- ✅ Solo ~50 MB por caché
- ✅ Expira automáticamente después de 7 días sin uso

**Consumo estimado:** ~200 MB (40% del límite)

---

## 🌐 3. GITHUB PAGES - Hosting Gratuito

### ✅ Configuración Actual

**URL del sitio:** `https://hector26rubio2.github.io/replicon-automator/`

**Contenido alojado:**

1. **Documentación** (`/`) - Generada desde README.md
2. **Coverage Reports** (`/coverage/`) - Reportes de pruebas
3. **Release Notes** - Historial de versiones

```yaml
# 📁 .github/workflows/docs.yml

# Genera sitio estático SIN dependencias externas
- name: Generate documentation site
  run: |
    mkdir -p docs-site

    # Convertir README a HTML (sin dependencias)
    python3 -c "
    import re
    # Markdown → HTML puro
    "

    # Alojar en GitHub Pages (gratis, ilimitado para repos públicos)
```

**Ventajas:**

- ✅ SSL/HTTPS gratuito
- ✅ CDN global (rápido en todo el mundo)
- ✅ Sin límite de visitas en repos públicos
- ✅ Actualización automática en cada push a `main`

**Alternativas evaluadas:**

- ❌ Netlify Free (100 GB/mes pero requiere cuenta externa)
- ❌ Vercel Free (similar, pero más complejo)
- ✅ **GitHub Pages** (nativo, simple, ilimitado)

---

## 🔐 4. SEGURIDAD - Sin Costo Adicional

### ✅ Protección Multi-Capa

#### A. Dependabot (Actualizaciones Automáticas)

```yaml
# 📁 .github/dependabot.yml

version: 2
updates:
  - package-ecosystem: 'npm'
    schedule:
      interval: 'weekly' # No daily (ahorra notificaciones)
    groups:
      dependencies:
        update-types: ['minor', 'patch'] # Agrupar PRs
    open-pull-requests-limit: 5 # Máximo 5 PRs abiertos
```

**Ahorro:** ~15 PRs/mes → ~3 PRs/mes (agrupados)

#### B. CodeQL (Análisis de Seguridad)

```yaml
# 📁 .github/workflows/codeql.yml

# GRATIS para repositorios públicos
# NO consume minutos de Actions

on:
  schedule:
    - cron: '0 3 * * 1' # Solo lunes (no diario)
  push:
    branches: [main] # Solo en cambios importantes
```

#### C. Branch Protection Rules

```bash
# Settings → Branches → Add rule

Branch name pattern: main

✅ Require pull request before merging
  ✅ Require approvals: 1 (puede ser tu mismo)
  ✅ Dismiss stale approvals when new commits are pushed

✅ Require status checks to pass
  ✅ quick-validation
  ✅ build

✅ Require conversation resolution before merging

❌ Require signed commits (opcional, más seguro)

❌ Include administrators (para trabajar solo, deshabilitarlo)
```

#### D. Secrets Management

```bash
# Settings → Secrets and variables → Actions → New repository secret

# Ejemplo: Token de notificaciones
Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/XXX/YYY/ZZZ

# Uso en workflows
env:
  SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**NUNCA HARDCODEAR:**

- ❌ API Keys
- ❌ Tokens
- ❌ Contraseñas
- ❌ Credenciales de base de datos

---

## 💻 5. CODESPACES - Desarrollo en la Nube

### ✅ Uso Estratégico (60 horas/mes)

**Cuándo usar Codespaces:**

- ✅ Desarrollo desde laptop sin recursos
- ✅ Testing en entorno limpio
- ✅ Revisión rápida de PRs
- ✅ Debugging de issues complejos

**Cuándo NO usar:**

- ❌ Desarrollo local habitual
- ❌ Builds de producción (usa Actions)
- ❌ Dejar abierto sin trabajar (consume horas)

### Configuración Óptima

```json
// 📁 .devcontainer/devcontainer.json

{
  "name": "Replicon Automator Dev",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:22",

  // Pre-instalar extensiones
  "customizations": {
    "vscode": {
      "extensions": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode", "ms-playwright.playwright"]
    }
  },

  // Comando post-creación
  "postCreateCommand": "npm install && npx playwright install chromium",

  // Configuración de máquina (2 cores = mínimo, gratis)
  "hostRequirements": {
    "cpus": 2,
    "memory": "4gb",
    "storage": "32gb"
  }
}
```

**Consumo estimado:**

- 10 sesiones/mes × 3 horas/sesión = 30 horas (50% del límite)
- Siempre cerrar Codespaces cuando no se usen

---

## 🛠️ 6. GESTIÓN DE PROYECTOS - Kanban Completo

### ✅ GitHub Projects V2 (Gratis, Ilimitado)

**Configuración:** Ver [`GITHUB_PROJECTS.md`](./GITHUB_PROJECTS.md)

**Automatizaciones Nativas:**

1. **Auto-mover Issues:** Asignado → In Progress
2. **Auto-cerrar:** PR merged → Done
3. **Auto-labels:** Dependabot → `dependencies` tag

**Integraciones Gratuitas:**

- ✅ GitHub Mobile (notificaciones push)
- ✅ VS Code Extension (gestionar issues desde el editor)
- ✅ Slack Free (notificaciones de PRs)

---

## 📈 7. MÉTRICAS Y MONITOREO

### ✅ GitHub Insights (Gratis)

**Métricas Disponibles:**

- 📊 **Pulse:** Actividad semanal
- 👥 **Contributors:** Quién contribuye
- 📈 **Traffic:** Visitas al repo
- 🌐 **Community:** Salud del proyecto
- 🔄 **Dependency Graph:** Dependencias visualizadas

**Acceso:** `github.com/usuario/repo/insights`

### ✅ Coverage Badges

```markdown
# README.md

[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)](https://hector26rubio2.github.io/replicon-automator/coverage/)
```

**Actualización automática:** CI/CD genera badge en cada push

---

## 🎯 8. BEST PRACTICES - Ahorro Extremo

### ✅ DO's

1. **Usa `act` localmente** para testing de workflows

   ```bash
   # Instalar act
   choco install act-cli

   # Ejecutar workflow localmente (NO consume minutos de GitHub)
   act -j build
   ```

2. **Draft PRs** para trabajo en progreso (no activa CI completo)

3. **Squash commits** antes de merge (menos runs de CI)

4. **Scheduled workflows** solo cuando sea necesario

   ```yaml
   schedule:
     - cron: '0 3 * * 1' # Solo lunes, NO diario
   ```

5. **Fail-fast** para detener builds rápido
   ```yaml
   timeout-minutes: 5 # Falla rápido si algo está mal
   strategy:
     fail-fast: true
   ```

### ❌ DON'Ts

1. ❌ NO ejecutar workflows en cada commit (usa paths filters)

   ```yaml
   on:
     push:
       paths:
         - 'src/**' # Solo si cambió código fuente
   ```

2. ❌ NO duplicar lógica entre workflows (usa composite actions)

3. ❌ NO dejar Codespaces abiertos sin usar

4. ❌ NO almacenar archivos grandes en Git (usa Git LFS)

5. ❌ NO hacer polling frecuente en scheduled workflows

---

## 📊 DASHBOARD DE CONSUMO

Monitorea tu uso en: `Settings → Billing → Usage this month`

### Límites Críticos

```bash
# Alertas recomendadas
Actions: Alerta al 80% (1,600 min)
Packages: Alerta al 80% (400 MB)
Pages: No hay límite en repos públicos
```

---

## 🚀 ROADMAP DE OPTIMIZACIONES FUTURAS

### Q1 2025

- [ ] Migrar a Self-hosted runners (gratis, minutos ilimitados)
- [ ] Implementar Matrix builds (paralelizar tests)
- [ ] Caché de Playwright binaries en GitHub Packages

### Q2 2025

- [ ] GitHub Discussions para comunidad
- [ ] GitHub Sponsors (monetización opcional)
- [ ] Wiki para documentación avanzada

---

## 🎓 RECURSOS ADICIONALES

- 📚 [GitHub Actions Docs](https://docs.github.com/actions)
- 🔐 [Security Best Practices](https://docs.github.com/code-security)
- 📦 [Packages Guides](https://docs.github.com/packages)
- 🌐 [Pages Documentation](https://docs.github.com/pages)

---

## 🆘 SOPORTE

¿Problemas? Abre un [Issue](https://github.com/hector26rubio2/replicon-automator/issues/new/choose) usando los templates.

---

**🎉 Con esta configuración, tienes un entorno DevOps profesional SIN GASTAR UN CENTAVO.**

**Ahorro total estimado vs. alternativas pagas:** ~$50-100/mes
