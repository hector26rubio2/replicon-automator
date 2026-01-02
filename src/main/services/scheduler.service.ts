/**
 * Scheduler Service - Programación de automatizaciones
 */
import * as fs from 'fs';
import * as path from 'path';
import { app, BrowserWindow } from 'electron';
import { logAudit } from './audit-logger.service';
import { createLogger } from '../utils';

const logger = createLogger('Scheduler');

export interface ScheduledTask {
  id: string;
  name: string;
  enabled: boolean;
  cronExpression?: string; // For advanced scheduling
  schedule: {
    type: 'daily' | 'weekly' | 'monthly' | 'once';
    time: string; // HH:mm format
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    dayOfMonth?: number; // 1-31
    date?: string; // ISO date for 'once' type
  };
  accountIds: string[];
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
}

interface SchedulerConfig {
  tasks: ScheduledTask[];
  enabled: boolean;
}

class SchedulerService {
  private configPath: string;
  private config: SchedulerConfig;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'scheduler.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): SchedulerConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error('Error loading config:', error);
    }
    return { tasks: [], enabled: true };
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Error saving config:', error);
    }
  }

  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  start(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every minute for scheduled tasks
    this.checkInterval = setInterval(() => {
      this.checkScheduledTasks();
    }, 60 * 1000);

    // Initial check
    this.checkScheduledTasks();
    
    logger.info('Service started');
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Clear all task timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    logger.info('Service stopped');
  }

  private checkScheduledTasks(): void {
    if (!this.config.enabled) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    for (const task of this.config.tasks) {
      if (!task.enabled) continue;

      if (this.shouldRunTask(task, now, currentTime)) {
        this.executeTask(task);
      }

      // Update next run time
      task.nextRun = this.calculateNextRun(task);
    }

    this.saveConfig();
  }

  private shouldRunTask(task: ScheduledTask, now: Date, currentTime: string): boolean {
    if (task.schedule.time !== currentTime) return false;

    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();

    switch (task.schedule.type) {
      case 'daily':
        return true;

      case 'weekly':
        return task.schedule.daysOfWeek?.includes(dayOfWeek) ?? false;

      case 'monthly':
        return task.schedule.dayOfMonth === dayOfMonth;

      case 'once': {
        if (!task.schedule.date) return false;
        const scheduledDate = new Date(task.schedule.date).toDateString();
        return now.toDateString() === scheduledDate && !task.lastRun;
      }

      default:
        return false;
    }
  }

  private calculateNextRun(task: ScheduledTask): string {
    const now = new Date();
    const [hours, minutes] = task.schedule.time.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      switch (task.schedule.type) {
        case 'daily':
          next.setDate(next.getDate() + 1);
          break;

        case 'weekly': {
          const daysOfWeek = task.schedule.daysOfWeek || [];
          for (let i = 1; i <= 7; i++) {
            const checkDate = new Date(next);
            checkDate.setDate(checkDate.getDate() + i);
            if (daysOfWeek.includes(checkDate.getDay())) {
              return checkDate.toISOString();
            }
          }
          break;
        }

        case 'monthly':
          next.setMonth(next.getMonth() + 1);
          next.setDate(task.schedule.dayOfMonth || 1);
          break;

        case 'once':
          if (task.schedule.date) {
            return new Date(task.schedule.date + 'T' + task.schedule.time).toISOString();
          }
          break;
      }
    }

    return next.toISOString();
  }

  private async executeTask(task: ScheduledTask): Promise<void> {
    logger.info(`Executing task: ${task.name}`);
    
    logAudit('AUTOMATION_START', {
      source: 'scheduler',
      taskId: task.id,
      taskName: task.name,
      accountIds: task.accountIds,
    });

    // Update last run time
    task.lastRun = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    this.saveConfig();

    // Send message to renderer to start automation
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('scheduler:execute-task', {
        taskId: task.id,
        accountIds: task.accountIds,
      });
    }
  }

  // CRUD Operations

  createTask(taskData: Omit<ScheduledTask, 'id' | 'createdAt' | 'updatedAt' | 'nextRun'>): ScheduledTask {
    const now = new Date().toISOString();
    const task: ScheduledTask = {
      ...taskData,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
      nextRun: undefined,
    };

    task.nextRun = this.calculateNextRun(task);
    this.config.tasks.push(task);
    this.saveConfig();

    logAudit('CONFIG_CHANGED', { action: 'task_created', taskId: task.id, taskName: task.name });

    return task;
  }

  updateTask(id: string, updates: Partial<ScheduledTask>): ScheduledTask | null {
    const index = this.config.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const task = this.config.tasks[index];
    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    task.nextRun = this.calculateNextRun(task);
    
    this.saveConfig();

    logAudit('CONFIG_CHANGED', { action: 'task_updated', taskId: task.id, taskName: task.name });

    return task;
  }

  deleteTask(id: string): boolean {
    const index = this.config.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    const task = this.config.tasks[index];
    this.config.tasks.splice(index, 1);
    this.saveConfig();

    logAudit('CONFIG_CHANGED', { action: 'task_deleted', taskId: task.id, taskName: task.name });

    return true;
  }

  getTask(id: string): ScheduledTask | undefined {
    return this.config.tasks.find(t => t.id === id);
  }

  getAllTasks(): ScheduledTask[] {
    return [...this.config.tasks];
  }

  toggleTask(id: string): boolean {
    const task = this.config.tasks.find(t => t.id === id);
    if (!task) return false;

    task.enabled = !task.enabled;
    task.updatedAt = new Date().toISOString();
    this.saveConfig();

    return task.enabled;
  }

  setSchedulerEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();

    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  // Run task immediately (manual trigger)
  async runTaskNow(id: string): Promise<void> {
    const task = this.config.tasks.find(t => t.id === id);
    if (task) {
      await this.executeTask(task);
    }
  }
}

export const schedulerService = new SchedulerService();
