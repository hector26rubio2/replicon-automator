import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountMapperService } from '../main/services/account-mapper.service';
import type { AccountMappings } from '../common/types';

describe('AccountMapperService', () => {
  let service: AccountMapperService;
  let mappings: AccountMappings;

  beforeEach(() => {
    mappings = {
      AV: {
        name: 'AvantiCard',
        projects: {
          MS: 'Mantenimiento y Soporte',
          DEV: 'Desarrollo',
        },
      },
      JM: {
        name: 'JM Services',
        projects: {
          PR: 'Proyectos',
          CON: 'Consultoría',
        },
      },
    };

    service = new AccountMapperService(mappings);
  });

  describe('constructor', () => {
    it('should initialize with mappings', () => {
      expect(service).toBeDefined();
    });
  });

  describe('updateMappings', () => {
    it('should update mappings', () => {
      const newMappings: AccountMappings = {
        NEW: {
          name: 'New Account',
          projects: {},
        },
      };

      service.updateMappings(newMappings);

      expect(service.hasAccount('NEW')).toBe(true);
      expect(service.hasAccount('AV')).toBe(false);
    });
  });

  describe('mapAccount', () => {
    it('should map account name', () => {
      const mapped = service.mapAccount('AV');

      expect(mapped).toBe('AvantiCard');
    });

    it('should return original if no mapping', () => {
      const mapped = service.mapAccount('UNKNOWN');

      expect(mapped).toBe('UNKNOWN');
    });

    it('should handle case insensitive', () => {
      const mapped = service.mapAccount('av');

      expect(mapped).toBe('AvantiCard');
    });

    it('should trim whitespace', () => {
      const mapped = service.mapAccount('  AV  ');

      expect(mapped).toBe('AvantiCard');
    });
  });

  describe('mapProject', () => {
    it('should map project name', () => {
      const mapped = service.mapProject('AV', 'MS');

      expect(mapped).toBe('Mantenimiento y Soporte');
    });

    it('should return original if no account mapping', () => {
      const mapped = service.mapProject('UNKNOWN', 'PROJ');

      expect(mapped).toBe('PROJ');
    });

    it('should return original if no project mapping', () => {
      const mapped = service.mapProject('AV', 'UNKNOWN');

      expect(mapped).toBe('UNKNOWN');
    });

    it('should handle case insensitive', () => {
      const mapped = service.mapProject('av', 'ms');

      expect(mapped).toBe('Mantenimiento y Soporte');
    });

    it('should trim whitespace', () => {
      const mapped = service.mapProject('  AV  ', '  MS  ');

      expect(mapped).toBe('Mantenimiento y Soporte');
    });
  });

  describe('isSpecialAccount', () => {
    it('should detect vacation accounts', () => {
      expect(service.isSpecialAccount('H')).toBe(true);
      expect(service.isSpecialAccount('F')).toBe(true);
    });

    it('should detect no-work accounts', () => {
      expect(service.isSpecialAccount('BH')).toBe(true);
    });

    it('should detect weekend accounts', () => {
      expect(service.isSpecialAccount('FDS')).toBe(true);
      expect(service.isSpecialAccount('ND')).toBe(true);
    });

    it('should return false for regular accounts', () => {
      expect(service.isSpecialAccount('AV')).toBe(false);
    });
  });

  describe('isVacation', () => {
    it('should detect vacation', () => {
      expect(service.isVacation('H')).toBe(true);
      expect(service.isVacation('F')).toBe(true);
    });

    it('should not detect non-vacation', () => {
      expect(service.isVacation('BH')).toBe(false);
      expect(service.isVacation('AV')).toBe(false);
    });
  });

  describe('isNoWork', () => {
    it('should detect no-work', () => {
      expect(service.isNoWork('BH')).toBe(true);
    });

    it('should not detect non-no-work', () => {
      expect(service.isNoWork('H')).toBe(false);
      expect(service.isNoWork('AV')).toBe(false);
    });
  });

  describe('isWeekend', () => {
    it('should detect weekend', () => {
      expect(service.isWeekend('FDS')).toBe(true);
      expect(service.isWeekend('ND')).toBe(true);
    });

    it('should not detect non-weekend', () => {
      expect(service.isWeekend('HV')).toBe(false);
    });
  });

  describe('hasAccount', () => {
    it('should find existing account', () => {
      expect(service.hasAccount('AV')).toBe(true);
      expect(service.hasAccount('JM')).toBe(true);
    });

    it('should not find non-existing account', () => {
      expect(service.hasAccount('UNKNOWN')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(service.hasAccount('av')).toBe(true);
    });
  });

  describe('hasProject', () => {
    it('should find existing project', () => {
      expect(service.hasProject('AV', 'MS')).toBe(true);
      expect(service.hasProject('JM', 'PR')).toBe(true);
    });

    it('should not find non-existing project', () => {
      expect(service.hasProject('AV', 'UNKNOWN')).toBe(false);
    });

    it('should not find project for non-existing account', () => {
      expect(service.hasProject('UNKNOWN', 'MS')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(service.hasProject('av', 'ms')).toBe(true);
    });
  });
});
