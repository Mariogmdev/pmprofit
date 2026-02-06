/**
 * Centralized activity financial calculations
 * Used by both Constructor and Dashboard for consistent numbers
 * 
 * CRITICAL: All calculations properly weight:
 * - L-V (Lunes-Viernes): 5 days per week
 * - S-D (Sábado-Domingo): 2 days per week
 * - Uses dynamic weeks/month based on project configuration (daysPerMonth/7)
 */

import { 
  ActivityConfig, 
  ActivitySchedule,
  DEFAULT_MEMBERSHIP_CONFIG,
  DEFAULT_DAILY_PASS_CONFIG,
  DEFAULT_TRAFFIC_CONFIG,
} from '@/types/activity';
import { getWeeksPerMonth, WEEKDAYS_LV, WEEKDAYS_SD } from '@/lib/timeHelpers';
import { monthlyFinancialsWithOccupancy } from '@/lib/monthlyFinancials';

export interface ActivityFinancials {
  // Income breakdown
  ingresosMensuales: number;
  ingresosHorarios: number;
  ingresosComplementarios: number;
  ingresosClases: number;
  ingresosMembresiasPases: number;
  ingresosTrafico: number;
  
  // CAPEX breakdown
  capexTotal: number;
  capexConstruccion: number;
  capexEquipamiento: number;
  capexConsumibles: number;
  capexMobiliario: number;
  
  // OPEX breakdown (direct costs only)
  opexMensual: number;
  opexPersonal: number;
  opexMantenimiento: number;
  opexReposicion: number;
  opexProfesores: number;
  opexCostoVentas: number;
  
  /**
   * CONTRIBUTION MARGIN (Margen de Contribución)
   * 
   * IMPORTANT: This is NOT the project's consolidated EBITDA.
   * 
   * Contribution Margin = Activity Revenue - Direct Activity Costs
   * 
   * DOES NOT INCLUDE:
   * - Rent (arrendamiento)
   * - Administrative payroll
   * - Utilities (servicios públicos)
   * - Marketing
   * - Technology
   * - Security
   * - Insurance
   * - General maintenance
   * - Other global overhead
   * 
   * For the complete project EBITDA (with all overhead), see the Dashboard.
   */
  margenContribucionMensual: number;   // Previously: ebitdaMensual
  margenContribucionPorcentaje: number; // Previously: margenEbitda
  paybackActividadMeses: number;       // Previously: paybackMeses
  roiAnual: number;
  
  // Operational metrics
  ocupacionPromedio: number;
  totalUsuariosMes: number;
  totalHorasPico: number;
  totalHorasValle: number;
  
  // Weekly breakdown (for transparency)
  ingresosDiaLV: number;
  ingresosDiaSD: number;
  ingresosSemana: number;
}

/**
 * Calculate income per day for a set of schedules
 * @param schedules - Array of schedules for a specific day type (LV or SD)
 * @param cantidad - Number of courts/units
 * @param duracion - Duration of each reservation in hours
 */
function calculateIngresosPorDia(
  schedules: ActivitySchedule[],
  cantidad: number,
  duracion: number
): { ingresos: number; turnos: number; usuarios: number } {
  let ingresosDia = 0;
  let turnosTotales = 0;
  let usuariosTotales = 0;

  schedules.forEach((horario) => {
    const horas = Math.max(0, horario.fin - horario.inicio);
    const turnosPorUnidad = duracion > 0 ? horas / duracion : 0;
    const turnosDisponibles = turnosPorUnidad * cantidad;
    const turnosOcupados = turnosDisponibles * (horario.ocupacion / 100);
    const ingresosHorario = turnosOcupados * horario.tarifa;
    
    ingresosDia += ingresosHorario;
    turnosTotales += turnosOcupados;
  });

  return {
    ingresos: ingresosDia,
    turnos: turnosTotales,
    usuarios: usuariosTotales
  };
}

/**
 * Calculate all financial metrics for a single activity
 * This is the SINGLE SOURCE OF TRUTH for activity calculations
 * 
 * IMPORTANT: Uses proper weekly weighting (5 days L-V, 2 days S-D)
 */
export function calculateActivityFinancials(
  config: ActivityConfig,
  daysPerMonth: number = 30,
  totalClubUsersFromOtherActivities: number = 0
): ActivityFinancials {
  const cantidad = config.cantidad || 1;
  const duracion = config.duracionReserva || 1.5;
  const jugadores = config.jugadoresPorReserva || 4;

  // Initialize values
  let totalHorasPico = 0;
  let totalHorasValle = 0;
  let weightedOcupacion = 0;
  let ingresosHorarios = 0;
  let ingresosComplementarios = 0;
  let ingresosClases = 0;
  let ingresosMembresiasPases = 0;
  let ingresosTrafico = 0;
  let totalUsuariosMes = 0;
  let opexProfesores = 0;
  let opexCostoVentas = 0;
  
  // Weekly breakdown
  let ingresosDiaLV = 0;
  let ingresosDiaSD = 0;
  let ingresosSemana = 0;

  // Only calculate schedule-based values for reservation model
  if (config.modeloIngreso === 'reserva' || config.modeloIngreso === 'mixto') {
    const schedules = config.horarios || [];
    
    // Separate schedules by day type
    const horariosLV = schedules.filter(h => h.diaSemana === 'LV' || !h.diaSemana);
    const horariosSD = schedules.filter(h => h.diaSemana === 'SD');
    
    // Calculate totals for summary - WEIGHTED by days per week
    // L-V: 5 days, S-D: 2 days
    horariosLV.forEach((s) => {
      const hours = Math.max(0, s.fin - s.inicio);
      const weightedHours = hours * WEEKDAYS_LV; // 5 days
      if (s.tipo === 'pico') {
        totalHorasPico += weightedHours;
      } else {
        totalHorasValle += weightedHours;
      }
      weightedOcupacion += s.ocupacion * weightedHours;
    });
    
    horariosSD.forEach((s) => {
      const hours = Math.max(0, s.fin - s.inicio);
      const weightedHours = hours * WEEKDAYS_SD; // 2 days
      if (s.tipo === 'pico') {
        totalHorasPico += weightedHours;
      } else {
        totalHorasValle += weightedHours;
      }
      weightedOcupacion += s.ocupacion * weightedHours;
    });
    
    // Calculate income per day for L-V (Lunes-Viernes)
    const resultLV = calculateIngresosPorDia(horariosLV, cantidad, duracion);
    ingresosDiaLV = resultLV.ingresos;
    
    // Calculate income per day for S-D (Sábado-Domingo)
    const resultSD = calculateIngresosPorDia(horariosSD, cantidad, duracion);
    ingresosDiaSD = resultSD.ingresos;
    
    // Calculate weekly income (properly weighted)
    ingresosSemana = (ingresosDiaLV * WEEKDAYS_LV) + (ingresosDiaSD * WEEKDAYS_SD);
    
    // Calculate monthly income (dynamic weeks per month based on project config)
    const weeksPerMonth = getWeeksPerMonth(daysPerMonth);
    ingresosHorarios = ingresosSemana * weeksPerMonth;

    // Total users calculation for reservations
    // Calculate turns per day for each day type
    const turnosDiaLV = horariosLV.reduce((sum, h) => {
      const horas = Math.max(0, h.fin - h.inicio);
      const turnosPorUnidad = duracion > 0 ? horas / duracion : 0;
      const turnosDisponibles = turnosPorUnidad * cantidad;
      return sum + turnosDisponibles * (h.ocupacion / 100);
    }, 0);
    
    const turnosDiaSD = horariosSD.reduce((sum, h) => {
      const horas = Math.max(0, h.fin - h.inicio);
      const turnosPorUnidad = duracion > 0 ? horas / duracion : 0;
      const turnosDisponibles = turnosPorUnidad * cantidad;
      return sum + turnosDisponibles * (h.ocupacion / 100);
    }, 0);
    
    // Weekly turns and monthly reservations
    const turnosSemana = (turnosDiaLV * WEEKDAYS_LV) + (turnosDiaSD * WEEKDAYS_SD);
    const weeksPerMonthForTurnos = getWeeksPerMonth(daysPerMonth);
    const totalReservasMes = turnosSemana * weeksPerMonthForTurnos;
    totalUsuariosMes = totalReservasMes * jugadores;
    
    // Complementary income (rentals)
    (config.alquileres || []).forEach((a) => {
      ingresosComplementarios += (totalUsuariosMes * (a.porcentaje / 100) * a.precio);
    });
  }

  // Membership model
  if (config.modeloIngreso === 'membresia' || config.modeloIngreso === 'mixto') {
    const membershipConfig = config.membershipConfig || DEFAULT_MEMBERSHIP_CONFIG;
    ingresosMembresiasPases += membershipConfig.miembrosProyectados[0] * membershipConfig.precioMembresia;
    totalUsuariosMes += membershipConfig.miembrosProyectados[0];
  }

  // Daily pass model
  if (config.modeloIngreso === 'pase-diario' || config.modeloIngreso === 'mixto') {
    const dailyPassConfig = config.dailyPassConfig || DEFAULT_DAILY_PASS_CONFIG;
    ingresosMembresiasPases += dailyPassConfig.pasesProyectadosDia * daysPerMonth * dailyPassConfig.precioPase;
    totalUsuariosMes += dailyPassConfig.pasesProyectadosDia * daysPerMonth;
  }

  // Traffic model
  if (config.modeloIngreso === 'trafico') {
    const trafficConfig = config.trafficConfig || DEFAULT_TRAFFIC_CONFIG;
    
    const usuariosDeportivos = Math.round(totalClubUsersFromOtherActivities * (trafficConfig.porcentajeUsuariosClub / 100));
    const usuariosExternos = trafficConfig.visitantesExternosDia * daysPerMonth;
    const traficoTotal = usuariosDeportivos + usuariosExternos;
    
    if (trafficConfig.modeloOperacion === 'propia') {
      const ingresosBrutos = traficoTotal * trafficConfig.ticketPromedio * trafficConfig.consumosPorPersona;
      opexCostoVentas = ingresosBrutos * (trafficConfig.costoVentas / 100);
      ingresosTrafico = ingresosBrutos - opexCostoVentas;
    } else {
      ingresosTrafico = trafficConfig.ventasOperador * (trafficConfig.comisionConcesion / 100);
      opexCostoVentas = 0;
    }
    
    totalUsuariosMes += traficoTotal;
  }

  // Classes income
  if (config.tieneClases && config.configuracionClases) {
    const classConfig = config.configuracionClases;
    const clasesMes = classConfig.clasesPorDia * daysPerMonth * cantidad;
    
    if (classConfig.modeloCobro === 'por-alumno') {
      const alumnosReales = classConfig.alumnosPorClase * (classConfig.ocupacionClase / 100);
      ingresosClases = clasesMes * alumnosReales * classConfig.precioAlumno;
    } else {
      ingresosClases = clasesMes * classConfig.precioClase;
    }
    
    // Teacher costs
    if (classConfig.modeloProfesor === 'fijo') {
      opexProfesores = classConfig.cantidadProfesores * classConfig.salarioProfesor;
    } else {
      opexProfesores = clasesMes * classConfig.pagoClase;
    }
  }

  // Calculate occupancy average
  const totalHours = totalHorasPico + totalHorasValle;
  const ocupacionPromedio = totalHours > 0 ? weightedOcupacion / totalHours : 0;

  // Total monthly income
  const ingresosMensuales = ingresosHorarios + ingresosComplementarios + ingresosClases + ingresosMembresiasPases + ingresosTrafico;

  // CAPEX calculations
  const tipoCubierta = config.tipoCubierta || 'cubierta';
  const capexPorUnidad = tipoCubierta === 'cubierta' 
    ? (config.capexCubierta || 0)
    : tipoCubierta === 'semicubierta'
      ? (config.capexSemicubierta || 0)
      : (config.capexAireLibre || 0);
  
  const capexConstruccion = capexPorUnidad * cantidad;
  
  const capexEquipamiento = (config.equipamientoEspecifico || []).reduce(
    (sum, e) => sum + ((e.cantidad || 0) * (e.precioUnitario || 0)), 0
  );
  
  const capexConsumibles = (config.consumibles || []).reduce(
    (sum, c) => sum + ((c.cantidad || 0) * (c.precioUnitario || 0)), 0
  );
  
  const capexMobiliario = (config.mobiliario || []).reduce(
    (sum, m) => sum + ((m.cantidad || 0) * (m.precioUnitario || 0)), 0
  );
  
  const capexTotal = capexConstruccion + capexEquipamiento + capexConsumibles + capexMobiliario;

  // OPEX calculations
  const opexPersonal = (config.personal || []).reduce(
    (sum, p) => sum + ((p.cantidad || 0) * (p.salarioMensual || 0)), 0
  );
  
  const opexMantenimientoAnual = (config.mantenimiento || []).reduce(
    (sum, m) => sum + (m.costoAnual || 0), 0
  );
  const opexMantenimiento = opexMantenimientoAnual / 12;
  
  const opexReposicion = capexConsumibles * 0.3 / 12; // 30% annual reposition
  
  // opexCostoVentas is already deducted from ingresosTrafico
  const opexMensual = opexPersonal + opexMantenimiento + opexReposicion + opexProfesores;

  /**
   * CONTRIBUTION MARGIN (Margen de Contribución)
   * 
   * This represents: Activity Revenue - Direct Activity Costs
   * It does NOT include global overhead (rent, admin, utilities, etc.)
   * 
   * For the complete project EBITDA, see the Dashboard metrics.
   */
  const margenContribucionMensual = ingresosMensuales - opexMensual;
  const margenContribucionPorcentaje = ingresosMensuales > 0 
    ? (margenContribucionMensual / ingresosMensuales) * 100 
    : 0;
  const paybackActividadMeses = margenContribucionMensual > 0 
    ? Math.ceil(capexTotal / margenContribucionMensual) 
    : 999;
  const roiAnual = capexTotal > 0 
    ? ((margenContribucionMensual * 12) / capexTotal) * 100 
    : 0;

  return {
    ingresosMensuales,
    ingresosHorarios,
    ingresosComplementarios,
    ingresosClases,
    ingresosMembresiasPases,
    ingresosTrafico,
    capexTotal,
    capexConstruccion,
    capexEquipamiento,
    capexConsumibles,
    capexMobiliario,
    opexMensual,
    opexPersonal,
    opexMantenimiento,
    opexReposicion,
    opexProfesores,
    opexCostoVentas,
    margenContribucionMensual,
    margenContribucionPorcentaje,
    paybackActividadMeses,
    roiAnual,
    ocupacionPromedio,
    totalUsuariosMes,
    totalHorasPico,
    totalHorasValle,
    ingresosDiaLV,
    ingresosDiaSD,
    ingresosSemana,
  };
}

/**
 * Calculate occupancy target based on schedule types
 * 
 * IMPORTANT: Properly weights hours by weekly frequency:
 * - L-V (Weekdays): 5 days/week
 * - S-D (Weekend): 2 days/week
 * 
 * @returns Weighted average target occupancy percentage
 */
export function calculateOccupancyTarget(config: ActivityConfig): number {
  const schedules = config.horarios || [];
  if (schedules.length === 0) return 60;
  
  let totalWeightedHours = 0;
  let weightedTarget = 0;
  
  schedules.forEach((s) => {
    const hoursPerDay = Math.max(0, s.fin - s.inicio);
    
    // Get days per week based on schedule type (L-V = 5, S-D = 2)
    const daysPerWeek = (s.diaSemana === 'SD') ? WEEKDAYS_SD : WEEKDAYS_LV;
    
    // Hours per week for this schedule
    const hoursPerWeek = hoursPerDay * daysPerWeek;
    
    totalWeightedHours += hoursPerWeek;
    // Peak hours have 80% target, valley has 50%
    weightedTarget += hoursPerWeek * (s.tipo === 'pico' ? 80 : 50);
  });
  
  return totalWeightedHours > 0 ? weightedTarget / totalWeightedHours : 60;
}

/**
 * Calculate monthly income for specific pico/valle occupancy percentages
 * CRITICAL: Uses proper weekly weighting (L-V: 5 days, S-D: 2 days)
 * 
 * This function is the SINGLE SOURCE OF TRUTH for income calculations
 * with custom occupancy values (used for projections with maturity curves)
 * 
 * @param daysPerMonth - Days per month from project config (default 30)
 */
export function calculateMonthlyIncomeWithOccupancy(
  config: ActivityConfig,
  picoOcupacion: number,
  valleOcupacion: number,
  daysPerMonth: number = 30
): number {
  const horarios = config.horarios || [];
  const cantidad = config.cantidad || 1;
  const duracion = config.duracionReserva || 1.5;
  const weeksPerMonth = getWeeksPerMonth(daysPerMonth);

  // Separate schedules by day type
  const horariosLV = horarios.filter((h) => h.diaSemana === 'LV' || !h.diaSemana);
  const horariosSD = horarios.filter((h) => h.diaSemana === 'SD');

  let totalIncome = 0;

  // L-V: 5 days per week
  horariosLV.forEach((h) => {
    const horas = Math.max(0, (h.fin || 0) - (h.inicio || 0));
    const turnosHorario = (horas / duracion) * cantidad;
    const ocupacion = h.tipo === 'pico' ? picoOcupacion : valleOcupacion;
    const reservas = turnosHorario * (ocupacion / 100);
    const tarifa = h.tarifa || 0;
    // 5 days/week × dynamic weeks/month
    totalIncome += reservas * tarifa * WEEKDAYS_LV * weeksPerMonth;
  });

  // S-D: 2 days per week
  horariosSD.forEach((h) => {
    const horas = Math.max(0, (h.fin || 0) - (h.inicio || 0));
    const turnosHorario = (horas / duracion) * cantidad;
    const ocupacion = h.tipo === 'pico' ? picoOcupacion : valleOcupacion;
    const reservas = turnosHorario * (ocupacion / 100);
    const tarifa = h.tarifa || 0;
    // 2 days/week × dynamic weeks/month
    totalIncome += reservas * tarifa * WEEKDAYS_SD * weeksPerMonth;
  });

  return totalIncome;
}

/**
 * Calculate Year 1 income using monthly occupation projection
 * Returns the SUM of 12 months (not average)
 * 
 * CRITICAL FIX: Now uses monthlyFinancialsWithOccupancy which includes ALL income components:
 * - Reservations (reservas)
 * - Complementary income (alquileres/rentals)
 * - Classes (clases)
 * - Memberships (membresías)
 * - Daily passes (pases)
 * - Traffic income (tráfico)
 */
export function calculateYear1IncomeFromProjection(
  config: ActivityConfig,
  daysPerMonth: number = 30,
  totalClubUsersFromProject: number = 0
): { totalYear1: number; monthlyAverage: number; months: number[] } {
  // For non-reservation/non-mixed models, use base calculation
  if (!['reserva', 'mixto'].includes(config.modeloIngreso)) {
    const financials = calculateActivityFinancials(config, daysPerMonth, totalClubUsersFromProject);
    const monthlyBase = financials.ingresosMensuales;
    return {
      totalYear1: monthlyBase * 12,
      monthlyAverage: monthlyBase,
      months: Array(12).fill(monthlyBase),
    };
  }

  // For reservation/mixed model with monthly occupation data
  const ocupacionMensual = config.ocupacionMensual;
  
  if (!ocupacionMensual || ocupacionMensual.length === 0) {
    // No monthly data, use base calculation
    const financials = calculateActivityFinancials(config, daysPerMonth, totalClubUsersFromProject);
    const monthlyBase = financials.ingresosMensuales;
    return {
      totalYear1: monthlyBase * 12,
      monthlyAverage: monthlyBase,
      months: Array(12).fill(monthlyBase),
    };
  }

  // Calculate income for each month using centralized function
  // This includes ALL income components: reservations, rentals, classes, memberships, passes, traffic
  const months = ocupacionMensual.map((month) => {
    const financials = monthlyFinancialsWithOccupancy(
      config,
      daysPerMonth,
      month.pico,
      month.valle,
      totalClubUsersFromProject
    );
    return financials.ingresos.total;
  });

  const totalYear1 = months.reduce((sum, m) => sum + m, 0);
  const monthlyAverage = totalYear1 / 12;

  return { totalYear1, monthlyAverage, months };
}
