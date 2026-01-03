/**
 * Monitor de rendimiento para tracking de métricas en producción
 * Recolecta datos de memoria, CPU y duración de operaciones
 */

export interface PerformanceMetrics {
    /** Timestamp de la medición */
    timestamp: Date;
    /** Uso de memoria en MB */
    memoryUsage: {
        rss: number;
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    /** Tiempo de actividad del proceso en segundos */
    uptime: number;
    /** Métricas personalizadas */
    custom?: Record<string, number>;
}

export interface OperationTiming {
    /** Nombre de la operación */
    operation: string;
    /** Duración en milisegundos */
    duration: number;
    /** Timestamp de inicio */
    startTime: Date;
    /** Timestamp de finalización */
    endTime: Date;
    /** Éxito de la operación */
    success: boolean;
    /** Error si la operación falló */
    error?: string;
}

/**
 * Servicio para monitorear rendimiento de la aplicación
 * @example
 * const monitor = new PerformanceMonitor();
 * monitor.startOperation('csv-load');
 * // ... operación ...
 * monitor.endOperation('csv-load', true);
 * const metrics = monitor.getMetrics();
 */
export class PerformanceMonitor {
    private timings: Map<string, number> = new Map();
    private operations: OperationTiming[] = [];
    private metricsHistory: PerformanceMetrics[] = [];
    private maxHistorySize = 100;

    /**
     * Inicia el tracking de una operación
     * @param operation - Nombre único de la operación
     */
    startOperation(operation: string): void {
        this.timings.set(operation, Date.now());
    }

    /**
     * Finaliza el tracking de una operación
     * @param operation - Nombre de la operación iniciada
     * @param success - Si la operación fue exitosa
     * @param error - Mensaje de error opcional
     */
    endOperation(operation: string, success: boolean, error?: string): void {
        const startTime = this.timings.get(operation);
        if (!startTime) {
            console.warn(`[PerformanceMonitor] Operación "${operation}" no iniciada`);
            return;
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        this.operations.push({
            operation,
            duration,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            success,
            error,
        });

        this.timings.delete(operation);
    }

    /**
     * Captura snapshot actual de métricas del sistema
     * @param custom - Métricas personalizadas opcionales
     */
    captureMetrics(custom?: Record<string, number>): PerformanceMetrics {
        const memUsage = process.memoryUsage();

        const metrics: PerformanceMetrics = {
            timestamp: new Date(),
            memoryUsage: {
                rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
                external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
            },
            uptime: Math.round(process.uptime() * 100) / 100,
            custom,
        };

        this.metricsHistory.push(metrics);

        // Limitar tamaño del historial
        if (this.metricsHistory.length > this.maxHistorySize) {
            this.metricsHistory.shift();
        }

        return metrics;
    }

    /**
     * Obtiene métricas actuales del sistema
     */
    getMetrics(): PerformanceMetrics {
        return this.captureMetrics();
    }

    /**
     * Obtiene historial de todas las métricas capturadas
     */
    getMetricsHistory(): PerformanceMetrics[] {
        return [...this.metricsHistory];
    }

    /**
     * Obtiene timings de todas las operaciones registradas
     */
    getOperationTimings(): OperationTiming[] {
        return [...this.operations];
    }

    /**
     * Obtiene estadísticas agregadas de una operación específica
     * @param operation - Nombre de la operación
     */
    getOperationStats(operation: string): {
        count: number;
        avgDuration: number;
        minDuration: number;
        maxDuration: number;
        successRate: number;
    } | null {
        const ops = this.operations.filter(op => op.operation === operation);

        if (ops.length === 0) return null;

        const durations = ops.map(op => op.duration);
        const successCount = ops.filter(op => op.success).length;

        return {
            count: ops.length,
            avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / ops.length),
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            successRate: Math.round((successCount / ops.length) * 100),
        };
    }

    /**
     * Limpia todo el historial de métricas y operaciones
     */
    clear(): void {
        this.operations = [];
        this.metricsHistory = [];
        this.timings.clear();
    }

    /**
     * Genera reporte resumido de rendimiento
     */
    generateReport(): string {
        const currentMetrics = this.getMetrics();
        const totalOps = this.operations.length;
        const successOps = this.operations.filter(op => op.success).length;
        const failedOps = totalOps - successOps;

        const uniqueOps = new Set(this.operations.map(op => op.operation));
        const opStats = Array.from(uniqueOps)
            .map(op => {
                const stats = this.getOperationStats(op);
                return { operation: op, stats };
            })
            .filter(item => item.stats !== null) as Array<{
                operation: string;
                stats: NonNullable<ReturnType<PerformanceMonitor['getOperationStats']>>;
            }>;

        const report = [
            '=== Performance Report ===',
            `Timestamp: ${currentMetrics.timestamp.toISOString()}`,
            `Uptime: ${currentMetrics.uptime}s`,
            '',
            '--- Memory Usage ---',
            `RSS: ${currentMetrics.memoryUsage.rss} MB`,
            `Heap Used: ${currentMetrics.memoryUsage.heapUsed} MB`,
            `Heap Total: ${currentMetrics.memoryUsage.heapTotal} MB`,
            '',
            '--- Operations ---',
            `Total: ${totalOps}`,
            `Success: ${successOps}`,
            `Failed: ${failedOps}`,
            '',
            '--- Operation Details ---',
            ...opStats.map(({ operation, stats }) =>
                `${operation}: ${stats.count} ops, avg ${stats.avgDuration}ms, ${stats.successRate}% success`
            ),
        ];

        return report.join('\n');
    }
}
