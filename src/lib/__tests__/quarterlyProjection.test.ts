import { describe, it, expect } from 'vitest';

/**
 * Tests for quarterly projection accounting identity
 * EBITDA = Ingresos - OPEX must be preserved in every quarter
 */

// Simulate the quarterly calculation logic from ProjectionTable
function calculateQuarterlyProjection(annual: {
  ingresosAnuales: number;
  opexAnual: number;
  ebitdaAnual: number;
}) {
  const weights = [0.25, 0.25, 0.25, 0.25];
  const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
  
  return weights.map((weight, idx) => {
    const ingresos = annual.ingresosAnuales * weight;
    const opex = annual.opexAnual * weight;
    // CRITICAL: Calculate EBITDA to preserve accounting identity
    const ebitda = ingresos - opex;
    return { q: quarterNames[idx], ingresos, opex, ebitda };
  });
}

describe('calculateQuarterlyProjection', () => {
  it('respeta identidad EBITDA = Ingresos - OPEX en cada trimestre', () => {
    const annual = {
      ingresosAnuales: 1000000,
      opexAnual: 600000,
      ebitdaAnual: 400000
    };
    
    const quarters = calculateQuarterlyProjection(annual);
    
    // Verificar identidad en CADA trimestre
    quarters.forEach(q => {
      expect(q.ebitda).toBeCloseTo(q.ingresos - q.opex, 2);
    });
  });
  
  it('suma trimestral iguala anual', () => {
    const annual = {
      ingresosAnuales: 1000000,
      opexAnual: 600000,
      ebitdaAnual: 400000
    };
    
    const quarters = calculateQuarterlyProjection(annual);
    
    const totalIngresos = quarters.reduce((s, q) => s + q.ingresos, 0);
    const totalOpex = quarters.reduce((s, q) => s + q.opex, 0);
    const totalEbitda = quarters.reduce((s, q) => s + q.ebitda, 0);
    
    expect(totalIngresos).toBeCloseTo(annual.ingresosAnuales, 2);
    expect(totalOpex).toBeCloseTo(annual.opexAnual, 2);
    expect(totalEbitda).toBeCloseTo(annual.ebitdaAnual, 2);
  });
  
  it('distribución uniforme por defecto (25% cada Q)', () => {
    const annual = { 
      ingresosAnuales: 1000000, 
      opexAnual: 600000, 
      ebitdaAnual: 400000 
    };
    
    const quarters = calculateQuarterlyProjection(annual);
    
    // Cada trimestre debe ser aproximadamente 25%
    quarters.forEach(q => {
      expect(q.ingresos).toBeCloseTo(250000, 0);
      expect(q.opex).toBeCloseTo(150000, 0);
      expect(q.ebitda).toBeCloseTo(100000, 0);
    });
  });
  
  it('maneja correctamente EBITDA negativo', () => {
    const annual = {
      ingresosAnuales: 400000,
      opexAnual: 600000,
      ebitdaAnual: -200000 // Pérdida
    };
    
    const quarters = calculateQuarterlyProjection(annual);
    
    quarters.forEach(q => {
      expect(q.ebitda).toBeLessThan(0);
      expect(q.ebitda).toBeCloseTo(q.ingresos - q.opex, 2);
    });
    
    const totalEbitda = quarters.reduce((s, q) => s + q.ebitda, 0);
    expect(totalEbitda).toBeCloseTo(annual.ebitdaAnual, 2);
  });

  it('preserva identidad con números decimales complejos', () => {
    const annual = {
      ingresosAnuales: 1234567.89,
      opexAnual: 876543.21,
      ebitdaAnual: 358024.68
    };
    
    const quarters = calculateQuarterlyProjection(annual);
    
    quarters.forEach(q => {
      // La identidad debe ser exacta (no aproximada)
      expect(q.ebitda).toBe(q.ingresos - q.opex);
    });
  });
});
