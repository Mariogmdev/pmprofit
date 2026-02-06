import { describe, it, expect } from 'vitest';
import { calculateCapexTotal, calculateActivityCapex } from '../capexCalculations';

/**
 * Fase 0.2: CAPEX Consistency Tests
 * Validates that CAPEX calculations are consistent and accurate
 */
describe('Fase 0.2: CAPEX Consistency', () => {
  describe('calculateCapexTotal', () => {
    it('calcula total CAPEX correctamente con imprevistos', () => {
      const items = [
        { concepto: 'Obra civil', monto: 500000000 },
        { concepto: 'Equipamiento', monto: 200000000 },
        { concepto: 'Tecnología', monto: 100000000 },
      ];
      
      const imprevistosPercent = 10;
      
      const result = calculateCapexTotal(items, imprevistosPercent);
      
      const expectedSubtotal = 800000000;
      const expectedImprevistos = 80000000;
      const expectedTotal = 880000000;
      
      expect(result.subtotal).toBe(expectedSubtotal);
      expect(result.imprevistos).toBe(expectedImprevistos);
      expect(result.total).toBe(expectedTotal);
    });
    
    it('suma manual coincide con función', () => {
      const items = [
        { concepto: 'Item 1', monto: 100000000 },
        { concepto: 'Item 2', monto: 50000000 },
      ];
      
      const result = calculateCapexTotal(items, 5);
      
      const manualSubtotal = 150000000;
      const manualImprevistos = 7500000;
      const manualTotal = 157500000;
      
      expect(result.subtotal).toBe(manualSubtotal);
      expect(result.imprevistos).toBe(manualImprevistos);
      expect(result.total).toBe(manualTotal);
    });

    it('maneja lista vacía', () => {
      const result = calculateCapexTotal([], 10);
      
      expect(result.subtotal).toBe(0);
      expect(result.imprevistos).toBe(0);
      expect(result.total).toBe(0);
    });

    it('funciona sin imprevistos (0%)', () => {
      const items = [
        { concepto: 'Item 1', monto: 100000000 },
      ];
      
      const result = calculateCapexTotal(items, 0);
      
      expect(result.subtotal).toBe(100000000);
      expect(result.imprevistos).toBe(0);
      expect(result.total).toBe(100000000);
    });
  });

  describe('calculateActivityCapex', () => {
    it('calcula CAPEX de actividad con todos los componentes', () => {
      const config = {
        cantidad: 4,
        tipoCubierta: 'cubierta' as const,
        capexCubierta: 150000000,
        equipamientoEspecifico: [
          { cantidad: 8, precioUnitario: 500000 }, // Palas: 4M
          { cantidad: 4, precioUnitario: 2000000 }, // Redes: 8M
        ],
        consumibles: [
          { cantidad: 100, precioUnitario: 20000 }, // Bolas: 2M
        ],
        mobiliario: [
          { cantidad: 8, precioUnitario: 300000 }, // Bancas: 2.4M
        ],
      };
      
      const result = calculateActivityCapex(config);
      
      expect(result.construccion).toBe(600000000); // 4 × 150M
      expect(result.equipamiento).toBe(12000000); // 4M + 8M
      expect(result.consumibles).toBe(2000000); // 2M
      expect(result.mobiliario).toBe(2400000); // 2.4M
      expect(result.total).toBe(616400000);
    });

    it('maneja configuración vacía', () => {
      const result = calculateActivityCapex({});
      
      expect(result.construccion).toBe(0);
      expect(result.equipamiento).toBe(0);
      expect(result.consumibles).toBe(0);
      expect(result.mobiliario).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});
