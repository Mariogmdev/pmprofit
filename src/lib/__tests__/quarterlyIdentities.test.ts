import { describe, it, expect } from 'vitest';
import { 
  calculateQuarterlyProjection, 
  generateQuarterlyProjectionByYear,
  DEFAULT_QUARTERLY_WEIGHTS,
  QuarterlyWeights 
} from '../projectionCalculations';

/**
 * Tests for quarterly projection accounting identities
 * 
 * CRITICAL INVARIANT: EBITDA = Ingresos - OPEX must hold for EVERY quarter
 * This is a fundamental accounting identity that must never be violated
 */
describe('Quarterly Accounting Identities', () => {
  describe('calculateQuarterlyProjection', () => {
    it('maintains EBITDA = Ingresos - OPEX for each quarter with uniform weights', () => {
      const annual = {
        ingresosAnuales: 100_000_000,
        opexAnual: 60_000_000,
        ebitdaAnual: 40_000_000
      };
      
      const quarters = calculateQuarterlyProjection(annual);
      
      // Verify identity in each quarter
      quarters.forEach(q => {
        expect(q.ebitda).toBe(q.ingresos - q.opex);
      });
    });

    it('maintains EBITDA = Ingresos - OPEX with DIFFERENT weights per line', () => {
      const annual = {
        ingresosAnuales: 100_000_000,
        opexAnual: 60_000_000,
        ebitdaAnual: 40_000_000
      };
      
      // Simulate seasonality: different distribution for ingresos vs opex
      const weights: QuarterlyWeights = {
        ingresos: [0.20, 0.25, 0.25, 0.30], // Higher Q4 (holiday season)
        opex: [0.25, 0.25, 0.25, 0.25]      // Uniform costs
      };
      
      const quarters = calculateQuarterlyProjection(annual, weights);
      
      // CRITICAL: Even with different weights, identity must hold
      quarters.forEach((q, idx) => {
        const expectedIngresos = annual.ingresosAnuales * weights.ingresos[idx];
        const expectedOpex = annual.opexAnual * weights.opex[idx];
        
        expect(q.ingresos).toBeCloseTo(expectedIngresos, 2);
        expect(q.opex).toBeCloseTo(expectedOpex, 2);
        // EBITDA is calculated, NOT distributed
        expect(q.ebitda).toBe(q.ingresos - q.opex);
      });
    });

    it('quarterly sum equals annual values', () => {
      const annual = {
        ingresosAnuales: 100_000_000,
        opexAnual: 60_000_000,
        ebitdaAnual: 40_000_000
      };
      
      const quarters = calculateQuarterlyProjection(annual);
      
      const totalIngresos = quarters.reduce((s, q) => s + q.ingresos, 0);
      const totalOpex = quarters.reduce((s, q) => s + q.opex, 0);
      const totalEbitda = quarters.reduce((s, q) => s + q.ebitda, 0);
      
      expect(totalIngresos).toBeCloseTo(annual.ingresosAnuales, 0);
      expect(totalOpex).toBeCloseTo(annual.opexAnual, 0);
      expect(totalEbitda).toBeCloseTo(annual.ebitdaAnual, 0);
    });

    it('handles negative EBITDA correctly', () => {
      const annual = {
        ingresosAnuales: 40_000_000,
        opexAnual: 60_000_000,
        ebitdaAnual: -20_000_000 // Loss scenario
      };
      
      const quarters = calculateQuarterlyProjection(annual);
      
      quarters.forEach(q => {
        expect(q.ebitda).toBeLessThan(0);
        expect(q.ebitda).toBe(q.ingresos - q.opex);
      });
    });

    it('handles zero values', () => {
      const annual = {
        ingresosAnuales: 0,
        opexAnual: 0,
        ebitdaAnual: 0
      };
      
      const quarters = calculateQuarterlyProjection(annual);
      
      quarters.forEach(q => {
        expect(q.ingresos).toBe(0);
        expect(q.opex).toBe(0);
        expect(q.ebitda).toBe(0);
      });
    });

    it('preserves identity with complex decimal numbers', () => {
      const annual = {
        ingresosAnuales: 1234567.89,
        opexAnual: 876543.21,
        ebitdaAnual: 358024.68
      };
      
      const quarters = calculateQuarterlyProjection(annual);
      
      quarters.forEach(q => {
        // Identity must be mathematically exact
        expect(q.ebitda).toBe(q.ingresos - q.opex);
      });
    });

    it('default weights sum to 1.0', () => {
      const sumIngresos = DEFAULT_QUARTERLY_WEIGHTS.ingresos.reduce((a, b) => a + b, 0);
      const sumOpex = DEFAULT_QUARTERLY_WEIGHTS.opex.reduce((a, b) => a + b, 0);
      
      expect(sumIngresos).toBeCloseTo(1.0, 10);
      expect(sumOpex).toBeCloseTo(1.0, 10);
    });
  });

  describe('generateQuarterlyProjectionByYear', () => {
    it('generates quarters for multiple years maintaining identity', () => {
      const proyeccion = [
        { year: 1, ingresosAnuales: 100_000_000, opexAnual: 60_000_000, ebitdaAnual: 40_000_000 },
        { year: 2, ingresosAnuales: 120_000_000, opexAnual: 65_000_000, ebitdaAnual: 55_000_000 },
        { year: 3, ingresosAnuales: 140_000_000, opexAnual: 70_000_000, ebitdaAnual: 70_000_000 }
      ];
      
      const result = generateQuarterlyProjectionByYear(proyeccion);
      
      expect(result).toHaveLength(3);
      
      result.forEach(yearData => {
        expect(yearData.quarters).toHaveLength(4);
        yearData.quarters.forEach(q => {
          // Identity preserved in every quarter of every year
          expect(q.ebitda).toBe(q.ingresos - q.opex);
        });
      });
    });

    it('each year sums correctly', () => {
      const proyeccion = [
        { year: 1, ingresosAnuales: 100_000_000, opexAnual: 60_000_000, ebitdaAnual: 40_000_000 },
        { year: 2, ingresosAnuales: 120_000_000, opexAnual: 65_000_000, ebitdaAnual: 55_000_000 }
      ];
      
      const result = generateQuarterlyProjectionByYear(proyeccion);
      
      result.forEach((yearData, yearIdx) => {
        const annual = proyeccion[yearIdx];
        const totalIngresos = yearData.quarters.reduce((s, q) => s + q.ingresos, 0);
        const totalOpex = yearData.quarters.reduce((s, q) => s + q.opex, 0);
        const totalEbitda = yearData.quarters.reduce((s, q) => s + q.ebitda, 0);
        
        expect(totalIngresos).toBeCloseTo(annual.ingresosAnuales, 0);
        expect(totalOpex).toBeCloseTo(annual.opexAnual, 0);
        expect(totalEbitda).toBeCloseTo(annual.ebitdaAnual, 0);
      });
    });
  });

  describe('Edge cases that previously broke identity', () => {
    it('EBITDA with asymmetric seasonal weights still maintains identity', () => {
      // This is the bug scenario: different % for each line
      const annual = {
        ingresosAnuales: 100_000_000,
        opexAnual: 60_000_000,
        ebitdaAnual: 40_000_000
      };
      
      // Q1: Low revenue (winter), normal costs
      // Q4: High revenue (holiday), high costs
      const seasonalWeights: QuarterlyWeights = {
        ingresos: [0.15, 0.25, 0.25, 0.35],
        opex: [0.22, 0.26, 0.26, 0.26]
      };
      
      const quarters = calculateQuarterlyProjection(annual, seasonalWeights);
      
      // Q1: $15M revenue - $13.2M opex = $1.8M EBITDA
      expect(quarters[0].ingresos).toBeCloseTo(15_000_000, 0);
      expect(quarters[0].opex).toBeCloseTo(13_200_000, 0);
      expect(quarters[0].ebitda).toBe(quarters[0].ingresos - quarters[0].opex);
      
      // Q4: $35M revenue - $15.6M opex = $19.4M EBITDA  
      expect(quarters[3].ingresos).toBeCloseTo(35_000_000, 0);
      expect(quarters[3].opex).toBeCloseTo(15_600_000, 0);
      expect(quarters[3].ebitda).toBe(quarters[3].ingresos - quarters[3].opex);
      
      // Sum still equals annual
      const totalEbitda = quarters.reduce((s, q) => s + q.ebitda, 0);
      expect(totalEbitda).toBeCloseTo(annual.ebitdaAnual, 0);
    });

    it('WRONG approach would be distributing EBITDA independently - this test shows why', () => {
      // This demonstrates the bug we're preventing
      const annual = {
        ingresosAnuales: 100_000_000,
        opexAnual: 60_000_000,
        ebitdaAnual: 40_000_000
      };
      
      const weights: QuarterlyWeights = {
        ingresos: [0.20, 0.25, 0.25, 0.30],
        opex: [0.25, 0.25, 0.25, 0.25]
      };
      
      // WRONG approach (what we DON'T do):
      const wrongQ1Ebitda = annual.ebitdaAnual * 0.22; // Random % - WRONG
      const wrongQ1Ingresos = annual.ingresosAnuales * weights.ingresos[0];
      const wrongQ1Opex = annual.opexAnual * weights.opex[0];
      
      // This would NOT equal ingresos - opex:
      const correctQ1Ebitda = wrongQ1Ingresos - wrongQ1Opex;
      
      // Show the discrepancy
      expect(wrongQ1Ebitda).not.toBe(correctQ1Ebitda);
      
      // Our implementation always uses the correct approach
      const quarters = calculateQuarterlyProjection(annual, weights);
      expect(quarters[0].ebitda).toBe(quarters[0].ingresos - quarters[0].opex);
    });
  });
});
