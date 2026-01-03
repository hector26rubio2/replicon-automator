import type { AccountMappings } from '../../common/types';
import { SPECIAL_ACCOUNTS } from '../../common/constants';

/**
 * Servicio centralizado para mapeo de cuentas y proyectos
 * Elimina código duplicado en múltiples archivos
 */
export class AccountMapperService {
    private mappings: AccountMappings;

    constructor(mappings: AccountMappings) {
        this.mappings = mappings;
    }

    /**
     * Actualiza los mappings
     */
    updateMappings(mappings: AccountMappings): void {
        this.mappings = mappings;
    }

    /**
     * Obtiene el nombre mapeado de una cuenta
     */
    mapAccount(cuenta: string): string {
        const normalized = cuenta.trim().toUpperCase();
        return this.mappings[normalized]?.name || cuenta;
    }

    /**
     * Obtiene el nombre mapeado de un proyecto para una cuenta específica
     */
    mapProject(cuenta: string, proyecto: string): string {
        const normalized = cuenta.trim().toUpperCase();
        const projectNormalized = proyecto.trim().toUpperCase();

        const accountMapping = this.mappings[normalized];
        if (!accountMapping) {
            return proyecto;
        }

        return accountMapping.projects[projectNormalized] || proyecto;
    }

    /**
     * Verifica si una cuenta es especial (vacaciones, feriados, fin de semana)
     */
    isSpecialAccount(cuenta: string): boolean {
        const normalized = cuenta.trim().toUpperCase();
        return (
            SPECIAL_ACCOUNTS.VACATION.includes(normalized) ||
            SPECIAL_ACCOUNTS.NO_WORK.includes(normalized) ||
            SPECIAL_ACCOUNTS.WEEKEND.includes(normalized)
        );
    }

    /**
     * Verifica si es una cuenta de vacaciones
     */
    isVacation(cuenta: string): boolean {
        const normalized = cuenta.trim().toUpperCase();
        return SPECIAL_ACCOUNTS.VACATION.includes(normalized);
    }

    /**
     * Verifica si es una cuenta de día no laboral
     */
    isNoWork(cuenta: string): boolean {
        const normalized = cuenta.trim().toUpperCase();
        return SPECIAL_ACCOUNTS.NO_WORK.includes(normalized);
    }

    /**
     * Verifica si es una cuenta de fin de semana
     */
    isWeekend(cuenta: string): boolean {
        const normalized = cuenta.trim().toUpperCase();
        return SPECIAL_ACCOUNTS.WEEKEND.includes(normalized);
    }

    /**
     * Verifica si una cuenta existe en los mappings
     */
    hasAccount(cuenta: string): boolean {
        const normalized = cuenta.trim().toUpperCase();
        return normalized in this.mappings;
    }

    /**
     * Verifica si un proyecto existe para una cuenta específica
     */
    hasProject(cuenta: string, proyecto: string): boolean {
        const normalized = cuenta.trim().toUpperCase();
        const projectNormalized = proyecto.trim().toUpperCase();

        const accountMapping = this.mappings[normalized];
        if (!accountMapping) {
            return false;
        }

        return projectNormalized in accountMapping.projects;
    }

    /**
     * Obtiene todas las cuentas disponibles
     */
    getAllAccounts(): string[] {
        return Object.keys(this.mappings);
    }

    /**
     * Obtiene todos los proyectos de una cuenta
     */
    getAccountProjects(cuenta: string): string[] {
        const normalized = cuenta.trim().toUpperCase();
        const accountMapping = this.mappings[normalized];

        if (!accountMapping) {
            return [];
        }

        return Object.keys(accountMapping.projects);
    }

    /**
     * Valida que todos los datos del CSV tengan mapping
     */
    validateCSVData(csvData: { cuenta: string; proyecto: string }[]): {
        valid: boolean;
        unmappedAccounts: Set<string>;
        unmappedProjects: Set<string>;
    } {
        const unmappedAccounts = new Set<string>();
        const unmappedProjects = new Set<string>();

        csvData.forEach(row => {
            const cuenta = row.cuenta?.trim().toUpperCase();
            const proyecto = row.proyecto?.trim().toUpperCase();

            if (!cuenta || !proyecto) {
                return;
            }

            // Ignorar cuentas especiales
            if (this.isSpecialAccount(cuenta)) {
                return;
            }

            // Verificar cuenta
            if (!this.hasAccount(cuenta)) {
                unmappedAccounts.add(cuenta);
            } else {
                // Verificar proyecto
                if (!this.hasProject(cuenta, proyecto)) {
                    unmappedProjects.add(`${cuenta}:${proyecto}`);
                }
            }
        });

        return {
            valid: unmappedAccounts.size === 0 && unmappedProjects.size === 0,
            unmappedAccounts,
            unmappedProjects,
        };
    }
}

/**
 * Factory para crear instancia del servicio
 */
export function createAccountMapper(mappings: AccountMappings): AccountMapperService {
    return new AccountMapperService(mappings);
}
