/**
 * Occupancy Calculations
 * Centralized functions for weighted occupancy calculations
 * 
 * CRITICAL: Uses proper weekly weighting:
 * - L-V (Lunes-Viernes): 5 days per week
 * - S-D (Sábado-Domingo): 2 days per week
 */

import { WEEKDAYS_LV, WEEKDAYS_SD } from '@/lib/timeHelpers';

export interface ScheduleForOccupancy {
  inicio: number;
  fin: number;
  tipo: 'pico' | 'valle';
  ocupacion?: number;
  diaSemana?: 'LV' | 'SD';
}

/**
 * Calculate weighted average occupancy from schedules
 * 
 * Weights hours by weekly frequency:
 * - L-V: 5 days/week
 * - S-D: 2 days/week
 * 
 * @param horarios Array of schedule items with ocupacion
 * @returns Weighted average occupancy percentage (0-100)
 */
export function calculateWeightedOccupancy(
  horarios: ScheduleForOccupancy[]
): number {
  if (!horarios || horarios.length === 0) return 0;

  let totalWeightedHours = 0;
  let weightedOccupancy = 0;

  horarios.forEach(h => {
    const hoursPerDay = Math.max(0, h.fin - h.inicio);
    const daysPerWeek = h.diaSemana === 'SD' ? WEEKDAYS_SD : WEEKDAYS_LV;
    const hoursPerWeek = hoursPerDay * daysPerWeek;
    const ocupacion = h.ocupacion ?? (h.tipo === 'pico' ? 80 : 50);

    totalWeightedHours += hoursPerWeek;
    weightedOccupancy += hoursPerWeek * ocupacion;
  });

  return totalWeightedHours > 0 ? weightedOccupancy / totalWeightedHours : 0;
}

/**
 * Calculate weighted average occupancy with explicit pico/valle values
 * Used when occupancy values are passed separately from schedule
 * 
 * @param horarios Array of schedule items (for hours/tipo info)
 * @param picoOcupacion Peak occupancy percentage
 * @param valleOcupacion Valley occupancy percentage
 * @returns Weighted average occupancy percentage (0-100)
 */
export function calculateWeightedOccupancyWithValues(
  horarios: Array<{ inicio: number; fin: number; tipo: 'pico' | 'valle'; diaSemana?: 'LV' | 'SD' }>,
  picoOcupacion: number,
  valleOcupacion: number
): number {
  if (!horarios || horarios.length === 0) {
    return (picoOcupacion + valleOcupacion) / 2;
  }

  let totalWeightedHours = 0;
  let weightedOccupancy = 0;

  horarios.forEach(h => {
    const hoursPerDay = Math.max(0, h.fin - h.inicio);
    const daysPerWeek = h.diaSemana === 'SD' ? WEEKDAYS_SD : WEEKDAYS_LV;
    const hoursPerWeek = hoursPerDay * daysPerWeek;
    const ocupacion = h.tipo === 'pico' ? picoOcupacion : valleOcupacion;

    totalWeightedHours += hoursPerWeek;
    weightedOccupancy += hoursPerWeek * ocupacion;
  });

  return totalWeightedHours > 0 ? weightedOccupancy / totalWeightedHours : (picoOcupacion + valleOcupacion) / 2;
}

/**
 * Calculate total weekly hours from schedules
 */
export function calculateTotalWeeklyHours(
  horarios: Array<{ inicio: number; fin: number; diaSemana?: 'LV' | 'SD' }>
): number {
  if (!horarios || horarios.length === 0) return 0;

  return horarios.reduce((total, h) => {
    const hoursPerDay = Math.max(0, h.fin - h.inicio);
    const daysPerWeek = h.diaSemana === 'SD' ? WEEKDAYS_SD : WEEKDAYS_LV;
    return total + (hoursPerDay * daysPerWeek);
  }, 0);
}
