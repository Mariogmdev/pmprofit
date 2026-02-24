import * as XLSX from 'xlsx-js-style';
import { DashboardMetrics } from '@/types/dashboard';
import { EstadoResultados } from '@/types/estadoResultados';
import { BalanceGeneral } from '@/types/balanceGeneral';
import { ActivityConfig } from '@/types/activity';
import { ProjectOpex } from '@/types/opex';

// ═══════════════════════════════════════════════════
// BRAND COLORS (ARGB format for xlsx-js-style)
// ═══════════════════════════════════════════════════

const COLORS = {
  AZUL_MARINO:  '1A3A6B',
  VERDE_OSCURO: '1A7A40',
  VERDE_CLARO:  'D5F0E0',
  GRIS_OSCURO:  '4A4A4A',
  GRIS_CLARO:   'F2F2F2',
  AZUL_INPUT:   'D6E4FF',
  ROJO:         'CC0000',
  BLANCO:       'FFFFFF',
};

// ═══════════════════════════════════════════════════
// STYLE HELPERS
// ═══════════════════════════════════════════════════

interface CellStyle {
  font?: { bold?: boolean; italic?: boolean; color?: { rgb: string }; sz?: number; name?: string };
  fill?: { fgColor: { rgb: string }; patternType?: string };
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
  border?: Record<string, { style: string; color: { rgb: string } }>;
  numFmt?: string;
}

function makeStyle(opts: {
  bg?: string; fg?: string; bold?: boolean; italic?: boolean;
  sz?: number; numFmt?: string; align?: string;
}): CellStyle {
  const s: CellStyle = {};
  if (opts.bg) s.fill = { fgColor: { rgb: opts.bg }, patternType: 'solid' };
  const font: CellStyle['font'] = { name: 'Calibri' };
  if (opts.bold) font.bold = true;
  if (opts.italic) font.italic = true;
  if (opts.fg) font.color = { rgb: opts.fg };
  if (opts.sz) font.sz = opts.sz;
  s.font = font;
  if (opts.numFmt) s.numFmt = opts.numFmt;
  if (opts.align) s.alignment = { horizontal: opts.align };
  return s;
}

const S = {
  header:       makeStyle({ bg: COLORS.AZUL_MARINO, fg: COLORS.BLANCO, bold: true, sz: 14 }),
  subheader:    makeStyle({ bg: COLORS.AZUL_MARINO, fg: COLORS.BLANCO, bold: true, sz: 11 }),
  section:      makeStyle({ bold: true, sz: 11 }),
  inputCell:    makeStyle({ bg: COLORS.AZUL_INPUT }),
  totalGris:    makeStyle({ bg: COLORS.GRIS_OSCURO, fg: COLORS.BLANCO, bold: true }),
  totalVerde:   makeStyle({ bg: COLORS.VERDE_OSCURO, fg: COLORS.BLANCO, bold: true }),
  totalAzul:    makeStyle({ bg: COLORS.AZUL_MARINO, fg: COLORS.BLANCO, bold: true }),
  verdeClaro:   makeStyle({ bg: COLORS.VERDE_CLARO, bold: true }),
  italic:       makeStyle({ italic: true }),
  italicPct:    makeStyle({ italic: true, numFmt: '0.0%' }),
  currency:     makeStyle({ numFmt: '#,##0' }),
  currencyBold: makeStyle({ numFmt: '#,##0', bold: true }),
  pct:          makeStyle({ numFmt: '0.0%' }),
  pctBold:      makeStyle({ numFmt: '0.0%', bold: true }),
  normal:       makeStyle({}),
  bold:         makeStyle({ bold: true }),
  rojo:         makeStyle({ fg: COLORS.ROJO }),
  rojoCurrency: makeStyle({ fg: COLORS.ROJO, numFmt: '#,##0' }),
};

function c(value: number): number { return Math.round(value); }
function pct(value: number): number { return value / 100; }

function applyStyleToRow(ws: XLSX.WorkSheet, row: number, numCols: number, style: CellStyle): void {
  for (let col = 0; col < numCols; col++) {
    const ref = XLSX.utils.encode_cell({ r: row, c: col });
    if (!ws[ref]) ws[ref] = { v: '', t: 's' };
    ws[ref].s = style;
  }
}

function applyCurrencyStyle(ws: XLSX.WorkSheet, row: number, startCol: number, numCols: number, value_style?: CellStyle): void {
  const style = value_style || S.currency;
  for (let col = startCol; col < startCol + numCols; col++) {
    const ref = XLSX.utils.encode_cell({ r: row, c: col });
    if (ws[ref] && typeof ws[ref].v === 'number') {
      const isNeg = ws[ref].v < 0;
      ws[ref].s = isNeg ? { ...style, font: { ...(style.font || {}), color: { rgb: COLORS.ROJO } } } : style;
    }
  }
}

function applyPctStyle(ws: XLSX.WorkSheet, row: number, startCol: number, numCols: number, bold = false): void {
  const style = bold ? S.pctBold : S.italicPct;
  for (let col = startCol; col < startCol + numCols; col++) {
    const ref = XLSX.utils.encode_cell({ r: row, c: col });
    if (ws[ref]) ws[ref].s = style;
  }
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]): void {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

// ═══════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ═══════════════════════════════════════════════════

export interface ExcelExportParams {
  projectName: string;
  metrics: DashboardMetrics;
  pl: EstadoResultados;
  balance: BalanceGeneral;
  activities: { id: string; name: string; config: ActivityConfig }[];
  opex: ProjectOpex;
  inflationRate: number;
  projectionYears: number;
  daysPerMonth: number;
  discountRate: number;
  workingCapitalMonths: number;
  depreciacionAnos: number;
  openingHour: number;
  closingHour: number;
  currency: string;
}

export function exportarExcelCompleto(params: ExcelExportParams): void {
  const wb = XLSX.utils.book_new();

  agregarReadme(wb, params);
  agregarInputsGlobal(wb, params);
  agregarInputsActividades(wb, params);
  agregarOpexDetalle(wb, params);
  agregarPLAnual(wb, params);
  agregarBalanceGeneral(wb, params);
  agregarCashFlowVanTir(wb, params);

  const fecha = new Date().toISOString().split('T')[0];
  const nombre = `${params.projectName}_ModeloFinanciero_${fecha}.xlsx`;
  XLSX.writeFile(wb, nombre);
}

// ═══════════════════════════════════════════════════
// HOJA 1: README
// ═══════════════════════════════════════════════════

function agregarReadme(wb: XLSX.WorkBook, p: ExcelExportParams): void {
  const hojas = [
    ['README', 'Instrucciones de uso del modelo'],
    ['Inputs_Global', 'Parámetros generales del proyecto (editables)'],
    ['Inputs_Actividades', 'Configuración por actividad (editables)'],
    ['OPEX_Detalle', 'Desglose gastos operativos Año 1'],
    ['P&L_Anual', `Estado de Resultados — ${p.projectionYears} años`],
    ['Balance_General', `Balance General — ${p.projectionYears} años`],
    ['CashFlow_VAN_TIR', 'Flujo de caja, VAN, TIR y métricas de retorno'],
  ];

  const data: (string | null)[][] = [
    [`${p.projectName} — Modelo Financiero | Pádel Mundial`],
    [null],
    ['Cómo usar'],
    ['1) Cambia valores en celdas con fondo AZUL (Inputs) para escenarios.'],
    ['2) Las hojas de cálculo (fondo blanco) se actualizan automáticamente.'],
    ['3) No edites celdas con fórmulas — están protegidas por diseño.'],
    [null],
    ['Hojas del modelo'],
    ['Hoja', 'Descripción'],
    ...hojas.map(h => [h[0], h[1]]),
    [null],
    [`Generado por Pádel Mundial Financial Model`],
    [`Fecha de exportación: ${new Date().toLocaleDateString('es-CO')}`],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [30, 55]);

  // Style title
  const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws[titleRef]) ws[titleRef].s = makeStyle({ bold: true, sz: 16, fg: COLORS.AZUL_MARINO });

  // Style section headers
  const howToRef = XLSX.utils.encode_cell({ r: 2, c: 0 });
  if (ws[howToRef]) ws[howToRef].s = S.section;
  const sheetsRef = XLSX.utils.encode_cell({ r: 7, c: 0 });
  if (ws[sheetsRef]) ws[sheetsRef].s = S.section;

  // Style table header
  applyStyleToRow(ws, 8, 2, S.subheader);

  XLSX.utils.book_append_sheet(wb, ws, 'README');
}

// ═══════════════════════════════════════════════════
// HOJA 2: Inputs_Global
// ═══════════════════════════════════════════════════

function agregarInputsGlobal(wb: XLSX.WorkBook, p: ExcelExportParams): void {
  const rows: [string, string | number, string, string][] = [
    ['Nombre proyecto', p.projectName, '—', 'export'],
    ['Moneda', p.currency, '—', 'export'],
    ['Horizonte', p.projectionYears, 'años', 'export'],
    ['Inflación anual', p.inflationRate / 100, '%', 'export'],
    ['Tasa descuento', p.discountRate, '%', 'export'],
    ['Impuesto renta', 0.35, '%', 'constante'],
    ['Prestaciones soc.', (p.opex.prestaciones_porcentaje || 53.94) / 100, '%', 'constante'],
    ['Días por mes', p.daysPerMonth, 'días', 'export'],
    ['Capital de trabajo', p.workingCapitalMonths, 'meses', 'export'],
    ['Residual activos', 0.40, '%', 'constante'],
    ['Depreciación (años)', p.depreciacionAnos, 'años', 'export'],
    ['Hora apertura', p.openingHour, 'hora', 'export'],
    ['Hora cierre', p.closingHour, 'hora', 'export'],
  ];

  const data: (string | number | null)[][] = [
    ['Inputs Globales (celdas azules = editables)', null, null, null],
    [null],
    ['Campo', 'Valor', 'Unidad', 'Fuente'],
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [25, 20, 10, 12]);

  // Title style
  const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws[titleRef]) ws[titleRef].s = makeStyle({ bold: true, sz: 13, fg: COLORS.AZUL_MARINO });

  // Header row
  applyStyleToRow(ws, 2, 4, S.subheader);

  // Blue input cells (column B, rows 3-15)
  for (let r = 3; r < 3 + rows.length; r++) {
    const ref = XLSX.utils.encode_cell({ r, c: 1 });
    if (ws[ref]) {
      const val = ws[ref].v;
      const isPct = typeof val === 'number' && val <= 1 && val >= 0 && rows[r - 3][2] === '%';
      ws[ref].s = isPct
        ? { ...S.inputCell, numFmt: '0.00%' }
        : S.inputCell;
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Inputs_Global');
}

// ═══════════════════════════════════════════════════
// HOJA 3: Inputs_Actividades
// ═══════════════════════════════════════════════════

function agregarInputsActividades(wb: XLSX.WorkBook, p: ExcelExportParams): void {
  const headers = ['#', 'Actividad', 'Modelo', 'Cantidad', 'CAPEX/unidad', 'CAPEX Adicional', 'Precio/Membresía', 'Miembros A1'];

  const actRows = p.activities.map((act, i) => {
    const cfg = act.config;
    const tipoCubierta = cfg.tipoCubierta || 'cubierta';
    let capexUnit = 0;
    if (tipoCubierta === 'cubierta') capexUnit = cfg.capexCubierta || 0;
    else if (tipoCubierta === 'semicubierta') capexUnit = cfg.capexSemicubierta || 0;
    else capexUnit = cfg.capexAireLibre || 0;

    const capexAdicional = [
      ...(cfg.equipamientoEspecifico || []),
      ...(cfg.consumibles || []),
      ...(cfg.mobiliario || []),
    ].reduce((s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0);

    const precioMembesia = cfg.membershipConfig?.precioMembresia || cfg.dailyPassConfig?.precioPase || 0;
    const miembrosA1 = cfg.membershipConfig?.miembrosProyectados?.[0] || 0;

    return [
      i + 1,
      act.name,
      cfg.modeloIngreso,
      cfg.cantidad,
      c(capexUnit),
      c(capexAdicional),
      c(precioMembesia),
      miembrosA1,
    ];
  });

  const data: (string | number | null)[][] = [
    ['Inputs Actividades (celdas azules = editables)', null, null, null, null, null, null, null],
    [null],
    headers,
    ...actRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [5, 25, 14, 10, 16, 16, 18, 14]);

  // Title
  const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws[titleRef]) ws[titleRef].s = makeStyle({ bold: true, sz: 13, fg: COLORS.AZUL_MARINO });

  // Header row
  applyStyleToRow(ws, 2, headers.length, S.subheader);

  // Blue input cells for data rows
  for (let r = 3; r < 3 + actRows.length; r++) {
    for (let col = 1; col < headers.length; col++) {
      const ref = XLSX.utils.encode_cell({ r, c: col });
      if (ws[ref]) ws[ref].s = S.inputCell;
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Inputs_Actividades');
}

// ═══════════════════════════════════════════════════
// HOJA 4: OPEX_Detalle
// ═══════════════════════════════════════════════════

function agregarOpexDetalle(wb: XLSX.WorkBook, p: ExcelExportParams): void {
  const opex = p.opex;
  const met = p.metrics;

  // Calculate individual OPEX items from the opex config
  const nominaAdmin = (opex.nomina_administrativa || []).reduce(
    (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0);
  const nominaOper = (opex.nomina_operativa || []).reduce(
    (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0);
  const nominaAct = p.activities.reduce((s, a) =>
    s + (a.config.personal || []).reduce((ps, pp) =>
      ps + ((pp.cantidad || 0) * (pp.salarioMensual || 0)), 0), 0);
  const nominaBase = nominaAdmin + nominaOper + nominaAct;
  const prestaciones = nominaBase * ((opex.prestaciones_porcentaje || 53.94) / 100);
  const totalNomina = nominaBase + prestaciones;

  const sumCategory = (items: { costoMensual?: number }[]) =>
    (items || []).reduce((s, i) => s + (i.costoMensual || 0), 0);

  const ingresos = met.ingresosMensualesBase;

  const marketingFijo = sumCategory(opex.marketing || []);
  const seguridadFijo = sumCategory(opex.seguridad || []);
  const segurosFijo = sumCategory(opex.seguros || []);
  const mantFijo = sumCategory(opex.mantenimiento_general || []);
  const adminFijo = sumCategory(opex.administrativos || []);
  const internetFijo = sumCategory(opex.servicios_publicos || []);
  const tecnoFijo = sumCategory(opex.tecnologia || []);

  // Variable items
  const arrMod = opex.arrendamiento_modelo || 'propio';
  let arrPct = 0;
  let arrVal = 0;
  if (arrMod === 'variable') {
    arrPct = opex.arrendamiento_variable_porcentaje || 0;
    arrVal = ingresos * (arrPct / 100);
  } else if (arrMod === 'mixto') {
    arrPct = opex.arrendamiento_mixto_porcentaje || 0;
    arrVal = (opex.arrendamiento_mixto_fijo || 0) + ingresos * (arrPct / 100);
  } else if (arrMod === 'fijo') {
    arrVal = opex.arrendamiento_fijo || 0;
  }

  const cuatroPorMil = opex.incluir_4x1000 ? ingresos * 0.004 : 0;
  const datafonoVal = opex.incluir_comision_datafono !== false
    ? ingresos * ((opex.porcentaje_ventas_datafono ?? 70) / 100) * ((opex.comision_datafono_porcentaje ?? 2.5) / 100)
    : 0;
  const ivaVal = opex.incluir_iva
    ? ingresos * ((opex.porcentaje_ingresos_iva ?? 0) / 100) * ((opex.tarifa_iva ?? 19) / 100)
    : 0;

  const comisionAdm = (opex.comisiones || [])
    .filter(co => co.base !== 'utilidades')
    .reduce((s, co) => s + (ingresos * ((co.porcentaje || 0) / 100)), 0);

  const comisionUtil = (opex.comisiones || [])
    .filter(co => co.base === 'utilidades')
    .reduce((s, co) => co.porcentaje || 0, 0);

  const otrosImprev = sumCategory(opex.otros_gastos || []);

  // Build totals
  const fijosTotal = totalNomina + marketingFijo + seguridadFijo + segurosFijo + mantFijo + adminFijo + internetFijo + tecnoFijo;
  const variablesTotal = arrVal + cuatroPorMil + datafonoVal + ivaVal + comisionAdm + otrosImprev;
  // agua/luz are in servicios_publicos but may be % based - approximate
  const opexCajaSub = fijosTotal + variablesTotal;

  // EBITDA pre for commission calc
  const ebitdaPre = ingresos - opexCajaSub;
  const comisionUtilVal = Math.max(0, ebitdaPre) * (comisionUtil / 100);
  const opexCajaTotal = opexCajaSub + comisionUtilVal;

  // COGS from P&L month 12
  const cogs = p.pl.meses.length > 0 ? p.pl.meses[11]?.cogs?.total || 0 : 0;

  const headers = ['Concepto', 'Base', 'M12 (madurez)', 'Año 1 Prom.', 'Notas'];

  type Row = [string, string, number | string, number | string, string];

  const rows: (Row | null)[] = [
    // Fijos
    ['Nómina base + prestaciones', 'Fijo', c(totalNomina), c(totalNomina), `Admin ${c(nominaAdmin)} + Oper ${c(nominaOper)} + Act ${c(nominaAct)}`],
    ['Marketing', 'Fijo', c(marketingFijo), c(marketingFijo), ''],
    ['Seguridad', 'Fijo', c(seguridadFijo), c(seguridadFijo), ''],
    ['Seguros', 'Fijo', c(segurosFijo), c(segurosFijo), ''],
    ['Mantenimiento', 'Fijo', c(mantFijo), c(mantFijo), ''],
    ['Administrativos', 'Fijo', c(adminFijo), c(adminFijo), ''],
    ['Internet / Servicios Públicos', 'Fijo', c(internetFijo), c(internetFijo), ''],
    ['Tecnología POS', 'Fijo', c(tecnoFijo), c(tecnoFijo), ''],
    null,
    // Variables
    ['Arrendamiento', '% ingresos', c(arrVal), c(arrVal), `${arrPct}% ingresos (${arrMod})`],
    ['4x1000', '% ingresos', c(cuatroPorMil), c(cuatroPorMil), '0.4% ingresos'],
    ['Datáfono', '% ingresos', c(datafonoVal), c(datafonoVal),
      `${opex.porcentaje_ventas_datafono ?? 70}%×${opex.comision_datafono_porcentaje ?? 2.5}%`],
    ['IVA (proxy)', '% ingresos', c(ivaVal), c(ivaVal),
      `${opex.porcentaje_ingresos_iva ?? 0}%×${opex.tarifa_iva ?? 19}%`],
    ['Comisión administración', '% ingresos', c(comisionAdm), c(comisionAdm), ''],
    ['Otros imprevistos', '% ingresos', c(otrosImprev), c(otrosImprev), ''],
    null,
    ['OPEX caja (sin comisión util.)', 'Subtotal', c(opexCajaSub), c(opexCajaSub), ''],
    ['Comisión utilidades', 'EBITDA', c(comisionUtilVal), c(comisionUtilVal), `${comisionUtil}% sobre EBITDA`],
    ['OPEX CAJA TOTAL', 'TOTAL', c(opexCajaTotal), c(opexCajaTotal), ''],
    null,
    ['Instructores / Profesores', 'COGS', c(cogs), c(cogs / 1), 'Costo directo actividades'],
  ];

  const data: (string | number | null)[][] = [
    ['OPEX Detalle — Año 1 Mensual (M12 = madurez)', null, null, null, null],
    [null],
    headers,
    ...rows.map(r => r === null ? [null] : r),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [32, 14, 18, 18, 35]);

  // Title
  const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws[titleRef]) ws[titleRef].s = makeStyle({ bold: true, sz: 13, fg: COLORS.AZUL_MARINO });

  // Headers row
  applyStyleToRow(ws, 2, 5, S.subheader);

  // Style OPEX CAJA TOTAL row (find it)
  const dataStart = 3;
  rows.forEach((row, i) => {
    if (!row) return;
    const excelRow = dataStart + i;
    if (row[0] === 'OPEX CAJA TOTAL') {
      applyStyleToRow(ws, excelRow, 5, S.totalGris);
    } else if (row[0] === 'OPEX caja (sin comisión util.)') {
      applyStyleToRow(ws, excelRow, 5, S.bold);
    }
    // Currency format for columns C, D
    applyCurrencyStyle(ws, excelRow, 2, 2);
  });

  XLSX.utils.book_append_sheet(wb, ws, 'OPEX_Detalle');
}

// ═══════════════════════════════════════════════════
// HOJA 5: P&L_Anual
// ═══════════════════════════════════════════════════

function agregarPLAnual(wb: XLSX.WorkBook, p: ExcelExportParams): void {
  const { pl } = p;
  const numAnos = pl.anos.length;
  const yearHeaders = pl.anos.map(a => `Año ${a.periodo}`);
  const NC = Array(numAnos).fill(null);

  type RowDef = { label: string; values: number[]; style: 'normal' | 'bold' | 'totalAzul' | 'totalGris' | 'totalVerde' | 'verdeClaro' | 'pct' | 'section' };
  const buildRow = (label: string, values: number[], style: RowDef['style'] = 'normal'): RowDef =>
    ({ label, values, style });

  const sections: (RowDef | null)[] = [
    // INGRESOS
    buildRow('INGRESOS', [], 'section'),
    buildRow('Reservas', pl.anos.map(a => a.ingresos.reservas)),
    buildRow('Membresías', pl.anos.map(a => a.ingresos.membresias)),
    buildRow('Pases Diarios', pl.anos.map(a => a.ingresos.pasesDiarios)),
    buildRow('Clases / Instructores', pl.anos.map(a => a.ingresos.clases)),
    buildRow('Complementarios', pl.anos.map(a => a.ingresos.complementarios)),
    buildRow('F&B / Tráfico', pl.anos.map(a => a.ingresos.trafico)),
    buildRow('- Descuentos', pl.anos.map(a => a.ingresos.descuentos)),
    buildRow('INGRESOS NETOS', pl.anos.map(a => a.ingresos.netos), 'totalAzul'),
    null,
    // COGS
    buildRow('COSTO DE VENTAS', [], 'section'),
    buildRow('Costo Directo / F&B', pl.anos.map(a => a.cogs.costoDirecto)),
    buildRow('Instructores', pl.anos.map(a => a.cogs.instructores)),
    buildRow('TOTAL COGS', pl.anos.map(a => a.cogs.total), 'totalGris'),
    buildRow('MARGEN BRUTO', pl.anos.map(a => a.margenBruto), 'bold'),
    buildRow('Margen Bruto %', pl.anos.map(a => a.ingresos.netos > 0 ? a.margenBruto / a.ingresos.netos : 0), 'pct'),
    null,
    // GASTOS OPERACIONALES
    buildRow('GASTOS OPERACIONALES', [], 'section'),
    buildRow('Arrendamiento', pl.anos.map(a => a.opex.arriendo)),
    buildRow('Nómina + Prestaciones', pl.anos.map(a => a.opex.nomina)),
    buildRow('Servicios (agua+luz+internet)', pl.anos.map(a => a.opex.serviciosPublicos)),
    buildRow('Marketing', pl.anos.map(a => a.opex.marketing)),
    buildRow('Mantenimiento', pl.anos.map(a => a.opex.mantenimiento)),
    buildRow('Seguridad', pl.anos.map(a => a.opex.seguridad)),
    buildRow('Tecnología', pl.anos.map(a => a.opex.tecnologia)),
    buildRow('Seguros', pl.anos.map(a => a.opex.seguros)),
    buildRow('Comisiones + Otros', pl.anos.map(a => a.opex.comisiones + a.opex.otros)),
    buildRow('TOTAL OPEX', pl.anos.map(a => a.opex.total), 'totalGris'),
    null,
    // EBITDA
    buildRow('EBITDA', pl.anos.map(a => a.ebitda), 'totalVerde'),
    buildRow('Margen EBITDA %', pl.anos.map(a => a.ingresos.netos > 0 ? a.ebitda / a.ingresos.netos : 0), 'pct'),
    null,
    buildRow('Depreciación y Amortización', pl.anos.map(a => a.depreciacion.total)),
    buildRow('EBIT', pl.anos.map(a => a.ebit), 'bold'),
    buildRow('Margen EBIT %', pl.anos.map(a => a.ingresos.netos > 0 ? a.ebit / a.ingresos.netos : 0), 'pct'),
    null,
    buildRow('Impuesto renta (35%)', pl.anos.map(a => a.impuestos.valor)),
    buildRow('UTILIDAD NETA', pl.anos.map(a => a.utilidadNeta), 'verdeClaro'),
    buildRow('Margen Neto %', pl.anos.map(a => a.ingresos.netos > 0 ? a.utilidadNeta / a.ingresos.netos : 0), 'pct'),
  ];

  const data: (string | number | null)[][] = [
    [`Estado de Resultados — Proyección ${numAnos} años`, ...NC],
    ['Formato NIIF/GAAP — Valores en COP', ...NC],
    [null],
    ['Concepto', ...yearHeaders],
  ];

  sections.forEach(s => {
    if (s === null) {
      data.push([null]);
    } else if (s.values.length === 0) {
      data.push([s.label, ...NC]);
    } else {
      data.push([s.label, ...s.values.map(v => s.style === 'pct' ? v : c(v))]);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [32, ...Array(numAnos).fill(16)]);

  // Title rows
  applyStyleToRow(ws, 0, numAnos + 1, S.header);
  applyStyleToRow(ws, 1, numAnos + 1, makeStyle({ italic: true, fg: COLORS.GRIS_OSCURO, sz: 10 }));
  applyStyleToRow(ws, 3, numAnos + 1, S.subheader);

  // Style each row
  let rowIdx = 4;
  sections.forEach(s => {
    if (s === null) { rowIdx++; return; }
    const numTotalCols = numAnos + 1;
    switch (s.style) {
      case 'totalAzul':
        applyStyleToRow(ws, rowIdx, numTotalCols, S.totalAzul);
        break;
      case 'totalGris':
        applyStyleToRow(ws, rowIdx, numTotalCols, S.totalGris);
        break;
      case 'totalVerde':
        applyStyleToRow(ws, rowIdx, numTotalCols, S.totalVerde);
        break;
      case 'verdeClaro':
        applyStyleToRow(ws, rowIdx, numTotalCols, S.verdeClaro);
        break;
      case 'bold':
        applyStyleToRow(ws, rowIdx, numTotalCols, S.bold);
        applyCurrencyStyle(ws, rowIdx, 1, numAnos, S.currencyBold);
        break;
      case 'pct':
        applyPctStyle(ws, rowIdx, 1, numAnos);
        break;
      case 'section':
        applyStyleToRow(ws, rowIdx, numTotalCols, S.section);
        break;
      default:
        applyCurrencyStyle(ws, rowIdx, 1, numAnos);
        break;
    }
    rowIdx++;
  });

  XLSX.utils.book_append_sheet(wb, ws, 'P&L_Anual');
}

// ═══════════════════════════════════════════════════
// HOJA 6: Balance_General
// ═══════════════════════════════════════════════════

function agregarBalanceGeneral(wb: XLSX.WorkBook, p: ExcelExportParams): void {
  const { balance } = p;
  const numP = balance.periodos.length;
  const yearH = balance.periodos.map(per => `Año ${per.periodo}`);
  const NC = Array(numP).fill(null);

  type RowDef = { label: string; values: number[]; style: string };
  const br = (l: string, v: number[], s = 'normal'): RowDef => ({ label: l, values: v, style: s });

  const sections: (RowDef | null)[] = [
    br('ACTIVOS FIJOS', [], 'section'),
    br('CAPEX Bruto', balance.periodos.map(per => per.activos.fijos.capexBruto)),
    br('- Depreciación Acumulada', balance.periodos.map(per => -per.activos.fijos.depreciacionAcumulada)),
    br('Activo Fijo Neto', balance.periodos.map(per => per.activos.fijos.activoFijoNeto), 'bold'),
    null,
    br('ACTIVOS CIRCULANTES', [], 'section'),
    br('Efectivo / Caja', balance.periodos.map(per => per.activos.circulantes.efectivo)),
    br('Cuentas × Cobrar', balance.periodos.map(per => per.activos.circulantes.cuentasPorCobrar)),
    br('Inventarios', balance.periodos.map(per => per.activos.circulantes.inventarios)),
    br('Total Circulante', balance.periodos.map(per => per.activos.circulantes.total), 'bold'),
    null,
    br('TOTAL ACTIVOS', balance.periodos.map(per => per.activos.total), 'totalAzul'),
    null,
    br('PASIVOS CIRCULANTES', [], 'section'),
    br('Cuentas × Pagar', balance.periodos.map(per => per.pasivos.circulantes.cuentasPorPagar)),
    br('Impuestos × Pagar', balance.periodos.map(per => per.pasivos.circulantes.impuestosPorPagar)),
    br('Otros Pasivos', balance.periodos.map(per => per.pasivos.circulantes.otrosPasivos)),
    br('TOTAL PASIVOS', balance.periodos.map(per => per.pasivos.total), 'totalGris'),
    null,
    br('PATRIMONIO', [], 'section'),
    br('Capital Invertido', balance.periodos.map(per => per.patrimonio.capitalInvertido)),
    br('Utilidad Retenida', balance.periodos.map(per => per.patrimonio.utilidadRetenida)),
    br('Utilidad del Ejercicio', balance.periodos.map(per => per.patrimonio.utilidadEjercicio)),
    br('TOTAL PATRIMONIO', balance.periodos.map(per => per.patrimonio.total), 'totalVerde'),
    null,
    br('PASIVOS + PATRIMONIO ✓', balance.periodos.map(per => per.pasivos.total + per.patrimonio.total), 'bold'),
  ];

  const data: (string | number | null)[][] = [
    [`Balance General — ${numP} años`, ...NC],
    ['Posición financiera proyectada — Valores en COP', ...NC],
    [null],
    ['Concepto', ...yearH],
  ];

  sections.forEach(s => {
    if (s === null) { data.push([null]); }
    else if (s.values.length === 0) { data.push([s.label, ...NC]); }
    else { data.push([s.label, ...s.values.map(v => c(v))]); }
  });

  // Add RATIOS section
  const ratioStart = data.length;
  data.push([null]);
  const ratioYear = Math.min(3, numP);
  data.push([`RATIOS FINANCIEROS (Año ${ratioYear})`, ...NC]);

  const ratios: [string, number, string][] = [
    ['Liquidez corriente', balance.ratios.liquidez, '>1.5 = bueno'],
    ['Endeudamiento', balance.ratios.endeudamiento, '<40% = bueno'],
    ['ROE', balance.ratios.roe > 1 ? balance.ratios.roe / 100 : balance.ratios.roe, '>20% = bueno'],
    ['ROA', balance.ratios.roa > 1 ? balance.ratios.roa / 100 : balance.ratios.roa, '>15% = bueno'],
    ['Multiplicador capital', balance.ratios.multiplicadorCapital, 'informativo'],
  ];

  ratios.forEach(([name, val, note]) => {
    data.push([name, val, note, ...Array(numP - 2).fill(null)]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [32, ...Array(numP).fill(16)]);

  // Title
  applyStyleToRow(ws, 0, numP + 1, S.header);
  applyStyleToRow(ws, 1, numP + 1, makeStyle({ italic: true, fg: COLORS.GRIS_OSCURO, sz: 10 }));
  applyStyleToRow(ws, 3, numP + 1, S.subheader);

  // Style rows
  let ri = 4;
  sections.forEach(s => {
    if (s === null) { ri++; return; }
    const nc = numP + 1;
    switch (s.style) {
      case 'totalAzul': applyStyleToRow(ws, ri, nc, S.totalAzul); break;
      case 'totalGris': applyStyleToRow(ws, ri, nc, S.totalGris); break;
      case 'totalVerde': applyStyleToRow(ws, ri, nc, S.totalVerde); break;
      case 'bold':
        applyStyleToRow(ws, ri, nc, S.bold);
        applyCurrencyStyle(ws, ri, 1, numP, S.currencyBold);
        break;
      case 'section': applyStyleToRow(ws, ri, nc, S.section); break;
      default: applyCurrencyStyle(ws, ri, 1, numP); break;
    }
    ri++;
  });

  // Ratios header
  applyStyleToRow(ws, ratioStart + 1, numP + 1, S.section);

  // Color ratios conditionally
  ratios.forEach(([, val], i) => {
    const rowN = ratioStart + 2 + i;
    const ref = XLSX.utils.encode_cell({ r: rowN, c: 1 });
    if (ws[ref]) {
      const numVal = typeof val === 'number' ? val : 0;
      // Simple green/red based on thresholds
      let color = COLORS.GRIS_OSCURO;
      if (i === 0) color = numVal >= 1.5 ? COLORS.VERDE_OSCURO : numVal < 1 ? COLORS.ROJO : COLORS.GRIS_OSCURO;
      if (i === 1) color = numVal <= 0.4 ? COLORS.VERDE_OSCURO : numVal > 0.6 ? COLORS.ROJO : COLORS.GRIS_OSCURO;
      if (i === 2) color = numVal >= 0.20 ? COLORS.VERDE_OSCURO : COLORS.GRIS_OSCURO;
      if (i === 3) color = numVal >= 0.15 ? COLORS.VERDE_OSCURO : COLORS.GRIS_OSCURO;

      ws[ref].s = i >= 2
        ? makeStyle({ fg: color, bold: true, numFmt: '0.0%' })
        : makeStyle({ fg: color, bold: true, numFmt: '0.00' });
    }
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Balance_General');
}

// ═══════════════════════════════════════════════════
// HOJA 7: CashFlow_VAN_TIR
// ═══════════════════════════════════════════════════

function agregarCashFlowVanTir(wb: XLSX.WorkBook, p: ExcelExportParams): void {
  const { metrics, pl, balance } = p;
  const numAnos = p.projectionYears;
  const proy = metrics.proyeccion;

  // Valor residual = 40% del CAPEX en último año
  const valorResidual = metrics.capexTotal * 0.40;

  // Build cash flow table: Año 0 + Año 1..N
  const yearHeaders = ['Año 0', ...proy.map(y => `Año ${y.year}`)];
  const NC0 = Array(numAnos + 1).fill(null);

  // Cash flow rows
  const ingMensual = [0, ...proy.map(y => c(y.ingresosMensuales))];
  const opexMensual = [0, ...proy.map(y => c(y.opexMensual))];
  const ebitdaMensual = [0, ...proy.map(y => c(y.ebitdaMensual))];
  const ebitdaAnual = [0, ...proy.map(y => c(y.ebitdaAnual))];

  const depAnual = pl.anos.length > 0 ? pl.anos[0].depreciacion.total : 0;
  const depRow = [0, ...proy.map(() => c(depAnual))];

  const ebitAnual = proy.map(y => y.ebitdaAnual - depAnual);
  const ebitRow = [0, ...ebitAnual.map(v => c(v))];

  const impuestoRow = [0, ...ebitAnual.map(v => c(Math.max(0, v * 0.35)))];

  const flujoOperativo = proy.map((y, i) => y.ebitdaAnual - Math.max(0, ebitAnual[i] * 0.35));
  const flujoOpRow = [0, ...flujoOperativo.map(v => c(v))];

  const capexRow = [c(-metrics.capexTotal), ...Array(numAnos).fill(0)];
  const residualRow = [0, ...Array(numAnos - 1).fill(0), c(valorResidual)];

  const flujoCajaLibre = [
    -metrics.capexTotal,
    ...proy.map((y, i) => {
      let fcl = flujoOperativo[i];
      if (i === proy.length - 1) fcl += valorResidual;
      return fcl;
    }),
  ];
  const fclRow = flujoCajaLibre.map(v => c(v));

  let acum = 0;
  const flujoAcum = flujoCajaLibre.map(v => { acum += v; return c(acum); });

  const paybackRow = flujoCajaLibre.map((_, i) => {
    return flujoAcum[i] >= 0 ? 'SÍ' : 'NO';
  });

  type AnyRow = (string | number)[];

  const tableRows: (AnyRow | null)[] = [
    ['Ingresos mensuales (proxy)', ...ingMensual],
    ['OPEX mensual', ...opexMensual],
    ['EBITDA mensual', ...ebitdaMensual],
    ['×12 = EBITDA anual', ...ebitdaAnual],
    ['Depreciación anual', ...depRow],
    ['EBIT anual', ...ebitRow],
    ['Impuesto renta (35%)', ...impuestoRow],
    ['FLUJO CAJA OPERATIVO', ...flujoOpRow],
    ['CAPEX + WC (inversión)', ...capexRow],
    ['Valor residual', ...residualRow],
    ['FLUJO DE CAJA LIBRE', ...fclRow],
    ['Flujo acumulado', ...flujoAcum],
    ['Payback alcanzado', ...paybackRow],
  ];

  const data: (string | number | null)[][] = [
    [`Proyección Cash Flow — ${numAnos} años | VAN & TIR`, ...Array(numAnos).fill(null)],
    [null],
    ['Concepto', ...yearHeaders],
    ...tableRows.map(r => r === null ? [null] : r),
  ];

  // Section B — MÉTRICAS RETORNO
  const moic = metrics.capexTotal > 0
    ? (metrics.van + metrics.capexTotal) / metrics.capexTotal
    : 0;

  data.push([null]);
  data.push(['MÉTRICAS DE RETORNO', null, null]);

  const metricRows: [string, number | string, string][] = [
    ['TIR (IRR)', metrics.tir > 1 ? metrics.tir / 100 : metrics.tir, metrics.tir > 15 ? '✓ Atractiva' : '⚠ Revisar'],
    ['VAN (tasa ' + (p.discountRate * 100).toFixed(0) + '%)', c(metrics.van), metrics.van > 0 ? '✓ Positivo' : '⚠ Negativo'],
    ['Payback', `${metrics.paybackMesesReal || metrics.paybackMeses} meses`, `${((metrics.paybackMesesReal || metrics.paybackMeses) / 12).toFixed(1)} años`],
    ['CAPEX Total', c(metrics.capexTotal), ''],
    ['Múltiplo inversión (MOIC)', moic.toFixed(2) + 'x', ''],
  ];
  metricRows.forEach(r => data.push(r));

  // Section C — CAPEX BREAKDOWN
  data.push([null]);
  data.push(['CAPEX BREAKDOWN', null, null]);

  const capexBreakdownRows: [string, number | string, string][] = [
    ['Actividades deportivas', c(metrics.capexBreakdown.actividades), ''],
    ['Espacios / Infraestructura', c(metrics.capexBreakdown.infraestructura), ''],
    ['Obra civil', c(metrics.capexBreakdown.obraCivil), ''],
    ['Imprevistos (10%)', c(metrics.capexBreakdown.imprevistos), ''],
    ['Subtotal CAPEX', c(metrics.capexTotal - metrics.capexBreakdown.workingCapital), ''],
    ['Working Capital', c(metrics.capexBreakdown.workingCapital), ''],
    ['CAPEX TOTAL', c(metrics.capexTotal), ''],
  ];
  capexBreakdownRows.forEach(r => data.push(r));

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColWidths(ws, [32, ...Array(numAnos + 1).fill(16)]);

  const totalCols = numAnos + 2;

  // Title
  applyStyleToRow(ws, 0, totalCols, S.header);
  applyStyleToRow(ws, 2, totalCols, S.subheader);

  // Style table rows
  const tableStart = 3;
  const styleMap: Record<string, string> = {
    'FLUJO CAJA OPERATIVO': 'totalVerde',
    'FLUJO DE CAJA LIBRE': 'totalVerde',
    '×12 = EBITDA anual': 'bold',
    'EBIT anual': 'bold',
  };

  tableRows.forEach((row, i) => {
    if (!row) return;
    const label = row[0] as string;
    const ri = tableStart + i;

    if (styleMap[label] === 'totalVerde') {
      applyStyleToRow(ws, ri, totalCols, S.totalVerde);
    } else if (styleMap[label] === 'bold') {
      applyStyleToRow(ws, ri, totalCols, S.bold);
      applyCurrencyStyle(ws, ri, 1, numAnos + 1, S.currencyBold);
    } else if (label === 'Payback alcanzado') {
      // Color SÍ green, NO red
      for (let col = 1; col <= numAnos + 1; col++) {
        const ref = XLSX.utils.encode_cell({ r: ri, c: col });
        if (ws[ref]) {
          ws[ref].s = ws[ref].v === 'SÍ'
            ? makeStyle({ fg: COLORS.VERDE_OSCURO, bold: true })
            : makeStyle({ fg: COLORS.ROJO });
        }
      }
    } else if (label === 'Flujo acumulado') {
      applyCurrencyStyle(ws, ri, 1, numAnos + 1);
      // Make italic
      const labelRef = XLSX.utils.encode_cell({ r: ri, c: 0 });
      if (ws[labelRef]) ws[labelRef].s = S.italic;
    } else {
      applyCurrencyStyle(ws, ri, 1, numAnos + 1);
    }
  });

  // Métricas section header
  const metricHeaderRow = tableStart + tableRows.length + 1;
  applyStyleToRow(ws, metricHeaderRow, 3, S.section);

  // TIR color
  const tirRef = XLSX.utils.encode_cell({ r: metricHeaderRow + 1, c: 1 });
  if (ws[tirRef]) {
    ws[tirRef].s = makeStyle({
      fg: metrics.tir > 15 ? COLORS.VERDE_OSCURO : COLORS.ROJO,
      bold: true,
      numFmt: '0.0%',
    });
  }

  // VAN color
  const vanRef = XLSX.utils.encode_cell({ r: metricHeaderRow + 2, c: 1 });
  if (ws[vanRef]) {
    ws[vanRef].s = makeStyle({
      fg: metrics.van > 0 ? COLORS.VERDE_OSCURO : COLORS.ROJO,
      bold: true,
      numFmt: '#,##0',
    });
  }

  // CAPEX breakdown section
  const capexHeaderRow = metricHeaderRow + metricRows.length + 2;
  applyStyleToRow(ws, capexHeaderRow, 3, S.section);

  // CAPEX TOTAL row
  const capexTotalRow = capexHeaderRow + capexBreakdownRows.length;
  applyStyleToRow(ws, capexTotalRow, 3, S.totalVerde);

  // Subtotal CAPEX bold
  const subtotalRow = capexTotalRow - 2;
  applyStyleToRow(ws, subtotalRow, 3, S.bold);

  XLSX.utils.book_append_sheet(wb, ws, 'CashFlow_VAN_TIR');
}
