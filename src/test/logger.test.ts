import { describe, it, expect, beforeEach } from 'vitest';
import { createLogger, Logger } from '../main/utils/logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    Logger.clearLogs();
    Logger.setMinLevel('debug'); // Ensure all logs are captured
    logger = createLogger('TestContext');
  });

  describe('createLogger', () => {
    it('should create logger with context', () => {
      const testLogger = createLogger('MyContext');
      expect(testLogger).toBeInstanceOf(Logger);
    });
  });

  describe('logging methods', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message');
      const logs = Logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toBe('Debug message');
      expect(logs[0].context).toBe('TestContext');
    });

    it('should log info messages', () => {
      logger.info('Info message');
      const logs = Logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');
      const logs = Logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
    });

    it('should log error messages', () => {
      logger.error('Error message');
      const logs = Logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
    });

    it('should log messages with data', () => {
      const data = { foo: 'bar', num: 42 };
      logger.info('Message with data', data);
      const logs = Logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].data).toEqual(data);
    });

    it('should include timestamp', () => {
      logger.info('Test message');
      const logs = Logger.getLogs();

      expect(logs[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('log filtering', () => {
    beforeEach(() => {
      Logger.setMinLevel('info');
    });

    it('should filter out debug logs when min level is info', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      const logs = Logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
    });

    it('should log warn and error when min level is info', () => {
      logger.warn('Warning');
      logger.error('Error');
      const logs = Logger.getLogs();

      expect(logs).toHaveLength(2);
    });

    it('should only log errors when min level is error', () => {
      Logger.setMinLevel('error');

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warning');
      logger.error('Error');

      const logs = Logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
    });
  });

  describe('log storage', () => {
    it('should store multiple logs', () => {
      logger.info('Message 1');
      logger.warn('Message 2');
      logger.error('Message 3');

      const logs = Logger.getLogs();
      expect(logs).toHaveLength(3);
    });

    it('should limit stored logs to maxLogs', () => {
      Logger.clearLogs();

      // Create more than maxLogs (1000) entries
      for (let i = 0; i < 1010; i++) {
        logger.info(`Message ${i}`);
      }

      const logs = Logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(1000);
    });

    it('should keep most recent logs when limit exceeded', () => {
      Logger.clearLogs();

      for (let i = 0; i < 1010; i++) {
        logger.info(`Message ${i}`);
      }

      const logs = Logger.getLogs();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.message).toBe('Message 1009');
    });
  });

  describe('getLogs', () => {
    it('should return copy of logs', () => {
      logger.info('Test');
      const logs1 = Logger.getLogs();
      const logs2 = Logger.getLogs();

      expect(logs1).not.toBe(logs2);
      expect(logs1).toEqual(logs2);
    });

    it('should return empty array when no logs', () => {
      const logs = Logger.getLogs();
      expect(logs).toEqual([]);
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      logger.info('Message 1');
      logger.info('Message 2');

      Logger.clearLogs();

      const logs = Logger.getLogs();
      expect(logs).toHaveLength(0);
    });
  });

  describe('multiple contexts', () => {
    it('should maintain separate contexts', () => {
      const logger1 = createLogger('Context1');
      const logger2 = createLogger('Context2');

      logger1.info('From context 1');
      logger2.info('From context 2');

      const logs = Logger.getLogs();

      expect(logs).toHaveLength(2);
      expect(logs[0].context).toBe('Context1');
      expect(logs[1].context).toBe('Context2');
    });
  });

  describe('setMinLevel', () => {
    it('should change minimum log level', () => {
      Logger.setMinLevel('warn');

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');

      const logs = Logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
    });

    it('should affect all loggers', () => {
      const logger1 = createLogger('Logger1');
      const logger2 = createLogger('Logger2');

      Logger.setMinLevel('error');

      logger1.info('Info from logger1');
      logger2.warn('Warn from logger2');
      logger1.error('Error from logger1');

      const logs = Logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
    });
  });
});
