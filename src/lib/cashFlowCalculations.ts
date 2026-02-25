import { DashboardMetrics } from '@/types/dashboard';
import { EstadoResultados } from '@/types/estadoResultados';
import { CashFlowAnual, CashFlowFila } from '@/types/cashFlow';

export function calculateCashFlow(
  metrics: DashboardMetrics,
  pl: EstadoResultados,
  discountRate: number,
  taxRate: number = 0.35,
  residualPct: number = 0.40,
): CashFlowAnual {
  const capexTotal = metrics.capexTotal;
  const proy = metrics.proyeccion;
  const numAnos = proy.length;

  // Depreciación lineal del P&L (igual todos los años)
  const depAnual = pl.anos.length > 0 ? pl.anos[0].depreciacion.total : 0;

  // Valor residual = 40% del CAPEX sin Working Capital
  const workingCapital = metrics.workingCapitalValue ?? 0;
  const capexSinWC = capexTotal - workingCapital;
  const valorResidualTotal = capexSinWC * residualPct;

  // ── Fila Año 0 ──
  const fila0: CashFlowFila = {
    label: 'Año 0',
    year: 0,
    ebitdaAnual: 0,
    depreciacionAnual: 0,
    ebitAnual: 0,
    impuestoAnual: 0,
    flujoOperativo: 0,
    capexInversion: -capexTotal,
    valorResidual: 0,
    flujoCajaLibre: -capexTotal,
    flujoAcumulado: -capexTotal,
    paybackAlcanzado: false,
  };

  // ── Filas Año 1..N ──
  const filas: CashFlowFila[] = [fila0];
  let acumulado = -capexTotal;

  proy.forEach((year, i) => {
    const isLast = i === numAnos - 1;
    const ebitda = year.ebitdaAnual;
    const ebit = ebitda - depAnual;
    const impuesto = Math.max(0, ebit) * taxRate;
    const flujoOp = ebitda - impuesto;
    const residual = isLast ? valorResidualTotal : 0;
    // Usar flujoCaja del motor principal para consistencia
    const fcl = year.flujoCaja;
    acumulado += fcl;

    filas.push({
      label: `Año ${year.year}`,
      year: year.year,
      ebitdaAnual: ebitda,
      depreciacionAnual: depAnual,
      ebitAnual: ebit,
      impuestoAnual: impuesto,
      flujoOperativo: flujoOp,
      capexInversion: 0,
      valorResidual: residual,
      flujoCajaLibre: fcl,
      flujoAcumulado: acumulado,
      paybackAlcanzado: acumulado >= 0,
    });
  });

  // ── TIR — Newton-Raphson ──
  const fclArray = filas.map(f => f.flujoCajaLibre);

  function calcNPV(rate: number): number {
    return fclArray.reduce((acc, fcl, i) => acc + fcl / Math.pow(1 + rate, i), 0);
  }

  function calcIRR(): number {
    let rate = 0.1;
    for (let iter = 0; iter < 1000; iter++) {
      const npv = calcNPV(rate);
      const dnpv = fclArray.reduce(
        (acc, fcl, i) => acc - (i * fcl) / Math.pow(1 + rate, i + 1),
        0,
      );
      if (Math.abs(dnpv) < 1e-10) break;
      const newRate = rate - npv / dnpv;
      if (Math.abs(newRate - rate) < 1e-8) {
        rate = newRate;
        break;
      }
      rate = newRate;
    }
    return rate;
  }

  const tir = calcIRR();

  // ── VAN ──
  const van =
    fclArray.slice(1).reduce(
      (acc, fcl, i) => acc + fcl / Math.pow(1 + discountRate, i + 1),
      0,
    ) + fclArray[0];

  // ── Payback — interpolación mensual ──
  let paybackMeses = numAnos * 12; // default: no recupera
  const filasSinAnio0 = filas.slice(1);
  const idxCruce = filasSinAnio0.findIndex(f => f.flujoAcumulado >= 0);

  if (idxCruce >= 0) {
    const acumAnterior = idxCruce === 0
      ? fila0.flujoAcumulado
      : filasSinAnio0[idxCruce - 1].flujoAcumulado;
    const fclMensual = filasSinAnio0[idxCruce].flujoCajaLibre / 12;
    const mesesAdicionales = fclMensual > 0
      ? Math.ceil(Math.abs(acumAnterior) / fclMensual)
      : 12;
    paybackMeses = idxCruce * 12 + mesesAdicionales;
  }

  // ── CAPEX Breakdown (mapear desde DashboardMetrics) ──
  const cb = metrics.capexBreakdown;
  const capexBreakdown = {
    actividadesDeportivas: cb.actividades,
    espaciosInfraestructura: cb.infraestructura,
    obraCivil: cb.obraCivil,
    imprevistos: cb.imprevistos,
    subtotalCapex: capexSinWC,
    workingCapital,
    total: capexTotal,
  };

  const moic = capexTotal > 0 ? (van + capexTotal) / capexTotal : 0;

  return {
    filas,
    tir,
    van,
    paybackMeses,
    paybackAnos: paybackMeses / 12,
    capexTotal,
    moic,
    capexBreakdown,
  };
}
