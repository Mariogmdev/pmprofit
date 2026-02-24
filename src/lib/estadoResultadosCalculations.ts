/**
 * Estado de Resultados (P&L) Calculations
 *
 * CRITICAL RULE: Uses monthlyFinancialsWithOccupancy() as the ONLY
 * source of income data. Never duplicates income logic.
 */

import {
  EstadoResultados,
  PeriodoResultados,
} from '@/types/estadoResultados';
import {
  monthlyFinancialsWithOccupancy,
  MonthlyFinancialsResult,
} from '@/lib/monthlyFinancials';
import { ActivityConfig } from '@/types/activity';
import { logger } from '@/lib/logger';

// =====================================================
// MAIN EXPORT
// =====================================================

export function calculateEstadoResultados(
  projectId: string,
  activities: ActivityConfig[],
  capexTotal: number,
  workingCapital: number,
  opexProyecto: OpexProyectoInput = {},
  tasaImpuestos: number = 0.35,
  depreciacionAnos: number = 10,
  daysPerMonth: number = 30,
): EstadoResultados {
  const meses = calcularMesesAno1(activities, capexTotal, opexProyecto, depreciacionAnos, tasaImpuestos, daysPerMonth);
  const anos = calcularAnos(activities, capexTotal, opexProyecto, depreciacionAnos, tasaImpuestos, daysPerMonth);
  const metricas = calcularMetricas(anos);
  const comparativo = calcularComparativo(anos);

  return {
    proyectoId: projectId,
    generadoEn: new Date().toISOString(),
    config: { tasaImpuestos, depreciacionAnos, incluyeIntereses: false },
    meses,
    anos,
    metricas,
    comparativoAnual: comparativo,
  };
}

// =====================================================
// Project-level OPEX input (from project_opex table)
// =====================================================

export interface OpexProyectoInput {
  arriendo?: number;
  nomina?: number;
  seguros?: number;
  serviciosPublicos?: number;
  marketing?: number;
  mantenimiento?: number;
  limpieza?: number;
  seguridad?: number;
  contabilidad?: number;
  legal?: number;
  tecnologia?: number;
  comisiones?: number;
  otros?: number;
}

// =====================================================
// combinarActividades
// =====================================================

interface CombinedFinancials {
  ingresos: {
    reservas: number;
    membresias: number;
    pasesDiarios: number;
    clases: number;
    complementarios: number;
    trafico: number;
    total: number;
  };
  costos: {
    profesores: number;
    costoVentas: number;
  };
}

function combinarActividades(
  activities: ActivityConfig[],
  mes: number | null,
  ano: number,
  daysPerMonth: number,
): CombinedFinancials {
  const totals: CombinedFinancials = {
    ingresos: {
      reservas: 0, membresias: 0, pasesDiarios: 0, clases: 0,
      complementarios: 0, trafico: 0, total: 0,
    },
    costos: { profesores: 0, costoVentas: 0 },
  };

  // Pre-calculate total club users for traffic activities
  let totalClubUsers = 0;
  for (const activity of activities) {
    if (activity.modeloIngreso !== 'trafico') {
      const occ = getOccupationForPeriod(activity, mes, ano);
      const f = monthlyFinancialsWithOccupancy(activity, daysPerMonth, occ.pico, occ.valle, 0);
      totalClubUsers += f.usuarios;
    }
  }

  for (const activity of activities) {
    const occ = getOccupationForPeriod(activity, mes, ano);
    const isTraffic = activity.modeloIngreso === 'trafico';

    const f = monthlyFinancialsWithOccupancy(
      activity,
      daysPerMonth,
      occ.pico,
      occ.valle,
      isTraffic ? totalClubUsers : 0,
    );

    totals.ingresos.reservas += f.ingresos.reservas;
    totals.ingresos.membresias += f.ingresos.membresias;
    totals.ingresos.pasesDiarios += f.ingresos.pases;
    totals.ingresos.clases += f.ingresos.clases;
    totals.ingresos.complementarios += f.ingresos.complementarios;
    totals.ingresos.trafico += f.ingresos.trafico;
    totals.ingresos.total += f.ingresos.total;
    totals.costos.profesores += f.costos.profesores;
    totals.costos.costoVentas += f.costos.costoVentas;
  }

  return totals;
}

// =====================================================
// Occupation helpers
// =====================================================

function getOccupationForPeriod(
  activity: ActivityConfig,
  mes: number | null,
  ano: number,
): { pico: number; valle: number } {
  // Year 1 with specific month: use monthly occupation if available
  if (mes !== null && ano === 1) {
    const monthly = activity.ocupacionMensual?.[mes - 1];
    if (monthly) return { pico: monthly.pico, valle: monthly.valle };
  }

  // Use annual occupation data
  const yearData = activity.ocupacionAnual?.find(o => o.ano === ano);
  if (yearData) return { pico: yearData.pico, valle: yearData.valle };

  // Fallback: year 1 data with growth multiplier
  const year1 = activity.ocupacionAnual?.[0] ?? { pico: 60, valle: 30 };
  const mult = getYearMultiplier(ano);
  return {
    pico: Math.min(95, year1.pico * mult),
    valle: Math.min(95, year1.valle * mult),
  };
}

function getYearMultiplier(ano: number): number {
  const multipliers: Record<number, number> = {
    1: 1.0,
    2: 1.10,
    3: 1.20,
    4: 1.25,
    5: 1.30,
  };
  return multipliers[ano] ?? 1.0;
}

// =====================================================
// calcularPeriodo
// =====================================================

function calcularPeriodo(
  combined: CombinedFinancials,
  periodo: number,
  tipo: 'mensual' | 'anual',
  opexProyecto: OpexProyectoInput,
  depreciacionPeriodo: number,
  tasaImpuestos: number,
): PeriodoResultados {
  // --- INGRESOS ---
  const ingresosBrutos = combined.ingresos.total;
  const descuentos = 0;
  const devoluciones = 0;
  const ingresosNetos = ingresosBrutos + descuentos + devoluciones;

  // --- COGS (direct costs from activities) ---
  const cogsDirecto = combined.costos.costoVentas;
  const cogsInstructores = combined.costos.profesores;
  const cogsTotal = cogsDirecto + cogsInstructores;
  const cogs = {
    inventarioInicial: 0,
    compras: cogsDirecto * 0.7,
    inventarioFinal: 0,
    costoDirecto: cogsDirecto,
    instructores: cogsInstructores,
    entrenadores: 0,
    total: cogsTotal,
  };

  // --- MARGEN BRUTO ---
  const margenBruto = ingresosNetos - cogsTotal;
  const margenBrutoPorcentaje = ingresosNetos > 0
    ? (margenBruto / ingresosNetos) * 100
    : 0;

  // --- OPEX (project-level, cash only, no depreciation) ---
  const arriendo = opexProyecto.arriendo ?? 0;
  const nomina = opexProyecto.nomina ?? 0;
  const seguros = opexProyecto.seguros ?? 0;
  const serviciosPublicos = opexProyecto.serviciosPublicos ?? 0;
  const marketing = opexProyecto.marketing ?? 0;
  const mantenimiento = opexProyecto.mantenimiento ?? 0;
  const limpieza = opexProyecto.limpieza ?? 0;
  const seguridad = opexProyecto.seguridad ?? 0;
  const contabilidad = opexProyecto.contabilidad ?? 0;
  const legal = opexProyecto.legal ?? 0;
  const tecnologia = opexProyecto.tecnologia ?? 0;
  const comisiones = opexProyecto.comisiones ?? 0;
  const otros = opexProyecto.otros ?? 0;
  const opexTotal = arriendo + nomina + seguros + serviciosPublicos +
    marketing + mantenimiento + limpieza + seguridad +
    contabilidad + legal + tecnologia + comisiones + otros;

  // --- EBITDA (CRITICAL IDENTITY) ---
  const ebitda = margenBruto - opexTotal;
  const ebitdaPorcentaje = ingresosNetos > 0
    ? (ebitda / ingresosNetos) * 100
    : 0;

  // --- DEPRECIACIÓN (NEVER includes working capital) ---
  const depreciacionTotal = depreciacionPeriodo;
  const depreciacion = {
    actividades: depreciacionTotal * 0.50,
    infraestructura: depreciacionTotal * 0.25,
    obraCivil: depreciacionTotal * 0.15,
    equipamiento: depreciacionTotal * 0.10,
    total: depreciacionTotal,
  };

  // --- EBIT (CRITICAL IDENTITY) ---
  const ebit = ebitda - depreciacionTotal;
  const ebitPorcentaje = ingresosNetos > 0
    ? (ebit / ingresosNetos) * 100
    : 0;

  // --- FINANCIEROS ---
  const financieros = { intereses: 0, otrosGastos: 0, total: 0 };

  // --- IMPUESTOS (never negative) ---
  const utilidadAntesImpuestos = ebit - financieros.total;
  const impuestoValor = Math.max(0, utilidadAntesImpuestos * tasaImpuestos);

  // --- UTILIDAD NETA (CRITICAL IDENTITY) ---
  const utilidadNeta = utilidadAntesImpuestos - impuestoValor;
  const utilidadNetaPorcentaje = ingresosNetos > 0
    ? (utilidadNeta / ingresosNetos) * 100
    : 0;

  // --- VALIDATION ---
  const diffEbitda = Math.abs(ebitda - (margenBruto - opexTotal));
  const diffEbit = Math.abs(ebit - (ebitda - depreciacionTotal));
  if (diffEbitda > 1000) logger.dev(`⚠️ Identidad EBITDA rota en período ${periodo}: diff=${diffEbitda}`);
  if (diffEbit > 1000) logger.dev(`⚠️ Identidad EBIT rota en período ${periodo}: diff=${diffEbit}`);

  return {
    periodo,
    tipo,
    ingresos: {
      reservas: combined.ingresos.reservas,
      membresias: combined.ingresos.membresias,
      pasesDiarios: combined.ingresos.pasesDiarios,
      clases: combined.ingresos.clases,
      complementarios: combined.ingresos.complementarios,
      trafico: combined.ingresos.trafico,
      brutos: ingresosBrutos,
      descuentos,
      devoluciones,
      netos: ingresosNetos,
    },
    cogs,
    margenBruto,
    margenBrutoPorcentaje,
    opex: {
      arriendo, nomina, seguros, serviciosPublicos, marketing,
      mantenimiento, limpieza, seguridad, contabilidad, legal,
      tecnologia, comisiones, otros,
      total: opexTotal,
    },
    ebitda,
    ebitdaPorcentaje,
    depreciacion,
    ebit,
    ebitPorcentaje,
    financieros,
    utilidadAntesImpuestos,
    impuestos: { tasa: tasaImpuestos, valor: impuestoValor },
    utilidadNeta,
    utilidadNetaPorcentaje,
  };
}

// =====================================================
// calcularMesesAno1
// =====================================================

function calcularMesesAno1(
  activities: ActivityConfig[],
  capexTotal: number,
  opexProyecto: OpexProyectoInput,
  depreciacionAnos: number,
  tasaImpuestos: number,
  daysPerMonth: number,
): PeriodoResultados[] {
  const depreciacionMensual = capexTotal / depreciacionAnos / 12;

  return Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const combined = combinarActividades(activities, mes, 1, daysPerMonth);
    return calcularPeriodo(combined, mes, 'mensual', opexProyecto, depreciacionMensual, tasaImpuestos);
  });
}

// =====================================================
// calcularAnos
// =====================================================

function calcularAnos(
  activities: ActivityConfig[],
  capexTotal: number,
  opexProyecto: OpexProyectoInput,
  depreciacionAnos: number,
  tasaImpuestos: number,
  daysPerMonth: number,
): PeriodoResultados[] {
  const depreciacionAnual = capexTotal / depreciacionAnos;

  return Array.from({ length: 5 }, (_, i) => {
    const ano = i + 1;

    // Sum 12 months for each year
    const monthlyResults: CombinedFinancials[] = Array.from({ length: 12 }, (_, m) => {
      return combinarActividades(activities, ano === 1 ? m + 1 : null, ano, daysPerMonth);
    });

    // Aggregate 12 months into annual totals
    const annualCombined: CombinedFinancials = {
      ingresos: {
        reservas: monthlyResults.reduce((s, r) => s + r.ingresos.reservas, 0),
        membresias: monthlyResults.reduce((s, r) => s + r.ingresos.membresias, 0),
        pasesDiarios: monthlyResults.reduce((s, r) => s + r.ingresos.pasesDiarios, 0),
        clases: monthlyResults.reduce((s, r) => s + r.ingresos.clases, 0),
        complementarios: monthlyResults.reduce((s, r) => s + r.ingresos.complementarios, 0),
        trafico: monthlyResults.reduce((s, r) => s + r.ingresos.trafico, 0),
        total: monthlyResults.reduce((s, r) => s + r.ingresos.total, 0),
      },
      costos: {
        profesores: monthlyResults.reduce((s, r) => s + r.costos.profesores, 0),
        costoVentas: monthlyResults.reduce((s, r) => s + r.costos.costoVentas, 0),
      },
    };

    // Annual OPEX = monthly × 12
    const opexAnual: OpexProyectoInput = {};
    for (const key of Object.keys(opexProyecto) as (keyof OpexProyectoInput)[]) {
      opexAnual[key] = (opexProyecto[key] ?? 0) * 12;
    }

    return calcularPeriodo(annualCombined, ano, 'anual', opexAnual, depreciacionAnual, tasaImpuestos);
  });
}

// =====================================================
// calcularMetricas
// =====================================================

function calcularMetricas(anos: PeriodoResultados[]) {
  const ingresosTotal5Anos = anos.reduce((s, a) => s + a.ingresos.netos, 0);
  const ebitdaTotal5Anos = anos.reduce((s, a) => s + a.ebitda, 0);
  const utilidadNetaTotal5Anos = anos.reduce((s, a) => s + a.utilidadNeta, 0);

  const ingresoPromedio = ingresosTotal5Anos / 5;
  const ebitdaPromedio = ebitdaTotal5Anos / 5;
  const margenPromedioEbitda = ingresosTotal5Anos > 0
    ? (ebitdaTotal5Anos / ingresosTotal5Anos) * 100
    : 0;
  const margenPromedioNeto = ingresosTotal5Anos > 0
    ? (utilidadNetaTotal5Anos / ingresosTotal5Anos) * 100
    : 0;

  // Ratios from Year 3 (maturity)
  const ano3 = anos[2];
  const ratios = {
    margenBruto: ano3?.margenBrutoPorcentaje ?? 0,
    margenOperativo: ano3?.ebitdaPorcentaje ?? 0,
    margenNeto: ano3?.utilidadNetaPorcentaje ?? 0,
    ros: ano3?.ingresos.netos > 0
      ? (ano3.utilidadNeta / ano3.ingresos.netos) * 100
      : 0,
    opexSobreIngresos: ano3?.ingresos.netos > 0
      ? (ano3.opex.total / ano3.ingresos.netos) * 100
      : 0,
    arriendoSobreIngresos: ano3?.ingresos.netos > 0
      ? (ano3.opex.arriendo / ano3.ingresos.netos) * 100
      : 0,
    nominaSobreIngresos: ano3?.ingresos.netos > 0
      ? (ano3.opex.nomina / ano3.ingresos.netos) * 100
      : 0,
  };

  return {
    ingresosTotal5Anos, ebitdaTotal5Anos, utilidadNetaTotal5Anos,
    ingresoPromedio, ebitdaPromedio,
    margenPromedioEbitda, margenPromedioNeto,
    ratios,
  };
}

// =====================================================
// calcularComparativo
// =====================================================

function calcularComparativo(anos: PeriodoResultados[]) {
  return anos.map((ano, i) => {
    const anterior = i > 0 ? anos[i - 1] : null;
    return {
      ano: ano.periodo,
      ingresos: ano.ingresos.netos,
      crecimientoIngresos: anterior && anterior.ingresos.netos > 0
        ? ((ano.ingresos.netos - anterior.ingresos.netos) / anterior.ingresos.netos) * 100
        : undefined,
      ebitda: ano.ebitda,
      crecimientoEbitda: anterior && anterior.ebitda > 0
        ? ((ano.ebitda - anterior.ebitda) / anterior.ebitda) * 100
        : undefined,
      margenEbitda: ano.ebitdaPorcentaje,
      utilidadNeta: ano.utilidadNeta,
      crecimientoUtilidadNeta: anterior && anterior.utilidadNeta > 0
        ? ((ano.utilidadNeta - anterior.utilidadNeta) / anterior.utilidadNeta) * 100
        : undefined,
    };
  });
}
