import { describe, it, expect } from 'vitest';
import { CSVRow } from '../common/types';

describe('Types', () => {
  describe('CSVRow', () => {
    it('should create valid CSVRow', () => {
      const row: CSVRow = {
        cuenta: 'AV',
        proyecto: 'MS',
        extras: '',
      };

      expect(row.cuenta).toBe('AV');
      expect(row.proyecto).toBe('MS');
      expect(row.extras).toBe('');
    });

    it('should allow extras to be empty string', () => {
      const row: CSVRow = {
        cuenta: 'TEST',
        proyecto: 'PROJ',
        extras: '',
      };

      expect(row.extras).toBe('');
    });

    it('should allow extras with EXT format', () => {
      const row: CSVRow = {
        cuenta: 'AV',
        proyecto: 'MS',
        extras: 'EXT/AV:MS:1000:1200',
      };

      expect(row.extras).toContain('EXT');
    });
  });

  describe('CSV data structures', () => {
    it('should create array of CSVRows', () => {
      const rows: CSVRow[] = [
        { cuenta: 'AV', proyecto: 'MS', extras: '' },
        { cuenta: 'JM', proyecto: 'PR', extras: '' },
      ];

      expect(rows).toHaveLength(2);
      expect(rows[0].cuenta).toBe('AV');
    });

    it('should handle empty array', () => {
      const rows: CSVRow[] = [];

      expect(rows).toHaveLength(0);
    });
  });
});
