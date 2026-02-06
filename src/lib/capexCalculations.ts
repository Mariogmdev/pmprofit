/**
 * CAPEX Calculations
 * Centralized functions for consistent CAPEX totals across the application
 */

export interface CapexItem {
  concepto: string;
  monto: number;
}

export interface CapexTotalResult {
  subtotal: number;
  imprevistos: number;
  total: number;
}

/**
 * Calculate CAPEX total with contingency (imprevistos)
 * 
 * @param items Array of CAPEX items with amounts
 * @param imprevistosPercent Contingency percentage (e.g., 10 = 10%)
 * @returns Subtotal, contingency value, and total
 */
export function calculateCapexTotal(
  items: CapexItem[],
  imprevistosPercent: number = 0
): CapexTotalResult {
  const subtotal = items.reduce((sum, item) => sum + (item.monto || 0), 0);
  const imprevistos = subtotal * (imprevistosPercent / 100);
  const total = subtotal + imprevistos;

  return {
    subtotal,
    imprevistos,
    total,
  };
}

/**
 * Calculate activity CAPEX breakdown
 */
export function calculateActivityCapex(config: {
  cantidad?: number;
  tipoCubierta?: 'cubierta' | 'semicubierta' | 'aire-libre';
  capexCubierta?: number;
  capexSemicubierta?: number;
  capexAireLibre?: number;
  equipamientoEspecifico?: Array<{ cantidad?: number; precioUnitario?: number }>;
  consumibles?: Array<{ cantidad?: number; precioUnitario?: number }>;
  mobiliario?: Array<{ cantidad?: number; precioUnitario?: number }>;
}): {
  construccion: number;
  equipamiento: number;
  consumibles: number;
  mobiliario: number;
  total: number;
} {
  const cantidad = config.cantidad || 1;
  const tipoCubierta = config.tipoCubierta || 'cubierta';
  
  const capexPorUnidad = tipoCubierta === 'cubierta' 
    ? (config.capexCubierta || 0)
    : tipoCubierta === 'semicubierta'
      ? (config.capexSemicubierta || 0)
      : (config.capexAireLibre || 0);
  
  const construccion = capexPorUnidad * cantidad;
  
  const equipamiento = (config.equipamientoEspecifico || []).reduce(
    (sum, e) => sum + ((e.cantidad || 0) * (e.precioUnitario || 0)), 0
  );
  
  const consumibles = (config.consumibles || []).reduce(
    (sum, c) => sum + ((c.cantidad || 0) * (c.precioUnitario || 0)), 0
  );
  
  const mobiliario = (config.mobiliario || []).reduce(
    (sum, m) => sum + ((m.cantidad || 0) * (m.precioUnitario || 0)), 0
  );
  
  const total = construccion + equipamiento + consumibles + mobiliario;

  return {
    construccion,
    equipamiento,
    consumibles,
    mobiliario,
    total,
  };
}
