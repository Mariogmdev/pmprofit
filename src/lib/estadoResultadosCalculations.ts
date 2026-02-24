/**
 * Estado de Resultados (P&L) Calculations
 *
 * ALIGNED WITH DASHBOARD: Uses the SAME projection functions as useDashboardMetrics:
 * - Year 1: calculateYear1MonthlyProjection() for monthly income + COGS
 * - Years 2-5: calculateYearlyProjection() for income scaling with inflation + occupancy growth
 * - OPEX: calculateOpexMensual() from opexCalculations.ts (shared engine)
 *
 * This ensures P&L numbers match the "Proyección Financiera" table in the Resumen tab.
 */

import {
  EstadoResultados,
  PeriodoResultados,
} from '@/types/estadoResultados';
import {
  calculateYear1MonthlyProjection,
  MonthlyFinancialsResult,
} from '@/lib/monthlyFinancials';
import { calculateYearlyProjection } from '@/lib/projectionCalculations';
import { calculateActivityFinancials } from '@/lib/activityCalculations';
import { ActivityConfig } from '@/types/activity';
import { ProjectOpex } from '@/types/opex';
import { calculateOpexMensual, OpexBreakdown } from '@/lib/opexCalculations';
import { logger } from '@/lib/logger';

// =====================================================
// MAIN EXPORT
// =====================================================

export function calculateEstadoResultados(
  projectId: string,
  activities: { id: string; name: string; config: ActivityConfig }[],
  projectOpex: ProjectOpex,
  capexTotal: number,
  workingCapital: number,
  tasaImpuestos: number = 0.35,
  depreciacionAnos: number = 10,
  daysPerMonth: number = 30,
  inflationRate: number = 3,
): EstadoResultados {
  // ── Step 1: Calculate Year 1 monthly data (same as dashboard) ──
  const year1Data = calculateYear1Monthly(activities, daysPerMonth);

  // ── Step 2: Calculate ocupacionPromedio (same as dashboard) ──
  const ocupacionPromedio = calculateWeightedOccupancyFromActivities(activities, daysPerMonth);

  // ── Step 3: Build 5-year projection using SAME engine as dashboard ──
  const yearlyProjection = calculateYearlyProjection(
    year1Data.totalYear1Income, // Annual Year 1 income
    ocupacionPromedio,           // Year 1 average occupancy
    5,                           // Crecimiento ocupación 5%/año (same as dashboard)
    inflationRate,               // From project config
    5,                           // 5 years
  );

  // ── Step 4: Calculate COGS ratio from Year 1 (month 12 = maturity) ──
  const year1Month12 = year1Data.months[11];
  const cogsRatio = year1Month12.totalIncome > 0
    ? year1Month12.totalCogs / year1Month12.totalIncome
    : 0;
  const profesoresRatio = year1Month12.totalIncome > 0
    ? year1Month12.profesores / year1Month12.totalIncome
    : 0;
  const costoVentasRatio = year1Month12.totalIncome > 0
    ? year1Month12.costoVentas / year1Month12.totalIncome
    : 0;

  // ── Step 5: Build P&L periods ──
  const meses = buildYear1Months(year1Data, projectOpex, activities, capexTotal, depreciacionAnos, tasaImpuestos, daysPerMonth);
  const anos = buildAnnualPeriods(
    year1Data, yearlyProjection, projectOpex, activities,
    capexTotal, depreciacionAnos, tasaImpuestos, daysPerMonth,
    cogsRatio, profesoresRatio, costoVentasRatio,
  );

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
// Year 1 monthly aggregation (same as dashboard)
// =====================================================

interface AggregatedMonth {
  reservas: number;
  membresias: number;
  pasesDiarios: number;
  clases: number;
  complementarios: number;
  trafico: number;
  totalIncome: number;
  profesores: number;
  costoVentas: number;
  totalCogs: number;
}

interface Year1AggregatedData {
  months: AggregatedMonth[];
  totalYear1Income: number;
  incomeBreakdownYear1: {
    reservas: number;
    membresias: number;
    pasesDiarios: number;
    clases: number;
    complementarios: number;
    trafico: number;
  };
}

function calculateYear1Monthly(
  activities: { id: string; config: ActivityConfig }[],
  daysPerMonth: number,
): Year1AggregatedData {
  // Pre-calculate total club users (same logic as dashboard)
  const nonTrafficActivities = activities.filter(a => a.config.modeloIngreso !== 'trafico');
  let totalClubUsers = 0;
  nonTrafficActivities.forEach(a => {
    const financials = calculateActivityFinancials(a.config, daysPerMonth, 0);
    totalClubUsers += financials.totalUsuariosMes;
  });

  // Get Year 1 monthly projection per activity (SAME function as dashboard)
  const activityProjections = activities.map(act => {
    return calculateYear1MonthlyProjection(
      act.config,
      daysPerMonth,
      act.config.modeloIngreso === 'trafico' ? totalClubUsers : 0,
    );
  });

  // Aggregate across activities per month
  const months: AggregatedMonth[] = Array.from({ length: 12 }, (_, i) => {
    let reservas = 0, membresias = 0, pasesDiarios = 0, clases = 0, complementarios = 0, trafico = 0;
    let profesores = 0, costoVentas = 0;

    activityProjections.forEach(proj => {
      const m = proj.months[i];
      reservas += m.ingresos.reservas;
      membresias += m.ingresos.membresias;
      pasesDiarios += m.ingresos.pases;
      clases += m.ingresos.clases;
      complementarios += m.ingresos.complementarios;
      trafico += m.ingresos.trafico;
      profesores += m.costos.profesores;
      costoVentas += m.costos.costoVentas;
    });

    const totalIncome = reservas + membresias + pasesDiarios + clases + complementarios + trafico;
    return {
      reservas, membresias, pasesDiarios, clases, complementarios, trafico,
      totalIncome,
      profesores, costoVentas,
      totalCogs: profesores + costoVentas,
    };
  });

  const totalYear1Income = months.reduce((s, m) => s + m.totalIncome, 0);

  const incomeBreakdownYear1 = {
    reservas: months.reduce((s, m) => s + m.reservas, 0),
    membresias: months.reduce((s, m) => s + m.membresias, 0),
    pasesDiarios: months.reduce((s, m) => s + m.pasesDiarios, 0),
    clases: months.reduce((s, m) => s + m.clases, 0),
    complementarios: months.reduce((s, m) => s + m.complementarios, 0),
    trafico: months.reduce((s, m) => s + m.trafico, 0),
  };

  return { months, totalYear1Income, incomeBreakdownYear1 };
}

// =====================================================
// Weighted occupancy (same logic as dashboard)
// =====================================================

function calculateWeightedOccupancyFromActivities(
  activities: { id: string; config: ActivityConfig }[],
  daysPerMonth: number,
): number {
  let ocupacionTotal = 0;
  let horasTotal = 0;

  activities.forEach(act => {
    const financials = calculateActivityFinancials(act.config, daysPerMonth, 0);
    const totalHours = financials.totalHorasPico + financials.totalHorasValle;
    if (totalHours > 0) {
      ocupacionTotal += financials.ocupacionPromedio * totalHours;
      horasTotal += totalHours;
    }
  });

  return horasTotal > 0 ? ocupacionTotal / horasTotal : 0;
}

// =====================================================
// Build Year 1 monthly P&L periods
// =====================================================

function buildYear1Months(
  year1Data: Year1AggregatedData,
  projectOpex: ProjectOpex,
  activities: { id: string; config: ActivityConfig }[],
  capexTotal: number,
  depreciacionAnos: number,
  tasaImpuestos: number,
  daysPerMonth: number,
): PeriodoResultados[] {
  const depreciacionMensual = capexTotal / depreciacionAnos / 12;

  return year1Data.months.map((month, i) => {
    const opex = calculateOpexMensual({
      projectOpex,
      activities,
      ingresosBrutos: month.totalIncome,
      capexParaDepreciacion: capexTotal,
      daysPerMonth,
    });

    return buildPeriodo(month, i + 1, 'mensual', opex, depreciacionMensual, tasaImpuestos);
  });
}

// =====================================================
// Build annual P&L periods (aligned with dashboard)
// =====================================================

function buildAnnualPeriods(
  year1Data: Year1AggregatedData,
  yearlyProjection: ReturnType<typeof calculateYearlyProjection>,
  projectOpex: ProjectOpex,
  activities: { id: string; config: ActivityConfig }[],
  capexTotal: number,
  depreciacionAnos: number,
  tasaImpuestos: number,
  daysPerMonth: number,
  cogsRatio: number,
  profesoresRatio: number,
  costoVentasRatio: number,
): PeriodoResultados[] {
  const depreciacionAnual = capexTotal / depreciacionAnos;

  return yearlyProjection.map((yearData, i) => {
    const ano = yearData.year;
    const ingresosAnuales = yearData.ingresoAnual;
    const ingresosMensuales = yearData.ingresoMensual;

    let annualMonth: AggregatedMonth;

    if (ano === 1) {
      // Year 1: Sum actual monthly data
      annualMonth = {
        reservas: year1Data.incomeBreakdownYear1.reservas,
        membresias: year1Data.incomeBreakdownYear1.membresias,
        pasesDiarios: year1Data.incomeBreakdownYear1.pasesDiarios,
        clases: year1Data.incomeBreakdownYear1.clases,
        complementarios: year1Data.incomeBreakdownYear1.complementarios,
        trafico: year1Data.incomeBreakdownYear1.trafico,
        totalIncome: year1Data.totalYear1Income,
        profesores: year1Data.months.reduce((s, m) => s + m.profesores, 0),
        costoVentas: year1Data.months.reduce((s, m) => s + m.costoVentas, 0),
        totalCogs: year1Data.months.reduce((s, m) => s + m.totalCogs, 0),
      };
    } else {
      // Years 2-5: Scale income from projection, COGS proportional to Year 1 maturity ratio
      const year1Ratio = year1Data.totalYear1Income > 0 ? ingresosAnuales / year1Data.totalYear1Income : 1;
      annualMonth = {
        reservas: year1Data.incomeBreakdownYear1.reservas * year1Ratio,
        membresias: year1Data.incomeBreakdownYear1.membresias * year1Ratio,
        pasesDiarios: year1Data.incomeBreakdownYear1.pasesDiarios * year1Ratio,
        clases: year1Data.incomeBreakdownYear1.clases * year1Ratio,
        complementarios: year1Data.incomeBreakdownYear1.complementarios * year1Ratio,
        trafico: year1Data.incomeBreakdownYear1.trafico * year1Ratio,
        totalIncome: ingresosAnuales,
        profesores: ingresosAnuales * profesoresRatio,
        costoVentas: ingresosAnuales * costoVentasRatio,
        totalCogs: ingresosAnuales * cogsRatio,
      };
    }

    // OPEX: Use monthly average income for this year (same as dashboard)
    const opexMensual = calculateOpexMensual({
      projectOpex,
      activities,
      ingresosBrutos: ingresosMensuales,
      capexParaDepreciacion: capexTotal,
      daysPerMonth,
    });

    // Scale OPEX to annual
    const opexAnual: OpexBreakdown = {
      ...opexMensual,
      nomina: opexMensual.nomina * 12,
      arriendo: opexMensual.arriendo * 12,
      seguros: opexMensual.seguros * 12,
      serviciosPublicos: opexMensual.serviciosPublicos * 12,
      marketing: opexMensual.marketing * 12,
      mantenimiento: opexMensual.mantenimiento * 12,
      seguridad: opexMensual.seguridad * 12,
      tecnologia: opexMensual.tecnologia * 12,
      administrativos: opexMensual.administrativos * 12,
      gastosFinancieros: opexMensual.gastosFinancieros * 12,
      impuestos: opexMensual.impuestos * 12,
      comisiones: opexMensual.comisiones * 12,
      otros: opexMensual.otros * 12,
      depreciacion: opexMensual.depreciacion * 12,
      opexCaja: opexMensual.opexCaja * 12,
      opexTotal: opexMensual.opexTotal * 12,
    };

    return buildPeriodo(annualMonth, ano, 'anual', opexAnual, depreciacionAnual, tasaImpuestos);
  });
}

// =====================================================
// buildPeriodo — shared P&L construction
// =====================================================

function buildPeriodo(
  data: AggregatedMonth,
  periodo: number,
  tipo: 'mensual' | 'anual',
  opex: OpexBreakdown,
  depreciacionPeriodo: number,
  tasaImpuestos: number,
): PeriodoResultados {
  const ingresosBrutos = data.totalIncome;
  const descuentos = 0;
  const devoluciones = 0;
  const ingresosNetos = ingresosBrutos + descuentos + devoluciones;

  // --- COGS ---
  const cogsTotal = data.totalCogs;
  const cogs = {
    inventarioInicial: 0,
    compras: data.costoVentas * 0.7,
    inventarioFinal: 0,
    costoDirecto: data.costoVentas,
    instructores: data.profesores,
    entrenadores: 0,
    total: cogsTotal,
  };

  // --- MARGEN BRUTO ---
  const margenBruto = ingresosNetos - cogsTotal;
  const margenBrutoPorcentaje = ingresosNetos > 0 ? (margenBruto / ingresosNetos) * 100 : 0;

  // --- OPEX (cash, sin depreciación) ---
  const opexTotal = opex.opexCaja;

  // --- EBITDA ---
  const ebitda = margenBruto - opexTotal;
  const ebitdaPorcentaje = ingresosNetos > 0 ? (ebitda / ingresosNetos) * 100 : 0;

  // --- DEPRECIACIÓN ---
  const depreciacion = {
    actividades: depreciacionPeriodo * 0.50,
    infraestructura: depreciacionPeriodo * 0.25,
    obraCivil: depreciacionPeriodo * 0.15,
    equipamiento: depreciacionPeriodo * 0.10,
    total: depreciacionPeriodo,
  };

  // --- EBIT ---
  const ebit = ebitda - depreciacionPeriodo;
  const ebitPorcentaje = ingresosNetos > 0 ? (ebit / ingresosNetos) * 100 : 0;

  // --- FINANCIEROS ---
  const financieros = { intereses: 0, otrosGastos: 0, total: 0 };

  // --- IMPUESTOS ---
  const utilidadAntesImpuestos = ebit - financieros.total;
  const impuestoValor = Math.max(0, utilidadAntesImpuestos * tasaImpuestos);

  // --- UTILIDAD NETA ---
  const utilidadNeta = utilidadAntesImpuestos - impuestoValor;
  const utilidadNetaPorcentaje = ingresosNetos > 0 ? (utilidadNeta / ingresosNetos) * 100 : 0;

  // --- VALIDATION ---
  const diffEbitda = Math.abs(ebitda - (margenBruto - opexTotal));
  const diffEbit = Math.abs(ebit - (ebitda - depreciacionPeriodo));
  if (diffEbitda > 1000) logger.dev(`⚠️ Identidad EBITDA rota en período ${periodo}: diff=${diffEbitda}`);
  if (diffEbit > 1000) logger.dev(`⚠️ Identidad EBIT rota en período ${periodo}: diff=${diffEbit}`);

  return {
    periodo,
    tipo,
    ingresos: {
      reservas: data.reservas,
      membresias: data.membresias,
      pasesDiarios: data.pasesDiarios,
      clases: data.clases,
      complementarios: data.complementarios,
      trafico: data.trafico,
      brutos: ingresosBrutos,
      descuentos,
      devoluciones,
      netos: ingresosNetos,
    },
    cogs,
    margenBruto,
    margenBrutoPorcentaje,
    opex: {
      arriendo: opex.arriendo,
      nomina: opex.nomina,
      seguros: opex.seguros,
      serviciosPublicos: opex.serviciosPublicos,
      marketing: opex.marketing,
      mantenimiento: opex.mantenimiento,
      limpieza: 0,
      seguridad: opex.seguridad,
      contabilidad: 0,
      legal: 0,
      tecnologia: opex.tecnologia,
      comisiones: opex.comisiones,
      otros: opex.otros + opex.administrativos + opex.gastosFinancieros + opex.impuestos,
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
// calcularMetricas
// =====================================================

function calcularMetricas(anos: PeriodoResultados[]) {
  const ingresosTotal5Anos = anos.reduce((s, a) => s + a.ingresos.netos, 0);
  const ebitdaTotal5Anos = anos.reduce((s, a) => s + a.ebitda, 0);
  const utilidadNetaTotal5Anos = anos.reduce((s, a) => s + a.utilidadNeta, 0);

  const ingresoPromedio = ingresosTotal5Anos / 5;
  const ebitdaPromedio = ebitdaTotal5Anos / 5;
  const margenPromedioEbitda = ingresosTotal5Anos > 0
    ? (ebitdaTotal5Anos / ingresosTotal5Anos) * 100 : 0;
  const margenPromedioNeto = ingresosTotal5Anos > 0
    ? (utilidadNetaTotal5Anos / ingresosTotal5Anos) * 100 : 0;

  const ano3 = anos[2];
  const ratios = {
    margenBruto: ano3?.margenBrutoPorcentaje ?? 0,
    margenOperativo: ano3?.ebitdaPorcentaje ?? 0,
    margenNeto: ano3?.utilidadNetaPorcentaje ?? 0,
    ros: ano3?.ingresos.netos > 0 ? (ano3.utilidadNeta / ano3.ingresos.netos) * 100 : 0,
    opexSobreIngresos: ano3?.ingresos.netos > 0 ? (ano3.opex.total / ano3.ingresos.netos) * 100 : 0,
    arriendoSobreIngresos: ano3?.ingresos.netos > 0 ? (ano3.opex.arriendo / ano3.ingresos.netos) * 100 : 0,
    nominaSobreIngresos: ano3?.ingresos.netos > 0 ? (ano3.opex.nomina / ano3.ingresos.netos) * 100 : 0,
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
