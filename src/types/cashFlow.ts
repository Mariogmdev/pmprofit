export interface CashFlowAnual {
  filas: CashFlowFila[];
  tir: number;
  van: number;
  paybackMeses: number;
  paybackAnos: number;
  capexTotal: number;
  moic: number;
  capexBreakdown: {
    actividadesDeportivas: number;
    espaciosInfraestructura: number;
    obraCivil: number;
    imprevistos: number;
    subtotalCapex: number;
    workingCapital: number;
    total: number;
  };
}

export interface CashFlowFila {
  label: string;
  year: number;
  ebitdaAnual: number;
  depreciacionAnual: number;
  ebitAnual: number;
  impuestoAnual: number;
  flujoOperativo: number;
  capexInversion: number;
  valorResidual: number;
  flujoCajaLibre: number;
  flujoAcumulado: number;
  paybackAlcanzado: boolean;
}
