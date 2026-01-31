// Types for Section C: Detailed OPEX

export interface NominaItem {
  cargo: string;
  cantidad: number;
  salarioMensual: number;
}

export type ExpenseType = 'fijo' | 'porcentaje-facturacion' | 'por-reserva';

export interface ServiceItem {
  concepto: string;
  tipo?: ExpenseType;
  costoMensual?: number;
  porcentaje?: number;
  costoPorReserva?: number;
}

export type RentCalculationBase = 'ingresos-brutos' | 'ingresos-netos' | 'utilidades' | 'ingresos-operacionales';

export interface ComisionItem {
  concepto: string;
  base: 'ingresos-brutos' | 'ingresos-netos' | 'utilidades';
  porcentaje: number;
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
  arrendamiento_variable_base: RentCalculationBase;
  arrendamiento_mixto_fijo: number;
  arrendamiento_mixto_porcentaje: number;
  arrendamiento_mixto_base: RentCalculationBase;
  
  // 3-10. Categories
  servicios_publicos: ServiceItem[];
  marketing: ServiceItem[];
  tecnologia: ServiceItem[];
  seguridad: ServiceItem[];
  seguros: ServiceItem[];
  mantenimiento_general: ServiceItem[];
  administrativos: ServiceItem[];
  otros_gastos: ServiceItem[];
  
  // 11. Commissions
  comisiones: ComisionItem[];
  
  // 12. Depreciation
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
  seguridad: number;
  seguros: number;
  mantenimientoGeneral: number;
  mantenimientoActividades: number; // from Section A
  administrativos: number;
  otrosGastos: number;
  comisiones: number;
  depreciacion: number;
  
  // Total
  opexMensualTotal: number;
  
  // Metrics
  ingresosMensuales: number; // from Section A
  opexComoPorcentaje: number;
  ebitdaMensual: number;
  margenEbitda: number;
}
