import {
  ActivityConfig,
  DEFAULT_ACTIVITY_CONFIG,
  DEFAULT_MEMBERSHIP_CONFIG,
  DEFAULT_DAILY_PASS_CONFIG,
  generateId,
} from '@/types/activity';

export interface DraftNomina { cargo: string; cantidad: number; salarioMensual: number }
export interface DraftService { concepto: string; costoMensual: number }
export interface DraftActivity {
  name: string;
  modeloIngreso: 'reserva' | 'membresia' | 'pase-diario' | 'trafico';
  cantidad: number | null;
  areaPorUnidad: number | null;
  duracionReserva: number | null;
  jugadoresPorReserva: number | null;
  capexPorUnidad: number | null;
  horarios: { nombre: string; inicio: number; fin: number; tarifa: number; tipo: 'pico' | 'valle'; ocupacion: number }[];
  precioMembresia: number | null;
  miembrosAno1: number | null;
  precioPase: number | null;
  pasesDia: number | null;
  ticketPromedio: number | null;
  visitantesExternosDia: number | null;
  costoVentasPorcentaje: number | null;
  fuente: string;
}
export const SERVICE_CATEGORIES = [
  'servicios_publicos', 'marketing', 'tecnologia', 'seguros', 'mantenimiento_general', 'administrativos', 'otros_gastos',
] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export interface BusinessPlanDraft {
  project: {
    name: string | null; location: string | null; currency: string | null;
    opening_hour: number | null; closing_hour: number | null; days_per_month: number | null;
    discount_rate: number | null; inflation_rate: number | null; projection_years: number | null;
  };
  activities: DraftActivity[];
  opex: {
    nomina_administrativa: DraftNomina[];
    nomina_operativa: DraftNomina[];
    arrendamiento_modelo: 'propio' | 'fijo' | 'variable' | 'mixto';
    arrendamiento_fijo: number | null;
    arrendamiento_variable_porcentaje: number | null;
  } & Record<ServiceCategory, DraftService[]>;
  capex_obra_civil_total: number | null;
  notas: string[];
}

const ICONS: Record<DraftActivity['modeloIngreso'], string> = {
  reserva: '🎾', membresia: '🏋️', 'pase-diario': '🎟️', trafico: '🍽️',
};

const pos = (v: number | null | undefined, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback;

/** Convert an AI-extracted activity into the app's activity config. */
export function draftActivityToConfig(a: DraftActivity): ActivityConfig & { icon: string } {
  const config: ActivityConfig & { icon: string } = {
    ...DEFAULT_ACTIVITY_CONFIG,
    icon: ICONS[a.modeloIngreso] ?? '📦',
    modeloIngreso: a.modeloIngreso,
    cantidad: Math.round(pos(a.cantidad, 1)),
    areaPorUnidad: pos(a.areaPorUnidad, 0),
    duracionReserva: pos(a.duracionReserva, DEFAULT_ACTIVITY_CONFIG.duracionReserva),
    jugadoresPorReserva: pos(a.jugadoresPorReserva, DEFAULT_ACTIVITY_CONFIG.jugadoresPorReserva),
    capexCubierta: pos(a.capexPorUnidad, 0),
    horarios: (a.horarios || []).map((h) => ({
      id: generateId(),
      nombre: h.nombre,
      inicio: h.inicio,
      fin: h.fin,
      tarifa: Math.max(0, h.tarifa),
      tipo: h.tipo,
      ocupacion: Math.min(100, Math.max(0, h.ocupacion)),
      diaSemana: 'LV' as const,
    })),
  };
  if (a.modeloIngreso === 'membresia') {
    const miembros = pos(a.miembrosAno1, DEFAULT_MEMBERSHIP_CONFIG.miembrosProyectados[0]);
    config.membershipConfig = {
      ...DEFAULT_MEMBERSHIP_CONFIG,
      precioMembresia: pos(a.precioMembresia, DEFAULT_MEMBERSHIP_CONFIG.precioMembresia),
      miembrosProyectados: DEFAULT_MEMBERSHIP_CONFIG.miembrosProyectados.map((_, i) => Math.round(miembros * (1 + 0.1 * i))),
    };
  }
  if (a.modeloIngreso === 'pase-diario') {
    config.dailyPassConfig = {
      ...DEFAULT_DAILY_PASS_CONFIG,
      precioPase: pos(a.precioPase, DEFAULT_DAILY_PASS_CONFIG.precioPase),
      pasesProyectadosDia: pos(a.pasesDia, DEFAULT_DAILY_PASS_CONFIG.pasesProyectadosDia),
    };
  }
  if (a.modeloIngreso === 'trafico') {
    config.trafficConfig = {
      porcentajeUsuariosClub: 30,
      visitantesExternosDia: pos(a.visitantesExternosDia, 0),
      ticketPromedio: pos(a.ticketPromedio, 0),
      consumosPorPersona: 1,
      modeloOperacion: 'propia',
      costoVentas: pos(a.costoVentasPorcentaje, 35),
      comisionConcesion: 0,
      ventasOperador: 0,
    };
  }
  return config;
}

/** Build the project_opex row from the draft. */
export function draftToOpexRow(d: BusinessPlanDraft['opex']) {
  const services = Object.fromEntries(
    SERVICE_CATEGORIES.map((c) => [c, (d[c] || []).map((s) => ({ concepto: s.concepto, tipo: 'fijo', costoMensual: Math.max(0, s.costoMensual) }))]),
  );
  return {
    nomina_administrativa: d.nomina_administrativa || [],
    nomina_operativa: d.nomina_operativa || [],
    arrendamiento_modelo: d.arrendamiento_modelo || 'propio',
    arrendamiento_fijo: d.arrendamiento_fijo ?? 0,
    arrendamiento_variable_porcentaje: d.arrendamiento_variable_porcentaje ?? 0,
    arrendamiento_mixto_fijo: d.arrendamiento_modelo === 'mixto' ? d.arrendamiento_fijo ?? 0 : 0,
    arrendamiento_mixto_porcentaje: d.arrendamiento_modelo === 'mixto' ? d.arrendamiento_variable_porcentaje ?? 0 : 0,
    ...services,
  };
}

/** Read text from a PDF or Excel file in the browser. */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();
  if (name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      pages.push(`--- Página ${i} ---\n` + tc.items.map((it) => ('str' in it ? it.str : '')).join(' '));
    }
    return pages.join('\n\n');
  }
  if (/\.(xlsx|xls|xlsm|csv)$/.test(name)) {
    const XLSX = await import('xlsx-js-style');
    const wb = XLSX.read(buffer, { type: 'array' });
    return wb.SheetNames.map((s) => `--- Hoja: ${s} ---\n` + XLSX.utils.sheet_to_csv(wb.Sheets[s], { blankrows: false })).join('\n\n');
  }
  throw new Error('Formato no soportado. Usa PDF o Excel.');
}
