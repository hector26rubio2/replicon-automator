/**
 * Utilidades compartidas
 */

/**
 * Convertir hora militar (1600) a formato estándar (4:00pm)
 */
export function militaryToStandard(militaryTime: string): string {
  try {
    const hour = parseInt(militaryTime.slice(0, 2));
    const minute = parseInt(militaryTime.slice(2));

    if (hour === 0) {
      return `12:${minute.toString().padStart(2, '0')}am`;
    } else if (hour < 12) {
      return `${hour}:${minute.toString().padStart(2, '0')}am`;
    } else if (hour === 12) {
      return `12:${minute.toString().padStart(2, '0')}pm`;
    } else {
      return `${hour - 12}:${minute.toString().padStart(2, '0')}pm`;
    }
  } catch {
    return militaryTime;
  }
}

/**
 * Convertir hora estándar (4:00pm) a militar (1600)
 */
export function standardToMilitary(standardTime: string): string {
  try {
    const match = standardTime.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
    if (!match) return standardTime;

    let hour = parseInt(match[1]);
    const minute = match[2];
    const period = match[3].toLowerCase();

    if (period === 'pm' && hour !== 12) {
      hour += 12;
    } else if (period === 'am' && hour === 12) {
      hour = 0;
    }

    return `${hour.toString().padStart(2, '0')}${minute}`;
  } catch {
    return standardTime;
  }
}

/**
 * Formatear fecha para mostrar
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formatear timestamp para logs
 */
export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Generar ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Delay async
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validar email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
