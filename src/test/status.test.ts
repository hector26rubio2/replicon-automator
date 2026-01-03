import { describe, it, expect } from 'vitest';
import {
  getStatusConfig,
  getStatusColor,
  getStatusTranslationKey,
  getStatusIcon,
  getProgressPercent,
  STATUS_CONFIG,
  STATUS_TRANSLATION_KEYS,
} from '../renderer/utils/status';
import type { AutomationProgress } from '../common/types';

describe('Status Utils', () => {
  describe('STATUS_CONFIG', () => {
    it('should have config for all statuses', () => {
      expect(STATUS_CONFIG.idle).toBeDefined();
      expect(STATUS_CONFIG.running).toBeDefined();
      expect(STATUS_CONFIG.paused).toBeDefined();
      expect(STATUS_CONFIG.completed).toBeDefined();
      expect(STATUS_CONFIG.error).toBeDefined();
    });

    it('should have required fields', () => {
      expect(STATUS_CONFIG.idle.color).toBeDefined();
      expect(STATUS_CONFIG.idle.bgColor).toBeDefined();
      expect(STATUS_CONFIG.idle.icon).toBeDefined();
    });
  });

  describe('STATUS_TRANSLATION_KEYS', () => {
    it('should have keys for all statuses', () => {
      expect(STATUS_TRANSLATION_KEYS.idle).toBe('automation.status.idle');
      expect(STATUS_TRANSLATION_KEYS.running).toBe('automation.status.running');
      expect(STATUS_TRANSLATION_KEYS.paused).toBe('automation.status.paused');
      expect(STATUS_TRANSLATION_KEYS.completed).toBe('automation.status.completed');
      expect(STATUS_TRANSLATION_KEYS.error).toBe('automation.status.error');
    });
  });

  describe('getStatusConfig', () => {
    it('should return config for idle', () => {
      const config = getStatusConfig('idle');

      expect(config.color).toContain('slate');
      expect(config.icon).toBeTruthy();
    });

    it('should return config for running', () => {
      const config = getStatusConfig('running');

      expect(config.color).toContain('emerald');
    });

    it('should return config for error', () => {
      const config = getStatusConfig('error');

      expect(config.color).toContain('red');
    });

    it('should return idle config for unknown status', () => {
      const config = getStatusConfig('unknown' as any);

      expect(config).toBe(STATUS_CONFIG.idle);
    });
  });

  describe('getStatusColor', () => {
    it('should return color for idle', () => {
      const color = getStatusColor('idle');

      expect(color).toContain('slate');
    });

    it('should return color for running', () => {
      const color = getStatusColor('running');

      expect(color).toContain('emerald');
    });
  });

  describe('getStatusTranslationKey', () => {
    it('should return translation key', () => {
      const key = getStatusTranslationKey('running');

      expect(key).toBe('automation.status.running');
    });

    it('should return idle key for unknown status', () => {
      const key = getStatusTranslationKey('unknown' as any);

      expect(key).toBe('automation.status.idle');
    });
  });

  describe('getStatusIcon', () => {
    it('should return icon for status', () => {
      const icon = getStatusIcon('running');

      expect(icon).toBeTruthy();
    });

    it('should return different icons for different statuses', () => {
      const runningIcon = getStatusIcon('running');
      const errorIcon = getStatusIcon('error');

      expect(runningIcon).not.toBe(errorIcon);
    });
  });

  describe('getProgressPercent', () => {
    it('should calculate progress percentage', () => {
      const progress: AutomationProgress = {
        status: 'running',
        currentDay: 5,
        totalDays: 10,
        processedRows: 0,
        totalRows: 0,
        message: '',
      };

      const percent = getProgressPercent(progress);

      expect(percent).toBe(50);
    });

    it('should return 0 for null progress', () => {
      const percent = getProgressPercent(null);

      expect(percent).toBe(0);
    });

    it('should return 0 for zero totalDays', () => {
      const progress: AutomationProgress = {
        status: 'idle',
        currentDay: 0,
        totalDays: 0,
        processedRows: 0,
        totalRows: 0,
        message: '',
      };

      const percent = getProgressPercent(progress);

      expect(percent).toBe(0);
    });

    it('should round percentage', () => {
      const progress: AutomationProgress = {
        status: 'running',
        currentDay: 1,
        totalDays: 3,
        processedRows: 0,
        totalRows: 0,
        message: '',
      };

      const percent = getProgressPercent(progress);

      expect(percent).toBe(33);
    });

    it('should handle 100% progress', () => {
      const progress: AutomationProgress = {
        status: 'completed',
        currentDay: 10,
        totalDays: 10,
        processedRows: 0,
        totalRows: 0,
        message: '',
      };

      const percent = getProgressPercent(progress);

      expect(percent).toBe(100);
    });
  });
});
