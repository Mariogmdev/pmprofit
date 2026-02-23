import { useMemo } from 'react';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { useProjectOpex } from '@/hooks/useProjectOpex';
import { useProjectSpaces } from '@/hooks/useProjectSpaces';
import { useObraCivil } from '@/hooks/useObraCivil';
import { useProject } from '@/contexts/ProjectContext';
import { DashboardMetrics, DashboardInsight, ProjectionYear, ActivityInsight, SpaceInsight, TrafficActivityBreakdown, CHART_COLORS } from '@/types/dashboard';
import { ActivityConfig, DEFAULT_TRAFFIC_CONFIG } from '@/types/activity';
import { ServiceItem, RentCalculationBase } from '@/types/opex';
import { ProjectSpace } from '@/types/infrastructure';
import { calculateActivityFinancials, calculateOccupancyTarget } from '@/lib/activityCalculations';
import { calculateYear1MonthlyProjection } from '@/lib/monthlyFinancials';
import { calculateYearlyProjection } from '@/lib/projectionCalculations';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Helper to generate unique IDs
const generateId = () => crypto.randomUUID();

export const useDashboardMetrics = (): DashboardMetrics => {
  const { currentProject } = useProject();
  const projectId = currentProject?.id || '';
  const { activities, loading: activitiesLoading } = useProjectActivities();
  const { opex, loading: opexLoading } = useProjectOpex(projectId);
  const { spaces, loading: spacesLoading } = useProjectSpaces(projectId);
  const { obraCivil, loading: obraCivilLoading } = useObraCivil(projectId);

  const loading = activitiesLoading || opexLoading || spacesLoading || obraCivilLoading;

  const metrics = useMemo((): DashboardMetrics => {
    const inflationRate = currentProject?.inflation_rate || 3;
    const discountRate = currentProject?.discount_rate || 12;
    const projectionYears = currentProject?.projection_years || 5;
    const areaTotal = currentProject?.area_total || 0;

    // === INCOME CALCULATIONS (Year 1) using CENTRALIZED calculations ===
    // CRITICAL: Use calculateActivityFinancials for ALL income calculations
    // This ensures consistency between Constructor and Dashboard
    const daysPerMonth = currentProject?.days_per_month || 30;
    
    // First pass: calculate total users for traffic-dependent activities
    // AND build breakdown by activity for transparency
    const nonTrafficActivities = activities.filter(a => a.config.modeloIngreso !== 'trafico');
    
    const clubUsersBreakdownData = nonTrafficActivities.map(a => {
      const financials = calculateActivityFinancials(a.config, daysPerMonth, 0);
      return {
        activityId: a.id,
        nombre: a.name,
        icon: a.icon || '⚽',
        usuarios: financials.totalUsuariosMes,
      };
    });
    
    const totalClubUsersFromOtherActivities = clubUsersBreakdownData.reduce(
      (sum, a) => sum + a.usuarios, 0
    );
    
    // Add percentage to breakdown
    const clubUsersBreakdown = clubUsersBreakdownData.map(a => ({
      ...a,
      porcentaje: totalClubUsersFromOtherActivities > 0 
        ? (a.usuarios / totalClubUsersFromOtherActivities) * 100 
        : 0,
    }));
    
    // Calculate financials for each activity using centralized function
    // IMPORTANT: 
    // - financials = MATURITY values (100% target occupancy) - used for Payback, TIR, VAN
    // - year1Income = Year 1 with maturity curve - used for Year 1 projections
    const activityFinancials = activities.map(act => {
      const financials = calculateActivityFinancials(
        act.config,
        daysPerMonth,
        act.config.modeloIngreso === 'trafico' ? totalClubUsersFromOtherActivities : 0
      );
      
      // Use calculateYear1MonthlyProjection for detailed breakdown by source
      const year1Projection = calculateYear1MonthlyProjection(
        act.config,
        daysPerMonth,
        act.config.modeloIngreso === 'trafico' ? totalClubUsersFromOtherActivities : 0
      );
      
      return {
        activity: act,
        financials,
        year1Projection,
      };
    });
    
    // Sum up total income from all activities
    // CRITICAL: Two separate totals:
    // - ingresosMadurez = at target occupancy (for Payback, TIR, VAN)
    // - ingresosBrutosAno1 = Year 1 average with maturity curve (for Year 1 projections)
    let ingresosMadurez = 0; // At 100% target occupancy
    let ingresosBrutosAno1 = 0; // Year 1 average (with maturity ramp)
    let ingresosOperacionales = 0;
    let totalReservas = 0;
    let ocupacionTotal = 0;
    let horasTotal = 0;
    let ticketTotal = 0;
    let ticketCount = 0;

    const ingresosPorActividad: DashboardMetrics['ingresosPorActividad'] = [];

    // Aggregate the 12-month Year 1 income curve across ALL activities WITH breakdown by source.
    const year1IncomeMonths = Array(12).fill(0) as number[];
    const year1BreakdownMonths = Array.from({ length: 12 }, () => ({
      reservas: 0, membresias: 0, pases: 0, complementarios: 0, clases: 0, trafico: 0,
    }));

    activityFinancials.forEach(({ activity, financials, year1Projection }, idx) => {
      // MATURITY income (at target occupancy) - for metrics and projections Year 2+
      ingresosMadurez += financials.ingresosMensuales;
      
      // Year 1 monthly average (considers maturity curve)
      const ingresoYear1Promedio = year1Projection.monthlyAverage;
      
      ingresosBrutosAno1 += ingresoYear1Promedio;
      ingresosOperacionales += financials.ingresosMensuales; // Use maturity for operational
      totalReservas += financials.totalUsuariosMes;
      
      // Calculate weighted occupancy
      const totalHours = financials.totalHorasPico + financials.totalHorasValle;
      if (totalHours > 0) {
        ocupacionTotal += financials.ocupacionPromedio * totalHours;
        horasTotal += totalHours;
      }
      
      // Get average tariff from schedules
      const horarios = activity.config.horarios || [];
      if (horarios.length > 0) {
        const tarifaPromedio = horarios.reduce((s, h) => s + (h.tarifa || 0), 0) / horarios.length;
        ticketTotal += tarifaPromedio;
        ticketCount++;
      }

      // Use MATURITY income for pie chart (represents true capacity)
      if (financials.ingresosMensuales > 0) {
        ingresosPorActividad.push({
          nombre: activity.name,
          valor: financials.ingresosMensuales,
          porcentaje: 0, // Will calculate after total
          color: CHART_COLORS.activities[idx % CHART_COLORS.activities.length],
        });
      }

      // Aggregate monthly totals AND breakdown by source
      year1Projection.months.forEach((monthResult, monthIdx) => {
        year1IncomeMonths[monthIdx] += monthResult.ingresos.total;
        year1BreakdownMonths[monthIdx].reservas += monthResult.ingresos.reservas;
        year1BreakdownMonths[monthIdx].membresias += monthResult.ingresos.membresias;
        year1BreakdownMonths[monthIdx].pases += monthResult.ingresos.pases;
        year1BreakdownMonths[monthIdx].complementarios += monthResult.ingresos.complementarios;
        year1BreakdownMonths[monthIdx].clases += monthResult.ingresos.clases;
        year1BreakdownMonths[monthIdx].trafico += monthResult.ingresos.trafico;
      });
    });

    // Build detailed Year 1 monthly breakdown for Dashboard "Mensual Año 1".
    // NOTE: OPEX and EBITDA distribution is proportional to the income curve.
    const year1IncomeTotal = year1IncomeMonths.reduce((sum, v) => sum + v, 0);
    const year1IncomeAvg = year1IncomeTotal / 12;

    // Calculate percentages based on MATURITY income
    ingresosPorActividad.forEach(item => {
      item.porcentaje = ingresosMadurez > 0 ? (item.valor / ingresosMadurez) * 100 : 0;
    });

    const ingresosNetos = ingresosMadurez * 0.85;
    const ocupacionPromedio = horasTotal > 0 ? ocupacionTotal / horasTotal : 0;
    const ticketPromedio = ticketCount > 0 ? ticketTotal / ticketCount : 0;

    // === TRAFFIC ACTIVITIES BREAKDOWN ===
    // Calculate detailed traffic breakdown for dashboard visibility
    const trafficActivities: TrafficActivityBreakdown[] = activities
      .filter(a => a.config.modeloIngreso === 'trafico')
      .map(activity => {
        const config = activity.config;
        const trafficConfig = config.trafficConfig || DEFAULT_TRAFFIC_CONFIG;
        
        const usuariosClub = Math.round(
          totalClubUsersFromOtherActivities * (trafficConfig.porcentajeUsuariosClub / 100)
        );
        const usuariosExternos = trafficConfig.visitantesExternosDia * daysPerMonth;
        const traficoTotal = usuariosClub + usuariosExternos;
        
        let ingresosBrutos = 0;
        let costoVentas = 0;
        let ingresosNetos = 0;
        let costoVentasPorcentaje = 0;
        let comisionPorcentaje: number | undefined = undefined;
        
        if (trafficConfig.modeloOperacion === 'propia') {
          ingresosBrutos = traficoTotal * trafficConfig.ticketPromedio * trafficConfig.consumosPorPersona;
          costoVentasPorcentaje = trafficConfig.costoVentas;
          costoVentas = ingresosBrutos * (trafficConfig.costoVentas / 100);
          ingresosNetos = ingresosBrutos - costoVentas;
        } else {
          // Concesión model
          ingresosBrutos = trafficConfig.ventasOperador;
          comisionPorcentaje = trafficConfig.comisionConcesion;
          costoVentas = ingresosBrutos * (1 - trafficConfig.comisionConcesion / 100);
          ingresosNetos = trafficConfig.ventasOperador * (trafficConfig.comisionConcesion / 100);
          costoVentasPorcentaje = 100 - trafficConfig.comisionConcesion;
        }
        
        const margenBruto = ingresosBrutos > 0 ? (ingresosNetos / ingresosBrutos) * 100 : 0;
        
        return {
          activityId: activity.id,
          nombre: activity.name,
          icon: activity.icon || '☕',
          usuariosClub,
          usuariosExternos,
          traficoTotal,
          ticketPromedio: trafficConfig.ticketPromedio,
          consumosPorPersona: trafficConfig.consumosPorPersona,
          ingresosBrutos,
          modeloOperacion: trafficConfig.modeloOperacion,
          costoVentasPorcentaje,
          costoVentas,
          comisionPorcentaje,
          ingresosNetos,
          margenBruto,
        };
      });

    // === CAPEX CALCULATIONS ===
    const capexActividades = activities.reduce((sum, activity) => {
      const config: ActivityConfig = activity.config;
      const cantidad = config.cantidad || 1;
      const tipoCubierta = config.tipoCubierta || 'cubierta';
      let capexConstruccion = 0;
      if (tipoCubierta === 'cubierta') {
        capexConstruccion = (config.capexCubierta || 0) * cantidad;
      } else if (tipoCubierta === 'semicubierta') {
        capexConstruccion = (config.capexSemicubierta || 0) * cantidad;
      } else {
        capexConstruccion = (config.capexAireLibre || 0) * cantidad;
      }
      const equipamientoTotal = (config.equipamientoEspecifico || []).reduce(
        (s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0
      );
      const consumiblesTotal = (config.consumibles || []).reduce(
        (s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0
      );
      const mobiliarioTotal = (config.mobiliario || []).reduce(
        (s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0
      );
      return sum + capexConstruccion + equipamientoTotal + consumiblesTotal + mobiliarioTotal;
    }, 0);

    const capexEspacios = spaces.reduce((sum, space) => {
      // CAPEX from area × cost per m² (matches SpaceCard calculation)
      const areaCapex = (space.area || 0) * ((space as any).capex_por_m2 || 0);
      
      // CAPEX from breakdown items
      const breakdownTotal = ((space.breakdown as Array<{cantidad?: number; precioUnitario?: number}>) || []).reduce(
        (s: number, item: {cantidad?: number; precioUnitario?: number}) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0
      );
      
      // Total = both components (areaCapex + breakdownTotal)
      return sum + areaCapex + breakdownTotal;
    }, 0);

    const capexObraCivil = obraCivil?.capex_obra_civil_total || 0;
    
    // Subtotal before contingencies and working capital
    const capexSubtotalSinImprevistos = capexActividades + capexEspacios + capexObraCivil;
    
    // Contingencies (imprevistos) - use percentage from obraCivil config
    const imprevistosPorcentaje = obraCivil?.imprevistos_porcentaje ?? 10;
    const imprevistosValor = capexSubtotalSinImprevistos * (imprevistosPorcentaje / 100);
    
    // CAPEX before working capital (used for depreciation calculation)
    const capexSinWorkingCapital = capexSubtotalSinImprevistos + imprevistosValor;
    
    // Working Capital parameters
    const workingCapitalMonths = currentProject?.working_capital_months ?? 3;

    // === OPEX CALCULATIONS (Simplified from OpexSummaryCard logic) ===
    const calculateReservasForActivities = (actividadesIncluidas?: string[]) => {
      const activitiesToInclude = actividadesIncluidas && actividadesIncluidas.length > 0
        ? activities.filter(a => actividadesIncluidas.includes(a.id))
        : activities;

      return activitiesToInclude.reduce((sum, act) => {
        const config: ActivityConfig = act.config;
        const cantidad = config.cantidad || 1;
        const horarios = config.horarios || [];
        const ocupacionPromedio = horarios.length > 0
          ? horarios.reduce((s, h) => s + (h.ocupacion || 0), 0) / horarios.length / 100
          : 0.5;
        const horasOperacion = horarios.reduce((s, h) => s + ((h.fin || 0) - (h.inicio || 0)), 0);
        const diasMes = 30;
        const reservasPorDia = horasOperacion * ocupacionPromedio / (config.duracionReserva || 1.5);
        return sum + (cantidad * reservasPorDia * diasMes);
      }, 0);
    };

    const calculateCategoryTotal = (items: ServiceItem[], ingresos: number) => {
      if (!items || items.length === 0) return 0;
      return items.reduce((sum, item) => {
        const tipo = item.tipo || 'fijo';
        if (tipo === 'fijo') {
          return sum + (item.costoMensual || 0);
        } else if (tipo === 'porcentaje-facturacion') {
          return sum + (ingresos * ((item.porcentaje || 0) / 100));
        } else if (tipo === 'por-reserva') {
          const reservasAplicables = calculateReservasForActivities(item.actividadesIncluidas);
          const reservasConPorcentaje = reservasAplicables * ((item.porcentajeReservas || 100) / 100);
          return sum + ((item.costoPorReserva || 0) * reservasConPorcentaje);
        }
        return sum;
      }, 0);
    };

    /**
     * IMPORTANTE - Diferencia OPEX Caja vs OPEX Total:
     * 
     * OPEX_CAJA (sin depreciación):
     *   - Para cálculo de EBITDA (Earnings Before Interest, Tax, Depreciation, Amortization)
     *   - Para Working Capital (solo gastos que requieren caja)
     *   - Para flujos de caja operativos
     * 
     * OPEX_TOTAL (con depreciación):
     *   - Para cálculo de EBIT (Earnings Before Interest and Tax)
     *   - Para P&L contable completo
     *   - Para cálculo de impuestos (base gravable)
     */
    
    // Calculate OPEX - uses capexSinWorkingCapital for depreciation (working capital is not depreciated)
    // Returns both opexTotal (with depreciation) and opexCaja (without depreciation - for EBITDA)
    const calculateOpexMensual = (ingresosBrutos: number, capexParaDepreciacion: number): { opexTotal: number; opexCaja: number } => {

      // Payroll from activities
      const nominaActividades = activities.reduce((sum, act) => {
        const config: ActivityConfig = act.config;
        const personal = config.personal || [];
        return sum + personal.reduce((s, p) => s + ((p.cantidad || 0) * (p.salarioMensual || 0)), 0);
      }, 0);

      // Maintenance from activities
      const mantenimientoActividades = activities.reduce((sum, act) => {
        const config: ActivityConfig = act.config;
        const mantenimiento = config.mantenimiento || [];
        const costoAnual = mantenimiento.reduce((s, m) => s + (m.costoAnual || 0), 0);
        return sum + (costoAnual / 12);
      }, 0);

      // Payroll
      const nominaAdmin = (opex?.nomina_administrativa || []).reduce(
        (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
      );
      const nominaOperativo = (opex?.nomina_operativa || []).reduce(
        (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
      );
      const nominaBase = nominaAdmin + nominaOperativo + nominaActividades;
      const prestaciones = nominaBase * ((opex?.prestaciones_porcentaje || 53.94) / 100);
      const totalNomina = nominaBase + prestaciones;

      // Categories
      const serviciosPublicos = calculateCategoryTotal(opex?.servicios_publicos || [], ingresosBrutos);
      const marketing = calculateCategoryTotal(opex?.marketing || [], ingresosBrutos);
      const tecnologia = calculateCategoryTotal(opex?.tecnologia || [], ingresosBrutos);
      const seguridad = calculateCategoryTotal(opex?.seguridad || [], ingresosBrutos);
      const seguros = calculateCategoryTotal(opex?.seguros || [], ingresosBrutos);
      const mantenimientoGeneral = calculateCategoryTotal(opex?.mantenimiento_general || [], ingresosBrutos);
      const administrativos = calculateCategoryTotal(opex?.administrativos || [], ingresosBrutos);
      const otrosGastos = calculateCategoryTotal(opex?.otros_gastos || [], ingresosBrutos);

      // Financial expenses
      let gastosFinancieros = 0;
      if (opex?.incluir_4x1000) {
        gastosFinancieros += ingresosBrutos * 0.004;
      }
      gastosFinancieros += (opex?.comisiones_bancarias || []).reduce(
        (s, i) => s + (i.costoMensual || 0), 0
      );
      if (opex?.incluir_comision_datafono !== false) {
        gastosFinancieros += ingresosBrutos * 
                            ((opex?.porcentaje_ventas_datafono ?? 70) / 100) * 
                            ((opex?.comision_datafono_porcentaje ?? 2.5) / 100);
      }

      // Taxes
      let impuestos = 0;
      if (opex?.incluir_iva) {
        const ivaCobrado = ingresosBrutos * 
                           ((opex?.porcentaje_ingresos_iva ?? 0) / 100) * 
                           ((opex?.tarifa_iva ?? 19) / 100);
        impuestos += Math.max(0, ivaCobrado - (opex?.iva_pagado_estimado ?? 0));
      }
      if (opex?.incluir_retenciones) {
        impuestos += (opex?.retenciones || []).reduce((s, i) => {
          const base = i.base === 'ingresos' ? ingresosBrutos : ingresosBrutos * 0.3;
          return s + (base * ((i.porcentaje || 0) / 100));
        }, 0);
      }

      // Depreciation - uses CAPEX without working capital (working capital is not a depreciable asset)
      const depreciacionAnos = opex?.depreciacion_anos || 10;
      const incluirDepreciacion = opex?.incluir_depreciacion !== false;
      const depreciacion = incluirDepreciacion ? (capexParaDepreciacion / depreciacionAnos / 12) : 0;

      // OPEX CAJA (sin depreciación) - para EBITDA y Working Capital
      const opexCajaSinArriendoNiComisiones = totalNomina + serviciosPublicos + marketing +
        tecnologia + seguridad + seguros + mantenimientoGeneral + mantenimientoActividades +
        administrativos + gastosFinancieros + impuestos + otrosGastos;

      // OPEX TOTAL (con depreciación) - para EBIT
      const opexSinArriendoNiComisiones = opexCajaSinArriendoNiComisiones + depreciacion;

      // Rent calculation
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
      const modelo = opex?.arrendamiento_modelo || 'propio';
      if (modelo === 'fijo') {
        arrendamiento = opex?.arrendamiento_fijo || 0;
      } else if (modelo === 'variable') {
        const base = calculateRentBase(opex?.arrendamiento_variable_base || 'ingresos-brutos');
        arrendamiento = base * ((opex?.arrendamiento_variable_porcentaje || 0) / 100);
      } else if (modelo === 'mixto') {
        const base = calculateRentBase(opex?.arrendamiento_mixto_base || 'ingresos-brutos');
        arrendamiento = (opex?.arrendamiento_mixto_fijo || 0) + 
                        base * ((opex?.arrendamiento_mixto_porcentaje || 0) / 100);
      }

      const opexSinComisiones = opexSinArriendoNiComisiones + arrendamiento;
      const opexCajaSinComisiones = opexCajaSinArriendoNiComisiones + arrendamiento;
      const utilidadesAntesComisiones = Math.max(0, ingresosBrutos - opexSinComisiones);

      // Commissions
      const comisiones = (opex?.comisiones || []).reduce((sum, com) => {
        let base = ingresosBrutos;
        if (com.base === 'ingresos-netos') base = ingresosNetos;
        if (com.base === 'utilidades') base = utilidadesAntesComisiones;
        return sum + (base * ((com.porcentaje || 0) / 100));
      }, 0);

      const opexTotal = opexSinComisiones + comisiones;
      const opexCaja = opexCajaSinComisiones + comisiones;

      return { opexTotal, opexCaja };
    };

    // === CALCULATE WORKING CAPITAL & FINAL CAPEX ===
    // CRITICAL: Use MATURITY income (not Year 1 average) for OPEX/Working Capital
    // This represents the stable operational state of the business
    // IMPORTANT: Working Capital uses OPEX CAJA (without depreciation) - only real cash expenses
    const { opexCaja: opexCajaMadurez } = calculateOpexMensual(ingresosMadurez, capexSinWorkingCapital);
    const workingCapitalValue = opexCajaMadurez * workingCapitalMonths;
    
    // TOTAL CAPEX = CAPEX sin working capital + Working Capital
    const capexTotal = capexSinWorkingCapital + workingCapitalValue;
    
    // === CALCULATE EBITDA & EBIT AT MATURITY (for Payback Simple, TIR, VAN) ===
    // CRITICAL: This is the EBITDA/EBIT when business reaches target occupancy
    // Use capexSinWorkingCapital for depreciation (WC is NOT a depreciable asset)
    const { opexTotal: opexMensualMadurezFinal, opexCaja: opexCajaMensualMadurez } = calculateOpexMensual(ingresosMadurez, capexSinWorkingCapital);
    
    // EBITDA = Ingresos - OPEX Caja (sin depreciación) - TRUE EBITDA
    const ebitdaMensualMadurez = ingresosMadurez - opexCajaMensualMadurez;
    
    // Depreciación mensual para cálculo de EBIT
    const depreciacionAnos = opex?.depreciacion_anos || 10;
    const incluirDepreciacionGlobal = opex?.incluir_depreciacion !== false;
    // Use capexSinWorkingCapital for depreciation (WC is not a depreciable asset)
    const depreciacionMensual = incluirDepreciacionGlobal ? (capexSinWorkingCapital / depreciacionAnos / 12) : 0;
    
    // EBIT = EBITDA - Depreciación
    const ebitMensualMadurez = ebitdaMensualMadurez - depreciacionMensual;
    
    // === PAYBACK SIMPLE ===
    // Uses MATURITY EBITDA (not Year 1 average) as per financial standards
    // This represents how long to recover investment once business is mature
    const paybackSimple = ebitdaMensualMadurez > 0 ? capexTotal / ebitdaMensualMadurez : 999;

    // === BUILD 5-YEAR PROJECTION WITH TAX SHIELD & RESIDUAL VALUE ===
    /**
     * FLUJO DE CAJA CON ESCUDO FISCAL Y VALOR RESIDUAL:
     * 
     * El flujo de caja para TIR/VAN considera:
     * 1. ESCUDO FISCAL: La depreciación reduce la base gravable
     *    - EBIT = EBITDA - Depreciación
     *    - Impuestos = max(0, EBIT × TasaImpositiva)
     *    - Flujo Post-Tax = EBITDA - Impuestos
     *    - Ahorro fiscal = Depreciación × TasaImpositiva
     * 
     * 2. VALOR RESIDUAL (solo último año):
     *    - Activos remanentes: ~40% del CAPEX (50% vida útil restante, menos descuento)
     *    - Working Capital: 100% recuperable
     */
    const TAX_RATE = 0.35; // Tasa impositiva Colombia (35%)
    const RESIDUAL_ASSET_RATE = 0.40; // 40% del CAPEX activos recuperable
    
    const proyeccion: ProjectionYear[] = [];
    let flujoAcumulado = 0; // Starts at 0; CAPEX is included in Year 1's flujoCaja
    let paybackMesesReal = 0;
    let paybackAlcanzado = false;
    
    // Depreciación anual para escudo fiscal
    const depreciacionAnual = depreciacionMensual * 12;
    
    // Valor residual para el último año
    const valorResidualActivos = capexSinWorkingCapital * RESIDUAL_ASSET_RATE;
    const valorResidualWC = workingCapitalValue;
    const valorResidualTotal = valorResidualActivos + valorResidualWC;

    // Use centralized projection engine: Year 1 = real average, Years 2+ grow from Year 1 with inflation + occupancy growth
    const yearlyProjection = calculateYearlyProjection(
      ingresosBrutosAno1 * 12,  // Annual Year 1 income (from maturity curve)
      ocupacionPromedio,         // Year 1 average occupancy
      5,                         // tasaCrecimientoOcupacion (5% annual)
      inflationRate,             // From project config
      projectionYears
    );

    for (let year = 1; year <= projectionYears; year++) {
      const yearData = yearlyProjection[year - 1];
      const ingresosMensuales = yearData.ingresoMensual;
      
      const ingresosAnuales = ingresosMensuales * 12;
      // Use OPEX CAJA (without depreciation) for EBITDA calculations
      const { opexTotal: opexMensualTotal, opexCaja: opexMensualCaja } = calculateOpexMensual(ingresosMensuales, capexSinWorkingCapital);
      const opexMensual = opexMensualTotal; // For projection table display
      const opexAnual = opexMensual * 12;
      const ebitdaMensual = ingresosMensuales - opexMensualCaja; // EBITDA uses cash OPEX
      const ebitdaAnual = ebitdaMensual * 12;
      const margenEbitda = ingresosMensuales > 0 ? (ebitdaMensual / ingresosMensuales) * 100 : 0;
      
      // EBIT para cálculo de impuestos
      const ebitAnual = ebitdaAnual - depreciacionAnual;
      
      // Impuestos con escudo fiscal (solo si hay utilidad positiva)
      const impuestosAnual = ebitAnual > 0 ? ebitAnual * TAX_RATE : 0;
      
      // Flujo de caja operativo post-tax
      let flujoCajaOperativo = ebitdaAnual - impuestosAnual;
      
      // CAPEX solo en año 1
      const capex = year === 1 ? capexTotal : 0;
      
      // Flujo de caja = Operativo - CAPEX + Valor Residual (último año)
      let flujoCaja = flujoCajaOperativo - capex;
      
      // Agregar valor residual en el último año
      if (year === projectionYears) {
        flujoCaja += valorResidualTotal;
      }
      
      flujoAcumulado += flujoCaja;
      
      if (!paybackAlcanzado && flujoAcumulado >= 0) {
        paybackAlcanzado = true;
        // Calculate exact month within the year
        const flujoAnterior = flujoAcumulado - flujoCaja;
        const mesesEnAno = Math.ceil((-flujoAnterior / flujoCaja) * 12);
        paybackMesesReal = (year - 1) * 12 + Math.min(mesesEnAno, 12);
      }
      
      const roiAcumulado = capexTotal > 0 ? (flujoAcumulado / capexTotal) * 100 : 0;

      proyeccion.push({
        year,
        ingresosMensuales,
        ingresosAnuales,
        opexMensual,
        opexAnual,
        ebitdaMensual,
        ebitdaAnual,
        margenEbitda,
        capex,
        flujoCaja,
        flujoAcumulado,
        roiAcumulado,
        paybackAlcanzado: flujoAcumulado >= 0,
      });
    }

    if (!paybackAlcanzado) {
      paybackMesesReal = projectionYears * 12 + 12; // Beyond projection
    }
    
    // Log TIR calculation details for debugging
    if (import.meta.env.DEV && capexTotal > 0) {
      console.log('📊 TIR Calculation (Tax Shield + Residual Value):', {
        taxRate: `${TAX_RATE * 100}%`,
        capexTotal: Math.round(capexTotal),
        depreciacionAnual: Math.round(depreciacionAnual),
        escudoFiscalAnual: Math.round(depreciacionAnual * TAX_RATE),
        valorResidual: {
          activos: Math.round(valorResidualActivos),
          workingCapital: Math.round(valorResidualWC),
          total: Math.round(valorResidualTotal)
        },
        flujos: {
          año1: Math.round(proyeccion[0]?.flujoCaja || 0),
          año5: Math.round(proyeccion[projectionYears - 1]?.flujoCaja || 0),
          año5SinResidual: Math.round((proyeccion[projectionYears - 1]?.flujoCaja || 0) - valorResidualTotal)
        }
      });
    }

    // ============================================================
    // Year 1 monthly breakdown with FIXED/VARIABLE OPEX structure
    // ============================================================
    /**
     * Descompone OPEX en componentes fijo y variable
     * 
     * FIJO (no escala con ingresos):
     * - Nómina base (admin + operativa + prestaciones)
     * - Arriendo fijo
     * - Seguros
     * - Tecnología fija (licencias)
     * - Seguridad base
     * - Mantenimiento fijo
     * 
     * VARIABLE (escala con ingresos o actividad):
     * - Arriendo variable (% ingresos)
     * - Comisiones (% ingresos)
     * - Gastos financieros (4x1000, datáfono)
     * - Servicios públicos (parcialmente)
     * - Marketing variable
     */
    const descomponerOpex = (
      opexTotalMadurez: number,
      ingresosMadurezVal: number
    ): { fijo: number; variable: number; porcentajeVariable: number } => {
      
      // COMPONENTES FIJOS
      const nominaAdmin = (opex?.nomina_administrativa || []).reduce(
        (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
      );
      const nominaOper = (opex?.nomina_operativa || []).reduce(
        (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
      );
      const nominaActs = activities.reduce((sum, act) => {
        const config: ActivityConfig = act.config;
        const personal = config.personal || [];
        return sum + personal.reduce((s, p) => s + ((p.cantidad || 0) * (p.salarioMensual || 0)), 0);
      }, 0);
      
      const nominaBase = nominaAdmin + nominaOper + nominaActs;
      const prestacionesFijas = nominaBase * ((opex?.prestaciones_porcentaje || 53.94) / 100);
      const totalNominaFija = nominaBase + prestacionesFijas;
      
      // Arriendo fijo según modelo
      let arriendoFijo = 0;
      const modelo = opex?.arrendamiento_modelo || 'propio';
      if (modelo === 'fijo') {
        arriendoFijo = opex?.arrendamiento_fijo || 0;
      } else if (modelo === 'mixto') {
        arriendoFijo = opex?.arrendamiento_mixto_fijo || 0;
      }
      
      // Seguros son siempre fijos
      const segurosFijos = (opex?.seguros || []).reduce((s, i) => s + (i.costoMensual || 0), 0);
      
      // Tecnología fija (solo items tipo 'fijo')
      const tecnologiaFija = (opex?.tecnologia || [])
        .filter(i => (i.tipo || 'fijo') === 'fijo')
        .reduce((s, i) => s + (i.costoMensual || 0), 0);
      
      // Seguridad fija
      const seguridadFija = (opex?.seguridad || [])
        .filter(i => (i.tipo || 'fijo') === 'fijo')
        .reduce((s, i) => s + (i.costoMensual || 0), 0);
      
      // Mantenimiento general fijo
      const mantenimientoFijo = (opex?.mantenimiento_general || [])
        .filter(i => (i.tipo || 'fijo') === 'fijo')
        .reduce((s, i) => s + (i.costoMensual || 0), 0);
      
      // Mantenimiento de actividades (fijo - es programado)
      const mantenimientoActsFijo = activities.reduce((sum, act) => {
        const config: ActivityConfig = act.config;
        const mantenimiento = config.mantenimiento || [];
        const costoAnual = mantenimiento.reduce((s, m) => s + (m.costoAnual || 0), 0);
        return sum + (costoAnual / 12);
      }, 0);
      
      // Administrativos fijos
      const administrativosFijos = (opex?.administrativos || [])
        .filter(i => (i.tipo || 'fijo') === 'fijo')
        .reduce((s, i) => s + (i.costoMensual || 0), 0);
      
      // Otros gastos fijos
      const otrosGastosFijos = (opex?.otros_gastos || [])
        .filter(i => (i.tipo || 'fijo') === 'fijo')
        .reduce((s, i) => s + (i.costoMensual || 0), 0);
      
      const opexFijo = totalNominaFija + arriendoFijo + segurosFijos + tecnologiaFija + 
                       seguridadFija + mantenimientoFijo + mantenimientoActsFijo + 
                       administrativosFijos + otrosGastosFijos;
      
      // COMPONENTES VARIABLES (resto = total - fijo)
      const opexVariable = Math.max(0, opexTotalMadurez - opexFijo);
      
      // Porcentaje variable sobre ingresos de madurez
      const porcentajeVariable = ingresosMadurezVal > 0 ? (opexVariable / ingresosMadurezVal) : 0;
      
      return {
        fijo: opexFijo,
        variable: opexVariable,
        porcentajeVariable
      };
    };

    // Calculate OPEX structure at maturity for Year 1 breakdown
    const { opexTotal: opexMadurezTotal } = calculateOpexMensual(ingresosMadurez, capexTotal);
    const opexStructure = descomponerOpex(opexMadurezTotal, ingresosMadurez);

    const year1Monthly: DashboardMetrics['year1Monthly'] = MONTH_NAMES.map((mes, idx) => {
      const ingresos = year1IncomeMonths[idx] || 0;
      const breakdown = year1BreakdownMonths[idx];
      
      const opexVariableMes = ingresos * opexStructure.porcentajeVariable;
      const opexMes = opexStructure.fijo + opexVariableMes;
      const ebitda = ingresos - opexMes;
      
      return {
        mes,
        ingresos,
        opex: opexMes,
        ebitda,
        reservas: breakdown.reservas,
        membresias: breakdown.membresias,
        pases: breakdown.pases,
        complementarios: breakdown.complementarios,
        clases: breakdown.clases,
        trafico: breakdown.trafico,
      };
    });

    // Log OPEX structure for debugging (dev only)
    if (import.meta.env.DEV && ingresosMadurez > 0) {
      console.log('📊 OPEX Structure:', {
        madurez: {
          ingresos: Math.round(ingresosMadurez),
          opexTotal: Math.round(opexMadurezTotal),
          opexFijo: Math.round(opexStructure.fijo),
          opexVariable: Math.round(opexStructure.variable),
          porcentajeVariable: (opexStructure.porcentajeVariable * 100).toFixed(1) + '%',
          porcentajeFijo: ((opexStructure.fijo / opexMadurezTotal) * 100).toFixed(1) + '%'
        },
        mes1: year1IncomeMonths[0] ? {
          ingresos: Math.round(year1IncomeMonths[0]),
          opexFijo: Math.round(opexStructure.fijo),
          opexVariable: Math.round(year1IncomeMonths[0] * opexStructure.porcentajeVariable),
          opexTotal: Math.round(year1Monthly[0].opex),
          ebitda: Math.round(year1Monthly[0].ebitda),
          margen: ((year1Monthly[0].ebitda / year1IncomeMonths[0]) * 100).toFixed(1) + '%'
        } : null,
        mes12: year1IncomeMonths[11] ? {
          ingresos: Math.round(year1IncomeMonths[11]),
          opexTotal: Math.round(year1Monthly[11].opex),
          ebitda: Math.round(year1Monthly[11].ebitda),
          margen: ((year1Monthly[11].ebitda / year1IncomeMonths[11]) * 100).toFixed(1) + '%'
        } : null
      });
    }

    // === CALCULATE TIR (Newton-Raphson) ===
    // CRITICAL FIX: projection.flujoCaja already includes -CAPEX in Year 1,
    // so we do NOT prepend another -CAPEX. The flows are:
    // [Year1 (operating - CAPEX), Year2, Year3, Year4, Year5 (+ residual)]
    const calculateTIR = () => {
      const cashFlows = proyeccion.map(p => p.flujoCaja);
      
      // Simple IRR approximation using iterative method
      let irr = 0.1;
      for (let i = 0; i < 100; i++) {
        let npv = 0;
        let npvDerivative = 0;
        cashFlows.forEach((cf, year) => {
          npv += cf / Math.pow(1 + irr, year);
          npvDerivative -= year * cf / Math.pow(1 + irr, year + 1);
        });
        if (Math.abs(npv) < 0.01) break;
        irr = irr - npv / npvDerivative;
        if (irr < -1 || irr > 10) irr = 0.1;
      }
      return Math.max(0, Math.min(irr * 100, 100));
    };

    // === CALCULATE VAN ===
    // Same fix: flows already include CAPEX in Year 1
    const calculateVAN = () => {
      const cashFlows = proyeccion.map(p => p.flujoCaja);
      return cashFlows.reduce((npv, cf, year) => {
        return npv + cf / Math.pow(1 + discountRate / 100, year);
      }, 0);
    };

    const tir = calculateTIR();
    const van = calculateVAN();

    // === BREAKEVEN CALCULATION ===
    let puntoEquilibrioMes = 0;
    let flujoParcial = -capexTotal;
    for (let mes = 1; mes <= projectionYears * 12; mes++) {
      const yearIdx = Math.floor((mes - 1) / 12);
      const ebitdaMes = proyeccion[yearIdx]?.ebitdaMensual || 0;
      flujoParcial += ebitdaMes;
      if (flujoParcial >= 0 && puntoEquilibrioMes === 0) {
        puntoEquilibrioMes = mes;
        break;
      }
    }
    if (puntoEquilibrioMes === 0) puntoEquilibrioMes = projectionYears * 12 + 12;

    // === GENERATE ACTIVITY INSIGHTS (Reuse calculations from above) ===
    const activityInsights: ActivityInsight[] = activityFinancials.map(({ activity, financials, year1Projection }) => {
      const config: ActivityConfig = activity.config;
      
      const ocupacionTarget = calculateOccupancyTarget(config);
      
      // Use Year 1 monthly average for income (considers maturity curve)
      const ingresosMensualesYear1 = year1Projection.monthlyAverage;
      
      // Generate activity-specific insights
      const actInsights: ActivityInsight['insights'] = [];
      
      if (financials.margenContribucionPorcentaje >= 40) {
        actInsights.push({ type: 'success', message: 'Margen saludable (>40%)', action: undefined });
      } else if (financials.margenContribucionPorcentaje < 20) {
        actInsights.push({ type: 'warning', message: `Margen bajo (${financials.margenContribucionPorcentaje.toFixed(0)}%). Revisar tarifas o costos.` });
      }
      
      if (financials.ocupacionPromedio >= ocupacionTarget * 0.9) {
        actInsights.push({ type: 'success', message: 'Ocupación cerca del objetivo' });
      } else if (financials.ocupacionPromedio < ocupacionTarget * 0.7) {
        actInsights.push({ type: 'warning', message: `Ocupación baja (${financials.ocupacionPromedio.toFixed(0)}% vs ${ocupacionTarget.toFixed(0)}% target)` });
      }
      
      if (financials.paybackActividadMeses <= 24) {
        actInsights.push({ type: 'success', message: `Payback rápido: ${financials.paybackActividadMeses} meses` });
      } else if (financials.paybackActividadMeses > 48) {
        actInsights.push({ type: 'warning', message: `Payback largo: ${financials.paybackActividadMeses} meses` });
      }
      
      if (ingresosMensualesYear1 > 0 && financials.capexTotal === 0) {
        actInsights.push({ type: 'opportunity', message: 'Sin CAPEX registrado - Verificar inversión' });
      }

      if (financials.margenContribucionMensual < 0) {
        actInsights.push({ type: 'warning', message: 'Margen negativo - Requiere atención' });
      }
      
      return {
        activityId: activity.id,
        nombre: activity.name,
        icon: activity.icon || '📦',
        categoria: config.modeloIngreso || 'reserva',
        ingresosMensuales: ingresosMensualesYear1,
        opexMensual: financials.opexMensual,
        ebitdaMensual: ingresosMensualesYear1 - financials.opexMensual,
        margenEbitda: ingresosMensualesYear1 > 0 ? ((ingresosMensualesYear1 - financials.opexMensual) / ingresosMensualesYear1) * 100 : 0,
        ocupacionPromedio: financials.ocupacionPromedio,
        ocupacionTarget,
        capacidadUtilizada: ocupacionTarget > 0 ? (financials.ocupacionPromedio / ocupacionTarget) * 100 : 0,
        capex: financials.capexTotal,
        paybackMeses: financials.paybackActividadMeses,
        roiAnual: financials.roiAnual,
        rankingIngresos: 0, // Will be calculated after
        rankingMargen: 0,
        rankingROI: 0,
        insights: actInsights,
        porcentajeIngresosTotales: ingresosBrutosAno1 > 0 ? (ingresosMensualesYear1 / ingresosBrutosAno1) * 100 : 0,
        porcentajeOpexTotales: 0, // Will calculate after
      };
    });
    
    // Calculate rankings
    const sortedByIngresos = [...activityInsights].sort((a, b) => b.ingresosMensuales - a.ingresosMensuales);
    const sortedByMargen = [...activityInsights].sort((a, b) => b.margenEbitda - a.margenEbitda);
    const sortedByROI = [...activityInsights].sort((a, b) => b.roiAnual - a.roiAnual);
    
    activityInsights.forEach(act => {
      act.rankingIngresos = sortedByIngresos.findIndex(a => a.activityId === act.activityId) + 1;
      act.rankingMargen = sortedByMargen.findIndex(a => a.activityId === act.activityId) + 1;
      act.rankingROI = sortedByROI.findIndex(a => a.activityId === act.activityId) + 1;
    });
    
    // Top performers
    const topActivitiesByRevenue = sortedByIngresos.slice(0, 3);
    const topActivitiesByMargin = sortedByMargen.filter(a => a.margenEbitda > 0).slice(0, 3);
    const worstPerformers = activityInsights
      .filter(a => a.margenEbitda < 30 || a.ocupacionPromedio < a.ocupacionTarget * 0.7)
      .slice(0, 3);
    
    // === GENERATE SPACE INSIGHTS ===
    const spaceInsights: SpaceInsight[] = spaces.map((space: ProjectSpace) => {
      const breakdownTotal = ((space.breakdown as Array<{cantidad?: number; precioUnitario?: number}>) || []).reduce(
        (s: number, item: {cantidad?: number; precioUnitario?: number}) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0
      );
      
      // Estimate income if space generates revenue
      const spaceIncome = space.genera_ingresos && space.configuracion_ingresos 
        ? (space.configuracion_ingresos.ingresoMensual || 0) 
        : 0;
      
      // Estimate OPEX (maintenance ~2% of CAPEX annually)
      const spaceOpex = breakdownTotal > 0 ? (breakdownTotal * 0.02) / 12 : 0;
      
      const spaceEbitda = spaceIncome - spaceOpex;
      const spaceRoi = breakdownTotal > 0 ? ((spaceEbitda * 12) / breakdownTotal) * 100 : 0;
      const spacePayback = spaceEbitda > 0 ? Math.ceil(breakdownTotal / spaceEbitda) : 999;
      
      // Generate space insights
      const spaceInsightsList: SpaceInsight['insights'] = [];
      
      if (space.genera_ingresos && spaceIncome > 0) {
        if (spaceRoi >= 15) {
          spaceInsightsList.push({ type: 'success', message: `ROI atractivo: ${spaceRoi.toFixed(1)}%` });
        } else if (spaceRoi > 0 && spaceRoi < 8) {
          spaceInsightsList.push({ type: 'warning', message: `ROI bajo: ${spaceRoi.toFixed(1)}%` });
        }
      } else if (!space.genera_ingresos && breakdownTotal > 50000000) {
        spaceInsightsList.push({ type: 'info', message: 'Espacio de soporte - Alto CAPEX sin ingresos directos' });
      }
      
      if (space.area === 0) {
        spaceInsightsList.push({ type: 'warning', message: 'Área no definida' });
      }
      
      return {
        spaceId: space.id,
        nombre: space.name,
        tipo: space.type,
        area: space.area || 0,
        capex: breakdownTotal,
        opexMensual: spaceOpex,
        ingresosMensuales: spaceIncome,
        utilizacionEstimada: space.genera_ingresos ? 80 : 100, // Assume 80% for revenue, 100% for support
        capacidadMaxima: space.area || 0,
        roi: spaceRoi,
        paybackMeses: spacePayback < 999 ? spacePayback : 0,
        insights: spaceInsightsList,
      };
    });

    // === GENERATE PROJECT INSIGHTS ===
    const insights: DashboardInsight[] = [];
    // Use MATURITY EBITDA for insights (represents stable business state)
    const ebitdaMensualBase = ebitdaMensualMadurez;
    const ebitMensualBase = ebitMensualMadurez;
    const margenEbitdaBase = ingresosMadurez > 0 ? (ebitdaMensualMadurez / ingresosMadurez) * 100 : 0;
    const margenEbitBase = ingresosMadurez > 0 ? (ebitMensualMadurez / ingresosMadurez) * 100 : 0;
    // Use total OPEX (with depreciation) for OPEX percentage insight
    const opexPorcentaje = ingresosMadurez > 0 
      ? (opexMensualMadurezFinal / ingresosMadurez) * 100 
      : 0;

    // Success insights
    if (ebitdaMensualBase > 0) {
      insights.push({
        id: generateId(),
        type: 'success',
        title: 'Proyecto viable',
        description: 'El EBITDA es positivo desde el primer año de operación.',
      });
    }

    if (tir >= 15) {
      insights.push({
        id: generateId(),
        type: 'success',
        title: 'TIR atractiva',
        description: `La TIR del ${tir.toFixed(1)}% supera el costo de capital esperado.`,
      });
    }

    if (paybackSimple <= 36) {
      insights.push({
        id: generateId(),
        type: 'success',
        title: 'Recuperación rápida',
        description: `La inversión se recupera en ${Math.round(paybackSimple)} meses (${(paybackSimple / 12).toFixed(1)} años).`,
      });
    }

    // Warning insights
    if (opexPorcentaje > 70) {
      insights.push({
        id: generateId(),
        type: 'warning',
        title: 'OPEX elevado',
        description: `Los gastos operativos representan el ${opexPorcentaje.toFixed(0)}% de los ingresos. Considere optimizar costos.`,
        action: { label: 'Revisar OPEX', tab: 'constructor' },
      });
    }

    if (margenEbitdaBase < 30) {
      insights.push({
        id: generateId(),
        type: 'warning',
        title: 'Margen ajustado',
        description: `El margen EBITDA del ${margenEbitdaBase.toFixed(1)}% está por debajo del benchmark (30%).`,
        action: { label: 'Optimizar ingresos', tab: 'constructor' },
      });
    }

    if (paybackSimple > 60) {
      insights.push({
        id: generateId(),
        type: 'warning',
        title: 'Payback largo',
        description: `La recuperación de la inversión tomará más de 5 años.`,
      });
    }

    // Info insights
    if (van > 0) {
      insights.push({
        id: generateId(),
        type: 'info',
        title: 'VAN positivo',
        description: `El proyecto genera valor con un VAN de ${(van / 1000000).toFixed(0)}M.`,
      });
    }

    if (activities.length === 0) {
      insights.push({
        id: generateId(),
        type: 'error',
        title: 'Sin actividades',
        description: 'Agregue actividades al proyecto para generar proyecciones.',
        action: { label: 'Ir al Constructor', tab: 'constructor' },
      });
    }

    // Error insights
    if (ebitdaMensualBase < 0) {
      insights.push({
        id: generateId(),
        type: 'error',
        title: 'EBITDA negativo',
        description: 'El proyecto genera pérdidas operativas. Revise ingresos y costos.',
        action: { label: 'Revisar modelo', tab: 'constructor' },
      });
    }

    return {
      // Base/Madurez metrics (100% target occupancy - stable business state)
      // CRITICAL: These are MATURITY values, not Year 1 averages
      ingresosMensualesBase: ingresosMadurez,
      ingresosAnualesBase: ingresosMadurez * 12,
      
      // EBITDA = Ingresos - OPEX Caja (sin depreciación)
      ebitdaMensualBase,
      margenEbitdaBase,
      
      // EBIT = EBITDA - Depreciación
      ebitMensualBase,
      margenEbitBase,
      depreciacionMensual,
      
      capexTotal,
      tir,
      van,
      paybackMeses: Math.round(paybackSimple), // Payback Simple (using maturity EBITDA)
      paybackMesesReal: paybackMesesReal, // Payback Real (considering Year 1 ramp)
      
      // Working Capital
      workingCapitalMonths,
      workingCapitalValue,
      opexMensualBase: opexCajaMensualMadurez, // Use cash OPEX for Working Capital base
      
      proyeccion,
      year1Monthly,
      ingresosPorActividad,
      capexBreakdown: {
        actividades: capexActividades,
        infraestructura: capexEspacios,
        obraCivil: capexObraCivil,
        imprevistos: imprevistosValor,
        workingCapital: workingCapitalValue,
      },
      puntoEquilibrioMes,
      ocupacionPromedio,
      ticketPromedio,
      ingresosPorM2Anual: areaTotal > 0 ? (ingresosBrutosAno1 * 12) / areaTotal : 0,
      ebitdaPorM2Anual: areaTotal > 0 ? (ebitdaMensualBase * 12) / areaTotal : 0,
      areaTotal,
      loading,
      insights,
      activityInsights,
      spaceInsights,
      topActivitiesByRevenue,
      topActivitiesByMargin,
      worstPerformers,
      // Traffic breakdown
      trafficActivities,
      totalClubUsers: totalClubUsersFromOtherActivities,
      clubUsersBreakdown,
    };
  }, [currentProject, activities, opex, spaces, obraCivil, loading]);

  return metrics;
};
