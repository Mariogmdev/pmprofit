import { describe, it, expect } from 'vitest';
import { calculateMonthlyProjection, calculateYearlyProjection } from '../projectionCalculations';

/**
 * Projection Calculations Tests
 * Validates growth curves and annual projections
 */
describe('Projection Calculations', () => {
  describe('calculateMonthlyProjection', () => {
    it('genera 12 meses de proyección', () => {
      const result = calculateMonthlyProjection(50000000, 60, 70, 100, 'lineal');
      
      expect(result.meses).toHaveLength(12);
      expect(result.meses[0].mes).toBe(1);
      expect(result.meses[11].mes).toBe(12);
    });

    it('curva lineal: mes 1 = inicio, mes 12 = madurez', () => {
      const result = calculateMonthlyProjection(50000000, 60, 70, 100, 'lineal');
      
      expect(result.meses[0].factorMadurez).toBeCloseTo(70, 1);
      expect(result.meses[11].factorMadurez).toBeCloseTo(100, 1);
    });

    it('ocupación escala con factor de madurez', () => {
      const ocupacionBase = 60;
      const result = calculateMonthlyProjection(50000000, ocupacionBase, 70, 100, 'lineal');
      
      // Mes 1: 60% × 70% = 42%
      expect(result.meses[0].ocupacionPromedio).toBeCloseTo(42, 1);
      
      // Mes 12: 60% × 100% = 60%
      expect(result.meses[11].ocupacionPromedio).toBeCloseTo(60, 1);
    });

    it('ingresos escalan proporcionalmente a ocupación', () => {
      const ingresoBase = 50000000;
      const ocupacionBase = 60;
      const result = calculateMonthlyProjection(ingresoBase, ocupacionBase, 70, 100, 'lineal');
      
      // Mes 1: $50M × (42/60) = $35M
      expect(result.meses[0].ingresosMensuales).toBeCloseTo(35000000, -5);
      
      // Mes 12: $50M × (60/60) = $50M
      expect(result.meses[11].ingresosMensuales).toBeCloseTo(50000000, -5);
    });

    it('ingreso anual es suma de 12 meses', () => {
      const result = calculateMonthlyProjection(50000000, 60, 70, 100, 'lineal');
      
      const sumaManual = result.meses.reduce((sum, m) => sum + m.ingresosMensuales, 0);
      
      expect(result.ingresoAnual).toBeCloseTo(sumaManual, 0);
    });

    it('maneja ocupación base 0', () => {
      const result = calculateMonthlyProjection(50000000, 0, 70, 100, 'lineal');
      
      expect(result.ingresoAnual).toBe(0);
      expect(result.meses.every(m => m.ingresosMensuales === 0)).toBe(true);
    });

    it('curva S: crecimiento lento-rápido-lento', () => {
      const result = calculateMonthlyProjection(50000000, 60, 70, 100, 's-curve');
      
      // S-curve: inicio lento
      const incremento1 = result.meses[1].factorMadurez - result.meses[0].factorMadurez;
      
      // Medio rápido
      const incremento6 = result.meses[6].factorMadurez - result.meses[5].factorMadurez;
      
      // Final lento
      const incremento11 = result.meses[11].factorMadurez - result.meses[10].factorMadurez;
      
      // Incremento medio debe ser mayor que inicio y final
      expect(incremento6).toBeGreaterThan(incremento1);
      expect(incremento6).toBeGreaterThan(incremento11);
    });
  });

  describe('calculateYearlyProjection', () => {
    it('genera proyección de 5 años por defecto', () => {
      const result = calculateYearlyProjection(600000000, 60, 5, 3, 5);
      
      expect(result).toHaveLength(5);
      expect(result[0].year).toBe(1);
      expect(result[4].year).toBe(5);
    });

    it('año 1 usa valores directos', () => {
      const ingresoAno1 = 600000000;
      const ocupacionAno1 = 60;
      
      const result = calculateYearlyProjection(ingresoAno1, ocupacionAno1, 5, 3, 5);
      
      expect(result[0].ingresoAnual).toBe(ingresoAno1);
      expect(result[0].ocupacionPromedio).toBe(ocupacionAno1);
      expect(result[0].factorTarifa).toBe(1.0);
    });

    it('ocupación crece anualmente', () => {
      const result = calculateYearlyProjection(600000000, 60, 5, 3, 5);
      
      // Año 2: 60% × 1.05 = 63%
      expect(result[1].ocupacionPromedio).toBeCloseTo(63, 1);
      
      // Cada año mayor que el anterior
      for (let i = 1; i < result.length; i++) {
        expect(result[i].ocupacionPromedio).toBeGreaterThan(result[i - 1].ocupacionPromedio);
      }
    });

    it('tarifa crece con inflación', () => {
      const result = calculateYearlyProjection(600000000, 60, 5, 3, 5);
      
      // Año 2: factor = 1.03
      expect(result[1].factorTarifa).toBeCloseTo(1.03, 2);
      
      // Año 3: factor = 1.03 × 1.03 = 1.0609
      expect(result[2].factorTarifa).toBeCloseTo(1.0609, 3);
    });

    it('ingresos crecen por ocupación × inflación', () => {
      const ingresoAno1 = 600000000;
      const result = calculateYearlyProjection(ingresoAno1, 60, 5, 3, 5);
      
      // Año 2: $600M × (63/60) × 1.03 = $648.9M
      expect(result[1].ingresoAnual).toBeCloseTo(648900000, -5);
    });

    it('ocupación tiene tope de 95%', () => {
      // Con alto crecimiento, ocupación debería topearse
      const result = calculateYearlyProjection(600000000, 80, 20, 3, 10);
      
      // Ningún año debe superar 95%
      result.forEach(y => {
        expect(y.ocupacionPromedio).toBeLessThanOrEqual(95);
      });
    });

    it('maneja valores cero', () => {
      const result = calculateYearlyProjection(0, 0, 5, 3, 5);
      
      expect(result.every(y => y.ingresoAnual === 0)).toBe(true);
    });
  });
});
