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
  // Enhanced "por-reserva" fields
  porcentajeReservas?: number; // % of reservations to apply
  actividadesIncluidas?: string[]; // Array of activity IDs to include
}

export type RentCalculationBase = 'ingresos-brutos' | 'ingresos-netos' | 'utilidades' | 'ingresos-operacionales';

export interface ComisionItem {
  concepto: string;
  base: 'ingresos-brutos' | 'ingresos-netos' | 'utilidades';
  porcentaje: number;
}

export interface BankCommissionItem {
  concepto: string;
  costoMensual: number;
}

export interface RetencionItem {
  concepto: string;
  base: 'ingresos' | 'compras';
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
  
  // 3-9. Categories
  servicios_publicos: ServiceItem[];
  marketing: ServiceItem[];
  tecnologia: ServiceItem[];
  seguridad: ServiceItem[];
  seguros: ServiceItem[];
  mantenimiento_general: ServiceItem[];
  administrativos: ServiceItem[];
  
  // 10. Financial Expenses (NEW)
  incluir_4x1000?: boolean;
  comisiones_bancarias?: BankCommissionItem[];
  incluir_comision_datafono?: boolean;
  comision_datafono_porcentaje?: number;
  porcentaje_ventas_datafono?: number;
  gastos_financieros?: ServiceItem[];
  
  // 11. Taxes (NEW)
  incluir_iva?: boolean;
  porcentaje_ingresos_iva?: number;
  tarifa_iva?: number;
  iva_pagado_estimado?: number;
  incluir_retenciones?: boolean;
  retenciones?: RetencionItem[];
  impuestos?: ServiceItem[];
  
  // 12. Other
  otros_gastos: ServiceItem[];
  
  // 13. Commissions
  comisiones: ComisionItem[];
  
  // 14. Depreciation
  incluir_depreciacion?: boolean; // NEW - default true
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
  gastosFinancieros: number; // NEW
  impuestos: number; // NEW
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
