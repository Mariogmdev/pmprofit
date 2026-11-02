import { describe, it, expect } from 'vitest';
import { draftActivityToConfig, draftToOpexRow, DraftActivity } from '../businessPlanImport';

const base: DraftActivity = {
  name: 'Pádel', modeloIngreso: 'reserva', cantidad: null, areaPorUnidad: null, duracionReserva: null,
  jugadoresPorReserva: null, capexPorUnidad: null, horarios: [], precioMembresia: null, miembrosAno1: null,
  precioPase: null, pasesDia: null, ticketPromedio: null, visitantesExternosDia: null, costoVentasPorcentaje: null, fuente: '',
};

describe('business plan import mapping', () => {
  it('missing values fall back to defaults instead of zero', () => {
    const c = draftActivityToConfig(base);
    expect(c.cantidad).toBe(1);
    expect(c.duracionReserva).toBe(1.5);
    expect(c.jugadoresPorReserva).toBe(4);
  });

  it('occupancy from the document is clamped to 0-100', () => {
    const c = draftActivityToConfig({ ...base, horarios: [{ nombre: 'Pico', inicio: 18, fin: 22, tarifa: 120000, tipo: 'pico', ocupacion: 140 }] });
    expect(c.horarios[0].ocupacion).toBe(100);
    expect(c.horarios[0].tarifa).toBe(120000);
  });

  it('mixed rent copies fixed and percent into mixto fields', () => {
    const row = draftToOpexRow({
      nomina_administrativa: [], nomina_operativa: [], arrendamiento_modelo: 'mixto',
      arrendamiento_fijo: 10_000_000, arrendamiento_variable_porcentaje: 5,
      servicios_publicos: [], marketing: [], tecnologia: [], seguros: [], mantenimiento_general: [], administrativos: [], otros_gastos: [],
    });
    expect(row.arrendamiento_mixto_fijo).toBe(10_000_000);
    expect(row.arrendamiento_mixto_porcentaje).toBe(5);
  });
});
