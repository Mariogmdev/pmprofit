import jsPDF from 'jspdf';
import type { DashboardMetrics } from '@/types/dashboard';
import type { Project } from '@/types';

// Paleta de colores ProFit
const COLORS = {
  azul:       '#3B82A0',
  azulOscuro: '#2D6B87',
  azulClaro:  '#4A9BBF',
  lima:       '#CAEB3A',
  limaOscuro: '#A8C82E',
  blanco:     '#FFFFFF',
  grisClaro:  '#F0F4F8',
  grisMedio:  '#8FA8B8',
  negro:      '#1A2A35',
};

const PAGE_W = 297;  // A4 landscape mm
const PAGE_H = 210;
const MARGIN = 16;

// Helpers
function rect(doc: jsPDF, x: number, y: number, w: number, h: number, color: string) {
  doc.setFillColor(color);
  doc.rect(x, y, w, h, 'F');
}

interface TextOpts {
  size?: number;
  color?: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
}

function txt(doc: jsPDF, str: string, x: number, y: number, opts: TextOpts = {}) {
  doc.setFontSize(opts.size || 10);
  doc.setTextColor(opts.color || COLORS.negro);
  if (opts.bold) doc.setFont('helvetica', 'bold');
  else doc.setFont('helvetica', 'normal');
  doc.text(str, x, y, { align: opts.align || 'left' });
}

function formatM(value: number): string {
  if (Math.abs(value) >= 1_000_000_000)
    return '$' + (value / 1_000_000_000).toFixed(1) + 'B';
  if (Math.abs(value) >= 1_000_000)
    return '$' + Math.round(value / 1_000_000) + 'M';
  return '$' + Math.round(value / 1_000).toLocaleString() + 'K';
}

function formatPct(value: number): string {
  return value.toFixed(1) + '%';
}

// ── Reusable elements ───────────────────────────────

function drawHeader(doc: jsPDF, title: string, slideNum: number, totalSlides: number) {
  rect(doc, 0, 0, PAGE_W, 14, COLORS.azul);
  rect(doc, 0, 14, PAGE_W, 1.5, COLORS.lima);
  txt(doc, title, MARGIN, 9.5, { size: 13, color: COLORS.blanco, bold: true });
  txt(doc, `${slideNum} / ${totalSlides}`, PAGE_W - MARGIN, 9.5,
    { size: 9, color: COLORS.grisMedio, align: 'right' });
}

function drawFooter(doc: jsPDF, projectName: string) {
  rect(doc, 0, PAGE_H - 8, PAGE_W, 8, COLORS.azulOscuro);
  txt(doc, 'ProFit · Modelador Financiero', MARGIN, PAGE_H - 3,
    { size: 7, color: COLORS.grisMedio });
  txt(doc, projectName, PAGE_W / 2, PAGE_H - 3,
    { size: 7, color: COLORS.grisMedio, align: 'center' });
  txt(doc, new Date().toLocaleDateString('es-CO'), PAGE_W - MARGIN, PAGE_H - 3,
    { size: 7, color: COLORS.grisMedio, align: 'right' });
}

function drawKPIBox(doc: jsPDF, x: number, y: number, w: number, h: number,
  label: string, value: string, sublabel: string | undefined,
  bgColor: string, valueColor: string) {
  rect(doc, x, y, w, h, bgColor);
  rect(doc, x, y, w, 1, COLORS.lima);
  txt(doc, label, x + w / 2, y + 7, { size: 7.5, color: COLORS.grisMedio, align: 'center' });
  txt(doc, value, x + w / 2, y + 17, { size: 16, color: valueColor, bold: true, align: 'center' });
  if (sublabel) {
    txt(doc, sublabel, x + w / 2, y + 23, { size: 7, color: COLORS.grisMedio, align: 'center' });
  }
}

// ── SLIDE 1: PORTADA ────────────────────────────────
function slide1(doc: jsPDF, project: Project, metrics: DashboardMetrics) {
  rect(doc, 0, 0, PAGE_W, PAGE_H, COLORS.azul);
  rect(doc, 0, 0, 6, PAGE_H, COLORS.lima);

  const cx = PAGE_W / 2;

  txt(doc, 'ProFit', cx, 45, { size: 28, color: COLORS.lima, bold: true, align: 'center' });
  txt(doc, 'Modelador Financiero', cx, 54, { size: 10, color: COLORS.grisMedio, align: 'center' });

  doc.setDrawColor(COLORS.lima);
  doc.setLineWidth(0.5);
  doc.line(cx - 40, 60, cx + 40, 60);

  txt(doc, project.name || 'Proyecto', cx, 75, { size: 22, color: COLORS.blanco, bold: true, align: 'center' });

  if (project.location) {
    txt(doc, project.location, cx, 84, { size: 11, color: COLORS.grisMedio, align: 'center' });
  }

  txt(doc, 'Análisis Financiero para Inversionistas', cx, 96, { size: 9, color: COLORS.grisMedio, align: 'center' });

  const kpiY = 115;
  const kpiW = 50;
  const kpiGap = 8;
  const totalW = 4 * kpiW + 3 * kpiGap;
  const startX = (PAGE_W - totalW) / 2;
  const moic = metrics.capexTotal > 0 ? (metrics.van + metrics.capexTotal) / metrics.capexTotal : 0;

  const kpis = [
    { label: 'TIR', value: formatPct(metrics.tir), sub: 'Retorno anual' },
    { label: 'VAN', value: formatM(metrics.van), sub: `@ ${project.discount_rate ?? 10}%` },
    { label: 'Payback', value: `${metrics.paybackMesesReal}m`, sub: `${(metrics.paybackMesesReal / 12).toFixed(1)} años` },
    { label: 'MOIC', value: moic.toFixed(2) + 'x', sub: 'Múltiplo inversión' },
  ];

  kpis.forEach((kpi, i) => {
    const x = startX + i * (kpiW + kpiGap);
    drawKPIBox(doc, x, kpiY, kpiW, 32, kpi.label, kpi.value, kpi.sub, COLORS.azulOscuro, COLORS.lima);
  });

  txt(doc, new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long' }),
    cx, PAGE_H - 12, { size: 8, color: COLORS.grisMedio, align: 'center' });
}

// ── SLIDE 2: RESUMEN EJECUTIVO ──────────────────────
function slide2(doc: jsPDF, project: Project, metrics: DashboardMetrics) {
  drawHeader(doc, 'Resumen Ejecutivo', 2, 7);
  drawFooter(doc, project.name);

  const moic = metrics.capexTotal > 0 ? (metrics.van + metrics.capexTotal) / metrics.capexTotal : 0;
  const discountRate = project.discount_rate ?? 10;
  const spread = metrics.tir - discountRate;

  const y0 = 22;
  const kpiW = 60;
  const kpiH = 38;
  const gap = 6;

  const kpis = [
    { label: 'TIR del Proyecto', value: formatPct(metrics.tir),
      sub: spread >= 0 ? `Spread +${spread.toFixed(1)}pp vs WACC` : `Spread ${spread.toFixed(1)}pp`,
      color: metrics.tir >= discountRate ? COLORS.lima : '#FF6B6B' },
    { label: `VAN (@${discountRate}%)`, value: formatM(metrics.van),
      sub: metrics.van >= 0 ? 'Valor positivo' : 'Valor negativo',
      color: metrics.van >= 0 ? COLORS.lima : '#FF6B6B' },
    { label: 'Período de Recuperación', value: `${metrics.paybackMesesReal}m`,
      sub: `${(metrics.paybackMesesReal / 12).toFixed(1)} años`,
      color: metrics.paybackMesesReal <= 48 ? COLORS.lima : '#FFA500' },
    { label: 'MOIC', value: moic.toFixed(2) + 'x',
      sub: 'Múltiplo sobre inversión',
      color: moic >= 1.5 ? COLORS.lima : COLORS.blanco },
  ];

  kpis.forEach((kpi, i) => {
    drawKPIBox(doc, MARGIN + i * (kpiW + gap), y0, kpiW, kpiH,
      kpi.label, kpi.value, kpi.sub, COLORS.grisClaro, kpi.color);
  });

  // Two columns below
  const colY = y0 + kpiH + 10;
  const colW = (PAGE_W - 2 * MARGIN - 8) / 2;

  // Left: Investment
  rect(doc, MARGIN, colY, colW, 80, COLORS.grisClaro);
  rect(doc, MARGIN, colY, colW, 1, COLORS.lima);
  txt(doc, 'Estructura de Inversión', MARGIN + 6, colY + 8, { size: 9, bold: true });

  const capexItems: [string, number][] = [
    ['CAPEX Actividades', metrics.capexBreakdown?.actividades ?? 0],
    ['Infraestructura', metrics.capexBreakdown?.infraestructura ?? 0],
    ['Obra Civil', metrics.capexBreakdown?.obraCivil ?? 0],
    ['Imprevistos (10%)', metrics.capexBreakdown?.imprevistos ?? 0],
    ['Working Capital', metrics.capexBreakdown?.workingCapital ?? 0],
  ];

  capexItems.forEach(([label, value], i) => {
    const iy = colY + 16 + i * 11;
    txt(doc, label, MARGIN + 6, iy, { size: 8, color: '#555' });
    txt(doc, formatM(value), MARGIN + colW - 6, iy, { size: 8, bold: true, align: 'right' });
    doc.setDrawColor('#DDD');
    doc.setLineWidth(0.2);
    doc.line(MARGIN + 4, iy + 3, MARGIN + colW - 4, iy + 3);
  });

  const totalY = colY + 16 + 5 * 11 + 2;
  rect(doc, MARGIN, totalY, colW, 10, COLORS.azul);
  txt(doc, 'TOTAL CAPEX', MARGIN + 6, totalY + 7, { size: 9, color: COLORS.blanco, bold: true });
  txt(doc, formatM(metrics.capexTotal), MARGIN + colW - 6, totalY + 7,
    { size: 9, color: COLORS.lima, bold: true, align: 'right' });

  // Right: Project indicators
  const col2X = MARGIN + colW + 8;
  rect(doc, col2X, colY, colW, 80, COLORS.grisClaro);
  rect(doc, col2X, colY, colW, 1, COLORS.lima);
  txt(doc, 'Indicadores del Proyecto', col2X + 6, colY + 8, { size: 9, bold: true });

  const projItems: [string, string][] = [
    ['Ingresos Mensuales (base)', formatM(metrics.ingresosMensualesBase)],
    ['EBITDA Mensual', formatM(metrics.ebitdaMensualBase)],
    ['Margen EBITDA', formatPct(metrics.margenEbitdaBase)],
    ['Años de proyección', `${project.projection_years ?? 5} años`],
    ['Tasa de descuento', `${discountRate}%`],
  ];

  projItems.forEach(([label, value], i) => {
    const iy = colY + 16 + i * 11;
    txt(doc, label, col2X + 6, iy, { size: 8, color: '#555' });
    txt(doc, value, col2X + colW - 6, iy, { size: 8, bold: true, align: 'right' });
    doc.setDrawColor('#DDD');
    doc.setLineWidth(0.2);
    doc.line(col2X + 4, iy + 3, col2X + colW - 4, iy + 3);
  });

  const viable = metrics.tir >= discountRate && metrics.van > 0;
  rect(doc, col2X, colY + 70, colW, 10, viable ? '#22C55E' : '#EF4444');
  txt(doc, viable ? '✓  Proyecto VIABLE para inversión' : '⚠  Revisar supuestos',
    col2X + colW / 2, colY + 77, { size: 9, color: COLORS.blanco, bold: true, align: 'center' });
}

// ── SLIDE 3: PROYECCIÓN FINANCIERA ──────────────────
function slide3(doc: jsPDF, project: Project, metrics: DashboardMetrics) {
  drawHeader(doc, 'Proyección Financiera', 3, 7);
  drawFooter(doc, project.name);

  const projYears = metrics.proyeccion.length;
  const y0 = 22;

  const labelW = 20;
  const dataColW = (PAGE_W - 2 * MARGIN - labelW) / projYears;
  const headers = ['', ...metrics.proyeccion.map(p => `Año ${p.year}`)];
  const rows = [
    ['Ingresos', ...metrics.proyeccion.map(p => formatM(p.ingresosAnuales))],
    ['EBITDA', ...metrics.proyeccion.map(p => formatM(p.ebitdaAnual))],
    ['Margen %', ...metrics.proyeccion.map(p => formatPct(p.margenEbitda))],
    ['FCL', ...metrics.proyeccion.map(p => formatM(p.flujoCajaLibre))],
    ['Acumulado', ...metrics.proyeccion.map(p => formatM(p.flujoAcumulado))],
  ];

  const rowH = 12;
  let tableY = y0;

  // Header row
  let x = MARGIN;
  const colWidths = [labelW, ...Array(projYears).fill(dataColW)];
  headers.forEach((h, i) => {
    rect(doc, x, tableY, colWidths[i], rowH, COLORS.azul);
    txt(doc, h, x + colWidths[i] / 2, tableY + 8,
      { size: 8, color: COLORS.blanco, bold: true, align: 'center' });
    x += colWidths[i];
  });
  tableY += rowH;

  rows.forEach((row, ri) => {
    x = MARGIN;
    const bgColor = ri % 2 === 0 ? COLORS.grisClaro : COLORS.blanco;
    row.forEach((cell, ci) => {
      rect(doc, x, tableY, colWidths[ci], rowH, bgColor);
      const isLabel = ci === 0;
      const isNeg = cell.startsWith('-');
      let color = isLabel ? COLORS.negro : isNeg ? '#EF4444' : COLORS.azulOscuro;
      if (row[0] === 'Acumulado' && !isLabel) {
        color = isNeg ? '#EF4444' : '#22C55E';
      }
      txt(doc, cell, isLabel ? x + 3 : x + colWidths[ci] / 2, tableY + 8,
        { size: 8, color, bold: isLabel, align: isLabel ? 'left' : 'center' });
      x += colWidths[ci];
    });
    doc.setDrawColor('#CCC');
    doc.setLineWidth(0.2);
    doc.line(MARGIN, tableY + rowH, PAGE_W - MARGIN, tableY + rowH);
    tableY += rowH;
  });

  // Bar chart
  const chartX = MARGIN;
  const chartY = tableY + 12;
  const chartW = PAGE_W - 2 * MARGIN;
  const chartH = 55;

  rect(doc, chartX, chartY, chartW, chartH, COLORS.grisClaro);
  txt(doc, 'EBITDA vs Flujo de Caja Libre por Año', chartX + chartW / 2, chartY + 7,
    { size: 9, bold: true, align: 'center' });

  const maxVal = Math.max(...metrics.proyeccion.map(p => Math.max(p.ebitdaAnual, Math.abs(p.flujoCajaLibre))));
  const barAreaH = chartH - 20;
  const barAreaY = chartY + 12;
  const barW = (chartW - 20) / (projYears * 3);
  const barGap = barW * 0.5;

  metrics.proyeccion.forEach((p, i) => {
    const groupX = chartX + 10 + i * (barW * 2 + barGap * 3);

    const ebitdaH = maxVal > 0 ? (p.ebitdaAnual / maxVal) * (barAreaH - 10) : 0;
    rect(doc, groupX, barAreaY + barAreaH - ebitdaH, barW, ebitdaH, COLORS.azul);

    const fclVal = Math.max(0, p.flujoCajaLibre);
    const fclH = maxVal > 0 ? (fclVal / maxVal) * (barAreaH - 10) : 0;
    rect(doc, groupX + barW + 1, barAreaY + barAreaH - fclH, barW, fclH, COLORS.lima);

    txt(doc, `Año ${p.year}`, groupX + barW, barAreaY + barAreaH + 5,
      { size: 6.5, align: 'center' });
  });

  // Legend
  const legX = chartX + chartW - 50;
  const legY = chartY + 10;
  rect(doc, legX, legY, 8, 4, COLORS.azul);
  txt(doc, 'EBITDA', legX + 10, legY + 4, { size: 7 });
  rect(doc, legX, legY + 7, 8, 4, COLORS.lima);
  txt(doc, 'FCL', legX + 10, legY + 11, { size: 7 });
}

// ── SLIDE 4: FLUJO DE CAJA Y RETORNO ────────────────
function slide4(doc: jsPDF, project: Project, metrics: DashboardMetrics) {
  drawHeader(doc, 'Flujo de Caja y Análisis de Retorno', 4, 7);
  drawFooter(doc, project.name);

  const discountRate = project.discount_rate ?? 10;
  const moic = metrics.capexTotal > 0 ? (metrics.van + metrics.capexTotal) / metrics.capexTotal : 0;
  const spread = metrics.tir - discountRate;
  const y0 = 22;

  const kpiW = 60; const kpiH = 35; const gap = 6;
  const kpis = [
    { label: 'TIR', value: formatPct(metrics.tir), sub: 'Internal Rate of Return' },
    { label: `VAN @${discountRate}%`, value: formatM(metrics.van), sub: 'Valor Actual Neto' },
    { label: 'MOIC', value: moic.toFixed(2) + 'x', sub: 'Multiple on Invested Capital' },
    { label: 'Spread vs WACC',
      value: (spread >= 0 ? '+' : '') + spread.toFixed(1) + 'pp',
      sub: `TIR ${metrics.tir.toFixed(1)}% − WACC ${discountRate}%` },
  ];

  kpis.forEach((kpi, i) => {
    drawKPIBox(doc, MARGIN + i * (kpiW + gap), y0, kpiW, kpiH,
      kpi.label, kpi.value, kpi.sub, COLORS.azulOscuro, COLORS.lima);
  });

  // DCF table
  const tableY = y0 + kpiH + 10;
  const years = ['Año 0', ...metrics.proyeccion.map(p => `Año ${p.year}`)];
  const capexRow = [formatM(-metrics.capexTotal), ...metrics.proyeccion.map(() => '—')];
  const fclRow = ['—', ...metrics.proyeccion.map(p => formatM(p.flujoCajaLibre))];
  const acumRow = [formatM(-metrics.capexTotal), ...metrics.proyeccion.map(p => formatM(p.flujoAcumulado))];

  const labelColW = 35;
  const dataW = (PAGE_W - 2 * MARGIN - labelColW) / years.length;

  // Header
  let x = MARGIN + labelColW;
  rect(doc, MARGIN, tableY, labelColW, 10, COLORS.azul);
  txt(doc, 'Concepto', MARGIN + 3, tableY + 7, { size: 8, color: COLORS.blanco, bold: true });
  years.forEach(yr => {
    rect(doc, x, tableY, dataW, 10, COLORS.azul);
    txt(doc, yr, x + dataW / 2, tableY + 7,
      { size: 8, color: yr === 'Año 0' ? COLORS.grisMedio : COLORS.blanco, bold: true, align: 'center' });
    x += dataW;
  });

  const tableRows = [
    { label: 'CAPEX + WC', data: capexRow, conditional: false, defaultColor: '#EF4444' },
    { label: 'Flujo Caja Libre', data: fclRow, conditional: false, defaultColor: COLORS.azulOscuro },
    { label: 'Flujo Acumulado', data: acumRow, conditional: true, defaultColor: '' },
  ];

  tableRows.forEach((row, ri) => {
    const ry = tableY + 10 + ri * 11;
    const bg = ri % 2 === 0 ? COLORS.grisClaro : COLORS.blanco;
    rect(doc, MARGIN, ry, labelColW, 11, bg);
    txt(doc, row.label, MARGIN + 3, ry + 7.5, { size: 8, bold: true });

    x = MARGIN + labelColW;
    row.data.forEach(val => {
      rect(doc, x, ry, dataW, 11, bg);
      let color: string;
      if (row.conditional) {
        color = val.startsWith('-') ? '#EF4444' : val === '—' ? '#999' : '#22C55E';
      } else {
        color = val === '—' ? '#999' : row.defaultColor;
      }
      txt(doc, val, x + dataW / 2, ry + 7.5, { size: 8, color, align: 'center' });
      x += dataW;
    });
    doc.setDrawColor('#DDD');
    doc.setLineWidth(0.2);
    doc.line(MARGIN, ry + 11, PAGE_W - MARGIN, ry + 11);
  });

  // Payback callout
  const pbY = tableY + 10 + 3 * 11 + 8;
  rect(doc, MARGIN, pbY, PAGE_W - 2 * MARGIN, 22, COLORS.azulOscuro);
  rect(doc, MARGIN, pbY, 4, 22, COLORS.lima);
  txt(doc, `Punto de Recuperación: mes ${metrics.paybackMesesReal} (${(metrics.paybackMesesReal / 12).toFixed(1)} años)`,
    MARGIN + 10, pbY + 9, { size: 10, color: COLORS.blanco, bold: true });
  txt(doc, `El proyecto recupera la inversión total de ${formatM(metrics.capexTotal)} en el mes ${metrics.paybackMesesReal}`,
    MARGIN + 10, pbY + 17, { size: 8, color: COLORS.grisMedio });
}

// ── SLIDE 5: ACTIVIDADES Y REVENUE MIX ──────────────
function slide5(doc: jsPDF, project: Project, metrics: DashboardMetrics) {
  drawHeader(doc, 'Composición de Ingresos por Actividad', 5, 7);
  drawFooter(doc, project.name);

  const y0 = 22;
  const activities = metrics.activityInsights || [];
  const totalIngresos = metrics.ingresosMensualesBase;

  if (activities.length === 0) {
    txt(doc, 'No hay actividades configuradas', PAGE_W / 2, PAGE_H / 2,
      { size: 12, color: COLORS.grisMedio, align: 'center' });
    return;
  }

  const colW_act = [55, 35, 35, 30, 35, 30];
  const tableW = colW_act.reduce((s, v) => s + v, 0);
  const headers_act = ['Actividad', 'Ingresos/mes', 'EBITDA/mes', 'Margen', 'CAPEX', 'Payback'];

  let x = MARGIN;
  headers_act.forEach((h, i) => {
    rect(doc, x, y0, colW_act[i], 10, COLORS.azul);
    txt(doc, h, x + colW_act[i] / 2, y0 + 7,
      { size: 7.5, color: COLORS.blanco, bold: true, align: 'center' });
    x += colW_act[i];
  });

  const maxRows = Math.min(activities.length, 8);
  activities.slice(0, maxRows).forEach((act, ri) => {
    const ry = y0 + 10 + ri * 12;
    x = MARGIN;
    const bg = ri % 2 === 0 ? COLORS.grisClaro : COLORS.blanco;

    const cells = [
      act.nombre,
      formatM(act.ingresosMensuales),
      formatM(act.ebitdaMensual),
      formatPct(act.margenEbitda),
      act.capex ? formatM(act.capex) : '—',
      act.paybackMeses ? `${act.paybackMeses}m` : '—',
    ];

    cells.forEach((cell, ci) => {
      rect(doc, x, ry, colW_act[ci], 12, bg);
      const isName = ci === 0;
      const isMargen = ci === 3;
      let color = isMargen
        ? (act.margenEbitda >= 30 ? '#22C55E' : act.margenEbitda >= 20 ? '#FFA500' : '#EF4444')
        : COLORS.negro;
      txt(doc, cell, isName ? x + 3 : x + colW_act[ci] / 2, ry + 8,
        { size: 8, color, bold: isName || isMargen, align: isName ? 'left' : 'center' });
      x += colW_act[ci];
    });

    // Revenue share bar
    const pct = totalIngresos > 0 ? act.ingresosMensuales / totalIngresos : 0;
    const barX = MARGIN + tableW + 4;
    const barMaxW = PAGE_W - barX - MARGIN;
    const barY = ry + 4;
    rect(doc, barX, barY, barMaxW, 5, '#E5E7EB');
    rect(doc, barX, barY, barMaxW * pct, 5, COLORS.lima);
    txt(doc, formatPct(pct * 100), barX + barMaxW + 2, barY + 5,
      { size: 6.5, color: COLORS.grisMedio });

    doc.setDrawColor('#DDD');
    doc.setLineWidth(0.2);
    doc.line(MARGIN, ry + 12, PAGE_W - MARGIN, ry + 12);
  });

  // Totals row
  const totalRowY = y0 + 10 + maxRows * 12 + 2;
  rect(doc, MARGIN, totalRowY, tableW, 12, COLORS.azul);
  txt(doc, 'TOTAL', MARGIN + 3, totalRowY + 8,
    { size: 8.5, color: COLORS.blanco, bold: true });
  txt(doc, formatM(totalIngresos), MARGIN + colW_act[0] + colW_act[1] / 2, totalRowY + 8,
    { size: 8.5, color: COLORS.lima, bold: true, align: 'center' });
  txt(doc, formatM(metrics.ebitdaMensualBase),
    MARGIN + colW_act[0] + colW_act[1] + colW_act[2] / 2, totalRowY + 8,
    { size: 8.5, color: COLORS.lima, bold: true, align: 'center' });
  txt(doc, formatPct(metrics.margenEbitdaBase),
    MARGIN + colW_act[0] + colW_act[1] + colW_act[2] + colW_act[3] / 2, totalRowY + 8,
    { size: 8.5, color: COLORS.lima, bold: true, align: 'center' });
}

// ── SLIDE 6: CAPEX Y ESTRUCTURA ─────────────────────
function slide6(doc: jsPDF, project: Project, metrics: DashboardMetrics) {
  drawHeader(doc, 'Estructura de Inversión (CAPEX)', 6, 7);
  drawFooter(doc, project.name);

  const y0 = 22;
  const breakdown = metrics.capexBreakdown || { actividades: 0, infraestructura: 0, obraCivil: 0, imprevistos: 0, workingCapital: 0 };

  const leftW = (PAGE_W - 2 * MARGIN) * 0.55;

  txt(doc, 'Desglose por Componente', MARGIN, y0 + 6, { size: 10, bold: true });

  const items = [
    { label: 'Actividades Deportivas', value: breakdown.actividades || 0, color: COLORS.azul },
    { label: 'Espacios / Infraestructura', value: breakdown.infraestructura || 0, color: COLORS.azulClaro },
    { label: 'Obra Civil', value: breakdown.obraCivil || 0, color: '#5B8DB8' },
    { label: 'Imprevistos (10%)', value: breakdown.imprevistos || 0, color: COLORS.lima },
    { label: 'Working Capital', value: breakdown.workingCapital || 0, color: COLORS.limaOscuro },
  ];

  const maxVal = Math.max(...items.map(i => i.value));
  const barMaxW = leftW - 70;

  items.forEach((item, i) => {
    const iy = y0 + 16 + i * 22;
    txt(doc, item.label, MARGIN, iy, { size: 8.5 });
    txt(doc, formatM(item.value), MARGIN + leftW - 4, iy,
      { size: 8.5, bold: true, align: 'right' });

    const barW = maxVal > 0 ? (item.value / maxVal) * barMaxW : 0;
    rect(doc, MARGIN, iy + 3, barMaxW, 7, '#E5E7EB');
    rect(doc, MARGIN, iy + 3, barW, 7, item.color);

    const pct = metrics.capexTotal > 0 ? (item.value / metrics.capexTotal) * 100 : 0;
    txt(doc, formatPct(pct), MARGIN + barMaxW + 3, iy + 9,
      { size: 7, color: COLORS.grisMedio });
  });

  const totalY = y0 + 16 + items.length * 22 + 4;
  rect(doc, MARGIN, totalY, leftW, 12, COLORS.azul);
  txt(doc, 'CAPEX TOTAL', MARGIN + 4, totalY + 8,
    { size: 9, color: COLORS.blanco, bold: true });
  txt(doc, formatM(metrics.capexTotal), MARGIN + leftW - 4, totalY + 8,
    { size: 9, color: COLORS.lima, bold: true, align: 'right' });

  // Right: efficiency metrics
  const rightX = MARGIN + leftW + 10;
  const rightW = PAGE_W - rightX - MARGIN;

  txt(doc, 'Métricas de Eficiencia', rightX, y0 + 6, { size: 10, bold: true });

  const capexSinWC = (breakdown.actividades || 0) + (breakdown.infraestructura || 0) +
    (breakdown.obraCivil || 0) + (breakdown.imprevistos || 0);

  const effMetrics = [
    { label: 'CAPEX / m²', value: metrics.areaTotal > 0 ? formatM(metrics.capexTotal / metrics.areaTotal) + '/m²' : 'N/A' },
    { label: 'CAPEX sin WC', value: formatM(capexSinWC) },
    { label: 'Working Capital', value: formatM(breakdown.workingCapital || 0) },
    { label: 'WC / CAPEX Total', value: metrics.capexTotal > 0 ? formatPct((breakdown.workingCapital || 0) / metrics.capexTotal * 100) : '—' },
    { label: 'Años depreciación', value: '10 años' },
    { label: 'Valor residual (40%)', value: formatM(capexSinWC * 0.40) },
  ];

  effMetrics.forEach((m, i) => {
    const my = y0 + 14 + i * 18;
    rect(doc, rightX, my, rightW, 15, i % 2 === 0 ? COLORS.grisClaro : COLORS.blanco);
    rect(doc, rightX, my, 3, 15, COLORS.lima);
    txt(doc, m.label, rightX + 6, my + 6, { size: 7.5, color: '#666' });
    txt(doc, m.value, rightX + 6, my + 12, { size: 9, bold: true });
  });
}

// ── SLIDE 7: SUPUESTOS Y CIERRE ──────────────────────
function slide7(doc: jsPDF, project: Project, metrics: DashboardMetrics) {
  rect(doc, 0, 0, PAGE_W, PAGE_H, COLORS.azul);
  rect(doc, 0, 0, 6, PAGE_H, COLORS.lima);

  const cx = PAGE_W / 2;
  const discountRate = project.discount_rate ?? 10;
  const moic = metrics.capexTotal > 0 ? (metrics.van + metrics.capexTotal) / metrics.capexTotal : 0;

  txt(doc, 'Supuestos del Modelo', cx, 22,
    { size: 14, color: COLORS.lima, bold: true, align: 'center' });

  const supuestos = [
    { label: 'Inflación', value: `${project.inflation_rate ?? 5}% anual` },
    { label: 'Tasa de descuento', value: `${discountRate}%` },
    { label: 'Horizonte', value: `${project.projection_years ?? 5} años` },
    { label: 'Impuesto renta', value: '35% (Colombia)' },
    { label: 'Depreciación', value: '10 años lineal' },
    { label: 'Valor residual', value: '40% activos + 100% WC' },
  ];

  const supW = (PAGE_W - 2 * MARGIN - 8) / 2;
  supuestos.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = MARGIN + col * (supW + 8);
    const sy = 30 + row * 22;
    rect(doc, sx, sy, supW, 18, COLORS.azulOscuro);
    rect(doc, sx, sy, supW, 1.5, COLORS.lima);
    txt(doc, s.label, sx + 6, sy + 7, { size: 8, color: COLORS.grisMedio });
    txt(doc, s.value, sx + 6, sy + 14, { size: 10, color: COLORS.blanco, bold: true });
  });

  doc.setDrawColor(COLORS.lima);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, 100, PAGE_W - MARGIN, 100);

  txt(doc, 'Resumen de Retorno', cx, 112,
    { size: 12, color: COLORS.lima, bold: true, align: 'center' });

  const finalKPIs = [
    `TIR  ${formatPct(metrics.tir)}`,
    `VAN  ${formatM(metrics.van)}`,
    `Payback  ${metrics.paybackMesesReal}m`,
    `MOIC  ${moic.toFixed(2)}x`,
  ];

  finalKPIs.forEach((kpi, i) => {
    txt(doc, kpi, cx, 125 + i * 10,
      { size: 10, color: COLORS.blanco, bold: true, align: 'center' });
  });

  txt(doc, 'Generado por ProFit · Modelador Financiero', cx, PAGE_H - 12,
    { size: 8, color: COLORS.grisMedio, align: 'center' });
  txt(doc, new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
    cx, PAGE_H - 7, { size: 7, color: COLORS.grisMedio, align: 'center' });
}

// ── MAIN EXPORT ──────────────────────────────────────
export function generatePitchDeckPDF(project: Project, metrics: DashboardMetrics) {
  console.log('PDF generation started', project.name);
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  slide1(doc, project, metrics);

  doc.addPage();
  slide2(doc, project, metrics);

  doc.addPage();
  slide3(doc, project, metrics);

  doc.addPage();
  slide4(doc, project, metrics);

  doc.addPage();
  slide5(doc, project, metrics);

  doc.addPage();
  slide6(doc, project, metrics);

  doc.addPage();
  slide7(doc, project, metrics);

  const projectName = (project.name || 'proyecto')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const date = new Date().toISOString().split('T')[0];

  console.log('PDF saving...');
  doc.save(`profit-${projectName}-${date}.pdf`);
  console.log('PDF saved');
}
