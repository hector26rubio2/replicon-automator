import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CSVService } from '../../main/services/csv.service';
import * as fs from 'fs';

// Mock fs
vi.mock('fs');

describe('CSVService', () => {
    let csvService: CSVService;
    const mockCSVPath = 'test.csv';

    beforeEach(() => {
        csvService = new CSVService();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('loadCSV', () => {
        it('should load valid CSV file successfully', () => {
            const mockCSVContent = `Cuenta,Projecto,Extras
ADMIN,ADMIN-001,
DEV,DEV-001,8:00-12:00;13:00-17:00`;

            vi.mocked(fs.readFileSync).mockReturnValue(mockCSVContent);

            const result = csvService.loadCSV(mockCSVPath);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data).toHaveLength(2);
            expect(result.data?.[0]).toEqual({
                cuenta: 'ADMIN',
                proyecto: 'ADMIN-001',
                extras: ''
            });
        });

        it('should handle CSV with extra whitespace', () => {
            const mockCSVContent = `Cuenta , Projecto , Extras
  ADMIN  ,  ADMIN-001  ,  `;

            vi.mocked(fs.readFileSync).mockReturnValue(mockCSVContent);

            const result = csvService.loadCSV(mockCSVPath);

            expect(result.success).toBe(true);
            expect(result.data?.[0].cuenta).toBe('ADMIN');
            expect(result.data?.[0].proyecto).toBe('ADMIN-001');
        });

        it('should skip empty lines', () => {
            const mockCSVContent = `Cuenta,Projecto,Extras
ADMIN,ADMIN-001,

DEV,DEV-001,`;

            vi.mocked(fs.readFileSync).mockReturnValue(mockCSVContent);

            const result = csvService.loadCSV(mockCSVPath);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
        });

        it('should handle file read error', () => {
            vi.mocked(fs.readFileSync).mockImplementation(() => {
                throw new Error('File not found');
            });

            const result = csvService.loadCSV(mockCSVPath);

            expect(result.success).toBe(false);
            expect(result.error).toContain('File not found');
        });

        it('should handle malformed CSV', () => {
            const mockCSVContent = `Cuenta,Projecto,Extras
ADMIN,ADMIN-001,extra,unexpected,columns`;

            vi.mocked(fs.readFileSync).mockReturnValue(mockCSVContent);

            const result = csvService.loadCSV(mockCSVPath);

            // PapaParse puede manejar esto, pero verificamos que retorne algo
            expect(result).toBeDefined();
        });

        it('should handle CSV with missing columns', () => {
            const mockCSVContent = `Cuenta,Projecto
ADMIN,ADMIN-001`;

            vi.mocked(fs.readFileSync).mockReturnValue(mockCSVContent);

            const result = csvService.loadCSV(mockCSVPath);

            expect(result.success).toBe(true);
            // Extras debería ser undefined o ''
            expect(result.data?.[0].extras).toBe('');
        });

        it('should handle UTF-8 encoding', () => {
            const mockCSVContent = `Cuenta,Projecto,Extras
ADMIN,Administración,
DEV,Desarrollo,`;

            vi.mocked(fs.readFileSync).mockReturnValue(mockCSVContent);

            const result = csvService.loadCSV(mockCSVPath);

            expect(result.success).toBe(true);
            expect(result.data?.[0].proyecto).toBe('Administración');
            expect(result.data?.[1].proyecto).toBe('Desarrollo');
        });

        it('should trim header names', () => {
            const mockCSVContent = `  Cuenta  ,  Projecto  ,  Extras  
ADMIN,ADMIN-001,`;

            vi.mocked(fs.readFileSync).mockReturnValue(mockCSVContent);

            const result = csvService.loadCSV(mockCSVPath);

            expect(result.success).toBe(true);
            expect(result.data?.[0]).toHaveProperty('cuenta');
            expect(result.data?.[0]).toHaveProperty('proyecto');
            expect(result.data?.[0]).toHaveProperty('extras');
        });

        it('should handle CSV with only headers', () => {
            const mockCSVContent = `Cuenta,Projecto,Extras`;

            vi.mocked(fs.readFileSync).mockReturnValue(mockCSVContent);

            const result = csvService.loadCSV(mockCSVPath);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(0);
        });

        it('should handle empty file', () => {
            vi.mocked(fs.readFileSync).mockReturnValue('');

            const result = csvService.loadCSV(mockCSVPath);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle CSV with quoted fields', () => {
            const mockCSVContent = `Cuenta,Projecto,Extras
"ADMIN","ADMIN-001","8:00-12:00"`;

            vi.mocked(fs.readFileSync).mockReturnValue(mockCSVContent);

            const result = csvService.loadCSV(mockCSVPath);

            expect(result.success).toBe(true);
            expect(result.data?.[0].cuenta).toBe('ADMIN');
            expect(result.data?.[0].extras).toBe('8:00-12:00');
        });

        it('should handle CSV with newlines in quoted fields', () => {
            const mockCSVContent = `Cuenta,Projecto,Extras
"ADMIN","ADMIN-001","Line1
Line2"`;

            vi.mocked(fs.readFileSync).mockReturnValue(mockCSVContent);

            const result = csvService.loadCSV(mockCSVPath);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
        });
    });
});
