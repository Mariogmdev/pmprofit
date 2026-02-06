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
 * Distribution weights for quarterly calculations
 * Default is uniform (25% each quarter)
 * Can be customized for seasonality
 */
export interface QuarterlyWeights {
  ingresos: [number, number, number, number]; // Must sum to 1.0
  opex: [number, number, number, number];     // Must sum to 1.0
}

export const DEFAULT_QUARTERLY_WEIGHTS: QuarterlyWeights = {
  ingresos: [0.25, 0.25, 0.25, 0.25],
  opex: [0.25, 0.25, 0.25, 0.25]
};

/**
 * Calculate quarterly projection preserving accounting identity
 * 
 * CRITICAL: EBITDA is ALWAYS calculated as Ingresos - OPEX
 * Never distributed independently to maintain integrity
 * 
 * @param annual - Annual financial data
 * @param weights - Optional custom weights (defaults to uniform 25%)
 * @returns Quarterly breakdown with calculated EBITDA
 */
export function calculateQuarterlyProjection(
  annual: {
    ingresosAnuales: number;
    opexAnual: number;
    ebitdaAnual: number; // Only used for validation
  },
  weights: QuarterlyWeights = DEFAULT_QUARTERLY_WEIGHTS
): QuarterlyProjectionItem[] {
  const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
  
  const quarters = quarterNames.map((q, idx) => {
    const ingresos = annual.ingresosAnuales * weights.ingresos[idx];
    const opex = annual.opexAnual * weights.opex[idx];
    // CRITICAL: Calculate EBITDA to preserve accounting identity
    // EBITDA = Ingresos - OPEX (never use weights for EBITDA)
    const ebitda = ingresos - opex;
    
    return { q, ingresos, opex, ebitda };
  });
  
  // Validation: sum should match annual (within floating point tolerance)
  const totalEbitda = quarters.reduce((sum, q) => sum + q.ebitda, 0);
  const diff = Math.abs(totalEbitda - annual.ebitdaAnual);
  const tolerance = Math.abs(annual.ebitdaAnual) * 0.001; // 0.1%
  
  if (diff > tolerance && annual.ebitdaAnual !== 0) {
    console.warn(
      `Quarterly EBITDA sum (${totalEbitda.toFixed(0)}) differs from annual (${annual.ebitdaAnual.toFixed(0)}) by ${diff.toFixed(0)}`
    );
  }
  
  return quarters;
}

/**
 * Generate quarterly data for multiple years
 */
export function generateQuarterlyProjectionByYear(
  proyeccion: Array<{
    year: number;
    ingresosAnuales: number;
    opexAnual: number;
    ebitdaAnual: number;
  }>,
  weights: QuarterlyWeights = DEFAULT_QUARTERLY_WEIGHTS
): QuarterlyProjectionYear[] {
  return proyeccion.map(year => ({
    year: year.year,
    quarters: calculateQuarterlyProjection(
      {
        ingresosAnuales: year.ingresosAnuales,
        opexAnual: year.opexAnual,
        ebitdaAnual: year.ebitdaAnual
      },
      weights
    )
  }));
}
