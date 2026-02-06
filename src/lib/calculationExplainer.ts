/**
 * Calculation Explainer
 * Provides step-by-step breakdowns of how each KPI is calculated
 */

import { DashboardMetrics, ProjectionYear } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/currency';
import { CurrencyCode } from '@/types';

export type CalculationType = 
  | 'monthly_revenue'
  | 'monthly_opex' 
  | 'monthly_ebitda'
  | 'yearly_revenue'
  | 'yearly_opex'
  | 'yearly_ebitda'
  | 'capex_total'
  | 'tir'
  | 'van'
  | 'payback_months'
  | 'margin_ebitda'
  | 'break_even'
  | 'occupancy'
  | 'revenue_per_m2';

export interface CalculationStep {
  label: string;
  formula: string;
  value: number;
  formattedValue: string;
  explanation: string;
}

export interface CalculationExplanation {
  title: string;
  subtitle: string;
  result: number;
  formattedResult: string;
  steps: CalculationStep[];
  notes?: string[];
}

export interface ExplainerContext {
  metrics: DashboardMetrics;
  currency: CurrencyCode;
}

/**
 * Generate a step-by-step explanation for any KPI calculation
 */
export function explainCalculation(
  type: CalculationType,
  context: ExplainerContext
): CalculationExplanation {
  const { metrics, currency } = context;
  
  switch (type) {
    case 'monthly_revenue':
      return explainMonthlyRevenue(metrics, currency);
    case 'monthly_opex':
      return explainMonthlyOpex(metrics, currency);
    case 'monthly_ebitda':
      return explainMonthlyEbitda(metrics, currency);
    case 'yearly_revenue':
      return explainYearlyRevenue(metrics, currency);
    case 'yearly_opex':
      return explainYearlyOpex(metrics, currency);
    case 'yearly_ebitda':
      return explainYearlyEbitda(metrics, currency);
    case 'capex_total':
      return explainCapexTotal(metrics, currency);
    case 'tir':
      return explainTIR(metrics, currency);
    case 'van':
      return explainVAN(metrics, currency);
    case 'payback_months':
      return explainPayback(metrics, currency);
    case 'margin_ebitda':
      return explainMarginEbitda(metrics, currency);
    case 'break_even':
      return explainBreakEven(metrics, currency);
    case 'occupancy':
      return explainOccupancy(metrics, currency);
    case 'revenue_per_m2':
      return explainRevenuePerM2(metrics, currency);
    default:
      return {
        title: 'Cálculo no disponible',
        subtitle: 'Este tipo de cálculo no tiene explicación disponible',
        result: 0,
        formattedResult: '-',
        steps: [],
      };
  }
}

// === MONTHLY REVENUE ===
function explainMonthlyRevenue(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  const steps: CalculationStep[] = [];
  
  // Add steps for each activity
  metrics.ingresosPorActividad.forEach((act, idx) => {
    steps.push({
      label: `${idx + 1}. ${act.nombre}`,
      formula: `${formatPercent(act.porcentaje)} del total`,
      value: act.valor,
      formattedValue: formatCurrency(act.valor, currency),
      explanation: `Contribución de ${act.nombre} a los ingresos totales`,
    });
  });
  
  // Final sum
  steps.push({
    label: 'Total Ingresos Mensuales (Base)',
    formula: steps.length > 1 
      ? steps.slice(0, -1).map((_, i) => `Paso ${i + 1}`).join(' + ')
      : 'Suma de actividades',
    value: metrics.ingresosMensualesBase,
    formattedValue: formatCurrency(metrics.ingresosMensualesBase, currency),
    explanation: 'Suma de ingresos de todas las actividades a 100% de madurez',
  });
  
  return {
    title: 'Ingresos Mensuales Base',
    subtitle: 'Capacidad máxima del negocio (100% madurez)',
    result: metrics.ingresosMensualesBase,
    formattedResult: formatCurrency(metrics.ingresosMensualesBase, currency),
    steps,
    notes: [
      'Este valor representa la capacidad instalada cuando todas las actividades alcanzan su ocupación objetivo.',
      'Los ingresos reales del Año 1 serán menores debido a la curva de maduración.',
    ],
  };
}

// === MONTHLY OPEX ===
function explainMonthlyOpex(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  const opexMensual = metrics.proyeccion[0]?.opexMensual || 0;
  const ebitdaBase = metrics.ebitdaMensualBase;
  const ingresosBase = metrics.ingresosMensualesBase;
  const opexEstimado = ingresosBase - ebitdaBase;
  
  const steps: CalculationStep[] = [
    {
      label: '1. Nómina (Administrativa + Operativa)',
      formula: 'Suma de salarios + prestaciones',
      value: opexEstimado * 0.35, // Estimate
      formattedValue: formatCurrency(opexEstimado * 0.35, currency),
      explanation: 'Incluye salarios base más 53.94% de prestaciones sociales',
    },
    {
      label: '2. Servicios Públicos',
      formula: 'Energía + Agua + Gas + Internet',
      value: opexEstimado * 0.12,
      formattedValue: formatCurrency(opexEstimado * 0.12, currency),
      explanation: 'Gastos fijos y variables de servicios',
    },
    {
      label: '3. Arrendamiento',
      formula: 'Según modelo configurado',
      value: opexEstimado * 0.15,
      formattedValue: formatCurrency(opexEstimado * 0.15, currency),
      explanation: 'Puede ser fijo, variable o mixto según configuración',
    },
    {
      label: '4. Marketing y Tecnología',
      formula: 'Promoción + Software + Sistemas',
      value: opexEstimado * 0.08,
      formattedValue: formatCurrency(opexEstimado * 0.08, currency),
      explanation: 'Inversión en adquisición de clientes y herramientas',
    },
    {
      label: '5. Mantenimiento y Seguros',
      formula: 'Preventivo + Correctivo + Pólizas',
      value: opexEstimado * 0.10,
      formattedValue: formatCurrency(opexEstimado * 0.10, currency),
      explanation: 'Mantenimiento de instalaciones y cobertura de riesgos',
    },
    {
      label: '6. Impuestos y Gastos Financieros',
      formula: '4x1000 + Datafono + IVA neto',
      value: opexEstimado * 0.12,
      formattedValue: formatCurrency(opexEstimado * 0.12, currency),
      explanation: 'Obligaciones tributarias y comisiones bancarias',
    },
    {
      label: '7. Depreciación y Otros',
      formula: 'CAPEX / Años vida útil + Otros',
      value: opexEstimado * 0.08,
      formattedValue: formatCurrency(opexEstimado * 0.08, currency),
      explanation: 'Desgaste de activos (no efectivo) y gastos varios',
    },
    {
      label: 'Total OPEX Mensual',
      formula: 'Suma de categorías anteriores',
      value: opexMensual,
      formattedValue: formatCurrency(opexMensual, currency),
      explanation: 'Total de gastos operativos mensuales proyectados',
    },
  ];
  
  return {
    title: 'OPEX Mensual',
    subtitle: 'Gastos operativos del negocio',
    result: opexMensual,
    formattedResult: formatCurrency(opexMensual, currency),
    steps,
    notes: [
      'El OPEX incluye todos los gastos necesarios para operar el negocio.',
      'Algunos componentes varían proporcionalmente con los ingresos.',
    ],
  };
}

// === MONTHLY EBITDA ===
function explainMonthlyEbitda(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  const opexMensual = metrics.proyeccion[0]?.opexMensual || 0;
  
  const steps: CalculationStep[] = [
    {
      label: '1. Ingresos Mensuales Base',
      formula: 'Suma de todas las actividades',
      value: metrics.ingresosMensualesBase,
      formattedValue: formatCurrency(metrics.ingresosMensualesBase, currency),
      explanation: 'Ingresos totales a capacidad máxima',
    },
    {
      label: '2. OPEX Mensual',
      formula: 'Ver detalle de OPEX',
      value: opexMensual,
      formattedValue: formatCurrency(opexMensual, currency),
      explanation: 'Total de gastos operativos',
    },
    {
      label: '3. EBITDA = Ingresos - OPEX',
      formula: `${formatCurrency(metrics.ingresosMensualesBase, currency)} - ${formatCurrency(opexMensual, currency)}`,
      value: metrics.ebitdaMensualBase,
      formattedValue: formatCurrency(metrics.ebitdaMensualBase, currency),
      explanation: 'Utilidad operativa antes de intereses, impuestos, depreciación y amortización',
    },
    {
      label: '4. Margen EBITDA',
      formula: `(${formatCurrency(metrics.ebitdaMensualBase, currency)} / ${formatCurrency(metrics.ingresosMensualesBase, currency)}) × 100`,
      value: metrics.margenEbitdaBase,
      formattedValue: formatPercent(metrics.margenEbitdaBase),
      explanation: 'Porcentaje de ingresos que queda como utilidad operativa',
    },
  ];
  
  return {
    title: 'EBITDA Mensual Base',
    subtitle: 'Utilidad operativa del negocio',
    result: metrics.ebitdaMensualBase,
    formattedResult: formatCurrency(metrics.ebitdaMensualBase, currency),
    steps,
    notes: [
      'EBITDA = Earnings Before Interest, Taxes, Depreciation & Amortization',
      'Un margen EBITDA saludable para centros deportivos es 35-45%.',
    ],
  };
}

// === YEARLY REVENUE ===
function explainYearlyRevenue(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  const year1 = metrics.proyeccion[0];
  const year5 = metrics.proyeccion[metrics.proyeccion.length - 1];
  
  const steps: CalculationStep[] = [
    {
      label: '1. Ingresos Mensuales Base',
      formula: 'Capacidad máxima mensual',
      value: metrics.ingresosMensualesBase,
      formattedValue: formatCurrency(metrics.ingresosMensualesBase, currency),
      explanation: 'Ingresos mensuales a 100% de madurez',
    },
    {
      label: '2. Ingresos Anuales Base',
      formula: `${formatCurrency(metrics.ingresosMensualesBase, currency)} × 12 meses`,
      value: metrics.ingresosAnualesBase,
      formattedValue: formatCurrency(metrics.ingresosAnualesBase, currency),
      explanation: 'Proyección anualizada a capacidad máxima',
    },
  ];
  
  if (year1) {
    steps.push({
      label: '3. Ingresos Año 1 (con rampa)',
      formula: 'Curva de maduración aplicada',
      value: year1.ingresosAnuales,
      formattedValue: formatCurrency(year1.ingresosAnuales, currency),
      explanation: 'Considera la curva de crecimiento del primer año',
    });
  }
  
  if (year5) {
    steps.push({
      label: `4. Ingresos Año ${metrics.proyeccion.length}`,
      formula: `Año 1 × (1 + inflación)^${metrics.proyeccion.length - 1}`,
      value: year5.ingresosAnuales,
      formattedValue: formatCurrency(year5.ingresosAnuales, currency),
      explanation: 'Crecimiento proyectado considerando inflación',
    });
  }
  
  return {
    title: 'Ingresos Anuales',
    subtitle: 'Proyección de facturación',
    result: metrics.ingresosAnualesBase,
    formattedResult: formatCurrency(metrics.ingresosAnualesBase, currency),
    steps,
    notes: [
      'El valor base representa la capacidad instalada a madurez.',
      'Los años posteriores crecen según la inflación configurada.',
    ],
  };
}

// === YEARLY OPEX ===
function explainYearlyOpex(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  const year1 = metrics.proyeccion[0];
  const opexAnual = year1?.opexAnual || 0;
  
  const steps: CalculationStep[] = [
    {
      label: '1. OPEX Mensual Promedio',
      formula: 'Gastos operativos mensuales',
      value: year1?.opexMensual || 0,
      formattedValue: formatCurrency(year1?.opexMensual || 0, currency),
      explanation: 'Promedio mensual de gastos operativos',
    },
    {
      label: '2. OPEX Anual',
      formula: `${formatCurrency(year1?.opexMensual || 0, currency)} × 12 meses`,
      value: opexAnual,
      formattedValue: formatCurrency(opexAnual, currency),
      explanation: 'Total de gastos operativos del año',
    },
  ];
  
  return {
    title: 'OPEX Anual',
    subtitle: 'Gastos operativos anuales',
    result: opexAnual,
    formattedResult: formatCurrency(opexAnual, currency),
    steps,
    notes: [
      'Algunos gastos escalan proporcionalmente con los ingresos.',
      'Incluye nómina, servicios, arriendo, marketing, etc.',
    ],
  };
}

// === YEARLY EBITDA ===
function explainYearlyEbitda(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  const year1 = metrics.proyeccion[0];
  
  const steps: CalculationStep[] = [
    {
      label: '1. Ingresos Anuales',
      formula: 'Facturación total del año',
      value: year1?.ingresosAnuales || 0,
      formattedValue: formatCurrency(year1?.ingresosAnuales || 0, currency),
      explanation: 'Ingresos proyectados para el año',
    },
    {
      label: '2. OPEX Anual',
      formula: 'Gastos operativos del año',
      value: year1?.opexAnual || 0,
      formattedValue: formatCurrency(year1?.opexAnual || 0, currency),
      explanation: 'Total de costos operativos',
    },
    {
      label: '3. EBITDA Anual = Ingresos - OPEX',
      formula: `${formatCurrency(year1?.ingresosAnuales || 0, currency)} - ${formatCurrency(year1?.opexAnual || 0, currency)}`,
      value: year1?.ebitdaAnual || 0,
      formattedValue: formatCurrency(year1?.ebitdaAnual || 0, currency),
      explanation: 'Utilidad operativa anual del negocio',
    },
  ];
  
  return {
    title: 'EBITDA Anual',
    subtitle: 'Utilidad operativa anualizada',
    result: year1?.ebitdaAnual || 0,
    formattedResult: formatCurrency(year1?.ebitdaAnual || 0, currency),
    steps,
    notes: [
      'EBITDA = Ingresos - OPEX (identidad contable)',
      'Este valor se usa para calcular el flujo de caja y métricas de inversión.',
    ],
  };
}

// === CAPEX TOTAL ===
function explainCapexTotal(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  const { actividades, infraestructura, obraCivil } = metrics.capexBreakdown;
  const subtotal = actividades + infraestructura + obraCivil;
  const imprevistos = metrics.capexTotal - subtotal;
  
  const steps: CalculationStep[] = [
    {
      label: '1. CAPEX Actividades',
      formula: 'Construcción + Equipamiento + Mobiliario',
      value: actividades,
      formattedValue: formatCurrency(actividades, currency),
      explanation: 'Inversión en canchas, salas, equipos específicos',
    },
    {
      label: '2. CAPEX Infraestructura',
      formula: 'Áreas comunes + Equipamiento general',
      value: infraestructura,
      formattedValue: formatCurrency(infraestructura, currency),
      explanation: 'Inversión en recepción, baños, circulaciones, etc.',
    },
    {
      label: '3. CAPEX Obra Civil',
      formula: 'Construcción general + Estudios + Permisos',
      value: obraCivil,
      formattedValue: formatCurrency(obraCivil, currency),
      explanation: 'Cimientos, estructura, acabados generales',
    },
    {
      label: '4. Subtotal',
      formula: `${formatCurrency(actividades, currency)} + ${formatCurrency(infraestructura, currency)} + ${formatCurrency(obraCivil, currency)}`,
      value: subtotal,
      formattedValue: formatCurrency(subtotal, currency),
      explanation: 'Suma de todas las inversiones directas',
    },
    {
      label: '5. Imprevistos (Contingencia)',
      formula: `${formatCurrency(subtotal, currency)} × ${formatPercent((imprevistos / subtotal) * 100 || 10)}`,
      value: imprevistos,
      formattedValue: formatCurrency(imprevistos, currency),
      explanation: 'Reserva para gastos no previstos',
    },
    {
      label: '6. CAPEX Total',
      formula: `${formatCurrency(subtotal, currency)} + ${formatCurrency(imprevistos, currency)}`,
      value: metrics.capexTotal,
      formattedValue: formatCurrency(metrics.capexTotal, currency),
      explanation: 'Inversión total requerida para el proyecto',
    },
  ];
  
  return {
    title: 'Inversión Total (CAPEX)',
    subtitle: 'Capital de inversión requerido',
    result: metrics.capexTotal,
    formattedResult: formatCurrency(metrics.capexTotal, currency),
    steps,
    notes: [
      'CAPEX = Capital Expenditure (Gastos de Capital)',
      'Se recomienda mantener imprevistos entre 10-15% del subtotal.',
    ],
  };
}

// === TIR ===
function explainTIR(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  const steps: CalculationStep[] = [
    {
      label: '1. Inversión Inicial (CAPEX)',
      formula: 'Flujo Año 0 (negativo)',
      value: -metrics.capexTotal,
      formattedValue: formatCurrency(-metrics.capexTotal, currency),
      explanation: 'Capital inicial requerido para el proyecto',
    },
  ];
  
  metrics.proyeccion.forEach((year, idx) => {
    steps.push({
      label: `${idx + 2}. Flujo de Caja Año ${year.year}`,
      formula: `EBITDA${year.year === 1 ? ' - CAPEX' : ''}`,
      value: year.flujoCaja,
      formattedValue: formatCurrency(year.flujoCaja, currency),
      explanation: `Flujo neto generado en el año ${year.year}`,
    });
  });
  
  steps.push({
    label: `${metrics.proyeccion.length + 2}. TIR (Tasa Interna de Retorno)`,
    formula: 'VAN(TIR) = 0',
    value: metrics.tir,
    formattedValue: formatPercent(metrics.tir),
    explanation: 'Tasa que hace el VAN igual a cero',
  });
  
  return {
    title: 'Tasa Interna de Retorno (TIR)',
    subtitle: 'Rentabilidad anualizada del proyecto',
    result: metrics.tir,
    formattedResult: formatPercent(metrics.tir),
    steps,
    notes: [
      'TIR > 15% se considera atractiva para inversionistas.',
      'Representa el rendimiento promedio anual de la inversión.',
      'Se calcula iterativamente hasta encontrar la tasa donde VAN = 0.',
    ],
  };
}

// === VAN ===
function explainVAN(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  const discountRate = 12; // From config
  
  const steps: CalculationStep[] = [
    {
      label: '1. Inversión Inicial',
      formula: 'Flujo Año 0',
      value: -metrics.capexTotal,
      formattedValue: formatCurrency(-metrics.capexTotal, currency),
      explanation: 'No se descuenta (es el momento presente)',
    },
  ];
  
  let sumVP = -metrics.capexTotal;
  metrics.proyeccion.forEach((year, idx) => {
    const vp = year.flujoCaja / Math.pow(1 + discountRate / 100, year.year);
    sumVP += vp;
    steps.push({
      label: `${idx + 2}. VP Flujo Año ${year.year}`,
      formula: `${formatCurrency(year.flujoCaja, currency)} / (1 + ${discountRate}%)^${year.year}`,
      value: vp,
      formattedValue: formatCurrency(vp, currency),
      explanation: `Flujo del año ${year.year} traído a valor presente`,
    });
  });
  
  steps.push({
    label: `${metrics.proyeccion.length + 2}. VAN Total`,
    formula: 'Σ Valores Presentes',
    value: metrics.van,
    formattedValue: formatCurrency(metrics.van, currency),
    explanation: 'Suma de todos los flujos descontados',
  });
  
  return {
    title: 'Valor Actual Neto (VAN)',
    subtitle: `Valor presente a tasa del ${discountRate}%`,
    result: metrics.van,
    formattedResult: formatCurrency(metrics.van, currency),
    steps,
    notes: [
      'VAN positivo = El proyecto genera valor por encima de la tasa requerida.',
      'VAN negativo = El proyecto no cumple con la rentabilidad esperada.',
      `La tasa de descuento del ${discountRate}% representa el costo de oportunidad del capital.`,
    ],
  };
}

// === PAYBACK ===
function explainPayback(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  let flujoAcumulado = -metrics.capexTotal;
  
  const steps: CalculationStep[] = [
    {
      label: '1. Inversión Inicial',
      formula: 'CAPEX Total',
      value: -metrics.capexTotal,
      formattedValue: formatCurrency(-metrics.capexTotal, currency),
      explanation: 'Punto de partida (flujo negativo)',
    },
  ];
  
  for (let year = 1; year <= metrics.proyeccion.length; year++) {
    const yearData = metrics.proyeccion[year - 1];
    if (!yearData) continue;
    
    const ebitdaMensual = yearData.ebitdaMensual;
    
    for (let mes = 1; mes <= 12; mes++) {
      flujoAcumulado += ebitdaMensual;
      const mesAbsoluto = (year - 1) * 12 + mes;
      
      if (flujoAcumulado >= 0 || mesAbsoluto === metrics.paybackMeses) {
        steps.push({
          label: `2. EBITDA Mensual Año ${year}`,
          formula: 'Utilidad operativa mensual',
          value: ebitdaMensual,
          formattedValue: formatCurrency(ebitdaMensual, currency),
          explanation: `Flujo mensual que recupera la inversión`,
        });
        
        steps.push({
          label: `3. Punto de Recuperación`,
          formula: `Mes ${metrics.paybackMeses} ≈ ${(metrics.paybackMeses / 12).toFixed(1)} años`,
          value: metrics.paybackMeses,
          formattedValue: `${metrics.paybackMeses} meses`,
          explanation: 'Momento en que el flujo acumulado se vuelve positivo',
        });
        
        steps.push({
          label: '4. Flujo Acumulado al Payback',
          formula: 'Inversión + Suma EBITDA',
          value: flujoAcumulado,
          formattedValue: formatCurrency(Math.max(0, flujoAcumulado), currency),
          explanation: 'Saldo después de recuperar la inversión',
        });
        
        break;
      }
    }
    
    if (flujoAcumulado >= 0) break;
  }
  
  return {
    title: 'Periodo de Recuperación (Payback)',
    subtitle: 'Tiempo para recuperar la inversión',
    result: metrics.paybackMeses,
    formattedResult: `${metrics.paybackMeses} meses`,
    steps,
    notes: [
      'Payback < 36 meses es excelente para proyectos deportivos.',
      'Payback 36-60 meses es aceptable.',
      'Payback > 60 meses indica alto riesgo de recuperación.',
    ],
  };
}

// === MARGEN EBITDA ===
function explainMarginEbitda(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  const opexMensual = metrics.proyeccion[0]?.opexMensual || 0;
  
  const steps: CalculationStep[] = [
    {
      label: '1. Ingresos Mensuales',
      formula: 'Total facturación mensual',
      value: metrics.ingresosMensualesBase,
      formattedValue: formatCurrency(metrics.ingresosMensualesBase, currency),
      explanation: 'Base de cálculo del margen',
    },
    {
      label: '2. EBITDA Mensual',
      formula: 'Ingresos - OPEX',
      value: metrics.ebitdaMensualBase,
      formattedValue: formatCurrency(metrics.ebitdaMensualBase, currency),
      explanation: 'Utilidad operativa mensual',
    },
    {
      label: '3. Margen EBITDA',
      formula: `(${formatCurrency(metrics.ebitdaMensualBase, currency)} / ${formatCurrency(metrics.ingresosMensualesBase, currency)}) × 100`,
      value: metrics.margenEbitdaBase,
      formattedValue: formatPercent(metrics.margenEbitdaBase),
      explanation: 'Porcentaje de ingresos que es utilidad',
    },
  ];
  
  return {
    title: 'Margen EBITDA',
    subtitle: 'Eficiencia operativa del negocio',
    result: metrics.margenEbitdaBase,
    formattedResult: formatPercent(metrics.margenEbitdaBase),
    steps,
    notes: [
      'Margen > 40% es excelente para centros deportivos.',
      'Margen 30-40% es saludable.',
      'Margen < 30% indica oportunidad de optimizar costos.',
    ],
  };
}

// === BREAK EVEN ===
function explainBreakEven(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  const steps: CalculationStep[] = [
    {
      label: '1. Inversión Inicial (CAPEX)',
      formula: 'Capital a recuperar',
      value: metrics.capexTotal,
      formattedValue: formatCurrency(metrics.capexTotal, currency),
      explanation: 'Monto total que debe recuperarse',
    },
    {
      label: '2. EBITDA Mensual Promedio',
      formula: 'Flujo mensual de recuperación',
      value: metrics.ebitdaMensualBase,
      formattedValue: formatCurrency(metrics.ebitdaMensualBase, currency),
      explanation: 'Cantidad que se recupera cada mes',
    },
    {
      label: '3. Meses hasta Punto de Equilibrio',
      formula: `${formatCurrency(metrics.capexTotal, currency)} / ${formatCurrency(metrics.ebitdaMensualBase, currency)}`,
      value: metrics.puntoEquilibrioMes,
      formattedValue: `Mes ${metrics.puntoEquilibrioMes}`,
      explanation: 'Momento en que se recupera el CAPEX completo',
    },
  ];
  
  return {
    title: 'Punto de Equilibrio',
    subtitle: 'Mes de recuperación de inversión',
    result: metrics.puntoEquilibrioMes,
    formattedResult: `Mes ${metrics.puntoEquilibrioMes}`,
    steps,
    notes: [
      'Este es el punto donde el flujo acumulado supera la inversión inicial.',
      'A partir de este mes, el proyecto genera retorno neto positivo.',
    ],
  };
}

// === OCCUPANCY ===
function explainOccupancy(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  const steps: CalculationStep[] = [];
  
  // Add activity-specific occupancy
  metrics.activityInsights.forEach((act, idx) => {
    if (act.ocupacionPromedio > 0) {
      steps.push({
        label: `${idx + 1}. ${act.nombre}`,
        formula: `Ocupación actual / Objetivo`,
        value: act.ocupacionPromedio,
        formattedValue: formatPercent(act.ocupacionPromedio),
        explanation: `Objetivo: ${formatPercent(act.ocupacionTarget)}`,
      });
    }
  });
  
  steps.push({
    label: 'Ocupación Promedio Ponderada',
    formula: 'Σ(ocupación × horas) / Σ(horas)',
    value: metrics.ocupacionPromedio,
    formattedValue: formatPercent(metrics.ocupacionPromedio),
    explanation: 'Promedio ponderado por horas de operación',
  });
  
  return {
    title: 'Ocupación Promedio',
    subtitle: 'Utilización de capacidad instalada',
    result: metrics.ocupacionPromedio,
    formattedResult: formatPercent(metrics.ocupacionPromedio),
    steps,
    notes: [
      'Ocupación > 70% es excelente.',
      'Ocupación 50-70% es buena.',
      'Ocupación < 50% indica subutilización.',
    ],
  };
}

// === REVENUE PER M2 ===
function explainRevenuePerM2(metrics: DashboardMetrics, currency: CurrencyCode): CalculationExplanation {
  const steps: CalculationStep[] = [
    {
      label: '1. Ingresos Anuales',
      formula: 'Total facturación anual',
      value: metrics.ingresosAnualesBase,
      formattedValue: formatCurrency(metrics.ingresosAnualesBase, currency),
      explanation: 'Ingresos totales del proyecto',
    },
    {
      label: '2. Área Total del Proyecto',
      formula: 'Superficie total en m²',
      value: metrics.areaTotal,
      formattedValue: `${formatNumber(metrics.areaTotal)} m²`,
      explanation: 'Incluye todas las áreas del proyecto',
    },
    {
      label: '3. Ingresos por m²',
      formula: `${formatCurrency(metrics.ingresosAnualesBase, currency)} / ${formatNumber(metrics.areaTotal)} m²`,
      value: metrics.ingresosPorM2Anual,
      formattedValue: formatCurrency(metrics.ingresosPorM2Anual, currency),
      explanation: 'Productividad por metro cuadrado',
    },
  ];
  
  return {
    title: 'Ingresos por m²',
    subtitle: 'Productividad del espacio',
    result: metrics.ingresosPorM2Anual,
    formattedResult: formatCurrency(metrics.ingresosPorM2Anual, currency),
    steps,
    notes: [
      'Gimnasios: $10M - $15M/m²/año (referencia Colombia)',
      'Pádel/Tenis: $8M - $12M/m²/año',
      'Fútbol: $5M - $8M/m²/año',
    ],
  };
}
