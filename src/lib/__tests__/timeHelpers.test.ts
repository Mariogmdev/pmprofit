import { describe, it, expect } from 'vitest';
import { getWeeksPerMonth, WEEKDAYS_LV, WEEKDAYS_SD, DAYS_PER_WEEK } from '../timeHelpers';

describe('timeHelpers', () => {
  describe('getWeeksPerMonth', () => {
    it('calcula semanas correctamente para 28 días', () => {
      expect(getWeeksPerMonth(28)).toBe(4.0);
    });
    
    it('calcula semanas correctamente para 30 días', () => {
      expect(getWeeksPerMonth(30)).toBeCloseTo(4.2857, 4);
    });
    
    it('calcula semanas correctamente para 31 días', () => {
      expect(getWeeksPerMonth(31)).toBeCloseTo(4.4286, 4);
    });
    
    it('usa 30 días por defecto', () => {
      expect(getWeeksPerMonth()).toBeCloseTo(4.2857, 4);
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
      expect(diff30vs28).toBeCloseTo(0.0714, 2);
      
      // 31 días > 28 días (10.71% más)
      const diff31vs28 = (income31 - income28) / income28;
      expect(diff31vs28).toBeCloseTo(0.1071, 2);
    });
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
});
