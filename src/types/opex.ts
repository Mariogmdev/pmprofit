// Types for Section C: Detailed OPEX

export interface NominaItem {
  cargo: string;
  cantidad: number;
  salarioMensual: number;
}

export interface ServiceItem {
  concepto: string;
  costoMensual: number;
}

export interface ProjectOpex {
  id: string;
  project_id: string;
  
  // 1. Payroll
  nomina_administrativa: NominaItem[];
  nomina_operativa: NominaItem[];
  prestaciones_porcentaje: number; // default 53.94% (Colombia)
  
  // 2. Rent
  arrendamiento_modelo: 'variable' | 'fijo' | 'mixto' | 'propio';
  arrendamiento_fijo: number;
  arrendamiento_variable_porcentaje: number;
  arrendamiento_mixto_fijo: number;
  arrendamiento_mixto_porcentaje: number;
  
  // 3-9. Other categories (all use ServiceItem format)
  servicios_publicos: ServiceItem[];
  marketing: ServiceItem[];
  tecnologia: ServiceItem[];
  seguros: ServiceItem[];
  mantenimiento_general: ServiceItem[];
  administrativos: ServiceItem[];
  otros_gastos: ServiceItem[];
  
  // 10. Depreciation
  depreciacion_anos: number; // default 10
  
  updated_at: string;
}

export interface OpexSummary {
  // By category
  nominaAdmin: number;
  nominaOperativo: number;
  nominaActividades: number; // from Section A
  prestaciones: number;
  totalNomina: number;
  
  arrendamiento: number;
  serviciosPublicos: number;
  marketing: number;
  tecnologia: number;
  seguros: number;
  mantenimientoGeneral: number;
  mantenimientoActividades: number; // from Section A
  administrativos: number;
  otrosGastos: number;
  depreciacion: number;
  
  // Total
  opexMensualTotal: number;
  
  // Metrics
  ingresosMensuales: number; // from Section A
  opexComoPorcentaje: number;
  ebitdaMensual: number;
  margenEbitda: number;
}
