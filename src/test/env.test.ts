import { describe, it, expect } from 'vitest';
import { loadEnvConfig } from '../main/utils/env';

describe('Environment Utils', () => {
  describe('loadEnvConfig', () => {
    it('should load environment config', () => {
      const config = loadEnvConfig();

      expect(config).toBeDefined();
      expect(typeof config.isDev).toBe('boolean');
      expect(typeof config.headless).toBe('boolean');
      expect(typeof config.autoSave).toBe('boolean');
    });

    it('should have default timeout', () => {
      const config = loadEnvConfig();

      expect(typeof config.timeout).toBe('number');
      expect(config.timeout).toBeGreaterThanOrEqual(0);
    });

    it('should have loginUrl', () => {
      const config = loadEnvConfig();

      expect(typeof config.loginUrl).toBe('string');
    });
  });
});
