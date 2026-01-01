/**
 * Validación y tipado de variables de entorno
 */

import { createLogger } from './logger';

const logger = createLogger('Env');

interface EnvConfig {
  /** URL de login de Okta/Replicon */
  loginUrl: string;
  /** Timeout para operaciones en ms */
  timeout: number;
  /** Ejecutar navegador sin ventana visible */
  headless: boolean;
  /** Guardar configuración automáticamente */
  autoSave: boolean;
  /** Modo desarrollo */
  isDev: boolean;
}

/**
 * Parsea un valor booleano de variable de entorno
 */
function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  const normalized = value.toLowerCase().trim();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

/**
 * Parsea un valor numérico de variable de entorno
 */
function parseNumberEnv(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Carga y valida las variables de entorno
 */
export function loadEnvConfig(): EnvConfig {
  const config: EnvConfig = {
    loginUrl: process.env.REPLICON_LOGIN_URL ?? 'https://newshore.okta.com/',
    timeout: parseNumberEnv(process.env.REPLICON_TIMEOUT, 45000),
    headless: parseBooleanEnv(process.env.REPLICON_HEADLESS, false),
    autoSave: parseBooleanEnv(process.env.REPLICON_AUTOSAVE, true),
    isDev: process.env.NODE_ENV === 'development',
  };

  // Validaciones
  if (config.timeout < 1000) {
    logger.warn('REPLICON_TIMEOUT muy bajo, usando mínimo de 1000ms');
    config.timeout = 1000;
  }

  if (config.timeout > 300000) {
    logger.warn('REPLICON_TIMEOUT muy alto, usando máximo de 300000ms (5 min)');
    config.timeout = 300000;
  }

  try {
    new URL(config.loginUrl);
  } catch {
    logger.error('REPLICON_LOGIN_URL inválida, usando default');
    config.loginUrl = 'https://newshore.okta.com/';
  }

  logger.info('Configuración de entorno cargada', {
    loginUrl: config.loginUrl,
    timeout: config.timeout,
    headless: config.headless,
    autoSave: config.autoSave,
    isDev: config.isDev,
  });

  return config;
}

export type { EnvConfig };
