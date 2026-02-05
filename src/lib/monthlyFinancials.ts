/**
 * Centralized Monthly Financials Calculator
 * 
 * Calculates monthly income INCLUDING ALL COMPONENTS with custom occupancy.
 * Used for Year 1 projections where each month has different occupancy.
 * 
 * CRITICAL: This function includes ALL income streams:
 * - Reservas (schedule-based hourly income)
 * - Complementarios (rentals based on users)
 * - Clases (class income)
 * - Membresías (membership fees)
 * - Pases (daily passes)
 * - Tráfico (F&B/retail traffic-based income)
 * 
 * Uses proper weekly weighting (L-V: 5 days, S-D: 2 days)
 */

import { 
  ActivityConfig,
  DEFAULT_MEMBERSHIP_CONFIG,
  DEFAULT_DAILY_PASS_CONFIG,
  DEFAULT_TRAFFIC_CONFIG,
} from '@/types/activity';
import { getWeeksPerMonth, WEEKDAYS_LV, WEEKDAYS_SD } from '@/lib/timeHelpers';
import { logger } from '@/lib/logger';

export interface MonthlyFinancialsResult {
  ingresos: {
    reservas: number;
    complementarios: number;
    clases: number;
    membresias: number;
    pases: number;
    trafico: number;
    total: number;
  };
  usuarios: number;
  ocupacion: {
    pico: number;
    valle: number;
    promedio: number;
  };
  // Cost breakdown for EBITDA calculation
  costos: {
    profesores: number;
    costoVentas: number;
  };
}

/**
 * Calculate all monthly financials with custom occupancy
 * 
 * @param config Activity configuration
 * @param daysPerMonth Days per month from project config
 * @param occupancyPico Custom peak occupancy percentage (0-100)
 * @param occupancyValle Custom valley occupancy percentage (0-100)
 * @param totalClubUsersFromOtherActivities Total users from other activities (for traffic model)
 * @returns Complete monthly financial breakdown
 */
export function monthlyFinancialsWithOccupancy(
  config: ActivityConfig,
  daysPerMonth: number = 30,
  occupancyPico: number,
  occupancyValle: number,
  totalClubUsersFromOtherActivities: number = 0
): MonthlyFinancialsResult {
  const weeksPerMonth = getWeeksPerMonth(daysPerMonth);
  const cantidad = config.cantidad || 1;
  const duracion = config.duracionReserva || 1.5;
  const jugadores = config.jugadoresPorReserva || 4;
  const modeloIngreso = config.modeloIngreso;

  logger.dev('=== monthlyFinancialsWithOccupancy ===');
  logger.dev('Model:', modeloIngreso);
  logger.dev('Occupancy Pico/Valle:', occupancyPico, '/', occupancyValle);

  // Initialize values
  let ingresosReservas = 0;
  let ingresosComplementarios = 0;
  let ingresosClases = 0;
  let ingresosMembresias = 0;
  let ingresosPases = 0;
  let ingresosTrafico = 0;
  let totalUsuariosMes = 0;
  let opexProfesores = 0;
  let opexCostoVentas = 0;

  // ============================================================
  // 1. RESERVATION INCOME (for 'reserva' and 'mixto' models)
  // ============================================================
  if (modeloIngreso === 'reserva' || modeloIngreso === 'mixto') {
    const horarios = config.horarios || [];
    const horariosLV = horarios.filter(h => h.diaSemana === 'LV' || !h.diaSemana);
    const horariosSD = horarios.filter(h => h.diaSemana === 'SD');

    // Calculate L-V income
    horariosLV.forEach(h => {
      const horas = Math.max(0, h.fin - h.inicio);
      const turnosPorUnidad = duracion > 0 ? horas / duracion : 0;
      const turnosDisponibles = turnosPorUnidad * cantidad;
      const ocupacion = h.tipo === 'pico' ? occupancyPico : occupancyValle;
      const reservas = turnosDisponibles * (ocupacion / 100);
      // 5 days/week × weeks/month
      ingresosReservas += reservas * h.tarifa * WEEKDAYS_LV * weeksPerMonth;
    });

    // Calculate S-D income
    horariosSD.forEach(h => {
      const horas = Math.max(0, h.fin - h.inicio);
      const turnosPorUnidad = duracion > 0 ? horas / duracion : 0;
      const turnosDisponibles = turnosPorUnidad * cantidad;
      const ocupacion = h.tipo === 'pico' ? occupancyPico : occupancyValle;
      const reservas = turnosDisponibles * (ocupacion / 100);
      // 2 days/week × weeks/month
      ingresosReservas += reservas * h.tarifa * WEEKDAYS_SD * weeksPerMonth;
    });

    // Calculate users from reservations
    const turnosDiaLV = horariosLV.reduce((sum, h) => {
      const horas = Math.max(0, h.fin - h.inicio);
      const turnosPorUnidad = duracion > 0 ? horas / duracion : 0;
      const turnosDisponibles = turnosPorUnidad * cantidad;
      const ocupacion = h.tipo === 'pico' ? occupancyPico : occupancyValle;
      return sum + turnosDisponibles * (ocupacion / 100);
    }, 0);

    const turnosDiaSD = horariosSD.reduce((sum, h) => {
      const horas = Math.max(0, h.fin - h.inicio);
      const turnosPorUnidad = duracion > 0 ? horas / duracion : 0;
      const turnosDisponibles = turnosPorUnidad * cantidad;
      const ocupacion = h.tipo === 'pico' ? occupancyPico : occupancyValle;
      return sum + turnosDisponibles * (ocupacion / 100);
    }, 0);

    const turnosSemana = (turnosDiaLV * WEEKDAYS_LV) + (turnosDiaSD * WEEKDAYS_SD);
    const totalReservasMes = turnosSemana * weeksPerMonth;
    const usuariosReservas = totalReservasMes * jugadores;
    totalUsuariosMes += usuariosReservas;

    // ============================================================
    // 2. COMPLEMENTARY INCOME (rentals based on users)
    // ============================================================
    (config.alquileres || []).forEach(a => {
      ingresosComplementarios += (usuariosReservas * (a.porcentaje / 100) * a.precio);
    });
  }

  // ============================================================
  // 3. MEMBERSHIP INCOME (for 'membresia' and 'mixto' models)
  // ============================================================
  if (modeloIngreso === 'membresia' || modeloIngreso === 'mixto') {
    const membershipConfig = config.membershipConfig || DEFAULT_MEMBERSHIP_CONFIG;
    ingresosMembresias = membershipConfig.miembrosProyectados[0] * membershipConfig.precioMembresia;
    totalUsuariosMes += membershipConfig.miembrosProyectados[0];
  }

  // ============================================================
  // 4. DAILY PASS INCOME (for 'pase-diario' and 'mixto' models)
  // ============================================================
  if (modeloIngreso === 'pase-diario' || modeloIngreso === 'mixto') {
    const dailyPassConfig = config.dailyPassConfig || DEFAULT_DAILY_PASS_CONFIG;
    ingresosPases = dailyPassConfig.pasesProyectadosDia * daysPerMonth * dailyPassConfig.precioPase;
    totalUsuariosMes += dailyPassConfig.pasesProyectadosDia * daysPerMonth;
  }

  // ============================================================
  // 5. TRAFFIC INCOME (for 'trafico' model - F&B, retail)
  // ============================================================
  if (modeloIngreso === 'trafico') {
    const trafficConfig = config.trafficConfig || DEFAULT_TRAFFIC_CONFIG;
    
    const usuariosDeportivos = Math.round(
      totalClubUsersFromOtherActivities * (trafficConfig.porcentajeUsuariosClub / 100)
    );
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

  // ============================================================
  // 6. CLASSES INCOME
  // ============================================================
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

  // ============================================================
  // 7. TOTAL & WEIGHTED OCCUPANCY
  // ============================================================
  const totalIngresos = 
    ingresosReservas + 
    ingresosComplementarios + 
    ingresosClases + 
    ingresosMembresias + 
    ingresosPases + 
    ingresosTrafico;

  // Calculate weighted occupancy based on schedule hours
  const ocupacionPromedio = calculateWeightedOccupancy(config, occupancyPico, occupancyValle);

  logger.dev('Income breakdown:');
  logger.dev('  Reservas:', ingresosReservas);
  logger.dev('  Complementarios:', ingresosComplementarios);
  logger.dev('  Clases:', ingresosClases);
  logger.dev('  Membresías:', ingresosMembresias);
  logger.dev('  Pases:', ingresosPases);
  logger.dev('  Tráfico:', ingresosTrafico);
  logger.dev('  TOTAL:', totalIngresos);

  return {
    ingresos: {
      reservas: ingresosReservas,
      complementarios: ingresosComplementarios,
      clases: ingresosClases,
      membresias: ingresosMembresias,
      pases: ingresosPases,
      trafico: ingresosTrafico,
      total: totalIngresos,
    },
    usuarios: totalUsuariosMes,
    ocupacion: {
      pico: occupancyPico,
      valle: occupancyValle,
      promedio: ocupacionPromedio,
    },
    costos: {
      profesores: opexProfesores,
      costoVentas: opexCostoVentas,
    },
  };
}

/**
 * Calculate weighted average occupancy based on schedule hours
 * 
 * IMPORTANT: Properly weights hours by weekly frequency:
 * - L-V (Weekdays): 5 days/week
 * - S-D (Weekend): 2 days/week
 */
function calculateWeightedOccupancy(
  config: ActivityConfig,
  picoOcupacion: number,
  valleOcupacion: number
): number {
  const horarios = config.horarios || [];
  if (horarios.length === 0) return (picoOcupacion + valleOcupacion) / 2;

  let totalWeightedHours = 0;
  let weightedOccupancy = 0;

  horarios.forEach(h => {
    const hoursPerDay = Math.max(0, h.fin - h.inicio);
    const daysPerWeek = h.diaSemana === 'SD' ? WEEKDAYS_SD : WEEKDAYS_LV;
    const hoursPerWeek = hoursPerDay * daysPerWeek;

    const ocupacion = h.tipo === 'pico' ? picoOcupacion : valleOcupacion;

    totalWeightedHours += hoursPerWeek;
    weightedOccupancy += hoursPerWeek * ocupacion;
  });

  return totalWeightedHours > 0 ? weightedOccupancy / totalWeightedHours : (picoOcupacion + valleOcupacion) / 2;
}

/**
 * Calculate Year 1 projection using monthly occupation data
 * Returns detailed breakdown for each month
 * 
 * @param config Activity configuration
 * @param daysPerMonth Days per month from project config
 * @param totalClubUsersFromOtherActivities Total users for traffic calculations
 * @returns Array of 12 monthly financial results plus summary
 */
export function calculateYear1MonthlyProjection(
  config: ActivityConfig,
  daysPerMonth: number = 30,
  totalClubUsersFromOtherActivities: number = 0
): {
  months: MonthlyFinancialsResult[];
  totalYear1: number;
  monthlyAverage: number;
  totalsByComponent: {
    reservas: number;
    complementarios: number;
    clases: number;
    membresias: number;
    pases: number;
    trafico: number;
  };
} {
  const ocupacionMensual = config.ocupacionMensual;

  // Default to using Year 1 annual occupation if no monthly data
  const defaultOccupation = config.ocupacionAnual?.[0] || { pico: 60, valle: 30 };

  const months: MonthlyFinancialsResult[] = [];
  const totals = {
    reservas: 0,
    complementarios: 0,
    clases: 0,
    membresias: 0,
    pases: 0,
    trafico: 0,
  };

  for (let i = 0; i < 12; i++) {
    const monthOccupation = ocupacionMensual?.[i] || {
      mes: i + 1,
      pico: defaultOccupation.pico,
      valle: defaultOccupation.valle,
    };

    const result = monthlyFinancialsWithOccupancy(
      config,
      daysPerMonth,
      monthOccupation.pico,
      monthOccupation.valle,
      totalClubUsersFromOtherActivities
    );

    months.push(result);

    // Accumulate totals
    totals.reservas += result.ingresos.reservas;
    totals.complementarios += result.ingresos.complementarios;
    totals.clases += result.ingresos.clases;
    totals.membresias += result.ingresos.membresias;
    totals.pases += result.ingresos.pases;
    totals.trafico += result.ingresos.trafico;
  }

  const totalYear1 = months.reduce((sum, m) => sum + m.ingresos.total, 0);
  const monthlyAverage = totalYear1 / 12;

  return {
    months,
    totalYear1,
    monthlyAverage,
    totalsByComponent: totals,
  };
}
