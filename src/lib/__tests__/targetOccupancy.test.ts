import { describe, it, expect } from 'vitest';
import { calculateOccupancyTarget } from '../activityCalculations';
import { ActivityConfig, ActivitySchedule } from '@/types/activity';

// Helper to create a minimal ActivityConfig with horarios
function createConfigWithHorarios(horarios: ActivitySchedule[]): ActivityConfig {
  return {
    tipoUnidad: 'test',
    cantidad: 1,
    duracionReserva: 1,
    areaPorUnidad: 100,
    jugadoresPorReserva: 1,
    modeloIngreso: 'reserva',
    horarios,
    alquileres: [],
    tieneClases: false,
    tipoCubierta: 'cubierta',
    capexCubierta: 0,
    capexSemicubierta: 0,
    capexAireLibre: 0,
    equipamientoEspecifico: [],
    consumibles: [],
    mobiliario: [],
    personal: [],
    mantenimiento: [],
    ocupacionAnual: [],
    modoOcupacion: 'anual',
    crecimientoAutomatico: false,
    tasaCrecimiento: 0,
  };
}

describe('calculateOccupancyTarget', () => {
  it('weights L-V correctly (5 days/week)', () => {
    const horarios: ActivitySchedule[] = [
      { id: '1', nombre: 'Mañana', diaSemana: 'LV', tipo: 'pico', inicio: 9, fin: 17, tarifa: 100, ocupacion: 80 } // 8h × 5d = 40h/week
    ];
    
    const config = createConfigWithHorarios(horarios);
    const result = calculateOccupancyTarget(config);
    
    // Single pico schedule should return 80% target
    expect(result).toBe(80);
  });
  
  it('weights S-D correctly (2 days/week)', () => {
    const horarios: ActivitySchedule[] = [
      { id: '1', nombre: 'Mañana', diaSemana: 'SD', tipo: 'pico', inicio: 10, fin: 18, tarifa: 100, ocupacion: 80 } // 8h × 2d = 16h/week
    ];
    
    const config = createConfigWithHorarios(horarios);
    const result = calculateOccupancyTarget(config);
    
    // Single pico schedule should return 80% target
    expect(result).toBe(80);
  });
  
  it('combines L-V + S-D correctly with proper weighting', () => {
    const horarios: ActivitySchedule[] = [
      { id: '1', nombre: 'Pico LV', diaSemana: 'LV', tipo: 'pico', inicio: 9, fin: 17, tarifa: 100, ocupacion: 80 },   // 8h × 5d = 40h pico
      { id: '2', nombre: 'Valle SD', diaSemana: 'SD', tipo: 'valle', inicio: 10, fin: 18, tarifa: 50, ocupacion: 50 },  // 8h × 2d = 16h valle
    ];
    
    const config = createConfigWithHorarios(horarios);
    const result = calculateOccupancyTarget(config);
    
    // Weighted average: (40 * 80 + 16 * 50) / (40 + 16) = (3200 + 800) / 56 = 71.43%
    expect(result).toBeCloseTo(71.43, 1);
  });
  
  it('defaults to L-V if diaSemana not specified', () => {
    const horarios: ActivitySchedule[] = [
      { id: '1', nombre: 'Default', diaSemana: undefined as any, tipo: 'pico', inicio: 9, fin: 17, tarifa: 100, ocupacion: 80 }
    ];
    
    const config = createConfigWithHorarios(horarios);
    const result = calculateOccupancyTarget(config);
    
    // Should treat as L-V (5 days) and return 80% for pico
    expect(result).toBe(80);
  });
  
  it('handles multiple schedules of same type', () => {
    const horarios: ActivitySchedule[] = [
      { id: '1', nombre: 'Mañana', diaSemana: 'LV', tipo: 'pico', inicio: 9, fin: 12, tarifa: 100, ocupacion: 80 },   // 3h × 5d = 15h pico
      { id: '2', nombre: 'Tarde', diaSemana: 'LV', tipo: 'valle', inicio: 14, fin: 18, tarifa: 50, ocupacion: 50 },  // 4h × 5d = 20h valle
    ];
    
    const config = createConfigWithHorarios(horarios);
    const result = calculateOccupancyTarget(config);
    
    // Weighted average: (15 * 80 + 20 * 50) / (15 + 20) = (1200 + 1000) / 35 = 62.86%
    expect(result).toBeCloseTo(62.86, 1);
  });
  
  it('returns 60% default for empty schedules', () => {
    const config = createConfigWithHorarios([]);
    const result = calculateOccupancyTarget(config);
    
    expect(result).toBe(60);
  });
  
  it('properly weights mixed pico/valle across L-V and S-D', () => {
    const horarios: ActivitySchedule[] = [
      { id: '1', nombre: 'Pico LV', diaSemana: 'LV', tipo: 'pico', inicio: 8, fin: 10, tarifa: 100, ocupacion: 80 },   // 2h × 5d = 10h pico
      { id: '2', nombre: 'Valle LV', diaSemana: 'LV', tipo: 'valle', inicio: 10, fin: 16, tarifa: 50, ocupacion: 50 },  // 6h × 5d = 30h valle
      { id: '3', nombre: 'Pico SD', diaSemana: 'SD', tipo: 'pico', inicio: 10, fin: 14, tarifa: 80, ocupacion: 80 },   // 4h × 2d = 8h pico
      { id: '4', nombre: 'Valle SD', diaSemana: 'SD', tipo: 'valle', inicio: 14, fin: 18, tarifa: 40, ocupacion: 50 },  // 4h × 2d = 8h valle
    ];
    
    const config = createConfigWithHorarios(horarios);
    const result = calculateOccupancyTarget(config);
    
    // Total weighted hours: 10 + 30 + 8 + 8 = 56h/week
    // Pico hours: 10 + 8 = 18h at 80%
    // Valle hours: 30 + 8 = 38h at 50%
    // Weighted: (18 * 80 + 38 * 50) / 56 = (1440 + 1900) / 56 = 59.64%
    expect(result).toBeCloseTo(59.64, 1);
  });
});
