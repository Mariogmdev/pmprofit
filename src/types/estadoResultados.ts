// ==========================================
// 1. LineaResultados
// ==========================================
export interface LineaResultados {
  concepto: string;
  valor: number;
  nivel: number; // 0=principal, 1=subcategoría, 2=detalle
  esTotal: boolean;
  formula?: string;
}

// ==========================================
// 2. PeriodoResultados
// ==========================================
export interface PeriodoResultados {
  periodo: number; // 1-12 meses ó 1-5 años
  tipo: 'mensual' | 'trimestral' | 'anual';

  ingresos: {
    reservas: number;
    membresias: number;
    pasesDiarios: number;
    clases: number;
    complementarios: number;
    trafico: number;
    brutos: number;
    descuentos: number;
    devoluciones: number;
    netos: number;
  };

  cogs: {
    inventarioInicial: number;
    compras: number;
    inventarioFinal: number;
    costoDirecto: number;
    instructores: number;
    entrenadores: number;
    total: number;
  };

  margenBruto: number;
  margenBrutoPorcentaje: number;

  opex: {
    arriendo: number;
    nomina: number;
    seguros: number;
    serviciosPublicos: number;
    marketing: number;
    mantenimiento: number;
    limpieza: number;
    seguridad: number;
    contabilidad: number;
    legal: number;
    tecnologia: number;
    comisiones: number;
    otros: number;
    total: number; // SOLO caja, sin depreciación
  };

  ebitda: number;
  ebitdaPorcentaje: number;

  depreciacion: {
    actividades: number;
    infraestructura: number;
    obraCivil: number;
    equipamiento: number;
    total: number;
  };

  ebit: number;
  ebitPorcentaje: number;

  financieros: {
    intereses: number;
    otrosGastos: number;
    total: number;
  };

  utilidadAntesImpuestos: number;

  impuestos: {
    tasa: number;  // 0.35
    valor: number; // max(0, utilidadAntesImpuestos * tasa)
  };

  utilidadNeta: number;
  utilidadNetaPorcentaje: number;
}

// ==========================================
// 3. EstadoResultados
// ==========================================
export interface EstadoResultados {
  proyectoId: string;
  generadoEn: string; // ISO timestamp

  config: {
    tasaImpuestos: number;    // 0.35
    depreciacionAnos: number; // 10
    incluyeIntereses: boolean;
  };

  anos: PeriodoResultados[];  // 5 elementos, tipo='anual'
  meses: PeriodoResultados[]; // 12 elementos, tipo='mensual' (Año 1)

  metricas: {
    ingresosTotal5Anos: number;
    ebitdaTotal5Anos: number;
    utilidadNetaTotal5Anos: number;
    ingresoPromedio: number;
    ebitdaPromedio: number;
    margenPromedioEbitda: number;
    margenPromedioNeto: number;

    ratios: {
      margenBruto: number;
      margenOperativo: number;
      margenNeto: number;
      ros: number;
      opexSobreIngresos: number;
      arriendoSobreIngresos: number;
      nominaSobreIngresos: number;
    };
  };

  comparativoAnual: {
    ano: number;
    ingresos: number;
    crecimientoIngresos?: number;
    ebitda: number;
    crecimientoEbitda?: number;
    margenEbitda: number;
    utilidadNeta: number;
    crecimientoUtilidadNeta?: number;
  }[];
}

// ==========================================
// 4. EstadoResultadosProps
// ==========================================
export interface EstadoResultadosProps {
  projectId: string;
  vista: 'anual' | 'mensual';
  periodo?: number;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
}
