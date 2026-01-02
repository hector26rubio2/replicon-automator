/**
 * Servicio de automatización con Playwright
 * Mucho más rápido que Selenium, no requiere drivers externos
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import type { 
  Credentials, 
  CSVRow, 
  TimeSlot, 
  AccountMappings, 
  TimeEntry,
  AutomationProgress,
  LogEntry,
  AppConfig 
} from '../../shared/types';
import { militaryToStandard, delay } from '../../shared/utils';
import { SPECIAL_ACCOUNTS } from '../../shared/constants';

export class PlaywrightAutomation {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: AppConfig;
  private isPaused: boolean = false;
  private isStopped: boolean = false;
  private currentProgress: AutomationProgress | null = null;
  private progressCallback: (progress: AutomationProgress) => void;
  private logCallback: (log: LogEntry) => void;

  constructor(
    config: AppConfig,
    progressCallback: (progress: AutomationProgress) => void,
    logCallback: (log: LogEntry) => void
  ) {
    this.config = config;
    this.progressCallback = progressCallback;
    this.logCallback = logCallback;
  }

  private log(level: LogEntry['level'], message: string) {
    this.logCallback({
      timestamp: new Date(),
      level,
      message,
    });
  }

  private updateProgress(progress: Partial<AutomationProgress>) {
    const base: AutomationProgress =
      this.currentProgress ??
      ({
        status: 'running',
        currentDay: 0,
        totalDays: 0,
        currentEntry: 0,
        totalEntries: 0,
        message: '',
        logs: [],
      } satisfies AutomationProgress);

    const next: AutomationProgress = {
      ...base,
      ...progress,
      status: this.isPaused ? 'paused' : (progress.status ?? base.status),
    };

    this.currentProgress = next;
    this.progressCallback(next);
  }

  async start(
    credentials: Credentials,
    csvData: CSVRow[],
    horarios: TimeSlot[],
    mappings: AccountMappings
  ): Promise<void> {
    try {
      this.log('info', '🚀 Iniciando automatización con Playwright...');
      
      // Procesar CSV a entradas de tiempo
      const timeEntries = this.processCSVData(csvData, horarios, mappings);
      this.log('info', `📊 Procesados ${timeEntries.length} días de trabajo`);

      // Iniciar navegador
      await this.setupBrowser();
      this.log('success', '✅ Navegador iniciado correctamente');

      // Login
      await this.login(credentials);
      this.log('success', '✅ Sesión iniciada correctamente');

      // Seleccionar mes
      await this.selectMonth();
      this.log('success', '✅ Mes seleccionado');

      // Procesar entradas
      await this.processEntries(timeEntries);
      
      this.log('success', '🎉 ¡Automatización completada exitosamente!');
      
    } catch (error) {
      this.log('error', `❌ Error: ${error}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async stop(): Promise<void> {
    this.isStopped = true;
    await this.cleanup();
    this.log('warning', '⚠️ Automatización detenida');
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    this.log('info', this.isPaused ? '⏸️ Automatización pausada' : '▶️ Automatización reanudada');

    if (this.currentProgress) {
      this.updateProgress({
        message: this.isPaused ? 'Automatización pausada' : 'Automatización reanudada',
      });
    }
  }

  private async setupBrowser(): Promise<void> {
    // Playwright descarga automáticamente los navegadores, no necesita drivers!
    this.browser = await chromium.launch({
      headless: this.config.headless,
      slowMo: 50, // Pequeño delay para mejor estabilidad
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'es-CO',
    });

    this.page = await this.context.newPage();
    
    // Configurar timeout global
    this.page.setDefaultTimeout(this.config.timeout);
  }

  private async login(credentials: Credentials): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');

    this.log('info', '🔐 Iniciando proceso de login...');
    
    await this.page.goto(this.config.loginUrl);
    
    // Email
    await this.page.fill('input[name="identifier"], input[type="email"]', credentials.email);
    await this.page.click('input[type="submit"], button[type="submit"]');
    
    // Esperar campo de contraseña
    await this.page.waitForSelector('input[type="password"]', { state: 'visible' });
    await this.page.fill('input[type="password"]', credentials.password);
    await this.page.click('input[type="submit"], button[type="submit"]');

    // Esperar autenticación MFA si es necesaria
    try {
      // Intentar detectar el botón de enviar push notification
      const mfaButton = await this.page.waitForSelector(
        '[data-se="okta_verify-push"], .authenticator-verify-list button',
        { timeout: 5000 }
      );
      if (mfaButton) {
        this.log('info', '📱 Verificación MFA detectada, esperando...');
        await mfaButton.click();
      }
    } catch {
      // No hay MFA, continuar
    }

    // Esperar a que cargue el dashboard de Okta
    await this.page.waitForSelector('a[aria-label*="Replicon"], a[href*="replicon"]', { 
      timeout: 60000 
    });
    
    this.log('info', '🔗 Abriendo Replicon...');
    
    // Click en Replicon
    await this.page.click('a[aria-label*="Replicon"], a[href*="replicon"]');

    // Cambiar a la nueva ventana de Replicon
    await this.switchToReplicon();
  }

  private async switchToReplicon(): Promise<void> {
    if (!this.context || !this.page) throw new Error('Navegador no inicializado');

    // Esperar a que se abra la nueva página
    const newPage = await this.context.waitForEvent('page', { timeout: 30000 });
    await newPage.waitForLoadState('networkidle');
    
    // Cerrar página anterior
    await this.page.close();
    
    // Usar la nueva página de Replicon
    this.page = newPage;
    
    this.log('info', '✅ Conectado a Replicon');
  }

  private async selectMonth(): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');

    this.log('info', '📅 Seleccionando timesheet del mes...');

    // Esperar que cargue el dashboard
    await this.page.waitForSelector('.userWelcomeText, [class*="welcome"]', { timeout: 30000 });
    
    // Click en el timesheet actual
    await this.page.click('timesheet-card li, [class*="timesheet"] li');
    
    // Esperar que cargue el timesheet
    await this.page.waitForSelector('[class*="timeEntryCell"], [class*="dayCell"]', { 
      timeout: 30000 
    });
  }

  private async processEntries(timeEntries: TimeEntry[][]): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');

    const totalDays = timeEntries.length;
    
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      // Verificar si se detuvo
      if (this.isStopped) break;
      
      // Esperar si está pausado
      while (this.isPaused && !this.isStopped) {
        await delay(500);
      }

      const dayNumber = dayIndex + 2; // Los días empiezan desde li[2]
      const dailyEntries = timeEntries[dayIndex];

      this.updateProgress({
        status: 'running',
        currentDay: dayIndex + 1,
        totalDays,
        message: `Procesando día ${dayIndex + 1} de ${totalDays}`,
      });

      // Verificar si es día de vacaciones o feriado
      if (await this.isVacationOrHoliday(dayNumber)) {
        this.log('info', `📅 Día ${dayIndex + 1}: Vacaciones/Feriado - Saltando`);
        continue;
      }

      // Filtrar entradas válidas
      const validEntries = dailyEntries.filter(
        entry => !['Vacation', 'No work', 'Weekend', 'ND'].includes(entry.project)
      );

      if (validEntries.length === 0) {
        this.log('info', `📅 Día ${dayIndex + 1}: Sin entradas de trabajo`);
        continue;
      }

      this.log('info', `📅 Día ${dayIndex + 1}: Procesando ${validEntries.length} entradas`);

      // Click en el día
      await this.page.click(`li:nth-child(${dayNumber}) a, li:nth-child(${dayNumber}) [class*="clickable"]`);
      await delay(500);

      // Procesar cada entrada
      for (let entryIndex = 0; entryIndex < validEntries.length; entryIndex++) {
        if (this.isStopped) break;

        const entry = validEntries[entryIndex];
        
        this.updateProgress({
          status: 'running',
          currentDay: dayIndex + 1,
          totalDays,
          currentEntry: entryIndex + 1,
          totalEntries: validEntries.length,
          message: `Día ${dayIndex + 1}: Entrada ${entryIndex + 1}/${validEntries.length}`,
        });

        await this.addTimeEntry(entry);
        
        this.log('success', `  ✓ ${entry.project} - ${entry.account}: ${entry.start_time} - ${entry.end_time}`);
      }
    }
  }

  private async addTimeEntry(entry: TimeEntry): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');

    // Hora de inicio
    await this.page.fill('input.time, input[type="time"]', entry.start_time);

    // Seleccionar proyecto
    await this.page.click('a.divDropdown, [class*="projectSelector"]');
    await this.page.click(`a:has-text("${entry.project}")`);
    
    // Seleccionar cuenta/subproyecto
    await this.page.click(`a:has-text("${entry.account}")`);
    
    // Guardar entrada de inicio
    await this.page.click('input[value="OK"], button:has-text("OK")');
    await this.page.waitForSelector('[class*="contextPopup"]', { state: 'hidden' });

    // Hora de fin
    await this.page.click('[class*="punchOut"], [class*="combinedInput"] a:nth-child(2)');
    await this.page.fill('input.time, input[type="time"]', entry.end_time);
    
    // Guardar hora de fin
    await this.page.click('input[value="OK"], button:has-text("OK")');
    await this.page.waitForSelector('[class*="contextPopup"]', { state: 'hidden' });
  }

  private async isVacationOrHoliday(dayNumber: number): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Verificar vacaciones
      const vacation = await this.page.$(`li:nth-child(${dayNumber}) span:has-text("Vacations")`);
      if (vacation) return true;

      // Verificar feriado
      const holiday = await this.page.$(`li:nth-child(${dayNumber}) [class*="holidayIndicator"]`);
      if (holiday) return true;

      return false;
    } catch {
      return false;
    }
  }

  private processCSVData(
    csvData: CSVRow[],
    horarios: TimeSlot[],
    mappings: AccountMappings
  ): TimeEntry[][] {
    const allEntries: TimeEntry[][] = [];

    for (const row of csvData) {
      const cuenta = row.cuenta.trim().toUpperCase();
      const proyecto = row.proyecto.trim().toUpperCase();
      const extras = row.extras?.trim() || '';

      const dailyEntries: TimeEntry[] = [];

      // Verificar si es día especial
      if (SPECIAL_ACCOUNTS.VACATION.includes(cuenta) || 
          SPECIAL_ACCOUNTS.NO_WORK.includes(cuenta) ||
          SPECIAL_ACCOUNTS.WEEKEND.includes(cuenta)) {
        // No crear entradas para días especiales
      } else if (cuenta === 'ND' && proyecto === 'ND') {
        // Solo procesar extras si existen
      } else {
        // Procesar entradas normales
        const mapping = mappings[cuenta];
        if (mapping && mapping.name !== 'No work' && mapping.name !== 'Vacation') {
          const projectName = mapping.name;
          const accountName = mapping.projects[proyecto] || proyecto;

          for (const horario of horarios) {
            dailyEntries.push({
              start_time: horario.start_time,
              end_time: horario.end_time,
              project: projectName,
              account: accountName,
            });
          }
        }
      }

      // Procesar entradas extra (EXT/)
      if (extras.startsWith('EXT/')) {
        const extEntries = this.parseExtEntries(extras, mappings);
        dailyEntries.push(...extEntries);
      }

      allEntries.push(dailyEntries);
    }

    return allEntries;
  }

  private parseExtEntries(extString: string, mappings: AccountMappings): TimeEntry[] {
    const entries: TimeEntry[] = [];
    
    // Remover 'EXT/'
    const extData = extString.slice(4);
    
    // Dividir por ';'
    const parts = extData.split(';');

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed.includes(':')) continue;

      const components = trimmed.split(':');
      if (components.length < 4) continue;

      const [cuenta, proyecto, startMilitary, endMilitary] = components;
      
      const mapping = mappings[cuenta.trim()];
      if (!mapping) continue;

      entries.push({
        start_time: militaryToStandard(startMilitary.trim()),
        end_time: militaryToStandard(endMilitary.trim()),
        project: mapping.name,
        account: mapping.projects[proyecto.trim()] || proyecto.trim(),
      });
    }

    return entries;
  }

  private async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close().catch(() => {});
    }
    if (this.context) {
      await this.context.close().catch(() => {});
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
    }
    
    this.page = null;
    this.context = null;
    this.browser = null;
  }
}
