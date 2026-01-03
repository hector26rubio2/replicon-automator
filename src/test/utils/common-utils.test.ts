import { describe, it, expect } from 'vitest';
import { 
  formatDate, 
  formatTimestamp, 
  militaryToStandard, 
  standardToMilitary,
  generateId 
} from '../../common/utils';

describe('Common Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should include day, month and year', () => {
      const date = new Date('2024-03-20');
      const formatted = formatDate(date);
      
      expect(formatted).toMatch(/2024/);
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp correctly', () => {
      const date = new Date('2024-01-15T14:30:45Z');
      const formatted = formatTimestamp(date);
      
      expect(typeof formatted).toBe('string');
      expect(formatted).toMatch(/:/);
    });
  });

  describe('militaryToStandard', () => {
    it('should convert midnight to 12am', () => {
      expect(militaryToStandard('0000')).toBe('12:00am');
    });

    it('should convert morning hours', () => {
      expect(militaryToStandard('0830')).toBe('8:30am');
    });

    it('should convert noon to 12pm', () => {
      expect(militaryToStandard('1200')).toBe('12:00pm');
    });

    it('should convert afternoon hours', () => {
      expect(militaryToStandard('1530')).toBe('3:30pm');
      expect(militaryToStandard('2100')).toBe('9:00pm');
    });

    it('should handle invalid input', () => {
      const result = militaryToStandard('invalid');
      expect(result).toMatch(/NaN/);
    });
  });

  describe('standardToMilitary', () => {
    it('should convert 12am to midnight', () => {
      expect(standardToMilitary('12:00am')).toBe('0000');
    });

    it('should convert morning hours', () => {
      expect(standardToMilitary('8:30am')).toBe('0830');
    });

    it('should convert noon', () => {
      expect(standardToMilitary('12:00pm')).toBe('1200');
    });

    it('should convert afternoon hours', () => {
      expect(standardToMilitary('3:30pm')).toBe('1530');
      expect(standardToMilitary('9:00pm')).toBe('2100');
    });

    it('should handle invalid input', () => {
      const result = standardToMilitary('invalid');
      expect(result).toBe('invalid');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
    });

    it('should generate non-empty strings', () => {
      const id = generateId();
      
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate IDs consistently', () => {
      for (let i = 0; i < 10; i++) {
        const id = generateId();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      }
    });
  });
});
