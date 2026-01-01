# Replicon Automator v3

🚀 **App de escritorio moderna para automatizar el registro de horas en Replicon**

## ✨ Características

- **🎯 Electron + React** - Interfaz moderna y responsiva
- **⚡ Playwright** - Automatización web ultra-rápida (sin drivers externos)
- **📊 Editor CSV integrado** - Crea y edita tus datos directamente en la app
- **📝 Plantillas predefinidas** - Semana estándar, vacaciones, proyectos mixtos
- **⏰ Horarios configurables** - Define tus bloques de trabajo
- **🏢 Mapeo de cuentas** - Configura abreviaciones y proyectos
- **📋 Logs en tiempo real** - Monitorea el progreso de la automatización
- **🔐 Credenciales seguras** - Guarda tus credenciales de forma cifrada

## 🛠️ Tecnologías

| Tecnología | Uso |
|------------|-----|
| Electron 28 | Framework de app de escritorio |
| React 18 | UI del renderer |
| TypeScript | Tipado estático |
| Tailwind CSS | Estilos |
| Playwright | Automatización web |
| Vite | Build tool para el renderer |

## 📦 Instalación

### Requisitos
- Node.js 18+
- npm o yarn

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Instalar navegadores de Playwright (solo la primera vez)
npx playwright install chromium

# 3. Ejecutar en modo desarrollo
npm run dev

# 4. Construir para producción
npm run dist:win
```

## 📁 Estructura del Proyecto

```
RepliconAutomatorV3/
├── src/
│   ├── main/                 # Proceso principal de Electron
│   │   ├── index.ts          # Entry point
│   │   ├── preload.ts        # Bridge seguro renderer<->main
│   │   └── services/
│   │       ├── playwright-automation.ts  # Automatización
│   │       ├── csv-service.ts            # Manejo de CSV
│   │       └── credentials-service.ts    # Credenciales
│   │
│   ├── renderer/             # UI (React)
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── TabNavigation.tsx
│   │   │   └── tabs/
│   │   │       ├── AutomationTab.tsx
│   │   │       ├── CSVEditorTab.tsx
│   │   │       ├── ConfigTab.tsx
│   │   │       └── LogsTab.tsx
│   │   └── hooks/
│   │       ├── useAutomation.ts
│   │       ├── useCSV.ts
│   │       └── useConfig.ts
│   │
│   └── shared/               # Código compartido
│       ├── types.ts          # Tipos TypeScript
│       ├── constants.ts      # Constantes y defaults
│       └── utils.ts          # Utilidades
│
├── assets/                   # Recursos (iconos)
├── package.json
├── tsconfig.json             # Config TS renderer
├── tsconfig.main.json        # Config TS main
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🎮 Uso

### 1. Configurar Credenciales
- Ingresa tu email y contraseña de Okta
- Opcionalmente, marca "Recordar credenciales"

### 2. Cargar/Crear CSV
- **Cargar**: Usa el botón "Cargar CSV" para un archivo existente
- **Crear**: Ve al tab "Editor CSV" y usa plantillas o crea manualmente

### 3. Configurar Horarios (opcional)
- Ve al tab "Configuración"
- Ajusta los bloques de tiempo de trabajo

### 4. Iniciar Automatización
- Click en "Iniciar Automatización"
- Monitorea el progreso en tiempo real
- Revisa los logs en el tab "Logs"

## 📊 Formato CSV

```csv
Cuenta,Projecto,Extras
PROD,PI,
AV,MS,EXT/PROD:PI:1600:1800
PROD,IN,EXT/PROD:PI:0900:1100;AV:MS:1400:1500
```

### Columnas
- **Cuenta**: Código de la cuenta (ej: PROD, AV, JM)
- **Projecto**: Código del proyecto (ej: MS, PR, PI)
- **Extras**: Horas extra en formato `EXT/CUENTA:PROYECTO:INICIO:FIN`

### Códigos especiales
- `H` o `F` = Vacaciones
- `BH` = Día sin trabajo
- `ND` = No aplica (fin de semana)

## 🔧 Ventajas sobre v2 (PyQt6 + Selenium)

| Aspecto | v2 (PyQt6 + Selenium) | v3 (Electron + Playwright) |
|---------|----------------------|---------------------------|
| **Velocidad** | Lento | 3-5x más rápido |
| **Drivers** | Requiere ChromeDriver | Sin drivers externos |
| **UI** | Qt Widgets | React moderno |
| **Bundle size** | Grande (Python) | Más compacto |
| **Editor CSV** | Externo | Integrado |
| **Plantillas** | No | Sí |

## 👤 Autor

**Hector David Rubio Tabares**

---

⚡ Powered by Playwright - Automatización web de nueva generación
