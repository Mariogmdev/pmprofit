import { useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { 
  ActivityConfig, 
  ActivityCalculations,
} from '@/types/activity';
import { calculateActivityFinancials, calculateOccupancyTarget } from '@/lib/activityCalculations';
import { WEEKDAYS_LV, WEEKDAYS_SD } from '@/lib/timeHelpers';

/**
 * Hook wrapper for activity calculations
 * Uses the centralized calculateActivityFinancials function
 * 
 * IMPORTANT: This hook provides BASE calculations (100% maturity)
 * Growth curves are applied separately in projection components
 * 
 * This ensures CONSISTENCY between Constructor and Dashboard
 */
export function useActivityCalculations(
  config: ActivityConfig, 
  totalClubUsersFromProject: number = 0
): ActivityCalculations {
  const { currentProject } = useProject();
  const daysPerMonth = currentProject?.days_per_month || 30;

  return useMemo(() => {
    console.log('=== useActivityCalculations (WRAPPER) ===');
    console.log('Activity:', config.tipoUnidad || 'unnamed');
    console.log('Using centralized calculateActivityFinancials');
    
    // ============================================================
    // CRITICAL: Use centralized calculation function for ALL income
    // This ensures Constructor and Dashboard show identical numbers
    // ============================================================
    const financials = calculateActivityFinancials(
      config,
      daysPerMonth,
      totalClubUsersFromProject
    );
    
    console.log('Base income (100% maturity):', financials.ingresosMensuales);
    console.log('  - Ingresos/día L-V:', financials.ingresosDiaLV);
    console.log('  - Ingresos/día S-D:', financials.ingresosDiaSD);
    console.log('  - Ingresos/semana:', financials.ingresosSemana);
    console.log('Base occupancy:', financials.ocupacionPromedio);
    
    // Calculate occupancy target
    const ocupacionTarget = calculateOccupancyTarget(config);
    
    // ============================================================
    // Calculate additional metrics needed by UI (weighted properly)
    // ============================================================
    const schedules = config.horarios || [];
    const horariosLV = schedules.filter(h => h.diaSemana === 'LV' || !h.diaSemana);
    const horariosSD = schedules.filter(h => h.diaSemana === 'SD');
    
    // Calculate weighted hours per week
    let horasPicoSemana = 0;
    let horasValleSemana = 0;
    let weightedTarifaPico = 0;
    let weightedTarifaValle = 0;
    let weightedOcupacionPico = 0;
    let weightedOcupacionValle = 0;
    
    // Process L-V schedules
    horariosLV.forEach(h => {
      const horas = Math.max(0, h.fin - h.inicio);
      const horasSemana = horas * WEEKDAYS_LV;
      
      if (h.tipo === 'pico') {
        horasPicoSemana += horasSemana;
        weightedTarifaPico += h.tarifa * horasSemana;
        weightedOcupacionPico += h.ocupacion * horasSemana;
      } else {
        horasValleSemana += horasSemana;
        weightedTarifaValle += h.tarifa * horasSemana;
        weightedOcupacionValle += h.ocupacion * horasSemana;
      }
    });
    
    // Process S-D schedules
    horariosSD.forEach(h => {
      const horas = Math.max(0, h.fin - h.inicio);
      const horasSemana = horas * WEEKDAYS_SD;
      
      if (h.tipo === 'pico') {
        horasPicoSemana += horasSemana;
        weightedTarifaPico += h.tarifa * horasSemana;
        weightedOcupacionPico += h.ocupacion * horasSemana;
      } else {
        horasValleSemana += horasSemana;
        weightedTarifaValle += h.tarifa * horasSemana;
        weightedOcupacionValle += h.ocupacion * horasSemana;
      }
    });
    
    const totalHorasSemana = horasPicoSemana + horasValleSemana;
    
    // Calculate percentages and averages
    const porcentajePico = totalHorasSemana > 0 ? (horasPicoSemana / totalHorasSemana) * 100 : 0;
    const porcentajeValle = totalHorasSemana > 0 ? (horasValleSemana / totalHorasSemana) * 100 : 0;
    
    const ocupacionPromedioPico = horasPicoSemana > 0 
      ? weightedOcupacionPico / horasPicoSemana 
      : 0;
    const ocupacionPromedioValle = horasValleSemana > 0 
      ? weightedOcupacionValle / horasValleSemana 
      : 0;
    
    // Calculate weighted average tariff
    const tarifaTotal = weightedTarifaPico + weightedTarifaValle;
    const tarifaPromedio = totalHorasSemana > 0 ? tarifaTotal / totalHorasSemana : 0;
    
    // Calculate turns per day (weighted average across week)
    const duracion = config.duracionReserva || 1.5;
    const cantidad = config.cantidad || 1;
    
    let turnosDiaLV = 0;
    horariosLV.forEach(h => {
      const horas = Math.max(0, h.fin - h.inicio);
      turnosDiaLV += (horas / duracion) * cantidad;
    });
    
    let turnosDiaSD = 0;
    horariosSD.forEach(h => {
      const horas = Math.max(0, h.fin - h.inicio);
      turnosDiaSD += (horas / duracion) * cantidad;
    });
    
    // Weighted average turns per day (5 weekdays, 2 weekend days)
    const turnosPorDiaPromedio = ((turnosDiaLV * WEEKDAYS_LV) + (turnosDiaSD * WEEKDAYS_SD)) / 7;
    
    // Total hours per day (not per week) for display
    const totalHorasPico = financials.totalHorasPico;
    const totalHorasValle = financials.totalHorasValle;
    
    console.log('Schedule summary:');
    console.log('  - Pico/Valle %:', porcentajePico.toFixed(1), '/', porcentajeValle.toFixed(1));
    console.log('  - Tarifa promedio:', tarifaPromedio);
    console.log('  - Ocupación promedio:', financials.ocupacionPromedio.toFixed(1), '%');
    console.log('  - Turnos/día promedio:', turnosPorDiaPromedio.toFixed(1));
    console.log('=== END useActivityCalculations ===');
    
    // ============================================================
    // Map to ActivityCalculations interface
    // All income values come from centralized function
    // ============================================================
    return {
      // Schedule metrics (properly weighted)
      totalHorasPico,
      totalHorasValle,
      porcentajePico,
      porcentajeValle,
      tarifaPromedio,
      ocupacionPromedio: financials.ocupacionPromedio,
      ocupacionPromedioPico,
      ocupacionPromedioValle,
      turnosPorDia: turnosPorDiaPromedio,
      ocupacionTarget,
      
      // Income breakdown (BASE - 100% maturity)
      // These come directly from centralized calculations
      ingresosMensualesAno1: financials.ingresosMensuales,
      ingresosHorarios: financials.ingresosHorarios,
      ingresosComplementarios: financials.ingresosComplementarios,
      ingresosClases: financials.ingresosClases,
      ingresosMembresiasPases: financials.ingresosMembresiasPases,
      ingresosTrafico: financials.ingresosTrafico,
      totalUsuariosMes: financials.totalUsuariosMes,
      
      // CAPEX breakdown
      capexConstruccion: financials.capexConstruccion,
      capexEquipamiento: financials.capexEquipamiento,
      capexConsumibles: financials.capexConsumibles,
      capexMobiliario: financials.capexMobiliario,
      capexTotal: financials.capexTotal,
      
      // OPEX breakdown
      opexPersonal: financials.opexPersonal,
      opexMantenimiento: financials.opexMantenimiento,
      opexReposicion: financials.opexReposicion,
      opexProfesores: financials.opexProfesores,
      opexCostoVentas: financials.opexCostoVentas,
      opexMensual: financials.opexMensual,
      
      // Financial metrics
      margen: financials.ebitdaMensual,
      margenPorcentaje: financials.margenEbitda,
      payback: financials.paybackMeses,
    };
  }, [config, daysPerMonth, totalClubUsersFromProject]);
}
