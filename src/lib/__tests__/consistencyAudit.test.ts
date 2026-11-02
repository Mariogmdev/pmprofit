import { describe, it, expect } from 'vitest';
import { auditDashboardMetrics, AUDIT_TOLERANCE } from '../consistencyAudit';
import type { DashboardMetrics, ProjectionYear } from '@/types/dashboard';

const year = (y: number, ing: number, opex: number, dep: number, fcl: number, acc: number): ProjectionYear => ({
  year: y, ingresosMensuales: ing / 12, ingresosAnuales: ing, opexMensual: opex / 12, opexAnual: opex,
  ebitdaMensual: (ing - opex) / 12, ebitdaAnual: ing - opex, margenEbitda: ((ing - opex) / ing) * 100,
  capex: 0, flujoCaja: fcl, flujoAcumulado: acc, roiAcumulado: 0, paybackAlcanzado: acc >= 0,
  depreciacionAnual: dep, ebitAnual: ing - opex - dep, impuestoAnual: 0, flujoOperativo: fcl,
  capexInversion: 0, valorResidual: 0, flujoCajaLibre: fcl, flujoAcumulado2: acc, paybackMes: 0,
});

const base = (): DashboardMetrics => ({
  ingresosMensualesBase: 100_000, ingresosAnualesBase: 1_200_000, ebitdaMensualBase: 40_000, margenEbitdaBase: 40,
  ebitMensualBase: 30_000, margenEbitBase: 30, depreciacionMensual: 10_000, capexTotal: 500_000,
  tir: 20, van: 1, paybackMeses: 12, paybackMesesReal: 12, workingCapitalMonths: 3, workingCapitalValue: 0,
  opexMensualBase: 60_000,
  proyeccion: [year(1, 1_000_000, 700_000, 120_000, 300_000, -200_000), year(2, 1_200_000, 720_000, 120_000, 400_000, 200_000)],
} as unknown as DashboardMetrics);

describe('consistency audit', () => {
  it('passes a consistent model', () => {
    expect(auditDashboardMetrics(base()).every((c) => c.ok)).toBe(true);
  });

  it('cumulative free cash flow starts at minus total investment', () => {
    const m = base();
    m.proyeccion[0].flujoAcumulado2 = 300_000; // forgot to subtract CAPEX
    expect(auditDashboardMetrics(m).find((c) => c.id === 'y1_fcf_acc')?.ok).toBe(false);
  });

  it('flags EBITDA that is not revenue minus OPEX beyond $1.000', () => {
    const m = base();
    m.proyeccion[1].ebitdaAnual += AUDIT_TOLERANCE + 1;
    expect(auditDashboardMetrics(m).find((c) => c.id === 'y2_ebitda')?.ok).toBe(false);
  });

  it('tolerates differences up to $1.000', () => {
    const m = base();
    m.ebitdaMensualBase += AUDIT_TOLERANCE;
    expect(auditDashboardMetrics(m).find((c) => c.id === 'base_ebitda')?.ok).toBe(true);
  });
});
