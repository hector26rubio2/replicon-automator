import { describe, it, expect } from 'vitest';
import {
  addHorario,
  removeHorario,
  updateHorario,
  addAccount,
  removeAccount,
  addProject,
} from '../common/config-helpers';
import type { TimeSlot, AccountMappings } from '../common/types';

describe('Config Helpers', () => {
  describe('addHorario', () => {
    it('should add new horario to empty array', () => {
      const slot: TimeSlot = { id: '1', start_time: '8:00am', end_time: '12:00pm' };
      const result = addHorario([], slot);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(slot);
    });

    it('should add new horario to existing array', () => {
      const existing: TimeSlot[] = [
        { id: '1', start_time: '8:00am', end_time: '12:00pm' },
      ];
      const newSlot: TimeSlot = { id: '2', start_time: '1:00pm', end_time: '5:00pm' };
      const result = addHorario(existing, newSlot);

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(newSlot);
    });

    it('should not mutate original array', () => {
      const original: TimeSlot[] = [
        { id: '1', start_time: '8:00am', end_time: '12:00pm' },
      ];
      const newSlot: TimeSlot = { id: '2', start_time: '1:00pm', end_time: '5:00pm' };
      
      addHorario(original, newSlot);

      expect(original).toHaveLength(1);
    });
  });

  describe('removeHorario', () => {
    it('should remove horario by id', () => {
      const horarios: TimeSlot[] = [
        { id: '1', start_time: '8:00am', end_time: '12:00pm' },
        { id: '2', start_time: '1:00pm', end_time: '5:00pm' },
      ];

      const result = removeHorario(horarios, '1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should return same array if id not found', () => {
      const horarios: TimeSlot[] = [
        { id: '1', start_time: '8:00am', end_time: '12:00pm' },
      ];

      const result = removeHorario(horarios, 'nonexistent');

      expect(result).toHaveLength(1);
    });

    it('should not mutate original array', () => {
      const original: TimeSlot[] = [
        { id: '1', start_time: '8:00am', end_time: '12:00pm' },
      ];

      removeHorario(original, '1');

      expect(original).toHaveLength(1);
    });
  });

  describe('updateHorario', () => {
    const horarios: TimeSlot[] = [
      { id: '1', start_time: '8:00am', end_time: '12:00pm' },
      { id: '2', start_time: '1:00pm', end_time: '5:00pm' },
    ];

    it('should update start_time', () => {
      const result = updateHorario(horarios, '1', 'start_time', '9:00am');

      expect(result[0].start_time).toBe('9:00am');
      expect(result[0].end_time).toBe('12:00pm');
    });

    it('should update end_time', () => {
      const result = updateHorario(horarios, '2', 'end_time', '6:00pm');

      expect(result[1].end_time).toBe('6:00pm');
      expect(result[1].start_time).toBe('1:00pm');
    });

    it('should not modify other horarios', () => {
      const result = updateHorario(horarios, '1', 'start_time', '9:00am');

      expect(result[1]).toEqual(horarios[1]);
    });

    it('should not mutate original array', () => {
      const original = [...horarios];
      updateHorario(horarios, '1', 'start_time', '9:00am');

      expect(horarios).toEqual(original);
    });
  });

  describe('addAccount', () => {
    it('should add new account to empty mappings', () => {
      const result = addAccount({}, 'av', 'Avianca');

      expect(result.AV).toBeDefined();
      expect(result.AV.name).toBe('Avianca');
      expect(result.AV.projects).toEqual({});
    });

    it('should convert account code to uppercase', () => {
      const result = addAccount({}, 'jm', 'Jambojet');

      expect(result.JM).toBeDefined();
      expect(result.jm).toBeUndefined();
    });

    it('should trim whitespace from inputs', () => {
      const result = addAccount({}, '  av  ', '  Avianca  ');

      expect(result.AV.name).toBe('Avianca');
    });

    it('should return unchanged mappings if code is empty', () => {
      const original: AccountMappings = { AV: { name: 'Avianca', projects: {} } };
      const result = addAccount(original, '', 'Test');

      expect(result).toEqual(original);
    });

    it('should return unchanged mappings if name is empty', () => {
      const original: AccountMappings = { AV: { name: 'Avianca', projects: {} } };
      const result = addAccount(original, 'JM', '');

      expect(result).toEqual(original);
    });

    it('should not mutate original mappings', () => {
      const original: AccountMappings = {};
      addAccount(original, 'AV', 'Avianca');

      expect(Object.keys(original)).toHaveLength(0);
    });
  });

  describe('removeAccount', () => {
    it('should remove account by code', () => {
      const mappings: AccountMappings = {
        AV: { name: 'Avianca', projects: {} },
        JM: { name: 'Jambojet', projects: {} },
      };

      const result = removeAccount(mappings, 'AV');

      expect(result.AV).toBeUndefined();
      expect(result.JM).toBeDefined();
    });

    it('should return same mappings if code not found', () => {
      const mappings: AccountMappings = {
        AV: { name: 'Avianca', projects: {} },
      };

      const result = removeAccount(mappings, 'NONEXISTENT');

      expect(result).toEqual(mappings);
    });

    it('should not mutate original mappings', () => {
      const original: AccountMappings = {
        AV: { name: 'Avianca', projects: {} },
      };

      removeAccount(original, 'AV');

      expect(original.AV).toBeDefined();
    });
  });

  describe('addProject', () => {
    const mappings: AccountMappings = {
      AV: { name: 'Avianca', projects: {} },
    };

    it('should add project to existing account', () => {
      const result = addProject(mappings, 'AV', 'ms', 'Avianca-Services-AM');

      expect(result.AV.projects.MS).toBe('Avianca-Services-AM');
    });

    it('should convert project code to uppercase', () => {
      const result = addProject(mappings, 'AV', 'pr', 'Projects');

      expect(result.AV.projects.PR).toBe('Projects');
      expect(result.AV.projects.pr).toBeUndefined();
    });

    it('should trim project code', () => {
      const result = addProject(mappings, 'AV', '  ms  ', 'Services');

      expect(result.AV.projects.MS).toBe('Services');
    });

    it('should return unchanged if account does not exist', () => {
      const result = addProject(mappings, 'NONEXISTENT', 'MS', 'Test');

      expect(result).toEqual(mappings);
    });

    it('should return unchanged if project code is empty', () => {
      const result = addProject(mappings, 'AV', '', 'Test');

      expect(result).toEqual(mappings);
    });

    it('should not mutate original mappings', () => {
      const original: AccountMappings = {
        AV: { name: 'Avianca', projects: {} },
      };

      addProject(original, 'AV', 'MS', 'Services');

      expect(Object.keys(original.AV.projects)).toHaveLength(0);
    });

    it('should preserve existing projects', () => {
      const withProjects: AccountMappings = {
        AV: { 
          name: 'Avianca', 
          projects: { MS: 'Services' } 
        },
      };

      const result = addProject(withProjects, 'AV', 'PR', 'Projects');

      expect(result.AV.projects.MS).toBe('Services');
      expect(result.AV.projects.PR).toBe('Projects');
    });
  });
});
