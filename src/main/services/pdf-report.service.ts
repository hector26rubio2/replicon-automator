import * as fs from 'fs';
import * as path from 'path';
import { app, dialog } from 'electron';
import { productionLogger } from '../utils/production-logger';
export interface ReportData {
  title: string;
  subtitle?: string;
  generatedAt: string;
  dateRange?: {
    start: string;
    end: string;
  };
  summary: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    totalHoursLogged: number;
    averageDuration: string;
  };
  executions: Array<{
    id: string;
    date: string;
    duration: string;
    status: 'success' | 'failed';
    accountsProcessed: number;
    hoursLogged: number;
    errors?: string[];
  }>;
  accountBreakdown?: Array<{
    accountName: string;
    totalExecutions: number;
    successRate: number;
    hoursLogged: number;
  }>;
}
class PdfReportService {
  private reportsDir: string;
  constructor() {
    this.reportsDir = path.join(app.getPath('userData'), 'reports');
    this.ensureReportsDir();
  }
  private ensureReportsDir(): void {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }
  private generateHtmlContent(data: ReportData): string {
    const formatPercent = (value: number) => `${value.toFixed(1)}%`;
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .header h1 {
      font-size: 28px;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .header .subtitle {
      font-size: 16px;
      color: #6b7280;
    }
    .header .date-range {
      font-size: 14px;
      color: #9ca3af;
      margin-top: 8px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .stat-card .value {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
    }
    .stat-card .label {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }
    .stat-card.success .value { color: #10B981; }
    .stat-card.error .value { color: #EF4444; }
    .stat-card.info .value { color: #3B82F6; }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      font-size: 20px;
      color: #1f2937;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    tr:hover {
      background: #f9fafb;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    .status.success {
      background: #D1FAE5;
      color: #065F46;
    }
    .status.failed {
      background: #FEE2E2;
      color: #991B1B;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 20px; }
      .summary { grid-template-columns: repeat(3, 1fr); }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.title}</h1>
    ${data.subtitle ? `<p class="subtitle">${data.subtitle}</p>` : ''}
    ${data.dateRange ? `<p class="date-range">${data.dateRange.start} - ${data.dateRange.end}</p>` : ''}
    <p class="date-range">Generado: ${data.generatedAt}</p>
  </div>
  <div class="summary">
    <div class="stat-card">
      <div class="value">${data.summary.totalExecutions}</div>
      <div class="label">Total Ejecuciones</div>
    </div>
    <div class="stat-card success">
      <div class="value">${formatPercent(data.summary.successRate)}</div>
      <div class="label">Tasa de Éxito</div>
    </div>
    <div class="stat-card error">
      <div class="value">${data.summary.failedExecutions}</div>
      <div class="label">Fallidas</div>
    </div>
    <div class="stat-card info">
      <div class="value">${data.summary.totalHoursLogged.toFixed(1)}</div>
      <div class="label">Horas Registradas</div>
    </div>
    <div class="stat-card">
      <div class="value">${data.summary.averageDuration}</div>
      <div class="label">Duración Promedio</div>
    </div>
    <div class="stat-card success">
      <div class="value">${data.summary.successfulExecutions}</div>
      <div class="label">Exitosas</div>
    </div>
  </div>
  <div class="section">
    <h2>Historial de Ejecuciones</h2>
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Duración</th>
          <th>Estado</th>
          <th>Cuentas</th>
          <th>Horas</th>
        </tr>
      </thead>
      <tbody>
        ${data.executions.map(exec => `
          <tr>
            <td>${exec.date}</td>
            <td>${exec.duration}</td>
            <td><span class="status ${exec.status}">${exec.status === 'success' ? 'Exitoso' : 'Fallido'}</span></td>
            <td>${exec.accountsProcessed}</td>
            <td>${exec.hoursLogged.toFixed(1)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ${data.accountBreakdown && data.accountBreakdown.length > 0 ? `
  <div class="section">
    <h2>Desglose por Cuenta</h2>
    <table>
      <thead>
        <tr>
          <th>Cuenta</th>
          <th>Ejecuciones</th>
          <th>Tasa de Éxito</th>
          <th>Horas Registradas</th>
        </tr>
      </thead>
      <tbody>
        ${data.accountBreakdown.map(account => `
          <tr>
            <td>${account.accountName}</td>
            <td>${account.totalExecutions}</td>
            <td>${formatPercent(account.successRate)}</td>
            <td>${account.hoursLogged.toFixed(1)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  <div class="footer">
    <p>Replicon Automator - Reporte de Automatización</p>
    <p>Este reporte fue generado automáticamente</p>
  </div>
</body>
</html>
    `;
  }
  async generateReport(data: ReportData): Promise<string> {
    const html = this.generateHtmlContent(data);
    const timestamp = Date.now();
    const fileName = `report-${timestamp}.html`;
    const filePath = path.join(this.reportsDir, fileName);
    fs.writeFileSync(filePath, html, 'utf-8');
    return filePath;
  }
  async exportReport(data: ReportData): Promise<string | null> {
    const result = await dialog.showSaveDialog({
      title: 'Exportar Reporte',
      defaultPath: `replicon-report-${new Date().toISOString().split('T')[0]}.html`,
      filters: [
        { name: 'HTML', extensions: ['html'] },
      ],
    });
    if (result.canceled || !result.filePath) {
      return null;
    }
    const html = this.generateHtmlContent(data);
    fs.writeFileSync(result.filePath, html, 'utf-8');
    return result.filePath;
  }
  getReportsDirectory(): string {
    return this.reportsDir;
  }
  listReports(): Array<{ name: string; path: string; createdAt: Date }> {
    try {
      const files = fs.readdirSync(this.reportsDir)
        .filter(f => f.endsWith('.html'))
        .map(f => {
          const filePath = path.join(this.reportsDir, f);
          const stats = fs.statSync(filePath);
          return {
            name: f,
            path: filePath,
            createdAt: stats.birthtime,
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return files;
    } catch (error) {
      productionLogger.error('PdfReport: Error listing reports', error);
      return [];
    }
  }
  deleteReport(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      productionLogger.error('PdfReport: Error deleting report', error);
      return false;
    }
  }
}
export const pdfReportService = new PdfReportService();
