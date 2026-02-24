import * as XLSX from 'xlsx';
import { DashboardMetrics } from '@/types/dashboard';
import { EstadoResultados } from '@/types/estadoResultados';
import { BalanceGeneral } from '@/types/balanceGeneral';

// ── Helpers de formato ────────────────────────────

function currencyCell(value: number): number {
  return Math.round(value);
}

function pctCell(value: number): number {
  return value / 100; // Excel maneja % como decimal
}

// ── Función principal de exportación ─────────────

export function exportarExcelCompleto(
  projectName: string,
  metrics: DashboardMetrics,
  pl: EstadoResultados,
  balance: BalanceGeneral,
): void {
  const wb = XLSX.utils.book_new();

  agregarHojaResumen(wb, projectName, metrics);
  agregarHojaPL(wb, pl);
  agregarHojaBalance(wb, balance);
  agregarHojaProyeccion(wb, metrics);

  const fecha = new Date().toISOString().split('T')[0];
  const nombreArchivo = `${projectName}_ModeloFinanciero_${fecha}.xlsx`;

  XLSX.writeFile(wb, nombreArchivo);
}

// ── HOJA 1: Resumen Ejecutivo ─────────────────────

function agregarHojaResumen(
  wb: XLSX.WorkBook,
  projectName: string,
  metrics: DashboardMetrics,
): void {
  const data: (string | number | null)[][] = [
    [projectName + ' — Resumen Ejecutivo', null, null, null],
    ['Modelo Financiero', null, null, null],
    [null],
    ['MÉTRICAS CLAVE', null, null, null],
    ['Métrica', 'Valor', 'Unidad', 'Interpretación'],
    ['TIR', pctCell(metrics.tir), '%', metrics.tir > 25 ? 'Atractiva' : 'Revisar'],
    ['VAN', currencyCell(metrics.van), 'COP', metrics.van > 0 ? 'Positivo' : 'Negativo'],
    ['Payback', metrics.paybackMeses, 'Meses', `${(metrics.paybackMeses / 12).toFixed(1)} años`],
    ['CAPEX Total', currencyCell(metrics.capexTotal), 'COP', null],
    ['Ingresos Mensuales (madurez)', currencyCell(metrics.ingresosMensualesBase), 'COP', null],
    ['EBITDA Mensual (madurez)', currencyCell(metrics.ebitdaMensualBase), 'COP', null],
    ['Margen EBITDA', pctCell(metrics.margenEbitdaBase), '%', null],
    [null],
    ['PROYECCIÓN 5 AÑOS', null, null, null, null, null, null],
    ['Año', 'Ingresos', 'OPEX', 'EBITDA', 'Margen %', 'Flujo Caja', 'ROI Acum.'],
    ...metrics.proyeccion.map(y => [
      `Año ${y.year}`,
      currencyCell(y.ingresosAnuales),
      currencyCell(y.opexAnual),
      currencyCell(y.ebitdaAnual),
      pctCell(y.margenEbitda),
      currencyCell(y.flujoCaja),
      pctCell(y.roiAcumulado),
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
    { wch: 12 }, { wch: 20 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
}

// ── HOJA 2: Estado de Resultados P&L ─────────────

function agregarHojaPL(
  wb: XLSX.WorkBook,
  pl: EstadoResultados,
): void {
  const data: (string | number | null)[][] = [
    ['ESTADO DE RESULTADOS (P&L)', null, null, null, null, null],
    ['Formato NIIF/GAAP — Proyección 5 años', null, null, null, null, null],
    [null],
    ['Concepto', 'Año 1', 'Año 2', 'Año 3', 'Año 4', 'Año 5'],
    ['INGRESOS', null, null, null, null, null],
    ['Reservas', ...pl.anos.map(a => currencyCell(a.ingresos.reservas))],
    ['Membresías', ...pl.anos.map(a => currencyCell(a.ingresos.membresias))],
    ['Pases Diarios', ...pl.anos.map(a => currencyCell(a.ingresos.pasesDiarios))],
    ['Clases', ...pl.anos.map(a => currencyCell(a.ingresos.clases))],
    ['Complementarios', ...pl.anos.map(a => currencyCell(a.ingresos.complementarios))],
    ['F&B / Tráfico', ...pl.anos.map(a => currencyCell(a.ingresos.trafico))],
    ['INGRESOS BRUTOS', ...pl.anos.map(a => currencyCell(a.ingresos.brutos))],
    ['- Descuentos', ...pl.anos.map(a => currencyCell(a.ingresos.descuentos))],
    ['INGRESOS NETOS', ...pl.anos.map(a => currencyCell(a.ingresos.netos))],
    [null],
    ['COSTO DE VENTAS', null, null, null, null, null],
    ['Costo Directo', ...pl.anos.map(a => currencyCell(a.cogs.costoDirecto))],
    ['Instructores', ...pl.anos.map(a => currencyCell(a.cogs.instructores))],
    ['TOTAL COGS', ...pl.anos.map(a => currencyCell(a.cogs.total))],
    ['MARGEN BRUTO', ...pl.anos.map(a => currencyCell(a.margenBruto))],
    ['Margen Bruto %', ...pl.anos.map(a => pctCell(a.margenBrutoPorcentaje))],
    [null],
    ['GASTOS OPERACIONALES', null, null, null, null, null],
    ['Arriendo', ...pl.anos.map(a => currencyCell(a.opex.arriendo))],
    ['Nómina', ...pl.anos.map(a => currencyCell(a.opex.nomina))],
    ['Servicios Públicos', ...pl.anos.map(a => currencyCell(a.opex.serviciosPublicos))],
    ['Marketing', ...pl.anos.map(a => currencyCell(a.opex.marketing))],
    ['Mantenimiento', ...pl.anos.map(a => currencyCell(a.opex.mantenimiento))],
    ['Seguridad', ...pl.anos.map(a => currencyCell(a.opex.seguridad))],
    ['Tecnología', ...pl.anos.map(a => currencyCell(a.opex.tecnologia))],
    ['Seguros', ...pl.anos.map(a => currencyCell(a.opex.seguros))],
    ['Otros', ...pl.anos.map(a => currencyCell(a.opex.otros))],
    ['TOTAL OPEX', ...pl.anos.map(a => currencyCell(a.opex.total))],
    [null],
    ['EBITDA', ...pl.anos.map(a => currencyCell(a.ebitda))],
    ['Margen EBITDA %', ...pl.anos.map(a => pctCell(a.ebitdaPorcentaje))],
    [null],
    ['Depreciación', ...pl.anos.map(a => currencyCell(a.depreciacion.total))],
    ['EBIT', ...pl.anos.map(a => currencyCell(a.ebit))],
    ['Margen EBIT %', ...pl.anos.map(a => pctCell(a.ebitPorcentaje))],
    [null],
    ['Impuestos (35%)', ...pl.anos.map(a => currencyCell(a.impuestos.valor))],
    ['UTILIDAD NETA', ...pl.anos.map(a => currencyCell(a.utilidadNeta))],
    ['Margen Neto %', ...pl.anos.map(a => pctCell(a.utilidadNetaPorcentaje))],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'P&L');
}

// ── HOJA 3: Balance General ───────────────────────

function agregarHojaBalance(
  wb: XLSX.WorkBook,
  balance: BalanceGeneral,
): void {
  const data: (string | number | null)[][] = [
    ['BALANCE GENERAL', null, null, null, null, null],
    ['Posición financiera proyectada — 5 años', null, null, null, null, null],
    [null],
    ['Concepto', 'Año 1', 'Año 2', 'Año 3', 'Año 4', 'Año 5'],
    ['ACTIVOS FIJOS', null, null, null, null, null],
    ['CAPEX Bruto', ...balance.periodos.map(p => currencyCell(p.activos.fijos.capexBruto))],
    ['- Depreciación Acumulada', ...balance.periodos.map(p => currencyCell(-p.activos.fijos.depreciacionAcumulada))],
    ['Activo Fijo Neto', ...balance.periodos.map(p => currencyCell(p.activos.fijos.activoFijoNeto))],
    [null],
    ['ACTIVOS CIRCULANTES', null, null, null, null, null],
    ['Efectivo / Caja', ...balance.periodos.map(p => currencyCell(p.activos.circulantes.efectivo))],
    ['Cuentas x Cobrar', ...balance.periodos.map(p => currencyCell(p.activos.circulantes.cuentasPorCobrar))],
    ['Inventarios', ...balance.periodos.map(p => currencyCell(p.activos.circulantes.inventarios))],
    ['Total Circulante', ...balance.periodos.map(p => currencyCell(p.activos.circulantes.total))],
    [null],
    ['TOTAL ACTIVOS', ...balance.periodos.map(p => currencyCell(p.activos.total))],
    [null],
    ['PASIVOS CIRCULANTES', null, null, null, null, null],
    ['Cuentas x Pagar', ...balance.periodos.map(p => currencyCell(p.pasivos.circulantes.cuentasPorPagar))],
    ['Impuestos x Pagar', ...balance.periodos.map(p => currencyCell(p.pasivos.circulantes.impuestosPorPagar))],
    ['Otros Pasivos', ...balance.periodos.map(p => currencyCell(p.pasivos.circulantes.otrosPasivos))],
    ['TOTAL PASIVOS', ...balance.periodos.map(p => currencyCell(p.pasivos.total))],
    [null],
    ['PATRIMONIO', null, null, null, null, null],
    ['Capital Invertido', ...balance.periodos.map(p => currencyCell(p.patrimonio.capitalInvertido))],
    ['Utilidad Retenida', ...balance.periodos.map(p => currencyCell(p.patrimonio.utilidadRetenida))],
    ['Utilidad del Ejercicio', ...balance.periodos.map(p => currencyCell(p.patrimonio.utilidadEjercicio))],
    ['TOTAL PATRIMONIO', ...balance.periodos.map(p => currencyCell(p.patrimonio.total))],
    [null],
    ['PASIVOS + PATRIMONIO', ...balance.periodos.map(p => currencyCell(p.pasivos.total + p.patrimonio.total))],
    [null],
    ['RATIOS FINANCIEROS (Año 3)', null, null, null, null, null],
    ['Liquidez', balance.ratios.liquidez, null, null, null, null],
    ['Endeudamiento', pctCell(balance.ratios.endeudamiento * 100), null, null, null, null],
    ['ROE', pctCell(balance.ratios.roe), null, null, null, null],
    ['ROA', pctCell(balance.ratios.roa), null, null, null, null],
    ['Multiplicador Capital', balance.ratios.multiplicadorCapital, null, null, null, null],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Balance');
}

// ── HOJA 4: Proyección Detallada ──────────────────

function agregarHojaProyeccion(
  wb: XLSX.WorkBook,
  metrics: DashboardMetrics,
): void {
  const data: (string | number | null)[][] = [
    ['PROYECCIÓN FINANCIERA — 5 AÑOS', null, null, null, null, null, null, null],
    [null],
    [
      'Año', 'Ingresos Mensuales', 'Ingresos Anuales',
      'OPEX Mensual', 'OPEX Anual', 'EBITDA Mensual',
      'EBITDA Anual', 'Margen EBITDA %', 'Flujo Caja',
      'Flujo Acumulado', 'ROI Acumulado %', 'Payback',
    ],
    ...metrics.proyeccion.map(y => [
      `Año ${y.year}`,
      currencyCell(y.ingresosMensuales),
      currencyCell(y.ingresosAnuales),
      currencyCell(y.opexMensual),
      currencyCell(y.opexAnual),
      currencyCell(y.ebitdaMensual),
      currencyCell(y.ebitdaAnual),
      pctCell(y.margenEbitda),
      currencyCell(y.flujoCaja),
      currencyCell(y.flujoAcumulado),
      pctCell(y.roiAcumulado),
      y.paybackAlcanzado ? 'Sí' : 'No',
    ]),
    [null],
    ['CAPEX BREAKDOWN', null, null, null, null, null],
    ['Actividades', currencyCell(metrics.capexBreakdown.actividades)],
    ['Infraestructura', currencyCell(metrics.capexBreakdown.infraestructura)],
    ['Obra Civil', currencyCell(metrics.capexBreakdown.obraCivil)],
    ['Imprevistos', currencyCell(metrics.capexBreakdown.imprevistos)],
    ['Working Capital', currencyCell(metrics.capexBreakdown.workingCapital)],
    ['CAPEX TOTAL', currencyCell(metrics.capexTotal)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 18 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 15 },
    { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Proyección');
}
