/**
 * Consistency audit: checks that the numbers shown in the Dashboard (and therefore
 * passed to PDF/Excel exports, which receive the same DashboardMetrics object)
 * satisfy the model's accounting identities. Pure function, no UI.
 */
import type { DashboardMetrics } from '@/types/dashboard';
import type { EstadoResultados } from '@/types/estadoResultados';
import type { BalanceGeneral } from '@/types/balanceGeneral';

export const AUDIT_TOLERANCE = 1000; // currency units

export interface AuditCheck {
  id: string;
  label: string;
  expected: number;
  actual: number;
  diff: number;
  ok: boolean;
  detail: string;
}

const check = (id: string, label: string, expected: number, actual: number, detail: string, tol = AUDIT_TOLERANCE): AuditCheck => {
  const e = Number.isFinite(expected) ? expected : NaN;
  const a = Number.isFinite(actual) ? actual : NaN;
  const diff = Math.abs(e - a);
  return { id, label, expected: e, actual: a, diff, ok: Number.isFinite(diff) && diff <= tol, detail };
};

export function auditDashboardMetrics(m: DashboardMetrics): AuditCheck[] {
  const checks: AuditCheck[] = [];
  const y1 = m.proyeccion[0];
  const months = m.year1Monthly ?? [];

  if (months.length === 12) {
    const sumIng = months.reduce((s, x) => s + x.ingresos, 0);
    const sumOpex = months.reduce((s, x) => s + x.opex, 0);
    checks.push(check('y1_rev_sum', 'Ingresos Año 1 = suma de 12 meses', sumIng, y1?.ingresosAnuales ?? NaN, 'Proyección anual vs. detalle mensual Año 1'));
    checks.push(check('y1_opex_sum', 'OPEX Año 1 = suma de 12 meses', sumOpex, y1?.opexAnual ?? NaN, 'Proyección anual vs. detalle mensual Año 1'));
    months.forEach((x, i) => {
      const parts = x.reservas + x.membresias + x.pases + x.complementarios + x.clases + x.trafico;
      checks.push(check(`m${i + 1}_sources`, `Mes ${i + 1}: fuentes de ingreso = total`, parts, x.ingresos, 'Reservas + membresías + pases + complementarios + clases + tráfico'));
      checks.push(check(`m${i + 1}_ebitda`, `Mes ${i + 1}: EBITDA = Ingresos − COGS − OPEX`, x.ingresos - (x.cogs ?? 0) - x.opex, x.ebitda, 'Identidad mensual'));
    });
    checks.push(check('base_month12', 'Ingreso mensual base = mes 12', months[11].ingresos, m.ingresosMensualesBase, 'Tarjeta "Ingresos Mensuales" vs. mes 12 del Año 1'));
  }

  const cogsBase = months.length === 12 ? months[11].cogs ?? 0 : 0;
  checks.push(check('base_ebitda', 'EBITDA mensual base = Ingresos − COGS − OPEX', m.ingresosMensualesBase - cogsBase - m.opexMensualBase, m.ebitdaMensualBase, 'Tarjeta EBITDA'));
  checks.push(check('base_ebit', 'EBIT mensual = EBITDA − depreciación', m.ebitdaMensualBase - m.depreciacionMensual, m.ebitMensualBase, 'Tarjeta EBITDA/EBIT'));

  let acumulado = -m.capexTotal; // Año 0: inversión inicial
  m.proyeccion.forEach((p) => {
    checks.push(check(`y${p.year}_ebitda`, `Año ${p.year}: EBITDA = Ingresos − COGS − OPEX`, p.ingresosAnuales - (p.cogsAnual ?? 0) - p.opexAnual, p.ebitdaAnual, 'Proyección anual (Dashboard, PDF y Excel)'));
    checks.push(check(`y${p.year}_ebit`, `Año ${p.year}: EBIT = EBITDA − depreciación`, p.ebitdaAnual - p.depreciacionAnual, p.ebitAnual, 'Estado de resultados'));
    const margin = p.ingresosAnuales > 0 ? (p.ebitdaAnual / p.ingresosAnuales) * 100 : 0;
    checks.push(check(`y${p.year}_margin`, `Año ${p.year}: margen EBITDA`, margin, p.margenEbitda, 'Porcentaje', 0.1));
    acumulado += p.flujoCajaLibre;
    checks.push(check(`y${p.year}_fcf_acc`, `Año ${p.year}: flujo libre acumulado`, acumulado, p.flujoAcumulado2, 'Flujo de caja'));
  });

  return checks;
}

/** Checks between the Dashboard numbers and the financial statements (P&L, Balance). */
export function auditStatements(m: DashboardMetrics, pl: EstadoResultados, balance: BalanceGeneral): AuditCheck[] {
  const checks: AuditCheck[] = [];
  const plY1Rev = pl.meses.reduce((s, x) => s + x.ingresos.netos, 0);
  checks.push(check('pl_y1_rev', 'Ingresos Año 1: Resumen = Estado de Resultados', m.proyeccion[0]?.ingresosAnuales ?? NaN, plY1Rev, 'Suma de 12 meses del P&L'));
  pl.anos.forEach((a, i) => {
    const y = i + 1;
    checks.push(check(`pl_y${y}_ebitda`, `P&L Año ${y}: EBITDA = Ingresos − COGS − OPEX`, a.ingresos.netos - a.cogs.total - a.opex.total, a.ebitda, 'Estado de Resultados'));
    checks.push(check(`pl_y${y}_ebit`, `P&L Año ${y}: EBIT = EBITDA − depreciación`, a.ebitda - a.depreciacion.total, a.ebit, 'Estado de Resultados'));
    const dash = m.proyeccion[i];
    if (dash) {
      checks.push(check(`pl_y${y}_rev_dash`, `Año ${y}: ingresos Resumen = P&L`, dash.ingresosAnuales, a.ingresos.netos, 'Resumen/PDF vs. Estado de Resultados/Excel'));
      checks.push(check(`pl_y${y}_ebitda_dash`, `Año ${y}: EBITDA Resumen = P&L`, dash.ebitdaAnual, a.ebitda, 'Resumen/PDF vs. Estado de Resultados/Excel'));
      checks.push(check(`pl_y${y}_dep_dash`, `Año ${y}: depreciación Resumen = P&L`, dash.depreciacionAnual, a.depreciacion.total, 'Flujo de caja vs. Estado de Resultados'));
    }
  });
  balance.periodos.forEach((b) => {
    checks.push(check(`bal_y${b.periodo}`, `Balance Año ${b.periodo}: Activos = Pasivos + Patrimonio`, b.activos.total, b.pasivos.total + b.patrimonio.total, 'Balance General'));
  });
  return checks;
}

export const summarizeAudit = (checks: AuditCheck[]) => ({
  total: checks.length,
  failed: checks.filter((c) => !c.ok).length,
});
