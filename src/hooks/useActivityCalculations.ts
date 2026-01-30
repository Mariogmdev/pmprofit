import { useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { 
  ActivityConfig, 
  ActivityCalculations,
  DEFAULT_MEMBERSHIP_CONFIG,
  DEFAULT_DAILY_PASS_CONFIG,
  DEFAULT_TRAFFIC_CONFIG,
  DEFAULT_CLASSES_CONFIG,
} from '@/types/activity';

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
    let weightedOcupacionPico = 0;   // Sum of (ocupacion * hours) for pico schedules
    let weightedOcupacionValle = 0;  // Sum of (ocupacion * hours) for valle schedules
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
          weightedOcupacionPico += s.ocupacion * hours;
        } else {
          totalHorasValle += hours;
          weightedOcupacionValle += s.ocupacion * hours;
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

      // Total users calculation
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
      
      // Use totalClubUsersFromProject instead of totalUsuariosMes for traffic calculation
      // This is the sum of all users from OTHER activities in the project
      const usuariosDeportivos = Math.round(totalClubUsersFromProject * (trafficConfig.porcentajeUsuariosClub / 100));
      const usuariosExternos = trafficConfig.visitantesExternosDia * daysPerMonth;
      const traficoTotal = usuariosDeportivos + usuariosExternos;
      
      if (trafficConfig.modeloOperacion === 'propia') {
        const ingresosBrutos = traficoTotal * trafficConfig.ticketPromedio * trafficConfig.consumosPorPersona;
        // For own operation: income is NET of cost of sales (margen bruto)
        opexCostoVentas = ingresosBrutos * (trafficConfig.costoVentas / 100);
        ingresosTrafico = ingresosBrutos - opexCostoVentas; // This matches the UI calculation
      } else {
        // For concession: income is commission on operator sales
        ingresosTrafico = trafficConfig.ventasOperador * (trafficConfig.comisionConcesion / 100);
        opexCostoVentas = 0; // No cost of sales for concession
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
    // Separate pico/valle weighted averages for accurate projection
    const ocupacionPromedioPico = totalHorasPico > 0 ? weightedOcupacionPico / totalHorasPico : 0;
    const ocupacionPromedioValle = totalHorasValle > 0 ? weightedOcupacionValle / totalHorasValle : 0;
    const turnosPorDia = duracion > 0 ? totalHours / duracion : 0;

    // Total monthly income Year 1
    const ingresosMensualesAno1 = ingresosHorarios + ingresosComplementarios + ingresosClases + ingresosMembresiasPases + ingresosTrafico;

    // Calculate CAPEX - Activity construction + equipment
    const tipoCubierta = config.tipoCubierta || 'cubierta';
    const capexPorUnidad = tipoCubierta === 'cubierta' 
      ? (config.capexCubierta || 0)
      : tipoCubierta === 'semicubierta'
        ? (config.capexSemicubierta || 0)
        : (config.capexAireLibre || 0);
    
    // Construction cost for this activity
    const capexConstruccion = capexPorUnidad * cantidad;
    
    // Additional equipment beyond basic construction
    const capexEquipamiento = (config.equipamientoEspecifico || []).reduce(
      (sum, e) => sum + (e.cantidad * e.precioUnitario), 0
    );
    
    const capexConsumibles = (config.consumibles || []).reduce(
      (sum, c) => sum + (c.cantidad * c.precioUnitario), 0
    );
    
    const capexMobiliario = (config.mobiliario || []).reduce(
      (sum, m) => sum + (m.cantidad * m.precioUnitario), 0
    );
    
    // Total CAPEX includes construction + equipment + consumables + furniture
    const capexTotal = capexConstruccion + capexEquipamiento + capexConsumibles + capexMobiliario;

    // Calculate OPEX
    const opexPersonal = (config.personal || []).reduce(
      (sum, p) => sum + (p.cantidad * p.salarioMensual), 0
    );
    
    const opexMantenimientoAnual = (config.mantenimiento || []).reduce(
      (sum, m) => sum + m.costoAnual, 0
    );
    const opexMantenimiento = opexMantenimientoAnual / 12;
    
    // Estimate reposition (consumables replenishment)
    const opexReposicion = capexConsumibles * 0.3 / 12; // 30% annual reposition
    
    // Note: For traffic model with own operation, opexCostoVentas is already deducted from ingresosTrafico
    // So we don't add it to opexMensual to avoid double-counting
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
