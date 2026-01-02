# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.0.5] - 2026-01-02

### Added
- DevLogs floating button to view application logs in real-time
- Console interceptor for Main and Renderer processes
- Source indicator for logs ([Main] / [Renderer])

### Improved
- In production, DevLogs only shows errors (no info/warn/debug)
- DevLogs button only appears in production when there are errors
- Removed application menu in production for cleaner UI
- Disabled DevTools in production for security
- Replaced all console.log with structured logger system
- Better theme support (dark/light) for DevLogs panel
- Full i18n support for DevLogs component

### Fixed
- DevLogger interceptor not working due to incorrect environment detection
- Old compiled files in dist/ not being updated
- Console.log statements appearing in production builds

### Technical
- Use `app.isPackaged` instead of `process.env.NODE_ENV` for environment detection
- Added `devTools: isDev` and `autoHideMenuBar` options to BrowserWindow
- Cleaned up debug/test console.log statements

## [0.0.4] - 2026-01-01

### Added
- Welcome/guide modal for new users (Onboarding)
- Step-by-step guide explaining main features
- Visual progress indicators in onboarding

### Improved
- Better user experience for first-time users
- Complete onboarding translations (ES/EN)

## [0.0.3] - 2026-01-01

### Fixed
- Missing TypeScript types for update APIs
- Artifact paths in CI/CD pipeline

## [0.0.2] - 2026-01-01

### Added
- Automatic update system with background download
- Update installation button in UI
- Translation system for main process (i18n)

### Improved
- Update messages now use translation system
- Better visual feedback during update downloads

## [0.0.1] - 2026-01-01

### Added
- Complete migration to Electron + Playwright
- Modern interface with React + Tailwind CSS
- Theme system (light/dark/system) with smooth transitions
- Multi-language support (ES/EN)
- Integrated CSV editor with undo/redo
- Template system
- Task scheduler
- Execution history with charts (BarChart, DonutChart, LineChart, Sparkline, ProgressRing)
- Notifications with sounds
- Global keyboard shortcuts
- Unified credentials service with safeStorage encryption
- Dry Run system to simulate automations
- Recovery/Checkpoint system for failed executions
- Browser preloading for faster startup
- Optimized Zustand selectors for better performance

### Technical
- Architecture based on Electron with separate main and renderer processes
- Automation with Playwright (faster than Selenium, no external drivers)
- CI/CD pipeline with GitHub Actions
- Automatic build for Windows (.exe installer and portable)
