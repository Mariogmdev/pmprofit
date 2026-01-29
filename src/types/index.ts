// Tipos para la aplicación Padel Mundial

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  area_total: number | null;
  opening_date: string | null;
  
  // Configuración financiera
  currency: CurrencyCode;
  currency_symbol: string;
  discount_rate: number;
  inflation_rate: number;
  projection_years: number;
  
  // Horarios operación
  opening_hour: number;
  opening_minute: number;
  closing_hour: number;
  closing_minute: number;
  days_per_month: number;
  
  weekend_different: boolean;
  weekend_opening_hour: number | null;
  weekend_closing_hour: number | null;
  
  holidays_different: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  last_saved_at: string;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  module_id: string | null;
  name: string;
  quantity: number;
  config: Record<string, unknown> | null;
  capex: number;
  opex_monthly: number;
  revenue_monthly: number;
  order_index: number;
  created_at: string;
}

export interface Module {
  id: string;
  name: string;
  category: string;
  type: 'actividad' | 'espacio' | 'servicio';
  default_config: Record<string, unknown>;
  created_by: string | null;
  is_public: boolean;
  is_system: boolean;
  usage_count: number;
  created_at: string;
}

// Tipos de moneda soportados
export type CurrencyCode = 'COP' | 'USD' | 'EUR' | 'MXN' | 'ARS' | 'CLP' | 'PEN' | 'BRL' | 'CUSTOM';

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: Record<Exclude<CurrencyCode, 'CUSTOM'>, CurrencyInfo> = {
  COP: { code: 'COP', name: 'Peso Colombiano', symbol: '$', locale: 'es-CO' },
  USD: { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', locale: 'en-US' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  MXN: { code: 'MXN', name: 'Peso Mexicano', symbol: '$', locale: 'es-MX' },
  ARS: { code: 'ARS', name: 'Peso Argentino', symbol: '$', locale: 'es-AR' },
  CLP: { code: 'CLP', name: 'Peso Chileno', symbol: '$', locale: 'es-CL' },
  PEN: { code: 'PEN', name: 'Sol Peruano', symbol: 'S/', locale: 'es-PE' },
  BRL: { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', locale: 'pt-BR' },
};

// Opciones de proyección
export const PROJECTION_YEARS_OPTIONS = [3, 5, 7, 10] as const;
export type ProjectionYears = typeof PROJECTION_YEARS_OPTIONS[number];

// Estado del guardado
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Tabs de la aplicación
export type AppTab = 'config' | 'sports' | 'opex' | 'summary';

export interface TabInfo {
  id: AppTab;
  label: string;
  icon: string;
}

export const APP_TABS: TabInfo[] = [
  { id: 'config', label: 'Configuración', icon: 'settings' },
  { id: 'sports', label: 'Deportes y Actividades', icon: 'activity' },
  { id: 'opex', label: 'OPEX', icon: 'trending-up' },
  { id: 'summary', label: 'Resumen', icon: 'bar-chart-2' },
];
