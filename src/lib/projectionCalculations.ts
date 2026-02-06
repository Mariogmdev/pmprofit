/**
 * Projection calculations for revenue and occupancy forecasting
 * 
 * These calculations apply growth curves OVER the base occupancy from schedules.
 * The base occupancy comes from the schedule configuration in activityCalculations.ts
 * 
 * IMPORTANT:
 * - Growth curves modify OCCUPANCY, not raw income
 * - Income scales proportionally with occupancy changes
 * - Uses dynamic weeks/month based on project configuration (daysPerMonth/7)
 */

export interface MonthlyProjectionItem {
  mes: number;
  factorMadurez: number;
  ocupacionPromedio: number;
  ingresosMensuales: number;
}

export interface MonthlyProjectionResult {
  meses: MonthlyProjectionItem[];
  ingresoAnual: number;
  ingresoMensualPromedio: number;
  ocupacionPromedioAnual: number;
}

export interface YearlyProjectionItem {
  year: number;
  ocupacionPromedio: number;
  factorTarifa: number;
  ingresoAnual: number;
  ingresoMensual: number;
}

/**
 * Calculate monthly projection for Year 1 with growth curve
 * 
 * @param ingresosMesBase - Base monthly income (at schedule occupancy, 100% maturity)
 * @param ocupacionBase - Base occupancy from schedules (weighted average %)
 * @param inicioProyecto - Starting maturity factor (e.g., 70 = 70%)
 * @param madurezProyecto - Final maturity factor (e.g., 100 = 100%)
 * @param tipoCurva - Curve type: 'lineal' or 's-curve'
 * 
 * Example with ocupacionBase=32%, inicioProyecto=70, madurezProyecto=100:
 * - Month 1: 32% × 70% = 22.4% → Income = $52.9M × (22.4/32) = $37M
 * - Month 12: 32% × 100% = 32% → Income = $52.9M × (32/32) = $52.9M
 * - Average: ~$45M/month
 */
export function calculateMonthlyProjection(
  ingresosMesBase: number,
  ocupacionBase: number,
  inicioProyecto: number = 70,
  madurezProyecto: number = 100,
  tipoCurva: 'lineal' | 's-curve' = 'lineal'
): MonthlyProjectionResult {
  const meses: MonthlyProjectionItem[] = [];
  
  // Prevent division by zero
  if (ocupacionBase <= 0) {
    return {
      meses: Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        factorMadurez: 0,
        ocupacionPromedio: 0,
        ingresosMensuales: 0
      })),
      ingresoAnual: 0,
      ingresoMensualPromedio: 0,
      ocupacionPromedioAnual: 0
    };
  }
  
  for (let mes = 1; mes <= 12; mes++) {
    let factorMadurez: number;
    
    if (tipoCurva === 'lineal') {
      // Linear growth from inicio to madurez over 12 months
      const incrementoPorMes = (madurezProyecto - inicioProyecto) / 11;
      factorMadurez = inicioProyecto + (incrementoPorMes * (mes - 1));
    } else {
      // S-curve: slow start, fast middle, slow end
      const t = (mes - 1) / 11; // Normalize 0-1
      const s = 1 / (1 + Math.exp(-10 * (t - 0.5))); // Sigmoid function
      factorMadurez = inicioProyecto + (s * (madurezProyecto - inicioProyecto));
    }
    
    // Apply maturity factor to base occupancy
    // ocupacionMes = ocupacionBase × (factorMadurez / 100)
    const ocupacionMes = ocupacionBase * (factorMadurez / 100);
    
    // Income scales proportionally with occupancy
    // ingresosMes = ingresosMesBase × (ocupacionMes / ocupacionBase)
    const ingresosMes = ingresosMesBase * (ocupacionMes / ocupacionBase);
    
    meses.push({
      mes,
      factorMadurez,
      ocupacionPromedio: ocupacionMes,
      ingresosMensuales: ingresosMes
    });
  }
  
  // Calculate annual totals
  const ingresoAnual = meses.reduce((sum, m) => sum + m.ingresosMensuales, 0);
  const ocupacionPromedioAnual = meses.reduce((sum, m) => sum + m.ocupacionPromedio, 0) / 12;
  
  return {
    meses,
    ingresoAnual,
    ingresoMensualPromedio: ingresoAnual / 12,
    ocupacionPromedioAnual
  };
}

/**
 * Calculate 5-year projection with occupancy growth and inflation
 * 
 * @param ingresoAno1 - Total annual income for Year 1 (after monthly curve)
 * @param ocupacionAno1 - Average occupancy for Year 1
 * @param tasaCrecimientoOcupacion - Annual occupancy growth rate (e.g., 5 = 5%)
 * @param tasaInflacion - Annual inflation rate for pricing (e.g., 3 = 3%)
 * @param anos - Number of years to project (default 5)
 * 
 * Growth formula:
 * - Year N occupancy = Year N-1 occupancy × (1 + growth%)
 * - Year N tariff factor = Year N-1 factor × (1 + inflation%)
 * - Year N income = Year 1 income × (occupancy factor) × (tariff factor)
 */
export function calculateYearlyProjection(
  ingresoAno1: number,
  ocupacionAno1: number,
  tasaCrecimientoOcupacion: number = 5,
  tasaInflacion: number = 3,
  anos: number = 5
): YearlyProjectionItem[] {
  const years: YearlyProjectionItem[] = [];
  
  // Prevent division by zero
  if (ocupacionAno1 <= 0 || ingresoAno1 <= 0) {
    return Array.from({ length: anos }, (_, i) => ({
      year: i + 1,
      ocupacionPromedio: 0,
      factorTarifa: 1,
      ingresoAnual: 0,
      ingresoMensual: 0
    }));
  }
  
  let ocupacionActual = ocupacionAno1;
  let factorTarifa = 1.0;
  
  for (let year = 1; year <= anos; year++) {
    if (year === 1) {
      // Year 1 uses the calculated values directly
      years.push({
        year: 1,
        ocupacionPromedio: ocupacionAno1,
        factorTarifa: 1.0,
        ingresoAnual: ingresoAno1,
        ingresoMensual: ingresoAno1 / 12
      });
      continue;
    }
    
    // Years 2+: apply growth rates
    // Occupancy grows by the growth rate
    ocupacionActual = ocupacionActual * (1 + tasaCrecimientoOcupacion / 100);
    
    // Cap occupancy at reasonable max (e.g., 95%)
    ocupacionActual = Math.min(ocupacionActual, 95);
    
    // Tariff grows by inflation
    factorTarifa = factorTarifa * (1 + tasaInflacion / 100);
    
    // Income = Year 1 income × (new occupancy / Year 1 occupancy) × tariff factor
    const factorOcupacion = ocupacionActual / ocupacionAno1;
    const ingresoAnual = ingresoAno1 * factorOcupacion * factorTarifa;
    
    years.push({
      year,
      ocupacionPromedio: ocupacionActual,
      factorTarifa,
      ingresoAnual,
      ingresoMensual: ingresoAnual / 12
    });
  }
  
  return years;
}

/**
 * Get default maturity curve parameters based on activity type
 */
export function getDefaultCurveParams(modeloIngreso: string): { inicio: number; madurez: number; curva: 'lineal' | 's-curve' } {
  switch (modeloIngreso) {
    case 'membresia':
      // Memberships tend to grow more slowly
      return { inicio: 50, madurez: 100, curva: 's-curve' };
    case 'trafico':
      // Traffic can be variable
      return { inicio: 60, madurez: 100, curva: 'lineal' };
    case 'pase-diario':
      // Daily passes can ramp up faster
      return { inicio: 70, madurez: 100, curva: 'lineal' };
    case 'reserva':
    default:
      // Reservation-based activities
    return { inicio: 70, madurez: 100, curva: 'lineal' };
  }
}

/**
 * Quarterly projection item with accounting identity preserved
 */
export interface QuarterlyProjectionItem {
  q: string;
  ingresos: number;
  opex: number;
  ebitda: number; // Always calculated as ingresos - opex
}

export interface QuarterlyProjectionYear {
  year: number;
  quarters: QuarterlyProjectionItem[];
}

/**
 * Monthly data structure for quarterly aggregation
 */
export interface MonthlyFinancialData {
  mes: string;
  ingresos: number;
  opex: number;
  ebitda: number;
}

/**
 * Calculate quarterly projection from REAL monthly data
 * 
 * CRITICAL: Each quarter sums its 3 actual months
 * EBITDA is ALWAYS calculated as Ingresos - OPEX (never distributed)
 * 
 * @param year1Monthly - Array of 12 monthly data points
 * @returns Quarterly breakdown with calculated EBITDA
 */
export function calculateQuarterlyFromMonths(
  year1Monthly: MonthlyFinancialData[]
): QuarterlyProjectionItem[] {
  if (!year1Monthly || year1Monthly.length < 12) {
    return [
      { q: 'Q1', ingresos: 0, opex: 0, ebitda: 0 },
      { q: 'Q2', ingresos: 0, opex: 0, ebitda: 0 },
      { q: 'Q3', ingresos: 0, opex: 0, ebitda: 0 },
      { q: 'Q4', ingresos: 0, opex: 0, ebitda: 0 },
    ];
  }

  const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
  const quarters: QuarterlyProjectionItem[] = [];

  for (let qIdx = 0; qIdx < 4; qIdx++) {
    const startMonth = qIdx * 3;
    const endMonth = startMonth + 3;
    
    // Sum the 3 REAL months for this quarter
    let ingresos = 0;
    let opex = 0;
    
    for (let m = startMonth; m < endMonth; m++) {
      ingresos += year1Monthly[m]?.ingresos || 0;
      opex += year1Monthly[m]?.opex || 0;
    }
    
    // CRITICAL: Calculate EBITDA to preserve accounting identity
    // EBITDA = Ingresos - OPEX (never use weights or distribution)
    const ebitda = ingresos - opex;
    
    quarters.push({
      q: quarterNames[qIdx],
      ingresos,
      opex,
      ebitda,
    });
  }

  return quarters;
}

/**
 * Generate quarterly data for multiple years
 * 
 * Year 1: Uses actual monthly data for accurate quarterly breakdown
 * Years 2+: Uses uniform distribution (25% each) since we don't have monthly projections
 * 
 * @param year1Monthly - Real monthly data for Year 1
 * @param proyeccion - Multi-year projection data
 */
export function generateQuarterlyProjectionByYear(
  proyeccion: Array<{
    year: number;
    ingresosAnuales: number;
    opexAnual: number;
    ebitdaAnual: number;
  }>,
  year1Monthly?: MonthlyFinancialData[]
): QuarterlyProjectionYear[] {
  return proyeccion.map(year => {
    if (year.year === 1 && year1Monthly && year1Monthly.length >= 12) {
      // Year 1: Use REAL monthly data
      return {
        year: year.year,
        quarters: calculateQuarterlyFromMonths(year1Monthly),
      };
    } else {
      // Years 2+: Uniform distribution (no monthly detail available)
      // Each quarter gets 25% of annual values
      const quarterlyIngresos = year.ingresosAnuales / 4;
      const quarterlyOpex = year.opexAnual / 4;
      const quarterlyEbitda = quarterlyIngresos - quarterlyOpex;
      
      return {
        year: year.year,
        quarters: [
          { q: 'Q1', ingresos: quarterlyIngresos, opex: quarterlyOpex, ebitda: quarterlyEbitda },
          { q: 'Q2', ingresos: quarterlyIngresos, opex: quarterlyOpex, ebitda: quarterlyEbitda },
          { q: 'Q3', ingresos: quarterlyIngresos, opex: quarterlyOpex, ebitda: quarterlyEbitda },
          { q: 'Q4', ingresos: quarterlyIngresos, opex: quarterlyOpex, ebitda: quarterlyEbitda },
        ],
      };
    }
  });
}
