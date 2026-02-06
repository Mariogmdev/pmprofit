import { describe, it, expect } from 'vitest';
import { monthlyFinancialsWithOccupancy } from '../monthlyFinancials';
import { calculateActivityFinancials } from '../activityCalculations';
import { ActivityConfig } from '@/types/activity';

/**
 * Bug #3: Alquileres in Dashboard
 * Validates that rental income is included in totals
 */
describe('Bug #3: Alquileres in Dashboard', () => {
  it('monthlyFinancials incluye alquileres en complementarios', () => {
    const config: Partial<ActivityConfig> = {
      cantidad: 4,
      modeloIngreso: 'reserva',
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      horarios: [
        { id: '1', nombre: 'LV', inicio: 6, fin: 22, tarifa: 50000, tipo: 'pico', ocupacion: 70, diaSemana: 'LV' }
      ],
      alquileres: [
        { id: '1', item: 'Palas', porcentaje: 20, precio: 5000 },
        { id: '2', item: 'Bolas', porcentaje: 50, precio: 2000 },
      ],
    };
    
    const result = monthlyFinancialsWithOccupancy(config as ActivityConfig, 30, 70, 30, 0);
    
    // Alquileres debe tener valor
    expect(result.ingresos.complementarios).toBeGreaterThan(0);
    
    // Total debe incluir complementarios
    expect(result.ingresos.total).toBeGreaterThan(result.ingresos.reservas);
  });

  it('alquileres se calculan basado en usuarios', () => {
    const config: Partial<ActivityConfig> = {
      cantidad: 4,
      modeloIngreso: 'reserva',
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      horarios: [
        { id: '1', nombre: 'LV', inicio: 6, fin: 22, tarifa: 50000, tipo: 'pico', ocupacion: 100, diaSemana: 'LV' }
      ],
      alquileres: [
        { id: '1', item: 'Test', porcentaje: 100, precio: 1000 },
      ],
    };
    
    const result = monthlyFinancialsWithOccupancy(config as ActivityConfig, 30, 100, 100, 0);
    
    // Con 100% de usuarios alquilando a $1000:
    // Complementarios = usuarios × 100% × $1000
    expect(result.ingresos.complementarios).toBe(result.usuarios * 1000);
  });

  it('calculateActivityFinancials incluye complementarios', () => {
    const config = {
      cantidad: 4,
      modeloIngreso: 'reserva',
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      tipoUnidad: 'Cancha',
      areaPorUnidad: 200,
      horarios: [
        { id: '1', nombre: 'LV', inicio: 6, fin: 22, tarifa: 50000, tipo: 'pico', ocupacion: 70, diaSemana: 'LV' }
      ],
      alquileres: [
        { id: '1', item: 'Palas', porcentaje: 20, precio: 5000 },
      ],
      ocupacionAnual: [{ ano: 1, pico: 70, valle: 30 }],
      modoOcupacion: 'anual',
      crecimientoAutomatico: false,
      tasaCrecimiento: 10,
      tipoCubierta: 'cubierta',
      capexCubierta: 0,
      capexSemicubierta: 0,
      capexAireLibre: 0,
      equipamientoEspecifico: [],
      consumibles: [],
      mobiliario: [],
      personal: [],
      mantenimiento: [],
      tieneClases: false,
    } as ActivityConfig;
    
    const result = calculateActivityFinancials(config, 30);
    
    expect(result.ingresosComplementarios).toBeGreaterThan(0);
    expect(result.ingresosMensuales).toBeGreaterThan(result.ingresosHorarios);
  });

  it('sin alquileres, complementarios es 0', () => {
    const config: Partial<ActivityConfig> = {
      cantidad: 4,
      modeloIngreso: 'reserva',
      duracionReserva: 1.5,
      jugadoresPorReserva: 4,
      horarios: [
        { id: '1', nombre: 'LV', inicio: 6, fin: 22, tarifa: 50000, tipo: 'pico', ocupacion: 70, diaSemana: 'LV' }
      ],
      alquileres: [],
    };
    
    const result = monthlyFinancialsWithOccupancy(config as ActivityConfig, 30, 70, 30, 0);
    
    expect(result.ingresos.complementarios).toBe(0);
  });
});
