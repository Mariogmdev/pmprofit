/**
 * Centralized activity financial calculations
 * Used by both Constructor and Dashboard for consistent numbers
 */

import { 
  ActivityConfig, 
  DEFAULT_MEMBERSHIP_CONFIG,
  DEFAULT_DAILY_PASS_CONFIG,
  DEFAULT_TRAFFIC_CONFIG,
} from '@/types/activity';

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
  
  // OPEX breakdown
  opexMensual: number;
  opexPersonal: number;
  opexMantenimiento: number;
  opexReposicion: number;
  opexProfesores: number;
  opexCostoVentas: number;
  
  // Calculated metrics
  ebitdaMensual: number;
  margenEbitda: number;
  paybackMeses: number;
  roiAnual: number;
  
  // Operational metrics
  ocupacionPromedio: number;
  totalUsuariosMes: number;
  totalHorasPico: number;
  totalHorasValle: number;
}

/**
 * Calculate all financial metrics for a single activity
 * This is the SINGLE SOURCE OF TRUTH for activity calculations
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
  let weightedTarifa = 0;
  let weightedOcupacion = 0;
  let ingresosHorarios = 0;
  let ingresosComplementarios = 0;
  let ingresosClases = 0;
  let ingresosMembresiasPases = 0;
  let ingresosTrafico = 0;
  let totalUsuariosMes = 0;
  let opexProfesores = 0;
  let opexCostoVentas = 0;

  // Only calculate schedule-based values for reservation model
  if (config.modeloIngreso === 'reserva' || config.modeloIngreso === 'mixto') {
    const schedules = config.horarios || [];
    
    schedules.forEach((s) => {
      const hours = Math.max(0, s.fin - s.inicio);
      if (s.tipo === 'pico') {
        totalHorasPico += hours;
      } else {
        totalHorasValle += hours;
      }
      weightedTarifa += s.tarifa * hours;
      weightedOcupacion += s.ocupacion * hours;
    });
    
    // Calculate hourly income
    schedules.forEach((s) => {
      const hoursPerDay = Math.max(0, s.fin - s.inicio);
      const reservasPerDay = hoursPerDay / duracion;
      const ocupacion = s.ocupacion / 100;
      const reservasPerMonth = reservasPerDay * cantidad * ocupacion * daysPerMonth;
      ingresosHorarios += reservasPerMonth * s.tarifa;
    });

    // Total users calculation for reservations
    const totalHours = totalHorasPico + totalHorasValle;
    const turnosPorDia = duracion > 0 ? totalHours / duracion : 0;
    const ocupacionPromedioCalc = totalHours > 0 ? weightedOcupacion / totalHours : 0;
    const totalReservasMes = turnosPorDia * cantidad * (ocupacionPromedioCalc / 100) * daysPerMonth;
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

  // Metrics
  const ebitdaMensual = ingresosMensuales - opexMensual;
  const margenEbitda = ingresosMensuales > 0 ? (ebitdaMensual / ingresosMensuales) * 100 : 0;
  const paybackMeses = ebitdaMensual > 0 ? Math.ceil(capexTotal / ebitdaMensual) : 999;
  const roiAnual = capexTotal > 0 ? ((ebitdaMensual * 12) / capexTotal) * 100 : 0;

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
    ebitdaMensual,
    margenEbitda,
    paybackMeses,
    roiAnual,
    ocupacionPromedio,
    totalUsuariosMes,
    totalHorasPico,
    totalHorasValle,
  };
}

/**
 * Calculate occupancy target based on schedule types
 */
export function calculateOccupancyTarget(config: ActivityConfig): number {
  const schedules = config.horarios || [];
  if (schedules.length === 0) return 60;
  
  let totalHours = 0;
  let weightedTarget = 0;
  
  schedules.forEach((s) => {
    const hours = Math.max(0, s.fin - s.inicio);
    totalHours += hours;
    // Peak hours have 80% target, valley has 50%
    weightedTarget += hours * (s.tipo === 'pico' ? 80 : 50);
  });
  
  return totalHours > 0 ? weightedTarget / totalHours : 60;
}
