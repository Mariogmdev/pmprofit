// =====================================================
// Balance General — Tipos TypeScript
// =====================================================

// ── ACTIVOS ──────────────────────────────────────

export interface ActivosFijos {
  capexBruto: number;            // CAPEX total invertido
  depreciacionAcumulada: number; // Suma depreciación años 1..N
  activoFijoNeto: number;       // capexBruto - depreciacionAcumulada
}

export interface ActivosCirculantes {
  efectivo: number;              // Caja disponible (flujo acumulado)
  cuentasPorCobrar: number;      // % ingresos pendiente cobro
  inventarios: number;           // Working capital operativo
  otrosActivos: number;
  total: number;
}

export interface TotalActivos {
  fijos: ActivosFijos;
  circulantes: ActivosCirculantes;
  total: number;                 // fijos.activoFijoNeto + circulantes.total
}

// ── PASIVOS ───────────────────────────────────────

export interface PasivosCirculantes {
  cuentasPorPagar: number;       // % OPEX pendiente pago
  impuestosPorPagar: number;     // Impuestos del período
  otrosPasivos: number;
  total: number;
}

export interface PasivosTotales {
  circulantes: PasivosCirculantes;
  largoplazo: number;            // 0 por ahora (sin deuda)
  total: number;
}

// ── PATRIMONIO ────────────────────────────────────

export interface Patrimonio {
  capitalInvertido: number;      // CAPEX total (inversión inicial)
  utilidadRetenida: number;      // Suma utilidadNeta años 1..N
  utilidadEjercicio: number;     // utilidadNeta del año actual
  total: number;                 // capitalInvertido + utilidadRetenida + utilidadEjercicio
}

// ── PERÍODO DEL BALANCE ───────────────────────────

export interface PeriodoBalance {
  periodo: number;               // 1-5 (años)
  activos: TotalActivos;
  pasivos: PasivosTotales;
  patrimonio: Patrimonio;

  // IDENTIDAD CONTABLE (siempre debe cumplirse):
  // activos.total === pasivos.total + patrimonio.total
  diferenciaIdentidad: number;   // debe ser 0 (tolerancia < $1,000)
}

// ── BALANCE GENERAL COMPLETO ──────────────────────

export interface BalanceGeneral {
  proyectoId: string;
  generadoEn: string;            // ISO timestamp
  capexTotal: number;            // inversión total del proyecto

  periodos: PeriodoBalance[];    // 5 años

  // Ratios financieros (año 3 = madurez)
  ratios: {
    liquidez: number;            // activosCirculantes / pasivosCirculantes
    endeudamiento: number;       // pasivos.total / activos.total
    roe: number;                 // utilidadNeta / patrimonio.total * 100
    roa: number;                 // utilidadNeta / activos.total * 100
    multiplicadorCapital: number; // activos.total / patrimonio.total
  };
}

// ── PROPS DEL COMPONENTE UI ───────────────────────

export interface BalanceGeneralProps {
  projectId: string;
  vista?: 'comparativo' | 'detalle';
  periodoDetalle?: number;       // 1-5, para vista detalle
}
