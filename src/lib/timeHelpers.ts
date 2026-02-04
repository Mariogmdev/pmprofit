/**
 * Time-related calculations centralized
 * Ensures consistency between reservation and membership models
 * 
 * CRITICAL: All income models now use the same weeks/month calculation
 * based on project configuration (daysPerMonth)
 */

/**
 * Calcula semanas por mes basado en días configurados
 * 
 * @param daysPerMonth - Días del mes (28, 30, 31)
 * @returns Semanas por mes (ej: 30/7 = 4.2857)
 * 
 * Antes usábamos 4.33 fijo (30/7 ≈ 4.33)
 * Ahora es dinámico basado en configuración del proyecto
 */
export function getWeeksPerMonth(daysPerMonth: number = 30): number {
  return daysPerMonth / 7;
}

/**
 * Días por semana (constante)
 */
export const DAYS_PER_WEEK = 7;

/**
 * Días laborales por semana
 */
export const WEEKDAYS_LV = 5; // Lunes - Viernes
export const WEEKDAYS_SD = 2; // Sábado - Domingo
