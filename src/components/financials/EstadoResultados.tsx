import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { EstadoResultadosProps, PeriodoResultados } from '@/types/estadoResultados';
import { calculateEstadoResultados } from '@/lib/estadoResultadosCalculations';
import { useProject } from '@/contexts/ProjectContext';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { useProjectOpex } from '@/hooks/useProjectOpex';
import { useProjectSpaces } from '@/hooks/useProjectSpaces';
import { useObraCivil } from '@/hooks/useObraCivil';
import { ActivityConfig } from '@/types/activity';
import { formatPLCurrency, formatPLPercentage } from '@/lib/plFormatters';

const MONTH_HEADERS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const YEAR_HEADERS = ['Año 1', 'Año 2', 'Año 3', 'Año 4', 'Año 5'];

// ── Auxiliary row components ──────────────────────────

function FilaSeccion({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr className="bg-muted/50">
      <td colSpan={colSpan} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </td>
    </tr>
  );
}

function FilaDetalle({
  label,
  periodos,
  getValue,
}: {
  label: string;
  periodos: PeriodoResultados[];
  getValue: (p: PeriodoResultados) => number;
}) {
  return (
    <tr className="border-b border-border/30 hover:bg-muted/20 transition-colors">
      <td className="px-4 py-1.5 text-sm text-muted-foreground whitespace-nowrap">{label}</td>
      {periodos.map((p, i) => (
        <td key={i} className="px-3 py-1.5 text-sm text-right tabular-nums text-foreground/80">
          {formatPLCurrency(getValue(p))}
        </td>
      ))}
    </tr>
  );
}

function FilaSeparador({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="h-px bg-border" />
    </tr>
  );
}

function FilaTotal({
  label,
  periodos,
  getValue,
  className = '',
}: {
  label: string;
  periodos: PeriodoResultados[];
  getValue: (p: PeriodoResultados) => number;
  className?: string;
}) {
  return (
    <tr className={`${className} border-b border-border/50`}>
      <td className="px-4 py-2 text-sm font-semibold whitespace-nowrap">{label}</td>
      {periodos.map((p, i) => (
        <td key={i} className="px-3 py-2 text-sm font-semibold text-right tabular-nums">
          {formatPLCurrency(getValue(p))}
        </td>
      ))}
    </tr>
  );
}

function FilaTotalConMargen({
  label,
  periodos,
  getValue,
  getMargen,
  className = '',
}: {
  label: string;
  periodos: PeriodoResultados[];
  getValue: (p: PeriodoResultados) => number;
  getMargen: (p: PeriodoResultados) => number;
  className?: string;
}) {
  return (
    <tr className={`${className} border-b border-border/50`}>
      <td className="px-4 py-2 text-sm font-bold whitespace-nowrap">{label}</td>
      {periodos.map((p, i) => (
        <td key={i} className="px-3 py-2 text-right">
          <div className="text-sm font-bold tabular-nums">{formatPLCurrency(getValue(p))}</div>
          <div className="text-xs text-muted-foreground tabular-nums">{formatPLPercentage(getMargen(p))}</div>
        </td>
      ))}
    </tr>
  );
}

// ── Main Component ──────────────────────────

export function EstadoResultados({
  projectId,
  vista: vistaInicial = 'anual',
}: EstadoResultadosProps) {
  const [vista, setVista] = useState<'anual' | 'mensual'>(vistaInicial);

  const { currentProject } = useProject();
  const { activities, loading: activitiesLoading } = useProjectActivities();
  const { opex, loading: opexLoading } = useProjectOpex(projectId);
  const { spaces, loading: spacesLoading } = useProjectSpaces(projectId);
  const { obraCivil, loading: obraCivilLoading } = useObraCivil(projectId);

  const loading = activitiesLoading || opexLoading || spacesLoading || obraCivilLoading;
  const daysPerMonth = currentProject?.days_per_month || 30;

  // Calculate CAPEX (same logic as dashboard)
  const capexData = useMemo(() => {
    const capexActividades = activities.reduce((sum, activity) => {
      const config: ActivityConfig = activity.config;
      const cantidad = config.cantidad || 1;
      const tipoCubierta = config.tipoCubierta || 'cubierta';
      let capexConstruccion = 0;
      if (tipoCubierta === 'cubierta') capexConstruccion = (config.capexCubierta || 0) * cantidad;
      else if (tipoCubierta === 'semicubierta') capexConstruccion = (config.capexSemicubierta || 0) * cantidad;
      else capexConstruccion = (config.capexAireLibre || 0) * cantidad;

      const equipamiento = (config.equipamientoEspecifico || []).reduce((s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0);
      const consumibles = (config.consumibles || []).reduce((s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0);
      const mobiliario = (config.mobiliario || []).reduce((s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0);
      return sum + capexConstruccion + equipamiento + consumibles + mobiliario;
    }, 0);

    const capexEspacios = spaces.reduce((sum, space) => {
      const areaCapex = (space.area || 0) * ((space as any).capex_por_m2 || 0);
      const breakdownTotal = ((space.breakdown as Array<{ cantidad?: number; precioUnitario?: number }>) || []).reduce(
        (s: number, item: { cantidad?: number; precioUnitario?: number }) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0,
      );
      return sum + areaCapex + breakdownTotal;
    }, 0);

    const capexObraCivil = obraCivil?.capex_obra_civil_total || 0;
    const subtotal = capexActividades + capexEspacios + capexObraCivil;
    const imprevistosPct = obraCivil?.imprevistos_porcentaje ?? 10;
    const imprevistos = subtotal * (imprevistosPct / 100);
    const capexSinWC = subtotal + imprevistos;

    return { capexSinWC, workingCapital: 0 };
  }, [activities, spaces, obraCivil]);

  // Calculate P&L
  const pl = useMemo(() => {
    if (!opex || activities.length === 0) return null;
    return calculateEstadoResultados(
      projectId,
      activities,
      opex,
      capexData.capexSinWC,
      capexData.workingCapital,
      0.35,
      opex.depreciacion_anos || 10,
      daysPerMonth,
    );
  }, [projectId, activities, opex, capexData, daysPerMonth]);

  if (loading || !pl) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-muted-foreground text-sm">Calculando Estado de Resultados...</div>
        </CardContent>
      </Card>
    );
  }

  const periodos = vista === 'anual' ? pl.anos : pl.meses;
  const headers = vista === 'anual' ? YEAR_HEADERS : MONTH_HEADERS;
  const colSpan = headers.length + 1;

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                📊 Estado de Resultados (P&L)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Formato NIIF/GAAP — Proyección 5 años
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Tabs value={vista} onValueChange={(v) => setVista(v as 'anual' | 'mensual')}>
                <TabsList className="h-8">
                  <TabsTrigger value="anual" className="text-xs px-3">5 Años</TabsTrigger>
                  <TabsTrigger value="mensual" className="text-xs px-3">Año 1 Mensual</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">Ingresos Netos</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatPLCurrency(pl.metricas.ingresoPromedio)}</p>
            <p className="text-xs text-muted-foreground">Promedio anual</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">EBITDA</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatPLCurrency(pl.metricas.ebitdaPromedio)}</p>
            <p className="text-xs text-primary font-medium">{formatPLPercentage(pl.metricas.margenPromedioEbitda)} margen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">Margen Neto</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatPLPercentage(pl.metricas.margenPromedioNeto)}</p>
            <p className="text-xs text-muted-foreground">Promedio 5 años</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">Utilidad Neta 5 años</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatPLCurrency(pl.metricas.utilidadNetaTotal5Anos)}</p>
            <p className="text-xs text-muted-foreground">Acumulado</p>
          </CardContent>
        </Card>
      </div>

      {/* ── P&L TABLE ── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-border bg-muted/30">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky left-0 bg-muted/30 min-w-[180px]">
                    Concepto
                  </th>
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-3 text-xs font-semibold text-muted-foreground text-right min-w-[100px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* ── INGRESOS ── */}
                <FilaSeccion label="INGRESOS" colSpan={colSpan} />
                <FilaDetalle label="  Reservas" periodos={periodos} getValue={(p) => p.ingresos.reservas} />
                <FilaDetalle label="  Membresías" periodos={periodos} getValue={(p) => p.ingresos.membresias} />
                <FilaDetalle label="  Pases Diarios" periodos={periodos} getValue={(p) => p.ingresos.pasesDiarios} />
                <FilaDetalle label="  Clases" periodos={periodos} getValue={(p) => p.ingresos.clases} />
                <FilaDetalle label="  Complementarios" periodos={periodos} getValue={(p) => p.ingresos.complementarios} />
                <FilaDetalle label="  F&B / Tráfico" periodos={periodos} getValue={(p) => p.ingresos.trafico} />
                <FilaSeparador colSpan={colSpan} />
                <FilaTotal label="INGRESOS BRUTOS" periodos={periodos} getValue={(p) => p.ingresos.brutos} className="bg-muted/30" />
                <FilaDetalle label="  - Descuentos" periodos={periodos} getValue={(p) => p.ingresos.descuentos} />
                <FilaDetalle label="  - Devoluciones" periodos={periodos} getValue={(p) => p.ingresos.devoluciones} />
                <FilaSeparador colSpan={colSpan} />
                <FilaTotal label="INGRESOS NETOS" periodos={periodos} getValue={(p) => p.ingresos.netos} className="bg-secondary/10 font-bold" />

                {/* ── COGS ── */}
                <FilaSeccion label="COSTO DE VENTAS" colSpan={colSpan} />
                <FilaDetalle label="  Costo Directo" periodos={periodos} getValue={(p) => p.cogs.costoDirecto} />
                <FilaDetalle label="  Instructores" periodos={periodos} getValue={(p) => p.cogs.instructores} />
                <FilaSeparador colSpan={colSpan} />
                <FilaTotal label="TOTAL COGS" periodos={periodos} getValue={(p) => p.cogs.total} className="bg-muted/30" />

                <FilaSeparador colSpan={colSpan} />
                <FilaTotalConMargen
                  label="MARGEN BRUTO"
                  periodos={periodos}
                  getValue={(p) => p.margenBruto}
                  getMargen={(p) => p.margenBrutoPorcentaje}
                  className="bg-secondary/10"
                />

                {/* ── OPEX ── */}
                <FilaSeccion label="GASTOS OPERACIONALES (OPEX)" colSpan={colSpan} />
                <FilaDetalle label="  Arriendo" periodos={periodos} getValue={(p) => p.opex.arriendo} />
                <FilaDetalle label="  Nómina" periodos={periodos} getValue={(p) => p.opex.nomina} />
                <FilaDetalle label="  Servicios Públicos" periodos={periodos} getValue={(p) => p.opex.serviciosPublicos} />
                <FilaDetalle label="  Marketing" periodos={periodos} getValue={(p) => p.opex.marketing} />
                <FilaDetalle label="  Mantenimiento" periodos={periodos} getValue={(p) => p.opex.mantenimiento} />
                <FilaDetalle label="  Seguridad" periodos={periodos} getValue={(p) => p.opex.seguridad} />
                <FilaDetalle label="  Tecnología" periodos={periodos} getValue={(p) => p.opex.tecnologia} />
                <FilaDetalle label="  Seguros" periodos={periodos} getValue={(p) => p.opex.seguros} />
                <FilaDetalle label="  Otros" periodos={periodos} getValue={(p) => p.opex.otros} />
                <FilaSeparador colSpan={colSpan} />
                <FilaTotal label="TOTAL OPEX" periodos={periodos} getValue={(p) => p.opex.total} className="bg-muted/30" />

                <FilaSeparador colSpan={colSpan} />
                <FilaTotalConMargen
                  label="EBITDA"
                  periodos={periodos}
                  getValue={(p) => p.ebitda}
                  getMargen={(p) => p.ebitdaPorcentaje}
                  className="bg-primary/10"
                />

                {/* ── DEPRECIACIÓN ── */}
                <FilaSeccion label="DEPRECIACIÓN" colSpan={colSpan} />
                <FilaDetalle label="  D&A Total" periodos={periodos} getValue={(p) => p.depreciacion.total} />
                <FilaSeparador colSpan={colSpan} />
                <FilaTotalConMargen
                  label="EBIT"
                  periodos={periodos}
                  getValue={(p) => p.ebit}
                  getMargen={(p) => p.ebitPorcentaje}
                  className="bg-warning/10"
                />

                {/* ── IMPUESTOS ── */}
                <FilaDetalle label="  - Impuestos (35%)" periodos={periodos} getValue={(p) => p.impuestos.valor} />
                <FilaSeparador colSpan={colSpan} />
                <FilaTotalConMargen
                  label="UTILIDAD NETA"
                  periodos={periodos}
                  getValue={(p) => p.utilidadNeta}
                  getMargen={(p) => p.utilidadNetaPorcentaje}
                  className="bg-accent/10 text-base"
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── COMPARATIVO YoY ── */}
      {vista === 'anual' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">📈 Crecimiento Año a Año</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {pl.comparativoAnual.map((item) => (
                <div key={item.ano} className="rounded-lg border border-border p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Año {item.ano}</p>
                  <p className="text-sm font-bold">{formatPLCurrency(item.ingresos)}</p>
                  {item.crecimientoIngresos !== undefined && (
                    <div className="flex items-center gap-1">
                      {item.crecimientoIngresos >= 0
                        ? <TrendingUp className="h-3 w-3 text-primary" />
                        : <TrendingDown className="h-3 w-3 text-destructive" />
                      }
                      <span className={`text-xs font-medium ${item.crecimientoIngresos >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {formatPLPercentage(item.crecimientoIngresos)}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    EBITDA: {formatPLPercentage(item.margenEbitda)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
