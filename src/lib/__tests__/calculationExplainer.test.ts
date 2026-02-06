import { describe, it, expect } from 'vitest';
import { explainCalculation, CalculationType, ExplainerContext } from '../calculationExplainer';
import { DashboardMetrics } from '@/types/dashboard';

// Mock metrics data for testing
const createMockMetrics = (overrides: Partial<DashboardMetrics> = {}): DashboardMetrics => ({
  ingresosMensualesBase: 100_000_000,
  ingresosAnualesBase: 1_200_000_000,
  ebitdaMensualBase: 40_000_000,
  margenEbitdaBase: 40,
  capexTotal: 500_000_000,
  tir: 25,
  van: 300_000_000,
  paybackMeses: 36,
  proyeccion: [
    {
      year: 1,
      ingresosMensuales: 90_000_000,
      ingresosAnuales: 1_080_000_000,
      opexMensual: 54_000_000,
      opexAnual: 648_000_000,
      ebitdaMensual: 36_000_000,
      ebitdaAnual: 432_000_000,
      margenEbitda: 40,
      capex: 500_000_000,
      flujoCaja: -68_000_000,
      flujoAcumulado: -68_000_000,
      roiAcumulado: -13.6,
      paybackAlcanzado: false,
    },
    {
      year: 2,
      ingresosMensuales: 100_000_000,
      ingresosAnuales: 1_200_000_000,
      opexMensual: 60_000_000,
      opexAnual: 720_000_000,
      ebitdaMensual: 40_000_000,
      ebitdaAnual: 480_000_000,
      margenEbitda: 40,
      capex: 0,
      flujoCaja: 480_000_000,
      flujoAcumulado: 412_000_000,
      roiAcumulado: 82.4,
      paybackAlcanzado: true,
    },
  ],
  ingresosPorActividad: [
    { nombre: 'Pádel', valor: 60_000_000, porcentaje: 60, color: '#22c55e' },
    { nombre: 'Tenis', valor: 25_000_000, porcentaje: 25, color: '#3b82f6' },
    { nombre: 'Gimnasio', valor: 15_000_000, porcentaje: 15, color: '#f97316' },
  ],
  capexBreakdown: {
    actividades: 300_000_000,
    infraestructura: 100_000_000,
    obraCivil: 50_000_000,
  },
  puntoEquilibrioMes: 36,
  ocupacionPromedio: 65,
  ticketPromedio: 80_000,
  ingresosPorM2Anual: 10_000_000,
  ebitdaPorM2Anual: 4_000_000,
  areaTotal: 120,
  loading: false,
  insights: [],
  activityInsights: [
    {
      activityId: '1',
      nombre: 'Pádel',
      icon: '🎾',
      categoria: 'reserva',
      ingresosMensuales: 60_000_000,
      opexMensual: 30_000_000,
      ebitdaMensual: 30_000_000,
      margenEbitda: 50,
      ocupacionPromedio: 70,
      ocupacionTarget: 75,
      capacidadUtilizada: 93,
      capex: 200_000_000,
      paybackMeses: 24,
      roiAnual: 30,
      rankingIngresos: 1,
      rankingMargen: 1,
      rankingROI: 1,
      insights: [],
      porcentajeIngresosTotales: 60,
      porcentajeOpexTotales: 50,
    },
  ],
  spaceInsights: [],
  topActivitiesByRevenue: [],
  topActivitiesByMargin: [],
  worstPerformers: [],
  trafficActivities: [],
  totalClubUsers: 1000,
  clubUsersBreakdown: [],
  ...overrides,
});

describe('Calculation Explainer', () => {
  const currency = 'COP' as const;
  
  describe('explainCalculation', () => {
    it('should return valid explanation structure for all calculation types', () => {
      const metrics = createMockMetrics();
      const context: ExplainerContext = { metrics, currency };
      
      const calculationTypes: CalculationType[] = [
        'monthly_revenue',
        'monthly_opex',
        'monthly_ebitda',
        'yearly_revenue',
        'yearly_opex',
        'yearly_ebitda',
        'capex_total',
        'tir',
        'van',
        'payback_months',
        'margin_ebitda',
        'break_even',
        'occupancy',
        'revenue_per_m2',
      ];
      
      calculationTypes.forEach(type => {
        const explanation = explainCalculation(type, context);
        
        expect(explanation).toBeDefined();
        expect(explanation.title).toBeDefined();
        expect(explanation.title.length).toBeGreaterThan(0);
        expect(explanation.subtitle).toBeDefined();
        expect(explanation.result).toBeDefined();
        expect(explanation.formattedResult).toBeDefined();
        expect(explanation.steps).toBeDefined();
        expect(Array.isArray(explanation.steps)).toBe(true);
        expect(explanation.steps.length).toBeGreaterThan(0);
      });
    });
    
    it('should calculate monthly revenue explanation correctly', () => {
      const metrics = createMockMetrics();
      const context: ExplainerContext = { metrics, currency };
      
      const explanation = explainCalculation('monthly_revenue', context);
      
      expect(explanation.title).toBe('Ingresos Mensuales Base');
      expect(explanation.result).toBe(100_000_000);
      
      // Should have steps for each activity plus total
      expect(explanation.steps.length).toBe(4); // 3 activities + 1 total
      
      // Last step should be the total
      const lastStep = explanation.steps[explanation.steps.length - 1];
      expect(lastStep.value).toBe(100_000_000);
    });
    
    it('should maintain EBITDA identity in explanation', () => {
      const metrics = createMockMetrics();
      const context: ExplainerContext = { metrics, currency };
      
      const explanation = explainCalculation('monthly_ebitda', context);
      
      // Find the EBITDA calculation step
      const ebitdaStep = explanation.steps.find(s => s.label.includes('EBITDA'));
      
      expect(ebitdaStep).toBeDefined();
      // The result should equal ingresos - opex
      expect(explanation.result).toBe(metrics.ebitdaMensualBase);
    });
    
    it('should explain CAPEX breakdown correctly', () => {
      const metrics = createMockMetrics();
      const context: ExplainerContext = { metrics, currency };
      
      const explanation = explainCalculation('capex_total', context);
      
      expect(explanation.title).toBe('Inversión Total (CAPEX)');
      expect(explanation.result).toBe(500_000_000);
      
      // Should have breakdown steps
      const actividadesStep = explanation.steps.find(s => s.label.includes('Actividades'));
      expect(actividadesStep).toBeDefined();
      expect(actividadesStep?.value).toBe(300_000_000);
      
      const infraestructuraStep = explanation.steps.find(s => s.label.includes('Infraestructura'));
      expect(infraestructuraStep).toBeDefined();
      expect(infraestructuraStep?.value).toBe(100_000_000);
    });
    
    it('should explain TIR with all cash flows', () => {
      const metrics = createMockMetrics();
      const context: ExplainerContext = { metrics, currency };
      
      const explanation = explainCalculation('tir', context);
      
      expect(explanation.title).toBe('Tasa Interna de Retorno (TIR)');
      expect(explanation.result).toBe(25);
      
      // Should have initial investment step
      const investmentStep = explanation.steps.find(s => s.label.includes('Inversión Inicial'));
      expect(investmentStep).toBeDefined();
      expect(investmentStep?.value).toBe(-500_000_000);
      
      // Should have cash flow steps for each year
      const year1Step = explanation.steps.find(s => s.label.includes('Año 1'));
      expect(year1Step).toBeDefined();
    });
    
    it('should explain VAN with discounted cash flows', () => {
      const metrics = createMockMetrics();
      const context: ExplainerContext = { metrics, currency };
      
      const explanation = explainCalculation('van', context);
      
      expect(explanation.title).toBe('Valor Actual Neto (VAN)');
      expect(explanation.result).toBe(300_000_000);
      
      // Should have VP steps for each year
      const vpSteps = explanation.steps.filter(s => s.label.includes('VP'));
      expect(vpSteps.length).toBeGreaterThan(0);
    });
    
    it('should explain payback calculation', () => {
      const metrics = createMockMetrics();
      const context: ExplainerContext = { metrics, currency };
      
      const explanation = explainCalculation('payback_months', context);
      
      expect(explanation.title).toBe('Periodo de Recuperación (Payback)');
      expect(explanation.result).toBe(36);
      expect(explanation.formattedResult).toBe('36 meses');
    });
    
    it('should include helpful notes in explanations', () => {
      const metrics = createMockMetrics();
      const context: ExplainerContext = { metrics, currency };
      
      const explanation = explainCalculation('margin_ebitda', context);
      
      expect(explanation.notes).toBeDefined();
      expect(explanation.notes?.length).toBeGreaterThan(0);
      // Notes should mention healthy margin benchmarks
      expect(explanation.notes?.some(n => n.includes('%'))).toBe(true);
    });
    
    it('should handle zero values gracefully', () => {
      const metrics = createMockMetrics({
        ingresosMensualesBase: 0,
        ebitdaMensualBase: 0,
        capexTotal: 0,
      });
      const context: ExplainerContext = { metrics, currency };
      
      const explanation = explainCalculation('monthly_revenue', context);
      
      expect(explanation).toBeDefined();
      expect(explanation.result).toBe(0);
      // Should not throw errors
      expect(explanation.steps.length).toBeGreaterThan(0);
    });
    
    it('should format currency values correctly', () => {
      const metrics = createMockMetrics();
      const context: ExplainerContext = { metrics, currency };
      
      const explanation = explainCalculation('capex_total', context);
      
      // Formatted result should contain currency formatting
      expect(explanation.formattedResult).toBeDefined();
      expect(explanation.formattedResult.length).toBeGreaterThan(0);
      
      // Steps should have formatted values
      explanation.steps.forEach(step => {
        expect(step.formattedValue).toBeDefined();
      });
    });
    
    it('should explain revenue per m2 correctly', () => {
      const metrics = createMockMetrics();
      const context: ExplainerContext = { metrics, currency };
      
      const explanation = explainCalculation('revenue_per_m2', context);
      
      expect(explanation.title).toBe('Ingresos por m²');
      expect(explanation.result).toBe(10_000_000);
      
      // Should have area step
      const areaStep = explanation.steps.find(s => s.label.includes('Área'));
      expect(areaStep).toBeDefined();
      expect(areaStep?.value).toBe(120);
    });
  });
  
  describe('Step structure validation', () => {
    it('each step should have all required fields', () => {
      const metrics = createMockMetrics();
      const context: ExplainerContext = { metrics, currency };
      
      const explanation = explainCalculation('monthly_ebitda', context);
      
      explanation.steps.forEach(step => {
        expect(step.label).toBeDefined();
        expect(typeof step.label).toBe('string');
        
        expect(step.formula).toBeDefined();
        expect(typeof step.formula).toBe('string');
        
        expect(step.value).toBeDefined();
        expect(typeof step.value).toBe('number');
        
        expect(step.formattedValue).toBeDefined();
        expect(typeof step.formattedValue).toBe('string');
        
        expect(step.explanation).toBeDefined();
        expect(typeof step.explanation).toBe('string');
      });
    });
  });
});
