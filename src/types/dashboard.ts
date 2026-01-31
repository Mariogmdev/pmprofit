// Types for Executive Dashboard (Tab 4)

export interface ProjectionYear {
  year: number;
  ingresosMensuales: number;
  ingresosAnuales: number;
  opexMensual: number;
  opexAnual: number;
  ebitdaMensual: number;
  ebitdaAnual: number;
  margenEbitda: number;
  capex: number;
  flujoCaja: number;
  flujoAcumulado: number;
  roiAcumulado: number;
  paybackAlcanzado: boolean;
}

export interface DashboardMetrics {
  // Hero metrics
  ingresosMensualesAno1: number;
  ingresosAnualesAno1: number;
  ebitdaMensualAno1: number;
  margenEbitdaAno1: number;
  capexTotal: number;
  tir: number;
  van: number;
  paybackMeses: number;
  
  // Projection 5 years
  proyeccion: ProjectionYear[];
  
  // Income composition
  ingresosPorActividad: Array<{
    nombre: string;
    valor: number;
    porcentaje: number;
    color: string;
  }>;
  
  // CAPEX breakdown
  capexBreakdown: {
    actividades: number;
    infraestructura: number;
    obraCivil: number;
  };
  
  // Additional metrics
  puntoEquilibrioMes: number;
  ocupacionPromedio: number;
  ticketPromedio: number;
  ingresosPorM2Anual: number;
  ebitdaPorM2Anual: number;
  areaTotal: number;
  
  // Loading state
  loading: boolean;
  
  // Insights
  insights: DashboardInsight[];
}

export interface DashboardInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  action?: {
    label: string;
    tab?: 'config' | 'constructor' | 'modules';
  };
}

export type ProjectionViewMode = 'anual' | 'mensual' | 'trimestral';

// Colors for charts
export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  income: '#22c55e',
  opex: '#ef4444',
  ebitda: '#3b82f6',
  capex: '#a855f7',
  payback: '#f97316',
  activities: ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#64748b'],
};
