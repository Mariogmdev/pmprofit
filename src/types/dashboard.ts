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
  // ── Cash Flow fields ──
  depreciacionAnual: number;
  ebitAnual: number;
  impuestoAnual: number;
  flujoOperativo: number;
  capexInversion: number;
  valorResidual: number;
  flujoCajaLibre: number;
  flujoAcumulado2: number;
  paybackMes: number;
}

// New: Activity-level insight
export interface ActivityInsight {
  activityId: string;
  nombre: string;
  icon: string;
  categoria: string;
  
  // Financial metrics
  ingresosMensuales: number;
  opexMensual: number;
  ebitdaMensual: number;
  margenEbitda: number;
  
  // Operational metrics
  ocupacionPromedio: number;
  ocupacionTarget: number;
  capacidadUtilizada: number;
  
  // ROI metrics
  capex: number;
  paybackMeses: number;
  roiAnual: number;
  
  // Ranking
  rankingIngresos: number;
  rankingMargen: number;
  rankingROI: number;
  
  // Activity-specific insights
  insights: Array<{
    type: 'success' | 'warning' | 'info' | 'opportunity';
    message: string;
    action?: string;
  }>;
  
  // Comparative
  porcentajeIngresosTotales: number;
  porcentajeOpexTotales: number;
}

// New: Space-level insight
export interface SpaceInsight {
  spaceId: string;
  nombre: string;
  tipo: string;
  area: number;
  
  // Financial
  capex: number;
  opexMensual: number;
  ingresosMensuales: number;
  
  // Utilization
  utilizacionEstimada: number;
  capacidadMaxima: number;
  
  // ROI
  roi: number;
  paybackMeses: number;
  
  // Insights
  insights: Array<{
    type: 'success' | 'warning' | 'info';
    message: string;
  }>;
}

// Traffic activity breakdown for dashboard
export interface TrafficActivityBreakdown {
  activityId: string;
  nombre: string;
  icon: string;
  
  // Traffic sources
  usuariosClub: number;
  usuariosExternos: number;
  traficoTotal: number;
  
  // Income calculation
  ticketPromedio: number;
  consumosPorPersona: number;
  ingresosBrutos: number;
  
  // Costs/Commissions
  modeloOperacion: 'propia' | 'concesion';
  costoVentasPorcentaje: number;
  costoVentas: number;
  comisionPorcentaje?: number;
  
  // Net income
  ingresosNetos: number;
  margenBruto: number;
}

export interface DashboardMetrics {
  // Hero metrics - Base/Madurez (100% ocupación objetivo)
  // Estos valores representan el estado estable cuando la actividad alcanza su ocupación objetivo
  ingresosMensualesBase: number;
  ingresosAnualesBase: number;
  
  // EBITDA = Ingresos - OPEX Caja (sin depreciación)
  ebitdaMensualBase: number;
  margenEbitdaBase: number;
  
  // EBIT = EBITDA - Depreciación
  ebitMensualBase: number;
  margenEbitBase: number;
  depreciacionMensual: number;
  
  capexTotal: number;
  tir: number;
  van: number;
  paybackMeses: number;
  paybackMesesReal: number; // Payback considering maturity curve
  
  // Working Capital
  workingCapitalMonths: number;
  workingCapitalValue: number;
  opexMensualBase: number;
  
  // Projection 5 years
  proyeccion: ProjectionYear[];

  // NEW: Detailed monthly breakdown for Year 1 (used by Dashboard "Mensual Año 1")
  year1Monthly?: Array<{
    mes: string;
    ingresos: number;
    opex: number;
    ebitda: number;
    // Desglose por fuente de ingresos
    reservas: number;
    membresias: number;
    pases: number;
    complementarios: number;
    clases: number;
    trafico: number;
  }>;
  
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
    imprevistos: number;
    workingCapital: number;
  };
  
  // Obra Civil detail breakdown
  obraCivilDetail?: {
    construccion: number;
    estudiosDisenos: number;
    interventoria: number;
    paisajismo: number;
    permisosLicencias: number;
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
  
  // NEW: Activity and space insights
  activityInsights: ActivityInsight[];
  spaceInsights: SpaceInsight[];
  topActivitiesByRevenue: ActivityInsight[];
  topActivitiesByMargin: ActivityInsight[];
  worstPerformers: ActivityInsight[];
  
  // NEW: Traffic breakdown
  trafficActivities: TrafficActivityBreakdown[];
  totalClubUsers: number;
  
  // NEW: Club users breakdown by activity
  clubUsersBreakdown: Array<{
    activityId: string;
    nombre: string;
    icon: string;
    usuarios: number;
    porcentaje: number;
  }>;
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
