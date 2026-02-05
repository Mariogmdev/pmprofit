import { useMemo } from 'react';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { useProjectOpex } from '@/hooks/useProjectOpex';
import { useProjectSpaces } from '@/hooks/useProjectSpaces';
import { useObraCivil } from '@/hooks/useObraCivil';
import { useProject } from '@/contexts/ProjectContext';
import { DashboardMetrics, DashboardInsight, ProjectionYear, ActivityInsight, SpaceInsight, CHART_COLORS } from '@/types/dashboard';
import { ActivityConfig } from '@/types/activity';
import { ServiceItem, RentCalculationBase } from '@/types/opex';
import { ProjectSpace } from '@/types/infrastructure';
import { calculateActivityFinancials, calculateOccupancyTarget, calculateYear1IncomeFromProjection } from '@/lib/activityCalculations';

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
    const totalClubUsersFromOtherActivities = activities
      .filter(a => a.config.modeloIngreso !== 'trafico')
      .reduce((sum, a) => {
        const financials = calculateActivityFinancials(a.config, daysPerMonth, 0);
        return sum + financials.totalUsuariosMes;
      }, 0);
    
    // Calculate financials for each activity using centralized function
    // IMPORTANT: For Year 1, we need to consider the monthly occupation projection (maturity curve)
    const activityFinancials = activities.map(act => {
      const financials = calculateActivityFinancials(
        act.config,
        daysPerMonth,
        act.config.modeloIngreso === 'trafico' ? totalClubUsersFromOtherActivities : 0
      );
      
      // Calculate Year 1 income considering monthly occupation projection
      const year1Income = calculateYear1IncomeFromProjection(
        act.config,
        daysPerMonth,
        act.config.modeloIngreso === 'trafico' ? totalClubUsersFromOtherActivities : 0
      );
      
      return {
        activity: act,
        financials,
        year1Income,
      };
    });
    
    // Sum up total income from all activities
    // Use Year 1 monthly average (which considers maturity curve)
    let ingresosBrutosAno1 = 0;
    let ingresosOperacionales = 0;
    let totalReservas = 0;
    let ocupacionTotal = 0;
    let horasTotal = 0;
    let ticketTotal = 0;
    let ticketCount = 0;

    const ingresosPorActividad: DashboardMetrics['ingresosPorActividad'] = [];

    // Aggregate the 12-month Year 1 income curve across ALL activities.
    // Source of truth: calculateYear1IncomeFromProjection(...).months
    const year1IncomeMonths = Array(12).fill(0) as number[];

    activityFinancials.forEach(({ activity, financials, year1Income }, idx) => {
      // Use Year 1 monthly average (considers maturity curve)
      const ingresoEstimado = year1Income.monthlyAverage;
      
      ingresosBrutosAno1 += ingresoEstimado;
      ingresosOperacionales += ingresoEstimado;
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

      if (ingresoEstimado > 0) {
        ingresosPorActividad.push({
          nombre: activity.name,
          valor: ingresoEstimado,
          porcentaje: 0, // Will calculate after total
          color: CHART_COLORS.activities[idx % CHART_COLORS.activities.length],
        });
      }

      year1Income.months.forEach((m, monthIdx) => {
        year1IncomeMonths[monthIdx] += m || 0;
      });
    });

    // Build detailed Year 1 monthly breakdown for Dashboard "Mensual Año 1".
    // NOTE: OPEX and EBITDA distribution is proportional to the income curve.
    const year1IncomeTotal = year1IncomeMonths.reduce((sum, v) => sum + v, 0);
    const year1IncomeAvg = year1IncomeTotal / 12;

    // Calculate percentages
    ingresosPorActividad.forEach(item => {
      item.porcentaje = ingresosBrutosAno1 > 0 ? (item.valor / ingresosBrutosAno1) * 100 : 0;
    });

    const ingresosNetos = ingresosBrutosAno1 * 0.85;
    const ocupacionPromedio = horasTotal > 0 ? ocupacionTotal / horasTotal : 0;
    const ticketPromedio = ticketCount > 0 ? ticketTotal / ticketCount : 0;

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
    
    // Subtotal before contingencies
    const capexSubtotal = capexActividades + capexEspacios + capexObraCivil;
    
    // Contingencies (imprevistos) - use percentage from obraCivil config
    // This ensures CONSISTENCY with InfrastructureSummary which uses the same source
    const imprevistosPorcentaje = obraCivil?.imprevistos_porcentaje ?? 10;
    const imprevistosValor = capexSubtotal * (imprevistosPorcentaje / 100);
    
    // TOTAL CAPEX = Subtotal + Contingencies
    // CRITICAL: This must match InfrastructureSummary calculation exactly
    const capexTotal = capexSubtotal + imprevistosValor;

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

    const calculateOpexMensual = (ingresosBrutos: number, capex: number) => {
      const ingresosNetos = ingresosBrutos * 0.85;

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

      // Depreciation
      const depreciacionAnos = opex?.depreciacion_anos || 10;
      const incluirDepreciacion = opex?.incluir_depreciacion !== false;
      const depreciacion = incluirDepreciacion ? (capex / depreciacionAnos / 12) : 0;

      // Base OPEX (without rent and commissions)
      const opexSinArriendoNiComisiones = totalNomina + serviciosPublicos + marketing +
        tecnologia + seguridad + seguros + mantenimientoGeneral + mantenimientoActividades +
        administrativos + gastosFinancieros + impuestos + otrosGastos + depreciacion;

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
      const utilidadesAntesComisiones = Math.max(0, ingresosBrutos - opexSinComisiones);

      // Commissions
      const comisiones = (opex?.comisiones || []).reduce((sum, com) => {
        let base = ingresosBrutos;
        if (com.base === 'ingresos-netos') base = ingresosNetos;
        if (com.base === 'utilidades') base = utilidadesAntesComisiones;
        return sum + (base * ((com.porcentaje || 0) / 100));
      }, 0);

      return opexSinComisiones + comisiones;
    };

    // === BUILD 5-YEAR PROJECTION ===
    const proyeccion: ProjectionYear[] = [];
    let flujoAcumulado = -capexTotal;
    let paybackMeses = 0;
    let paybackAlcanzado = false;

    for (let year = 1; year <= projectionYears; year++) {
      const growthFactor = Math.pow(1 + inflationRate / 100, year - 1);
      const ingresosMensuales = ingresosBrutosAno1 * growthFactor;
      const ingresosAnuales = ingresosMensuales * 12;
      const opexMensual = calculateOpexMensual(ingresosMensuales, capexTotal);
      const opexAnual = opexMensual * 12;
      const ebitdaMensual = ingresosMensuales - opexMensual;
      const ebitdaAnual = ebitdaMensual * 12;
      const margenEbitda = ingresosMensuales > 0 ? (ebitdaMensual / ingresosMensuales) * 100 : 0;
      
      const capex = year === 1 ? capexTotal : 0;
      const flujoCaja = ebitdaAnual - capex;
      flujoAcumulado += flujoCaja;
      
      if (!paybackAlcanzado && flujoAcumulado >= 0) {
        paybackAlcanzado = true;
        // Calculate exact month within the year
        const flujoAnterior = flujoAcumulado - flujoCaja;
        const mesesEnAno = Math.ceil((-flujoAnterior / flujoCaja) * 12);
        paybackMeses = (year - 1) * 12 + Math.min(mesesEnAno, 12);
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
      paybackMeses = projectionYears * 12 + 12; // Beyond projection
    }

    const baseOpexMensualAno1 = proyeccion[0]?.opexMensual || 0;
    const year1Monthly: DashboardMetrics['year1Monthly'] = MONTH_NAMES.map((mes, idx) => {
      const ingresos = year1IncomeMonths[idx] || 0;
      const factor = year1IncomeAvg > 0 ? ingresos / year1IncomeAvg : 1;
      const opex = baseOpexMensualAno1 * factor;
      const ebitda = ingresos - opex;
      return { mes, ingresos, opex, ebitda };
    });

    // === CALCULATE TIR (Simple approximation) ===
    // Using Newton-Raphson or bisection for real TIR would be more accurate
    // Here we use a simplified approach
    const calculateTIR = () => {
      const cashFlows = proyeccion.map(p => p.flujoCaja);
      cashFlows.unshift(-capexTotal); // Initial investment
      
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
    const calculateVAN = () => {
      const cashFlows = proyeccion.map(p => p.flujoCaja);
      cashFlows.unshift(-capexTotal);
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
    const activityInsights: ActivityInsight[] = activityFinancials.map(({ activity, financials, year1Income }) => {
      const config: ActivityConfig = activity.config;
      
      const ocupacionTarget = calculateOccupancyTarget(config);
      
      // Use Year 1 monthly average for income (considers maturity curve)
      const ingresosMensualesYear1 = year1Income.monthlyAverage;
      
      // Generate activity-specific insights
      const actInsights: ActivityInsight['insights'] = [];
      
      if (financials.margenEbitda >= 40) {
        actInsights.push({ type: 'success', message: 'Margen saludable (>40%)', action: undefined });
      } else if (financials.margenEbitda < 20) {
        actInsights.push({ type: 'warning', message: `Margen bajo (${financials.margenEbitda.toFixed(0)}%). Revisar tarifas o costos.` });
      }
      
      if (financials.ocupacionPromedio >= ocupacionTarget * 0.9) {
        actInsights.push({ type: 'success', message: 'Ocupación cerca del objetivo' });
      } else if (financials.ocupacionPromedio < ocupacionTarget * 0.7) {
        actInsights.push({ type: 'warning', message: `Ocupación baja (${financials.ocupacionPromedio.toFixed(0)}% vs ${ocupacionTarget.toFixed(0)}% target)` });
      }
      
      if (financials.paybackMeses <= 24) {
        actInsights.push({ type: 'success', message: `Payback rápido: ${financials.paybackMeses} meses` });
      } else if (financials.paybackMeses > 48) {
        actInsights.push({ type: 'warning', message: `Payback largo: ${financials.paybackMeses} meses` });
      }
      
      if (ingresosMensualesYear1 > 0 && financials.capexTotal === 0) {
        actInsights.push({ type: 'opportunity', message: 'Sin CAPEX registrado - Verificar inversión' });
      }

      if (financials.ebitdaMensual < 0) {
        actInsights.push({ type: 'warning', message: 'EBITDA negativo - Requiere atención' });
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
        paybackMeses: financials.paybackMeses,
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
    const ebitdaMensualBase = proyeccion[0]?.ebitdaMensual || 0;
    const margenEbitdaBase = proyeccion[0]?.margenEbitda || 0;
    const opexPorcentaje = ingresosBrutosAno1 > 0 
      ? ((proyeccion[0]?.opexMensual || 0) / ingresosBrutosAno1) * 100 
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

    if (paybackMeses <= 36) {
      insights.push({
        id: generateId(),
        type: 'success',
        title: 'Recuperación rápida',
        description: `La inversión se recupera en ${paybackMeses} meses (${(paybackMeses / 12).toFixed(1)} años).`,
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

    if (paybackMeses > 60) {
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
      // Base/Madurez metrics (100% ocupación objetivo)
      ingresosMensualesBase: ingresosBrutosAno1,
      ingresosAnualesBase: ingresosBrutosAno1 * 12,
      ebitdaMensualBase,
      margenEbitdaBase,
      capexTotal,
      tir,
      van,
      paybackMeses,
      proyeccion,
      year1Monthly,
      ingresosPorActividad,
      capexBreakdown: {
        actividades: capexActividades,
        infraestructura: capexEspacios,
        obraCivil: capexObraCivil,
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
    };
  }, [currentProject, activities, opex, spaces, obraCivil, loading]);

  return metrics;
};
