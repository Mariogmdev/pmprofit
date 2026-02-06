import { describe, it, expect } from 'vitest';
import { 
  calculateQuarterlyFromMonths,
  generateQuarterlyProjectionByYear,
  MonthlyFinancialData 
} from '../projectionCalculations';

/**
 * Tests for quarterly projection accounting identities
 * 
 * CRITICAL INVARIANT: EBITDA = Ingresos - OPEX must hold for EVERY quarter
 * This is a fundamental accounting identity that must never be violated
 * 
 * KEY DESIGN: Quarters are calculated by SUMMING real monthly data,
 * not by distributing annual values with weights.
 */
describe('Quarterly Accounting Identities', () => {
  describe('calculateQuarterlyFromMonths', () => {
    it('maintains EBITDA = Ingresos - OPEX for each quarter', () => {
      // Generate 12 months with varying values (like a real maturity curve)
      const year1Monthly: MonthlyFinancialData[] = [
        { mes: 'Ene', ingresos: 7_000_000, opex: 4_500_000, ebitda: 2_500_000 },
        { mes: 'Feb', ingresos: 7_500_000, opex: 4_600_000, ebitda: 2_900_000 },
        { mes: 'Mar', ingresos: 8_000_000, opex: 4_700_000, ebitda: 3_300_000 },
        { mes: 'Abr', ingresos: 8_300_000, opex: 4_800_000, ebitda: 3_500_000 },
        { mes: 'May', ingresos: 8_600_000, opex: 4_900_000, ebitda: 3_700_000 },
        { mes: 'Jun', ingresos: 8_800_000, opex: 5_000_000, ebitda: 3_800_000 },
        { mes: 'Jul', ingresos: 9_000_000, opex: 5_100_000, ebitda: 3_900_000 },
        { mes: 'Ago', ingresos: 9_200_000, opex: 5_150_000, ebitda: 4_050_000 },
        { mes: 'Sep', ingresos: 9_400_000, opex: 5_200_000, ebitda: 4_200_000 },
        { mes: 'Oct', ingresos: 9_600_000, opex: 5_250_000, ebitda: 4_350_000 },
        { mes: 'Nov', ingresos: 9_800_000, opex: 5_300_000, ebitda: 4_500_000 },
        { mes: 'Dic', ingresos: 10_000_000, opex: 5_350_000, ebitda: 4_650_000 },
      ];
      
      const quarters = calculateQuarterlyFromMonths(year1Monthly);
      
      // Verify identity in each quarter
      quarters.forEach(q => {
        expect(q.ebitda).toBe(q.ingresos - q.opex);
      });
    });

    it('sums actual months correctly for each quarter', () => {
      const year1Monthly: MonthlyFinancialData[] = [
        // Q1: Jan, Feb, Mar
        { mes: 'Ene', ingresos: 100, opex: 60, ebitda: 40 },
        { mes: 'Feb', ingresos: 110, opex: 65, ebitda: 45 },
        { mes: 'Mar', ingresos: 120, opex: 70, ebitda: 50 },
        // Q2: Apr, May, Jun
        { mes: 'Abr', ingresos: 130, opex: 75, ebitda: 55 },
        { mes: 'May', ingresos: 140, opex: 80, ebitda: 60 },
        { mes: 'Jun', ingresos: 150, opex: 85, ebitda: 65 },
        // Q3: Jul, Aug, Sep
        { mes: 'Jul', ingresos: 160, opex: 90, ebitda: 70 },
        { mes: 'Ago', ingresos: 170, opex: 95, ebitda: 75 },
        { mes: 'Sep', ingresos: 180, opex: 100, ebitda: 80 },
        // Q4: Oct, Nov, Dec
        { mes: 'Oct', ingresos: 190, opex: 105, ebitda: 85 },
        { mes: 'Nov', ingresos: 200, opex: 110, ebitda: 90 },
        { mes: 'Dic', ingresos: 210, opex: 115, ebitda: 95 },
      ];
      
      const quarters = calculateQuarterlyFromMonths(year1Monthly);
      
      // Q1 = 100+110+120 = 330 ingresos, 60+65+70 = 195 opex
      expect(quarters[0].ingresos).toBe(330);
      expect(quarters[0].opex).toBe(195);
      expect(quarters[0].ebitda).toBe(135);
      
      // Q2 = 130+140+150 = 420 ingresos, 75+80+85 = 240 opex
      expect(quarters[1].ingresos).toBe(420);
      expect(quarters[1].opex).toBe(240);
      expect(quarters[1].ebitda).toBe(180);
      
      // Q3 = 160+170+180 = 510 ingresos, 90+95+100 = 285 opex
      expect(quarters[2].ingresos).toBe(510);
      expect(quarters[2].opex).toBe(285);
      expect(quarters[2].ebitda).toBe(225);
      
      // Q4 = 190+200+210 = 600 ingresos, 105+110+115 = 330 opex
      expect(quarters[3].ingresos).toBe(600);
      expect(quarters[3].opex).toBe(330);
      expect(quarters[3].ebitda).toBe(270);
    });

    it('quarters are DIFFERENT when months have different values (maturity curve)', () => {
      const year1Monthly: MonthlyFinancialData[] = [
        // Early months: lower due to maturity curve (70% → 100%)
        { mes: 'Ene', ingresos: 70, opex: 50, ebitda: 20 },
        { mes: 'Feb', ingresos: 75, opex: 52, ebitda: 23 },
        { mes: 'Mar', ingresos: 80, opex: 54, ebitda: 26 },
        { mes: 'Abr', ingresos: 85, opex: 56, ebitda: 29 },
        { mes: 'May', ingresos: 88, opex: 58, ebitda: 30 },
        { mes: 'Jun', ingresos: 91, opex: 59, ebitda: 32 },
        { mes: 'Jul', ingresos: 94, opex: 60, ebitda: 34 },
        { mes: 'Ago', ingresos: 96, opex: 61, ebitda: 35 },
        { mes: 'Sep', ingresos: 98, opex: 62, ebitda: 36 },
        { mes: 'Oct', ingresos: 99, opex: 62, ebitda: 37 },
        { mes: 'Nov', ingresos: 100, opex: 63, ebitda: 37 },
        { mes: 'Dic', ingresos: 100, opex: 63, ebitda: 37 },
      ];
      
      const quarters = calculateQuarterlyFromMonths(year1Monthly);
      
      // Q1 should be LOWER than Q4 due to maturity curve
      expect(quarters[0].ingresos).toBeLessThan(quarters[3].ingresos);
      expect(quarters[0].ebitda).toBeLessThan(quarters[3].ebitda);
      
      // All quarters should be different
      expect(quarters[0].ingresos).not.toBe(quarters[1].ingresos);
      expect(quarters[1].ingresos).not.toBe(quarters[2].ingresos);
      expect(quarters[2].ingresos).not.toBe(quarters[3].ingresos);
    });

    it('quarterly sum equals annual values', () => {
      const year1Monthly: MonthlyFinancialData[] = Array.from({ length: 12 }, (_, i) => ({
        mes: `M${i + 1}`,
        ingresos: 8_333_333, // ~100M/12
        opex: 5_000_000,     // ~60M/12
        ebitda: 3_333_333,   // ~40M/12
      }));
      
      const quarters = calculateQuarterlyFromMonths(year1Monthly);
      
      const totalIngresos = quarters.reduce((s, q) => s + q.ingresos, 0);
      const totalOpex = quarters.reduce((s, q) => s + q.opex, 0);
      const totalEbitda = quarters.reduce((s, q) => s + q.ebitda, 0);
      
      expect(totalIngresos).toBeCloseTo(100_000_000, -3);
      expect(totalOpex).toBeCloseTo(60_000_000, -3);
      expect(totalEbitda).toBeCloseTo(40_000_000, -3);
    });

    it('handles negative EBITDA correctly', () => {
      const year1Monthly: MonthlyFinancialData[] = Array.from({ length: 12 }, (_, i) => ({
        mes: `M${i + 1}`,
        ingresos: 3_333_333, // ~40M/12
        opex: 5_000_000,     // ~60M/12
        ebitda: -1_666_667,  // Loss scenario
      }));
      
      const quarters = calculateQuarterlyFromMonths(year1Monthly);
      
      quarters.forEach(q => {
        expect(q.ebitda).toBeLessThan(0);
        expect(q.ebitda).toBe(q.ingresos - q.opex);
      });
    });

    it('handles zero values', () => {
      const year1Monthly: MonthlyFinancialData[] = Array.from({ length: 12 }, () => ({
        mes: 'M',
        ingresos: 0,
        opex: 0,
        ebitda: 0,
      }));
      
      const quarters = calculateQuarterlyFromMonths(year1Monthly);
      
      quarters.forEach(q => {
        expect(q.ingresos).toBe(0);
        expect(q.opex).toBe(0);
        expect(q.ebitda).toBe(0);
      });
    });

    it('handles empty or insufficient monthly data', () => {
      const quarters = calculateQuarterlyFromMonths([]);
      
      expect(quarters).toHaveLength(4);
      quarters.forEach(q => {
        expect(q.ingresos).toBe(0);
        expect(q.opex).toBe(0);
        expect(q.ebitda).toBe(0);
      });
    });
  });

  describe('generateQuarterlyProjectionByYear', () => {
    it('Year 1 uses REAL monthly data, Years 2+ use uniform distribution', () => {
      const year1Monthly: MonthlyFinancialData[] = [
        // Ascending income to simulate maturity curve
        { mes: 'Ene', ingresos: 7_000_000, opex: 4_200_000, ebitda: 2_800_000 },
        { mes: 'Feb', ingresos: 7_500_000, opex: 4_500_000, ebitda: 3_000_000 },
        { mes: 'Mar', ingresos: 8_000_000, opex: 4_800_000, ebitda: 3_200_000 },
        { mes: 'Abr', ingresos: 8_200_000, opex: 4_920_000, ebitda: 3_280_000 },
        { mes: 'May', ingresos: 8_400_000, opex: 5_040_000, ebitda: 3_360_000 },
        { mes: 'Jun', ingresos: 8_600_000, opex: 5_160_000, ebitda: 3_440_000 },
        { mes: 'Jul', ingresos: 8_800_000, opex: 5_280_000, ebitda: 3_520_000 },
        { mes: 'Ago', ingresos: 9_000_000, opex: 5_400_000, ebitda: 3_600_000 },
        { mes: 'Sep', ingresos: 9_200_000, opex: 5_520_000, ebitda: 3_680_000 },
        { mes: 'Oct', ingresos: 9_400_000, opex: 5_640_000, ebitda: 3_760_000 },
        { mes: 'Nov', ingresos: 9_600_000, opex: 5_760_000, ebitda: 3_840_000 },
        { mes: 'Dic', ingresos: 10_000_000, opex: 6_000_000, ebitda: 4_000_000 },
      ];
      
      const proyeccion = [
        { year: 1, ingresosAnuales: 103_700_000, opexAnual: 62_220_000, ebitdaAnual: 41_480_000 },
        { year: 2, ingresosAnuales: 120_000_000, opexAnual: 72_000_000, ebitdaAnual: 48_000_000 },
        { year: 3, ingresosAnuales: 140_000_000, opexAnual: 84_000_000, ebitdaAnual: 56_000_000 },
      ];
      
      const result = generateQuarterlyProjectionByYear(proyeccion, year1Monthly);
      
      expect(result).toHaveLength(3);
      
      // Year 1: Quarters should be DIFFERENT (from real monthly data)
      const year1 = result[0];
      expect(year1.quarters[0].ingresos).not.toBe(year1.quarters[3].ingresos);
      
      // Q1 = 7M + 7.5M + 8M = 22.5M
      expect(year1.quarters[0].ingresos).toBe(22_500_000);
      // Q4 = 9.4M + 9.6M + 10M = 29M
      expect(year1.quarters[3].ingresos).toBe(29_000_000);
      
      // Year 2: Quarters should be EQUAL (uniform distribution)
      const year2 = result[1];
      expect(year2.quarters[0].ingresos).toBe(year2.quarters[1].ingresos);
      expect(year2.quarters[1].ingresos).toBe(year2.quarters[2].ingresos);
      expect(year2.quarters[2].ingresos).toBe(year2.quarters[3].ingresos);
      expect(year2.quarters[0].ingresos).toBe(30_000_000); // 120M / 4
      
      // All years must maintain identity
      result.forEach(yearData => {
        yearData.quarters.forEach(q => {
          expect(q.ebitda).toBe(q.ingresos - q.opex);
        });
      });
    });

    it('each year sums correctly', () => {
      const year1Monthly: MonthlyFinancialData[] = Array.from({ length: 12 }, (_, i) => ({
        mes: `M${i + 1}`,
        ingresos: 8_333_333,
        opex: 5_000_000,
        ebitda: 3_333_333,
      }));
      
      const proyeccion = [
        { year: 1, ingresosAnuales: 100_000_000, opexAnual: 60_000_000, ebitdaAnual: 40_000_000 },
        { year: 2, ingresosAnuales: 120_000_000, opexAnual: 72_000_000, ebitdaAnual: 48_000_000 },
      ];
      
      const result = generateQuarterlyProjectionByYear(proyeccion, year1Monthly);
      
      result.forEach((yearData, yearIdx) => {
        const annual = proyeccion[yearIdx];
        const totalIngresos = yearData.quarters.reduce((s, q) => s + q.ingresos, 0);
        const totalOpex = yearData.quarters.reduce((s, q) => s + q.opex, 0);
        const totalEbitda = yearData.quarters.reduce((s, q) => s + q.ebitda, 0);
        
        // Use tolerance for Year 1 due to rounding
        expect(totalIngresos).toBeCloseTo(annual.ingresosAnuales, -3);
        expect(totalOpex).toBeCloseTo(annual.opexAnual, -3);
        expect(totalEbitda).toBeCloseTo(annual.ebitdaAnual, -3);
      });
    });

    it('falls back to uniform distribution when no monthly data provided', () => {
      const proyeccion = [
        { year: 1, ingresosAnuales: 100_000_000, opexAnual: 60_000_000, ebitdaAnual: 40_000_000 },
      ];
      
      const result = generateQuarterlyProjectionByYear(proyeccion);
      
      // Without monthly data, use uniform distribution
      const year1 = result[0];
      expect(year1.quarters[0].ingresos).toBe(25_000_000);
      expect(year1.quarters[0].opex).toBe(15_000_000);
      expect(year1.quarters[0].ebitda).toBe(10_000_000);
      
      // All quarters equal
      expect(year1.quarters[0].ingresos).toBe(year1.quarters[3].ingresos);
    });
  });
});
