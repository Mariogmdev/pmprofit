import { describe, it, expect } from 'vitest';
import { 
  monthlyFinancialsWithOccupancy, 
  calculateYear1MonthlyProjection,
  MonthlyFinancialsResult 
} from '../monthlyFinancials';
import { ActivityConfig, DEFAULT_ACTIVITY_CONFIG } from '@/types/activity';

describe('monthlyFinancialsWithOccupancy', () => {
  it('returns correct structure with all income components', () => {
    const config: ActivityConfig = {
      ...DEFAULT_ACTIVITY_CONFIG,
      modeloIngreso: 'mixto',
    };

    const result = monthlyFinancialsWithOccupancy(config, 30, 70, 30, 0);

    // Verify structure
    expect(result).toHaveProperty('ingresos');
    expect(result.ingresos).toHaveProperty('reservas');
    expect(result.ingresos).toHaveProperty('complementarios');
    expect(result.ingresos).toHaveProperty('clases');
    expect(result.ingresos).toHaveProperty('membresias');
    expect(result.ingresos).toHaveProperty('pases');
    expect(result.ingresos).toHaveProperty('trafico');
    expect(result.ingresos).toHaveProperty('total');

    expect(result).toHaveProperty('usuarios');
    expect(result).toHaveProperty('ocupacion');
    expect(result.ocupacion).toHaveProperty('pico');
    expect(result.ocupacion).toHaveProperty('valle');
    expect(result.ocupacion).toHaveProperty('promedio');
    
    expect(result).toHaveProperty('costos');
    expect(result.costos).toHaveProperty('profesores');
    expect(result.costos).toHaveProperty('costoVentas');
  });

  it('total equals sum of all income components', () => {
    const config: ActivityConfig = {
      ...DEFAULT_ACTIVITY_CONFIG,
      modeloIngreso: 'mixto',
      horarios: [
        { id: '1', inicio: 8, fin: 12, nombre: 'Mañana', tarifa: 50000, tipo: 'pico', ocupacion: 70, diaSemana: 'LV' },
        { id: '2', inicio: 14, fin: 18, nombre: 'Tarde', tarifa: 40000, tipo: 'valle', ocupacion: 40, diaSemana: 'LV' },
      ],
    };

    const result = monthlyFinancialsWithOccupancy(config, 30, 60, 30, 0);

    const manualSum = 
      result.ingresos.reservas +
      result.ingresos.complementarios +
      result.ingresos.clases +
      result.ingresos.membresias +
      result.ingresos.pases +
      result.ingresos.trafico;

    expect(result.ingresos.total).toBeCloseTo(manualSum, 2);
  });

  it('reservation model only includes reservas and complementarios', () => {
    const config: ActivityConfig = {
      ...DEFAULT_ACTIVITY_CONFIG,
      modeloIngreso: 'reserva',
      horarios: [
        { id: '1', inicio: 8, fin: 20, nombre: 'Completo', tarifa: 45000, tipo: 'pico', ocupacion: 60, diaSemana: 'LV' },
      ],
    };

    const result = monthlyFinancialsWithOccupancy(config, 30, 70, 30, 0);

    // Memberships and passes should be 0 for reservation model
    expect(result.ingresos.membresias).toBe(0);
    expect(result.ingresos.pases).toBe(0);
    expect(result.ingresos.trafico).toBe(0);
    
    // Reservas should be > 0 since we have schedules
    expect(result.ingresos.reservas).toBeGreaterThan(0);
  });

  it('membership model calculates membership income', () => {
    const config: ActivityConfig = {
      ...DEFAULT_ACTIVITY_CONFIG,
      modeloIngreso: 'membresia',
      membershipConfig: {
        precioMembresia: 200000,
        capacidadMaxima: 50,
        miembrosProyectados: [100, 120, 140, 160, 180],
        crecimientoAutomatico: false,
        tasaCrecimiento: 15,
        maximoMiembros: 300,
      },
    };

    const result = monthlyFinancialsWithOccupancy(config, 30, 70, 30, 0);

    // 100 members × $200,000 = $20,000,000
    expect(result.ingresos.membresias).toBe(100 * 200000);
    expect(result.ingresos.reservas).toBe(0);
    expect(result.usuarios).toBe(100);
  });

  /**
   * CRITICAL BUG TEST: Modelo Mixto must include ALL income components
   * - Reservations (from schedules)
   * - Memberships (from membershipConfig)
   * - Daily passes (from dailyPassConfig)
   * - Complementary income (rentals)
   */
  it('modelo mixto includes memberships + daily passes + reservations', () => {
    const config: ActivityConfig = {
      ...DEFAULT_ACTIVITY_CONFIG,
      cantidad: 4,
      modeloIngreso: 'mixto',
      duracionReserva: 1.5,
      horarios: [
        { id: '1', inicio: 6, fin: 22, nombre: 'Pico LV', tarifa: 50000, tipo: 'pico', diaSemana: 'LV', ocupacion: 70 },
      ],
      membershipConfig: {
        precioMembresia: 100000,
        capacidadMaxima: 50,
        miembrosProyectados: [200, 220, 240, 260, 280],
        crecimientoAutomatico: false,
        tasaCrecimiento: 15,
        maximoMiembros: 500,
      },
      dailyPassConfig: {
        precioPase: 50000,
        capacidadMaxima: 50,
        pasesProyectadosDia: 10,
      },
      ocupacionAnual: [{ ano: 1, pico: 60, valle: 30 }],
    };

    const result = monthlyFinancialsWithOccupancy(config, 30, 60, 30, 0);

    // Memberships: 200 × $100,000 = $20,000,000
    expect(result.ingresos.membresias).toBe(200 * 100000);
    
    // Daily passes: 10/day × 30 days × $50,000 = $15,000,000
    expect(result.ingresos.pases).toBe(10 * 30 * 50000);
    
    // Reservations should be > 0
    expect(result.ingresos.reservas).toBeGreaterThan(0);
    
    // Total must include ALL components
    const expectedTotal = result.ingresos.reservas + 
                          result.ingresos.complementarios + 
                          result.ingresos.clases + 
                          result.ingresos.membresias + 
                          result.ingresos.pases + 
                          result.ingresos.trafico;
    
    expect(result.ingresos.total).toBe(expectedTotal);
    // Total must be > memberships + passes alone (proves reservas are included)
    expect(result.ingresos.total).toBeGreaterThan(result.ingresos.membresias + result.ingresos.pases);
  });

  it('occupancy affects reservation income proportionally', () => {
    const config: ActivityConfig = {
      ...DEFAULT_ACTIVITY_CONFIG,
      modeloIngreso: 'reserva',
      cantidad: 2,
      duracionReserva: 1,
      horarios: [
        { id: '1', inicio: 10, fin: 14, nombre: 'Mañana', tarifa: 100000, tipo: 'pico', ocupacion: 100, diaSemana: 'LV' },
      ],
    };

    // 100% occupancy
    const result100 = monthlyFinancialsWithOccupancy(config, 30, 100, 100, 0);
    
    // 50% occupancy
    const result50 = monthlyFinancialsWithOccupancy(config, 30, 50, 50, 0);

    // Income at 50% should be half of 100%
    expect(result50.ingresos.reservas).toBeCloseTo(result100.ingresos.reservas / 2, 2);
  });

  it('uses proper weekly weighting (5 days LV, 2 days SD)', () => {
    const config: ActivityConfig = {
      ...DEFAULT_ACTIVITY_CONFIG,
      modeloIngreso: 'reserva',
      cantidad: 1,
      duracionReserva: 1,
      horarios: [
        // Same schedule for both LV and SD
        { id: '1', inicio: 10, fin: 12, nombre: 'LV', tarifa: 100000, tipo: 'pico', ocupacion: 100, diaSemana: 'LV' },
        { id: '2', inicio: 10, fin: 12, nombre: 'SD', tarifa: 100000, tipo: 'pico', ocupacion: 100, diaSemana: 'SD' },
      ],
    };

    const result = monthlyFinancialsWithOccupancy(config, 30, 100, 100, 0);

    // 2 turns/day × $100,000 = $200,000/day
    // LV: $200,000 × 5 days = $1,000,000/week
    // SD: $200,000 × 2 days = $400,000/week
    // Total: $1,400,000/week × 4.2857 weeks = ~$6,000,000/month
    const weeksPerMonth = 30 / 7;
    const expectedWeekly = (2 * 100000 * 5) + (2 * 100000 * 2); // 1,400,000
    const expectedMonthly = expectedWeekly * weeksPerMonth;

    expect(result.ingresos.reservas).toBeCloseTo(expectedMonthly, 0);
  });
});

describe('calculateYear1MonthlyProjection', () => {
  it('returns 12 months of projections', () => {
    const config: ActivityConfig = {
      ...DEFAULT_ACTIVITY_CONFIG,
      modeloIngreso: 'reserva',
      horarios: [
        { id: '1', inicio: 8, fin: 20, nombre: 'Completo', tarifa: 50000, tipo: 'pico', ocupacion: 60, diaSemana: 'LV' },
      ],
    };

    const projection = calculateYear1MonthlyProjection(config, 30, 0);

    expect(projection.months).toHaveLength(12);
    expect(projection.totalYear1).toBeGreaterThan(0);
    expect(projection.monthlyAverage).toBeCloseTo(projection.totalYear1 / 12, 2);
  });

  it('totalYear1 equals sum of all monthly totals', () => {
    const config: ActivityConfig = {
      ...DEFAULT_ACTIVITY_CONFIG,
      modeloIngreso: 'mixto',
      horarios: [
        { id: '1', inicio: 8, fin: 12, nombre: 'Mañana', tarifa: 50000, tipo: 'pico', ocupacion: 60, diaSemana: 'LV' },
      ],
    };

    const projection = calculateYear1MonthlyProjection(config, 30, 0);

    const manualSum = projection.months.reduce((sum, m) => sum + m.ingresos.total, 0);
    expect(projection.totalYear1).toBeCloseTo(manualSum, 2);
  });

  it('component totals match sum of monthly components', () => {
    const config: ActivityConfig = {
      ...DEFAULT_ACTIVITY_CONFIG,
      modeloIngreso: 'reserva',
      horarios: [
        { id: '1', inicio: 8, fin: 16, nombre: 'Dia', tarifa: 40000, tipo: 'pico', ocupacion: 50, diaSemana: 'LV' },
      ],
    };

    const projection = calculateYear1MonthlyProjection(config, 30, 0);

    const sumReservas = projection.months.reduce((sum, m) => sum + m.ingresos.reservas, 0);
    expect(projection.totalsByComponent.reservas).toBeCloseTo(sumReservas, 2);
  });

  it('uses monthly occupation data when available', () => {
    const config: ActivityConfig = {
      ...DEFAULT_ACTIVITY_CONFIG,
      modeloIngreso: 'reserva',
      horarios: [
        { id: '1', inicio: 10, fin: 12, nombre: 'Test', tarifa: 100000, tipo: 'pico', ocupacion: 50, diaSemana: 'LV' },
      ],
      ocupacionMensual: [
        { mes: 1, pico: 30, valle: 15 },
        { mes: 2, pico: 40, valle: 20 },
        { mes: 3, pico: 50, valle: 25 },
        { mes: 4, pico: 60, valle: 30 },
        { mes: 5, pico: 70, valle: 35 },
        { mes: 6, pico: 75, valle: 40 },
        { mes: 7, pico: 80, valle: 45 },
        { mes: 8, pico: 80, valle: 45 },
        { mes: 9, pico: 80, valle: 45 },
        { mes: 10, pico: 80, valle: 45 },
        { mes: 11, pico: 80, valle: 45 },
        { mes: 12, pico: 80, valle: 45 },
      ],
    };

    const projection = calculateYear1MonthlyProjection(config, 30, 0);

    // Month 1 should use 30% pico
    expect(projection.months[0].ocupacion.pico).toBe(30);
    
    // Month 12 should use 80% pico
    expect(projection.months[11].ocupacion.pico).toBe(80);

    // Later months should have higher income
    expect(projection.months[11].ingresos.reservas).toBeGreaterThan(projection.months[0].ingresos.reservas);
  });
});
