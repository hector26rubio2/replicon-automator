import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceMonitor } from '../../main/utils/performance-monitor';

describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
        monitor = new PerformanceMonitor();
    });

    describe('Operation Tracking', () => {
        it('should track operation timing', async () => {
            monitor.startOperation('test-op');
            await new Promise(resolve => setTimeout(resolve, 50));
            monitor.endOperation('test-op', true);

            const timings = monitor.getOperationTimings();
            expect(timings).toHaveLength(1);
            expect(timings[0].operation).toBe('test-op');
            expect(timings[0].duration).toBeGreaterThanOrEqual(50);
            expect(timings[0].success).toBe(true);
        });

        it('should track failed operations', () => {
            monitor.startOperation('failing-op');
            monitor.endOperation('failing-op', false, 'Test error');

            const timings = monitor.getOperationTimings();
            expect(timings[0].success).toBe(false);
            expect(timings[0].error).toBe('Test error');
        });

        it('should handle ending non-started operation', () => {
            monitor.endOperation('non-existent', true);
            const timings = monitor.getOperationTimings();
            expect(timings).toHaveLength(0);
        });

        it('should track multiple operations', () => {
            monitor.startOperation('op1');
            monitor.startOperation('op2');
            monitor.endOperation('op1', true);
            monitor.endOperation('op2', true);

            const timings = monitor.getOperationTimings();
            expect(timings).toHaveLength(2);
        });
    });

    describe('Metrics Capture', () => {
        it('should capture system metrics', () => {
            const metrics = monitor.getMetrics();

            expect(metrics.timestamp).toBeInstanceOf(Date);
            expect(metrics.memoryUsage.rss).toBeGreaterThan(0);
            expect(metrics.memoryUsage.heapUsed).toBeGreaterThan(0);
            expect(metrics.memoryUsage.heapTotal).toBeGreaterThan(0);
            expect(metrics.uptime).toBeGreaterThan(0);
        });

        it('should capture custom metrics', () => {
            const custom = { processedRows: 100, errors: 2 };
            const metrics = monitor.captureMetrics(custom);

            expect(metrics.custom).toEqual(custom);
        });

        it('should maintain metrics history', () => {
            monitor.captureMetrics();
            monitor.captureMetrics();
            monitor.captureMetrics();

            const history = monitor.getMetricsHistory();
            expect(history).toHaveLength(3);
        });

        it('should limit history size', () => {
            // Capturar más de 100 métricas
            for (let i = 0; i < 105; i++) {
                monitor.captureMetrics();
            }

            const history = monitor.getMetricsHistory();
            expect(history.length).toBeLessThanOrEqual(100);
        });
    });

    describe('Operation Statistics', () => {
        beforeEach(() => {
            monitor.startOperation('test-op');
            monitor.endOperation('test-op', true);

            monitor.startOperation('test-op');
            monitor.endOperation('test-op', true);

            monitor.startOperation('test-op');
            monitor.endOperation('test-op', false);
        });

        it('should calculate operation stats', () => {
            const stats = monitor.getOperationStats('test-op');

            expect(stats).not.toBeNull();
            if (stats) {
                expect(stats.count).toBe(3);
                expect(stats.avgDuration).toBeGreaterThanOrEqual(0);
                expect(stats.successRate).toBe(67); // 2/3 = 66.67 rounded
            }
        });

        it('should return null for non-existent operation', () => {
            const stats = monitor.getOperationStats('non-existent');
            expect(stats).toBeNull();
        });

        it('should calculate min/max duration', () => {
            const stats = monitor.getOperationStats('test-op');
            if (stats) {
                expect(stats.minDuration).toBeLessThanOrEqual(stats.maxDuration);
            }
        });
    });

    describe('Report Generation', () => {
        it('should generate report', () => {
            monitor.startOperation('test-op');
            monitor.endOperation('test-op', true);

            const report = monitor.generateReport();

            expect(report).toContain('Performance Report');
            expect(report).toContain('Memory Usage');
            expect(report).toContain('Operations');
            expect(report).toContain('test-op');
        });

        it('should include operation statistics in report', () => {
            monitor.startOperation('csv-load');
            monitor.endOperation('csv-load', true);

            monitor.startOperation('csv-load');
            monitor.endOperation('csv-load', false);

            const report = monitor.generateReport();
            expect(report).toContain('csv-load');
            expect(report).toContain('2 ops');
        });
    });

    describe('Clear', () => {
        it('should clear all data', () => {
            monitor.startOperation('op1');
            monitor.endOperation('op1', true);
            monitor.captureMetrics();

            monitor.clear();

            expect(monitor.getOperationTimings()).toHaveLength(0);
            expect(monitor.getMetricsHistory()).toHaveLength(0);
        });
    });
});
