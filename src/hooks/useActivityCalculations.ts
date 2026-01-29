import { useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { ActivityConfig, ActivityCalculations } from '@/types/activity';

export function useActivityCalculations(config: ActivityConfig): ActivityCalculations {
  const { currentProject } = useProject();
  
  // Get project operation days per month (default 30)
  const daysPerMonth = currentProject?.days_per_month || 30;

  return useMemo(() => {
    // Calculate schedule summary
    const schedules = config.horarios || [];
    
    let totalHorasPico = 0;
    let totalHorasValle = 0;
    let weightedTarifa = 0;
    let weightedOcupacion = 0;
    
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
    
    const totalHours = totalHorasPico + totalHorasValle;
    const porcentajePico = totalHours > 0 ? (totalHorasPico / totalHours) * 100 : 0;
    const porcentajeValle = totalHours > 0 ? (totalHorasValle / totalHours) * 100 : 0;
    const tarifaPromedio = totalHours > 0 ? weightedTarifa / totalHours : 0;
    const ocupacionPromedio = totalHours > 0 ? weightedOcupacion / totalHours : 0;
    const turnosPorDia = config.duracionReserva > 0 ? totalHours / config.duracionReserva : 0;

    // Calculate monthly income (Year 1)
    let ingresosHorarios = 0;
    const cantidad = config.cantidad || 1;
    const duracion = config.duracionReserva || 1.5;
    
    schedules.forEach((s) => {
      const hoursPerDay = Math.max(0, s.fin - s.inicio);
      const reservasPerDay = hoursPerDay / duracion;
      const ocupacion = s.ocupacion / 100;
      const reservasPerMonth = reservasPerDay * cantidad * ocupacion * daysPerMonth;
      ingresosHorarios += reservasPerMonth * s.tarifa;
    });

    // Calculate complementary income
    const jugadores = config.jugadoresPorReserva || 4;
    const totalReservasMes = (turnosPorDia * cantidad * (ocupacionPromedio / 100) * daysPerMonth);
    const totalUsuariosMes = totalReservasMes * jugadores;
    
    let ingresosComplementarios = 0;
    (config.alquileres || []).forEach((a) => {
      ingresosComplementarios += (totalUsuariosMes * (a.porcentaje / 100) * a.precio);
    });
    
    // Add classes income if enabled
    if (config.tieneClases && config.configuracionClases) {
      const { clasesPorDia, precioClase, descuento } = config.configuracionClases;
      const clasesPerMonth = clasesPorDia * daysPerMonth * cantidad;
      const precioConDescuento = precioClase * (1 - descuento / 100);
      ingresosComplementarios += clasesPerMonth * precioConDescuento;
    }

    const ingresosMensualesAno1 = ingresosHorarios + ingresosComplementarios;

    // Calculate CAPEX
    const tipoCubierta = config.tipoCubierta || 'cubierta';
    const capexPorUnidad = tipoCubierta === 'cubierta' 
      ? config.capexCubierta 
      : tipoCubierta === 'semicubierta'
        ? config.capexSemicubierta
        : config.capexAireLibre;
    
    const capexInfraestructura = capexPorUnidad * cantidad;
    
    const capexConsumibles = (config.consumibles || []).reduce(
      (sum, c) => sum + (c.cantidad * c.precioUnitario), 0
    );
    
    const capexMobiliario = (config.mobiliario || []).reduce(
      (sum, m) => sum + (m.cantidad * m.precioUnitario), 0
    );
    
    const capexTotal = capexInfraestructura + capexConsumibles + capexMobiliario;

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
    
    const opexMensual = opexPersonal + opexMantenimiento + opexReposicion;

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
      turnosPorDia,
      ingresosMensualesAno1,
      ingresosHorarios,
      ingresosComplementarios,
      totalUsuariosMes,
      capexInfraestructura,
      capexConsumibles,
      capexMobiliario,
      capexTotal,
      opexPersonal,
      opexMantenimiento,
      opexReposicion,
      opexMensual,
      margen,
      margenPorcentaje,
      payback,
    };
  }, [config, daysPerMonth]);
}
