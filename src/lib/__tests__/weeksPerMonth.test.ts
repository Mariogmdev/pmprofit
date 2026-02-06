import { describe, it, expect } from 'vitest';
import { getWeeksPerMonth, WEEKDAYS_LV, WEEKDAYS_SD, DAYS_PER_WEEK } from '../timeHelpers';

/**
 * Fase 0.4: weeksPerMonth Dynamic Tests
 * Validates that weeks per month is calculated dynamically based on days
 */
describe('Fase 0.4: weeksPerMonth Dynamic', () => {
  it('calcula semanas correctamente para 28 días', () => {
    const weeks = getWeeksPerMonth(28);
    expect(weeks).toBeCloseTo(4.0, 2);
  });
  
  it('calcula semanas correctamente para 30 días', () => {
    const weeks = getWeeksPerMonth(30);
    expect(weeks).toBeCloseTo(4.29, 2);
  });
  
  it('calcula semanas correctamente para 31 días', () => {
    const weeks = getWeeksPerMonth(31);
    expect(weeks).toBeCloseTo(4.43, 2);
  });
  
  it('ingresos aumentan proporcionalmente con más días', () => {
    const weeks28 = getWeeksPerMonth(28);
    const weeks31 = getWeeksPerMonth(31);
    
    const ratio = weeks31 / weeks28;
    
    // 31 días debe ser ~10.75% más que 28 días (31/28 = 1.1071)
    expect(ratio).toBeCloseTo(1.1071, 3);
  });
  
  it('no usa constante 4.33 fija', () => {
    const weeks28 = getWeeksPerMonth(28);
    const weeks31 = getWeeksPerMonth(31);
    
    // Si usara 4.33 fijo, ambos serían iguales
    expect(weeks28).not.toBe(weeks31);
    expect(weeks28).not.toBe(4.33);
    expect(weeks31).not.toBe(4.33);
  });

  it('usa 30 días por defecto', () => {
    const weeksDefault = getWeeksPerMonth();
    const weeks30 = getWeeksPerMonth(30);
    
    expect(weeksDefault).toBe(weeks30);
  });

  describe('constantes de días', () => {
    it('weekdays L-V es 5', () => {
      expect(WEEKDAYS_LV).toBe(5);
    });
    
    it('weekdays S-D es 2', () => {
      expect(WEEKDAYS_SD).toBe(2);
    });
    
    it('total días por semana es 7', () => {
      expect(DAYS_PER_WEEK).toBe(7);
      expect(WEEKDAYS_LV + WEEKDAYS_SD).toBe(DAYS_PER_WEEK);
    });
  });

  describe('impacto en cálculos financieros', () => {
    it('ingresos escalan proporcionalmente con días del mes', () => {
      const weeklyIncome = 1000000; // $1M/semana
      
      const income28 = weeklyIncome * getWeeksPerMonth(28);
      const income30 = weeklyIncome * getWeeksPerMonth(30);
      const income31 = weeklyIncome * getWeeksPerMonth(31);
      
      // 28 días = $4M/mes
      expect(income28).toBe(4000000);
      
      // 30 días > 28 días (7.14% más)
      const diff30vs28 = (income30 - income28) / income28;
      expect(diff30vs28).toBeCloseTo(0.0714, 3);
      
      // 31 días > 28 días (10.71% más)
      const diff31vs28 = (income31 - income28) / income28;
      expect(diff31vs28).toBeCloseTo(0.1071, 3);
    });
  });
});
