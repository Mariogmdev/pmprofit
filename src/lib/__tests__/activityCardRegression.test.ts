import { describe, it, expect } from 'vitest';
import { monthlyFinancialsWithOccupancy } from '../monthlyFinancials';
import { ActivityConfig, DEFAULT_MEMBERSHIP_CONFIG, DEFAULT_DAILY_PASS_CONFIG } from '@/types/activity';

/**
 * Regression tests to ensure centralized function produces correct values
 * These tests validate that removing duplicate calculations doesn't break anything
 */

// Helper to create minimal valid config
const createConfig = (overrides: Partial<ActivityConfig>): ActivityConfig => ({
  cantidad: 1,
  tipoUnidad: 'cancha',
  areaPorUnidad: 200,
  modeloIngreso: 'reserva',
  duracionReserva: 1.5,
  jugadoresPorReserva: 4,
  horarios: [],
  alquileres: [],
  ocupacionAnual: [{ ano: 1, pico: 60, valle: 30 }],
  modoOcupacion: 'anual',
  crecimientoAutomatico: true,
  ocupacionMensual: [],
  capex: { construccion: 0, equipamiento: 0, consumibles: 0, mobiliario: 0 },
  opex: { personal: 0, mantenimiento: 0, reposicion: 0, profesores: 0, costoVentas: 0 },
  tieneClases: false,
  configuracionClases: undefined,
  membershipConfig: DEFAULT_MEMBERSHIP_CONFIG,
  dailyPassConfig: DEFAULT_DAILY_PASS_CONFIG,
  ...overrides,
} as ActivityConfig);

// Helper to create schedule with required fields
const createSchedule = (
  id: string,
  inicio: number,
  fin: number,
  tarifa: number,
  tipo: 'pico' | 'valle',
  diaSemana: 'LV' | 'SD',
  ocupacion: number
) => ({
  id,
  nombre: `Horario ${id}`,
  inicio,
  fin,
  tarifa,
  tipo,
  diaSemana,
  ocupacion,
});

describe('ActivityCard - No Regression (Centralized Function)', () => {
  
  it('calculates reservation income correctly with custom occupancy', () => {
    const config = createConfig({
      cantidad: 4,
      modeloIngreso: 'reserva',
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      horarios: [
        createSchedule('1', 6, 22, 50000, 'pico', 'LV', 70),
        createSchedule('2', 8, 20, 50000, 'pico', 'SD', 80),
      ],
      alquileres: [
        { id: '1', item: 'Raqueta', porcentaje: 30, precio: 5000 }
      ],
      ocupacionAnual: [{ ano: 1, pico: 70, valle: 30 }]
    });
    
    const result = monthlyFinancialsWithOccupancy(config, 30, 70, 30, 0);
    
    // Verify structure exists
    expect(result).toHaveProperty('ingresos');
    expect(result.ingresos).toHaveProperty('reservas');
    expect(result.ingresos).toHaveProperty('complementarios');
    expect(result.ingresos).toHaveProperty('total');
    
    // Verify income is calculated
    expect(result.ingresos.reservas).toBeGreaterThan(0);
    expect(result.ingresos.total).toBeGreaterThan(0);
    
    // Verify users are calculated
    expect(result.usuarios).toBeGreaterThan(0);
  });
  
  it('total equals sum of all components', () => {
    const config = createConfig({
      cantidad: 2,
      modeloIngreso: 'mixto',
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      horarios: [
        createSchedule('1', 8, 20, 40000, 'pico', 'LV', 60),
      ],
      membershipConfig: {
        ...DEFAULT_MEMBERSHIP_CONFIG,
        miembrosProyectados: [50, 60, 70, 80, 90],
        precioMembresia: 100000,
      },
      dailyPassConfig: {
        ...DEFAULT_DAILY_PASS_CONFIG,
        pasesProyectadosDia: 5,
        precioPase: 25000,
      },
      ocupacionAnual: [{ ano: 1, pico: 60, valle: 40 }]
    });
    
    const result = monthlyFinancialsWithOccupancy(config, 30, 60, 40, 0);
    
    // Total must be sum of all components
    const manualSum =
      result.ingresos.reservas +
      result.ingresos.complementarios +
      result.ingresos.clases +
      result.ingresos.membresias +
      result.ingresos.pases +
      result.ingresos.trafico;
    
    expect(result.ingresos.total).toBe(manualSum);
  });
  
  it('respects occupancy percentage in calculations', () => {
    const config = createConfig({
      cantidad: 4,
      modeloIngreso: 'reserva',
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      horarios: [
        createSchedule('1', 6, 22, 50000, 'pico', 'LV', 70),
      ],
      ocupacionAnual: [{ ano: 1, pico: 70, valle: 30 }]
    });
    
    const result50 = monthlyFinancialsWithOccupancy(config, 30, 50, 50, 0);
    const result100 = monthlyFinancialsWithOccupancy(config, 30, 100, 100, 0);
    
    // 100% occupancy should produce roughly 2x income of 50% occupancy
    expect(result100.ingresos.reservas).toBeGreaterThan(result50.ingresos.reservas);
    expect(result100.ingresos.reservas / result50.ingresos.reservas).toBeCloseTo(2, 1);
  });
  
  it('only includes reservations for reserva model (not memberships)', () => {
    const config = createConfig({
      cantidad: 2,
      modeloIngreso: 'reserva', // NOT mixto
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      horarios: [
        createSchedule('1', 8, 20, 40000, 'pico', 'LV', 60),
      ],
      // Even if membership config exists, should not be included
      membershipConfig: {
        ...DEFAULT_MEMBERSHIP_CONFIG,
        miembrosProyectados: [100, 120, 140, 160, 180],
        precioMembresia: 200000,
      },
      ocupacionAnual: [{ ano: 1, pico: 60, valle: 40 }]
    });
    
    const result = monthlyFinancialsWithOccupancy(config, 30, 60, 40, 0);
    
    // Memberships should be 0 for 'reserva' model
    expect(result.ingresos.membresias).toBe(0);
    expect(result.ingresos.reservas).toBeGreaterThan(0);
  });
  
  it('includes all income sources for mixto model', () => {
    const config = createConfig({
      cantidad: 2,
      modeloIngreso: 'mixto',
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      horarios: [
        createSchedule('1', 8, 20, 40000, 'pico', 'LV', 60),
      ],
      membershipConfig: {
        ...DEFAULT_MEMBERSHIP_CONFIG,
        miembrosProyectados: [50, 60, 70, 80, 90],
        precioMembresia: 100000,
      },
      dailyPassConfig: {
        ...DEFAULT_DAILY_PASS_CONFIG,
        pasesProyectadosDia: 5,
        precioPase: 25000,
      },
      ocupacionAnual: [{ ano: 1, pico: 60, valle: 40 }]
    });
    
    const result = monthlyFinancialsWithOccupancy(config, 30, 60, 40, 0);
    
    // All income sources should be included
    expect(result.ingresos.reservas).toBeGreaterThan(0);
    expect(result.ingresos.membresias).toBeGreaterThan(0);
    expect(result.ingresos.pases).toBeGreaterThan(0);
    expect(result.ingresos.total).toBe(
      result.ingresos.reservas + 
      result.ingresos.complementarios + 
      result.ingresos.clases + 
      result.ingresos.membresias + 
      result.ingresos.pases + 
      result.ingresos.trafico
    );
  });
  
  it('uses dynamic weeksPerMonth based on daysPerMonth', () => {
    const config = createConfig({
      cantidad: 4,
      modeloIngreso: 'reserva',
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      horarios: [
        createSchedule('1', 8, 18, 50000, 'pico', 'LV', 70),
      ],
      ocupacionAnual: [{ ano: 1, pico: 70, valle: 30 }]
    });
    
    const result28 = monthlyFinancialsWithOccupancy(config, 28, 70, 70, 0);
    const result31 = monthlyFinancialsWithOccupancy(config, 31, 70, 70, 0);
    
    // 31-day month should produce more income than 28-day month
    expect(result31.ingresos.reservas).toBeGreaterThan(result28.ingresos.reservas);
    
    // Ratio should be approximately 31/28
    const expectedRatio = 31 / 28;
    const actualRatio = result31.ingresos.reservas / result28.ingresos.reservas;
    expect(actualRatio).toBeCloseTo(expectedRatio, 1);
  });
});
