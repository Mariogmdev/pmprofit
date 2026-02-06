import { describe, it, expect } from 'vitest';
import { 
  calculateWeightedOccupancy, 
  calculateWeightedOccupancyWithValues,
  calculateTotalWeeklyHours 
} from '../occupancyCalculations';

/**
 * Fase 0.6: Weighted Target Occupancy Tests
 * Validates that occupancy is properly weighted by hours and day type
 */
describe('Fase 0.6: Weighted Target Occupancy', () => {
  describe('calculateWeightedOccupancy', () => {
    it('pondera correctamente L-V × 5 días', () => {
      const horarios = [
        { inicio: 6, fin: 14, tipo: 'pico' as const, ocupacion: 70, diaSemana: 'LV' as const },
      ];
      
      const weighted = calculateWeightedOccupancy(horarios);
      
      // 8h × 5 días = 40 horas semanales
      // Todas pico 70%
      expect(weighted).toBe(70);
    });
    
    it('pondera correctamente S-D × 2 días', () => {
      const horarios = [
        { inicio: 6, fin: 22, tipo: 'pico' as const, ocupacion: 70, diaSemana: 'SD' as const },
      ];
      
      const weighted = calculateWeightedOccupancy(horarios);
      
      // 16h × 2 días = 32 horas semanales
      // Todas pico 70%
      expect(weighted).toBe(70);
    });
    
    it('pondera mixto L-V y S-D correctamente', () => {
      const horarios = [
        { inicio: 6, fin: 14, tipo: 'pico' as const, ocupacion: 70, diaSemana: 'LV' as const },   // 8h × 5 = 40h
        { inicio: 14, fin: 22, tipo: 'valle' as const, ocupacion: 30, diaSemana: 'LV' as const }, // 8h × 5 = 40h
        { inicio: 6, fin: 22, tipo: 'pico' as const, ocupacion: 70, diaSemana: 'SD' as const },   // 16h × 2 = 32h
      ];
      
      // Total: 112 horas/semana
      // Pico: (40h × 70%) + (32h × 70%) = 28h + 22.4h = 50.4h-equiv
      // Valle: 40h × 30% = 12h-equiv
      // Weighted: (40×70 + 40×30 + 32×70) / 112 = (2800 + 1200 + 2240) / 112 = 6240 / 112 = 55.71%
      
      const weighted = calculateWeightedOccupancy(horarios);
      
      expect(weighted).toBeCloseTo(55.71, 1);
    });
    
    it('diferentes ocupaciones en mismo período', () => {
      const horarios = [
        { inicio: 6, fin: 14, tipo: 'pico' as const, ocupacion: 80, diaSemana: 'LV' as const },  // 8h × 5 = 40h
        { inicio: 14, fin: 22, tipo: 'valle' as const, ocupacion: 40, diaSemana: 'LV' as const }, // 8h × 5 = 40h
      ];
      
      // Total: 80h semanales
      // (40×80 + 40×40) / 80 = (3200 + 1600) / 80 = 60%
      
      const weighted = calculateWeightedOccupancy(horarios);
      
      expect(weighted).toBe(60);
    });

    it('retorna 0 para lista vacía', () => {
      const weighted = calculateWeightedOccupancy([]);
      expect(weighted).toBe(0);
    });
  });

  describe('calculateWeightedOccupancyWithValues', () => {
    it('aplica valores pico/valle correctamente', () => {
      const horarios = [
        { inicio: 6, fin: 14, tipo: 'pico' as const, diaSemana: 'LV' as const },   // 8h × 5 = 40h
        { inicio: 14, fin: 22, tipo: 'valle' as const, diaSemana: 'LV' as const }, // 8h × 5 = 40h
      ];
      
      // Con 80% pico y 40% valle:
      // (40×80 + 40×40) / 80 = 60%
      const weighted = calculateWeightedOccupancyWithValues(horarios, 80, 40);
      
      expect(weighted).toBe(60);
    });

    it('promedio simple cuando no hay horarios', () => {
      const weighted = calculateWeightedOccupancyWithValues([], 70, 30);
      
      expect(weighted).toBe(50); // (70 + 30) / 2
    });
  });

  describe('calculateTotalWeeklyHours', () => {
    it('suma horas semanales correctamente', () => {
      const horarios = [
        { inicio: 6, fin: 22, diaSemana: 'LV' as const },  // 16h × 5 = 80h
        { inicio: 8, fin: 20, diaSemana: 'SD' as const },  // 12h × 2 = 24h
      ];
      
      const total = calculateTotalWeeklyHours(horarios);
      
      expect(total).toBe(104);
    });

    it('retorna 0 para lista vacía', () => {
      const total = calculateTotalWeeklyHours([]);
      expect(total).toBe(0);
    });
  });
});
