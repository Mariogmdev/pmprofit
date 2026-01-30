// Tipos para Sección B: Espacios e Infraestructura

export type SpaceType = 
  | 'recepcion' 
  | 'vestuarios' 
  | 'parqueadero' 
  | 'cafeteria' 
  | 'zona-lounge' 
  | 'pro-shop' 
  | 'zona-kids' 
  | 'terraza' 
  | 'salon-eventos' 
  | 'custom';

export interface BreakdownItem {
  item: string;
  cantidad: number;
  precioUnitario: number;
}

export interface SpaceIncomeConfig {
  modelo: 'alquiler' | 'concesion' | 'venta';
  ingresoMensual: number;
}

export interface ProjectSpace {
  id: string;
  project_id: string;
  type: SpaceType;
  name: string;
  area: number;
  capex_por_m2: number;
  breakdown: BreakdownItem[];
  genera_ingresos: boolean;
  configuracion_ingresos?: SpaceIncomeConfig | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ObraCivil {
  id: string;
  project_id: string;
  area_total_proyecto: number;
  costo_construccion_por_m2: number;
  capex_construccion: number;
  paisajismo: number;
  estudios_disenos: number;
  permisos_licencias: number;
  interventoria: number;
  interventoria_porcentaje: number;
  imprevistos_porcentaje: number;
  imprevistos_valor: number;
  capex_obra_civil_total: number;
  updated_at: string;
}

export interface InfrastructureSummaryData {
  capexEspacios: number;
  capexObraCivil: number;
  capexActividades: number;
  capexTotalProyecto: number;
}

export interface SpaceTemplate {
  type: SpaceType;
  name: string;
  icon: string;
  defaultArea: number;
}

export const SPACE_TEMPLATES: SpaceTemplate[] = [
  { type: 'recepcion', name: 'Recepción y Administración', icon: '🏢', defaultArea: 80 },
  { type: 'vestuarios', name: 'Vestuarios y Baños', icon: '🚿', defaultArea: 100 },
  { type: 'parqueadero', name: 'Parqueadero', icon: '🅿️', defaultArea: 500 },
  { type: 'cafeteria', name: 'Cafetería', icon: '☕', defaultArea: 60 },
  { type: 'zona-lounge', name: 'Zona Lounge', icon: '🛋️', defaultArea: 80 },
  { type: 'pro-shop', name: 'Pro Shop', icon: '🛍️', defaultArea: 40 },
  { type: 'zona-kids', name: 'Zona Kids', icon: '🧒', defaultArea: 50 },
  { type: 'terraza', name: 'Terraza', icon: '🌳', defaultArea: 100 },
  { type: 'salon-eventos', name: 'Salón de Eventos', icon: '🎉', defaultArea: 150 },
  { type: 'custom', name: 'Espacio Personalizado', icon: '➕', defaultArea: 0 },
];
