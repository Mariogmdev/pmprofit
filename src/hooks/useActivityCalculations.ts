import { useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { 
  ActivityConfig, 
  ActivityCalculations,
  ActivitySchedule,
  DEFAULT_MEMBERSHIP_CONFIG,
  DEFAULT_DAILY_PASS_CONFIG,
  DEFAULT_TRAFFIC_CONFIG,
  DEFAULT_CLASSES_CONFIG,
} from '@/types/activity';

// Constants for weekly calculations - MUST match activityCalculations.ts
const WEEKS_PER_MONTH = 4.33;
const WEEKDAYS_LV = 5; // Lunes - Viernes
const WEEKDAYS_SD = 2; // Sábado - Domingo

/**
 * Calculate income per day for a set of schedules
 * Helper function for proper weekly weighting
 */
function calculateIngresosPorDia(
  schedules: ActivitySchedule[],
  cantidad: number,
  duracion: number
): number {
  let ingresosDia = 0;

  schedules.forEach((horario) => {
    const horas = Math.max(0, horario.fin - horario.inicio);
    const turnosPorUnidad = duracion > 0 ? horas / duracion : 0;
    const turnosDisponibles = turnosPorUnidad * cantidad;
    const turnosOcupados = turnosDisponibles * (horario.ocupacion / 100);
    const ingresosHorario = turnosOcupados * horario.tarifa;
    
    ingresosDia += ingresosHorario;
  });

  return ingresosDia;
}

/**
 * Calculate occupied turns per day for a set of schedules
 */
function calculateTurnosPorDia(
  schedules: ActivitySchedule[],
  cantidad: number,
  duracion: number
): number {
  return schedules.reduce((sum, h) => {
    const horas = Math.max(0, h.fin - h.inicio);
    const turnosPorUnidad = duracion > 0 ? horas / duracion : 0;
    const turnosDisponibles = turnosPorUnidad * cantidad;
    return sum + turnosDisponibles * (h.ocupacion / 100);
  }, 0);
}

export function useActivityCalculations(config: ActivityConfig, totalClubUsersFromProject: number = 0): ActivityCalculations {
  const { currentProject } = useProject();
  
  // Get project operation days per month (default 30)
  const daysPerMonth = currentProject?.days_per_month || 30;

  return useMemo(() => {
    const cantidad = config.cantidad || 1;
    const duracion = config.duracionReserva || 1.5;
    const jugadores = config.jugadoresPorReserva || 4;

    // Initialize all calculation values
    let totalHorasPico = 0;
    let totalHorasValle = 0;
    let weightedTarifa = 0;
    let weightedOcupacion = 0;
    let weightedOcupacionPico = 0;
    let weightedOcupacionValle = 0;
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
      
      // Separate schedules by day type
      const horariosLV = schedules.filter(h => h.diaSemana === 'LV' || !h.diaSemana);
      const horariosSD = schedules.filter(h => h.diaSemana === 'SD');
      
      // Calculate totals for summary (all schedules)
      schedules.forEach((s) => {
        const hours = Math.max(0, s.fin - s.inicio);
        if (s.tipo === 'pico') {
          totalHorasPico += hours;
          weightedOcupacionPico += s.ocupacion * hours;
        } else {
          totalHorasValle += hours;
          weightedOcupacionValle += s.ocupacion * hours;
        }
        weightedTarifa += s.tarifa * hours;
        weightedOcupacion += s.ocupacion * hours;
      });
      
      // CRITICAL: Calculate income with proper weekly weighting
      // L-V (5 days) + S-D (2 days) * 4.33 weeks/month
      const ingresosDiaLV = calculateIngresosPorDia(horariosLV, cantidad, duracion);
      const ingresosDiaSD = calculateIngresosPorDia(horariosSD, cantidad, duracion);
      const ingresosSemana = (ingresosDiaLV * WEEKDAYS_LV) + (ingresosDiaSD * WEEKDAYS_SD);
      ingresosHorarios = ingresosSemana * WEEKS_PER_MONTH;

      // Total users calculation with weekly weighting
      const turnosDiaLV = calculateTurnosPorDia(horariosLV, cantidad, duracion);
      const turnosDiaSD = calculateTurnosPorDia(horariosSD, cantidad, duracion);
      const turnosSemana = (turnosDiaLV * WEEKDAYS_LV) + (turnosDiaSD * WEEKDAYS_SD);
      const totalReservasMes = turnosSemana * WEEKS_PER_MONTH;
      totalUsuariosMes = totalReservasMes * jugadores;
      
      // Complementary income (rentals)
      (config.alquileres || []).forEach((a) => {
        ingresosComplementarios += (totalUsuariosMes * (a.porcentaje / 100) * a.precio);
      });
    }

    // Membership model calculations
    if (config.modeloIngreso === 'membresia' || config.modeloIngreso === 'mixto') {
      const membershipConfig = config.membershipConfig || DEFAULT_MEMBERSHIP_CONFIG;
      ingresosMembresiasPases += membershipConfig.miembrosProyectados[0] * membershipConfig.precioMembresia;
      totalUsuariosMes += membershipConfig.miembrosProyectados[0];
    }

    // Daily pass model calculations
    if (config.modeloIngreso === 'pase-diario' || config.modeloIngreso === 'mixto') {
      const dailyPassConfig = config.dailyPassConfig || DEFAULT_DAILY_PASS_CONFIG;
      ingresosMembresiasPases += dailyPassConfig.pasesProyectadosDia * daysPerMonth * dailyPassConfig.precioPase;
      totalUsuariosMes += dailyPassConfig.pasesProyectadosDia * daysPerMonth;
    }

    // Traffic model calculations
    if (config.modeloIngreso === 'trafico') {
      const trafficConfig = config.trafficConfig || DEFAULT_TRAFFIC_CONFIG;
      
      const usuariosDeportivos = Math.round(totalClubUsersFromProject * (trafficConfig.porcentajeUsuariosClub / 100));
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

    // Classes income calculation
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

    // Calculate schedule summary
    const totalHours = totalHorasPico + totalHorasValle;
    const porcentajePico = totalHours > 0 ? (totalHorasPico / totalHours) * 100 : 0;
    const porcentajeValle = totalHours > 0 ? (totalHorasValle / totalHours) * 100 : 0;
    const tarifaPromedio = totalHours > 0 ? weightedTarifa / totalHours : 0;
    const ocupacionPromedio = totalHours > 0 ? weightedOcupacion / totalHours : 0;
    const ocupacionPromedioPico = totalHorasPico > 0 ? weightedOcupacionPico / totalHorasPico : 0;
    const ocupacionPromedioValle = totalHorasValle > 0 ? weightedOcupacionValle / totalHorasValle : 0;
    const turnosPorDia = duracion > 0 ? totalHours / duracion : 0;

    // Total monthly income Year 1
    const ingresosMensualesAno1 = ingresosHorarios + ingresosComplementarios + ingresosClases + ingresosMembresiasPases + ingresosTrafico;

    // Calculate CAPEX
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

    // Calculate OPEX
    const opexPersonal = (config.personal || []).reduce(
      (sum, p) => sum + ((p.cantidad || 0) * (p.salarioMensual || 0)), 0
    );
    
    const opexMantenimientoAnual = (config.mantenimiento || []).reduce(
      (sum, m) => sum + (m.costoAnual || 0), 0
    );
    const opexMantenimiento = opexMantenimientoAnual / 12;
    
    const opexReposicion = capexConsumibles * 0.3 / 12;
    
    const opexMensual = opexPersonal + opexMantenimiento + opexReposicion + opexProfesores;

    // Calculate metrics
    const margen = ingresosMensualesAno1 - opexMensual;
    const margenPorcentaje = ingresosMensualesAno1 > 0 
      ? (margen / ingresosMensualesAno1) * 100 
      : 0;
    const payback = margen > 0 ? capexTotal / margen : 0;

    return {
      totalHorasPico,
      totalHorasValle,
      porcentajePico,
      porcentajeValle,
      tarifaPromedio,
      ocupacionPromedio,
      ocupacionPromedioPico,
      ocupacionPromedioValle,
      turnosPorDia,
      ingresosMensualesAno1,
      ingresosHorarios,
      ingresosComplementarios,
      ingresosClases,
      ingresosMembresiasPases,
      ingresosTrafico,
      totalUsuariosMes,
      capexConstruccion,
      capexEquipamiento,
      capexConsumibles,
      capexMobiliario,
      capexTotal,
      opexPersonal,
      opexMantenimiento,
      opexReposicion,
      opexProfesores,
      opexCostoVentas,
      opexMensual,
      margen,
      margenPorcentaje,
      payback,
    };
  }, [config, daysPerMonth, totalClubUsersFromProject]);
}
