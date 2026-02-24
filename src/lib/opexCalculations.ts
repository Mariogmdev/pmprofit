/**
 * Standalone OPEX Calculation Engine
 *
 * Extracted from useDashboardMetrics so it can be reused by:
 * - Dashboard metrics (useDashboardMetrics.ts)
 * - Estado de Resultados / P&L (estadoResultadosCalculations.ts)
 *
 * SINGLE SOURCE OF TRUTH for all OPEX calculations.
 */

import { ProjectOpex, ServiceItem, RentCalculationBase } from '@/types/opex';
import { ActivityConfig } from '@/types/activity';

// =====================================================
// Input / Output types
// =====================================================

export interface OpexCalculationInput {
  projectOpex: ProjectOpex;
  activities: { id: string; config: ActivityConfig }[];
  ingresosBrutos: number;
  ingresosNetos?: number;          // defaults to ingresosBrutos * 0.85
  ingresosOperacionales?: number;  // defaults to ingresosBrutos
  capexParaDepreciacion: number;
  daysPerMonth?: number;           // defaults to 30
}

export interface OpexBreakdown {
  nomina: number;
  arriendo: number;
  seguros: number;
  serviciosPublicos: number;
  marketing: number;
  mantenimiento: number;
  seguridad: number;
  tecnologia: number;
  administrativos: number;
  gastosFinancieros: number;
  impuestos: number;
  comisiones: number;
  otros: number;
  depreciacion: number;

  /** OPEX sin depreciación — para EBITDA y Working Capital */
  opexCaja: number;
  /** OPEX con depreciación — para EBIT y P&L contable */
  opexTotal: number;
}

// =====================================================
// Main function
// =====================================================

export function calculateOpexMensual(input: OpexCalculationInput): OpexBreakdown {
  const {
    projectOpex: opex,
    activities,
    ingresosBrutos,
    capexParaDepreciacion,
    daysPerMonth = 30,
  } = input;
  const ingresosNetos = input.ingresosNetos ?? ingresosBrutos * 0.85;
  const ingresosOperacionales = input.ingresosOperacionales ?? ingresosBrutos;

  // --- Helper: reservas for "por-reserva" items ---
  const calculateReservasForActivities = (actividadesIncluidas?: string[]) => {
    const toInclude = actividadesIncluidas && actividadesIncluidas.length > 0
      ? activities.filter(a => actividadesIncluidas.includes(a.id))
      : activities;

    return toInclude.reduce((sum, act) => {
      const config: ActivityConfig = act.config;
      const cantidad = config.cantidad || 1;
      const horarios = config.horarios || [];
      const ocupacionPromedio = horarios.length > 0
        ? horarios.reduce((s, h) => s + (h.ocupacion || 0), 0) / horarios.length / 100
        : 0.5;
      const horasOperacion = horarios.reduce((s, h) => s + ((h.fin || 0) - (h.inicio || 0)), 0);
      const reservasPorDia = horasOperacion * ocupacionPromedio / (config.duracionReserva || 1.5);
      return sum + (cantidad * reservasPorDia * daysPerMonth);
    }, 0);
  };

  // --- Helper: category total ---
  const calculateCategoryTotal = (items: ServiceItem[]) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => {
      const tipo = item.tipo || 'fijo';
      if (tipo === 'fijo') {
        return sum + (item.costoMensual || 0);
      } else if (tipo === 'porcentaje-facturacion') {
        return sum + (ingresosBrutos * ((item.porcentaje || 0) / 100));
      } else if (tipo === 'por-reserva') {
        const reservasAplicables = calculateReservasForActivities(item.actividadesIncluidas);
        const reservasConPorcentaje = reservasAplicables * ((item.porcentajeReservas || 100) / 100);
        return sum + ((item.costoPorReserva || 0) * reservasConPorcentaje);
      }
      return sum;
    }, 0);
  };

  // --- Payroll ---
  const nominaActividades = activities.reduce((sum, act) => {
    const personal = act.config.personal || [];
    return sum + personal.reduce((s, p) => s + ((p.cantidad || 0) * (p.salarioMensual || 0)), 0);
  }, 0);

  const mantenimientoActividades = activities.reduce((sum, act) => {
    const mant = act.config.mantenimiento || [];
    const costoAnual = mant.reduce((s, m) => s + (m.costoAnual || 0), 0);
    return sum + (costoAnual / 12);
  }, 0);

  const nominaAdmin = (opex.nomina_administrativa || []).reduce(
    (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0,
  );
  const nominaOperativo = (opex.nomina_operativa || []).reduce(
    (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0,
  );
  const nominaBase = nominaAdmin + nominaOperativo + nominaActividades;
  const prestaciones = nominaBase * ((opex.prestaciones_porcentaje || 53.94) / 100);
  const totalNomina = nominaBase + prestaciones;

  // --- Categories ---
  const serviciosPublicos = calculateCategoryTotal(opex.servicios_publicos || []);
  const marketingTotal = calculateCategoryTotal(opex.marketing || []);
  const tecnologiaTotal = calculateCategoryTotal(opex.tecnologia || []);
  const seguridadTotal = calculateCategoryTotal(opex.seguridad || []);
  const segurosTotal = calculateCategoryTotal(opex.seguros || []);
  const mantenimientoGeneral = calculateCategoryTotal(opex.mantenimiento_general || []);
  const administrativosTotal = calculateCategoryTotal(opex.administrativos || []);
  const otrosGastos = calculateCategoryTotal(opex.otros_gastos || []);

  // --- Financial expenses ---
  let gastosFinancieros = 0;
  if (opex.incluir_4x1000) {
    gastosFinancieros += ingresosBrutos * 0.004;
  }
  gastosFinancieros += (opex.comisiones_bancarias || []).reduce(
    (s, i) => s + (i.costoMensual || 0), 0,
  );
  if (opex.incluir_comision_datafono !== false) {
    gastosFinancieros += ingresosBrutos *
      ((opex.porcentaje_ventas_datafono ?? 70) / 100) *
      ((opex.comision_datafono_porcentaje ?? 2.5) / 100);
  }

  // --- Taxes ---
  let impuestosTotal = 0;
  if (opex.incluir_iva) {
    const ivaCobrado = ingresosBrutos *
      ((opex.porcentaje_ingresos_iva ?? 0) / 100) *
      ((opex.tarifa_iva ?? 19) / 100);
    impuestosTotal += Math.max(0, ivaCobrado - (opex.iva_pagado_estimado ?? 0));
  }
  if (opex.incluir_retenciones) {
    impuestosTotal += (opex.retenciones || []).reduce((s, i) => {
      const base = i.base === 'ingresos' ? ingresosBrutos : ingresosBrutos * 0.3;
      return s + (base * ((i.porcentaje || 0) / 100));
    }, 0);
  }

  // --- Depreciation ---
  const depreciacionAnos = Math.max(1, opex.depreciacion_anos || 10);
  const incluirDepreciacion = opex.incluir_depreciacion !== false;
  const depreciacion = incluirDepreciacion ? (capexParaDepreciacion / depreciacionAnos / 12) : 0;

  // --- OPEX Caja (before rent & commissions) ---
  const opexCajaSinArriendoNiComisiones = totalNomina + serviciosPublicos + marketingTotal +
    tecnologiaTotal + seguridadTotal + segurosTotal + mantenimientoGeneral + mantenimientoActividades +
    administrativosTotal + gastosFinancieros + impuestosTotal + otrosGastos;

  const opexSinArriendoNiComisiones = opexCajaSinArriendoNiComisiones + depreciacion;

  // --- Rent ---
  const calculateRentBase = (base: RentCalculationBase): number => {
    switch (base) {
      case 'ingresos-brutos': return ingresosBrutos;
      case 'ingresos-netos': return ingresosNetos;
      case 'utilidades': return ingresosBrutos - opexSinArriendoNiComisiones;
      case 'ingresos-operacionales': return ingresosOperacionales;
      default: return ingresosBrutos;
    }
  };

  let arrendamiento = 0;
  const modelo = opex.arrendamiento_modelo || 'propio';
  if (modelo === 'fijo') {
    arrendamiento = opex.arrendamiento_fijo || 0;
  } else if (modelo === 'variable') {
    const base = calculateRentBase(opex.arrendamiento_variable_base || 'ingresos-brutos');
    arrendamiento = base * ((opex.arrendamiento_variable_porcentaje || 0) / 100);
  } else if (modelo === 'mixto') {
    const base = calculateRentBase(opex.arrendamiento_mixto_base || 'ingresos-brutos');
    arrendamiento = (opex.arrendamiento_mixto_fijo || 0) +
      base * ((opex.arrendamiento_mixto_porcentaje || 0) / 100);
  }

  const opexSinComisiones = opexSinArriendoNiComisiones + arrendamiento;
  const opexCajaSinComisiones = opexCajaSinArriendoNiComisiones + arrendamiento;
  const utilidadesAntesComisiones = Math.max(0, ingresosBrutos - opexSinComisiones);

  // --- Commissions ---
  const comisionesTotal = (opex.comisiones || []).reduce((sum, com) => {
    let base = ingresosBrutos;
    if (com.base === 'ingresos-netos') base = ingresosNetos;
    if (com.base === 'utilidades') base = utilidadesAntesComisiones;
    return sum + (base * ((com.porcentaje || 0) / 100));
  }, 0);

  const opexTotal = opexSinComisiones + comisionesTotal;
  const opexCaja = opexCajaSinComisiones + comisionesTotal;

  return {
    nomina: totalNomina,
    arriendo: arrendamiento,
    seguros: segurosTotal,
    serviciosPublicos,
    marketing: marketingTotal,
    mantenimiento: mantenimientoGeneral + mantenimientoActividades,
    seguridad: seguridadTotal,
    tecnologia: tecnologiaTotal,
    administrativos: administrativosTotal,
    gastosFinancieros,
    impuestos: impuestosTotal,
    comisiones: comisionesTotal,
    otros: otrosGastos,
    depreciacion,
    opexCaja,
    opexTotal,
  };
}
