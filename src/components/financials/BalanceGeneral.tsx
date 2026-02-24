import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BalanceGeneralProps, PeriodoBalance } from '@/types/balanceGeneral';
import { calculateEstadoResultados } from '@/lib/estadoResultadosCalculations';
import { calculateBalanceGeneral } from '@/lib/balanceGeneralCalculations';
import { useProject } from '@/contexts/ProjectContext';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { useProjectOpex } from '@/hooks/useProjectOpex';
import { useProjectSpaces } from '@/hooks/useProjectSpaces';
import { useObraCivil } from '@/hooks/useObraCivil';
import { ActivityConfig } from '@/types/activity';
import { formatPLCurrency, formatPLPercentage } from '@/lib/plFormatters';
import { CheckCircle, AlertTriangle } from 'lucide-react';

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
  periodos: PeriodoBalance[];
  getValue: (p: PeriodoBalance) => number;
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

function FilaTotal({
  label,
  periodos,
  getValue,
  className = '',
}: {
  label: string;
  periodos: PeriodoBalance[];
  getValue: (p: PeriodoBalance) => number;
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

function FilaIdentidad({ periodos }: { periodos: PeriodoBalance[] }) {
  return (
    <>
      <FilaTotal
        label="PASIVOS + PATRIMONIO"
        periodos={periodos}
        getValue={(p) => p.pasivos.total + p.patrimonio.total}
        className="bg-muted/40 font-bold"
      />
      <tr className="border-b border-border/50 bg-muted/20">
        <td className="px-4 py-1.5 text-sm text-muted-foreground whitespace-nowrap">
          Verificación identidad
        </td>
        {periodos.map((p, i) => {
          const ok = p.diferenciaIdentidad < 1000;
          return (
            <td key={i} className="px-3 py-1.5 text-sm text-right">
              {ok ? (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" /> ✓
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5" /> Δ{formatPLCurrency(p.diferenciaIdentidad)}
                </span>
              )}
            </td>
          );
        })}
      </tr>
    </>
  );
}

// ── Ratio color helpers ──────────────────────────

function getRatioColor(value: number, thresholds: { green: number; yellow: number; invert?: boolean }) {
  if (thresholds.invert) {
    // Lower is better (e.g. endeudamiento)
    if (value < thresholds.green) return 'text-green-600';
    if (value < thresholds.yellow) return 'text-yellow-600';
    return 'text-destructive';
  }
  // Higher is better
  if (value > thresholds.green) return 'text-green-600';
  if (value > thresholds.yellow) return 'text-yellow-600';
  return 'text-destructive';
}

// ── Main Component ──────────────────────────

export function BalanceGeneral({
  projectId,
  vista: vistaInicial = 'comparativo',
}: BalanceGeneralProps) {
  const [vista, setVista] = useState<'comparativo' | 'detalle'>(vistaInicial);
  const [periodoDetalle, setPeriodoDetalle] = useState(1);

  const { currentProject } = useProject();
  const { activities, loading: activitiesLoading } = useProjectActivities();
  const { opex, loading: opexLoading } = useProjectOpex(projectId);
  const { spaces, loading: spacesLoading } = useProjectSpaces(projectId);
  const { obraCivil, loading: obraCivilLoading } = useObraCivil(projectId);

  const loading = activitiesLoading || opexLoading || spacesLoading || obraCivilLoading;
  const daysPerMonth = currentProject?.days_per_month || 30;

  // Calculate CAPEX (same logic as EstadoResultados)
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

  const inflationRate = currentProject?.inflation_rate || 3;

  // Calculate P&L first
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
      inflationRate,
    );
  }, [projectId, activities, opex, capexData, daysPerMonth, inflationRate]);

  // Calculate Balance General
  const balance = useMemo(() => {
    if (!pl) return null;
    return calculateBalanceGeneral(
      projectId,
      pl,
      capexData.capexSinWC,
      capexData.workingCapital,
    );
  }, [projectId, pl, capexData]);

  if (loading || !balance) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-muted-foreground text-sm">Calculando Balance General...</div>
        </CardContent>
      </Card>
    );
  }

  const periodos = vista === 'comparativo'
    ? balance.periodos
    : [balance.periodos[periodoDetalle - 1]];
  const headers = vista === 'comparativo'
    ? YEAR_HEADERS
    : [`Año ${periodoDetalle}`];
  const colSpan = headers.length + 1;

  const ano5 = balance.periodos[4];

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                🏦 Balance General
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Posición financiera proyectada — 5 años
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Tabs value={vista} onValueChange={(v) => setVista(v as 'comparativo' | 'detalle')}>
                <TabsList className="h-8">
                  <TabsTrigger value="comparativo" className="text-xs px-3">Comparativo 5 Años</TabsTrigger>
                  <TabsTrigger value="detalle" className="text-xs px-3">Detalle por Año</TabsTrigger>
                </TabsList>
              </Tabs>
              {vista === 'detalle' && (
                <Select value={String(periodoDetalle)} onValueChange={(v) => setPeriodoDetalle(Number(v))}>
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((y) => (
                      <SelectItem key={y} value={String(y)} className="text-xs">Año {y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">Total Activos Año 5</p>
            <p className="text-xl font-bold text-primary mt-1">{formatPLCurrency(ano5.activos.total)}</p>
            <p className="text-xs text-muted-foreground">Posición total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">Patrimonio Año 5</p>
            <p className="text-xl font-bold text-green-600 mt-1">{formatPLCurrency(ano5.patrimonio.total)}</p>
            <p className="text-xs text-muted-foreground">Valor accionista</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">ROE Año 3</p>
            <p className={`text-xl font-bold mt-1 ${getRatioColor(balance.ratios.roe, { green: 15, yellow: 8 })}`}>
              {formatPLPercentage(balance.ratios.roe)}
            </p>
            <p className="text-xs text-muted-foreground">Retorno s/ patrimonio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">ROA Año 3</p>
            <p className={`text-xl font-bold mt-1 ${getRatioColor(balance.ratios.roa, { green: 8, yellow: 4 })}`}>
              {formatPLPercentage(balance.ratios.roa)}
            </p>
            <p className="text-xs text-muted-foreground">Retorno s/ activos</p>
          </CardContent>
        </Card>
      </div>

      {/* ── BALANCE TABLE ── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-border bg-muted/30">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky left-0 bg-muted/30 min-w-[200px]">
                    Concepto
                  </th>
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-3 text-xs font-semibold text-muted-foreground text-right min-w-[110px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* ── ACTIVOS ── */}
                <FilaSeccion label="ACTIVOS" colSpan={colSpan} />
                <FilaSeccion label="  ACTIVOS FIJOS" colSpan={colSpan} />
                <FilaDetalle label="    CAPEX Bruto" periodos={periodos} getValue={(p) => p.activos.fijos.capexBruto} />
                <FilaDetalle label="    - Depreciación Acumulada" periodos={periodos} getValue={(p) => -p.activos.fijos.depreciacionAcumulada} />
                <FilaTotal label="  Activo Fijo Neto" periodos={periodos} getValue={(p) => p.activos.fijos.activoFijoNeto} className="bg-blue-50/50 dark:bg-blue-950/20" />

                <FilaSeccion label="  ACTIVOS CIRCULANTES" colSpan={colSpan} />
                <FilaDetalle label="    Efectivo / Caja" periodos={periodos} getValue={(p) => p.activos.circulantes.efectivo} />
                <FilaDetalle label="    Cuentas x Cobrar" periodos={periodos} getValue={(p) => p.activos.circulantes.cuentasPorCobrar} />
                <FilaDetalle label="    Inventarios" periodos={periodos} getValue={(p) => p.activos.circulantes.inventarios} />
                <FilaDetalle label="    Otros Activos" periodos={periodos} getValue={(p) => p.activos.circulantes.otrosActivos} />
                <FilaTotal label="  Total Circulante" periodos={periodos} getValue={(p) => p.activos.circulantes.total} className="bg-blue-50/50 dark:bg-blue-950/20" />

                <FilaTotal label="TOTAL ACTIVOS" periodos={periodos} getValue={(p) => p.activos.total} className="bg-blue-100/60 dark:bg-blue-950/40 text-base font-bold" />

                {/* ── PASIVOS ── */}
                <FilaSeccion label="PASIVOS" colSpan={colSpan} />
                <FilaSeccion label="  PASIVOS CIRCULANTES" colSpan={colSpan} />
                <FilaDetalle label="    Cuentas x Pagar" periodos={periodos} getValue={(p) => p.pasivos.circulantes.cuentasPorPagar} />
                <FilaDetalle label="    Impuestos x Pagar" periodos={periodos} getValue={(p) => p.pasivos.circulantes.impuestosPorPagar} />
                <FilaDetalle label="    Otros Pasivos" periodos={periodos} getValue={(p) => p.pasivos.circulantes.otrosPasivos} />
                <FilaTotal label="  Total Pasivos Circulantes" periodos={periodos} getValue={(p) => p.pasivos.circulantes.total} className="bg-red-50/50 dark:bg-red-950/20" />
                <FilaDetalle label="  Pasivos Largo Plazo" periodos={periodos} getValue={(p) => p.pasivos.largoplazo} />

                <FilaTotal label="TOTAL PASIVOS" periodos={periodos} getValue={(p) => p.pasivos.total} className="bg-red-100/60 dark:bg-red-950/40 font-bold" />

                {/* ── PATRIMONIO ── */}
                <FilaSeccion label="PATRIMONIO" colSpan={colSpan} />
                <FilaDetalle label="    Capital Invertido" periodos={periodos} getValue={(p) => p.patrimonio.capitalInvertido} />
                <FilaDetalle label="    Utilidad Retenida" periodos={periodos} getValue={(p) => p.patrimonio.utilidadRetenida} />
                <FilaDetalle label="    Utilidad del Ejercicio" periodos={periodos} getValue={(p) => p.patrimonio.utilidadEjercicio} />

                <FilaTotal label="TOTAL PATRIMONIO" periodos={periodos} getValue={(p) => p.patrimonio.total} className="bg-green-100/60 dark:bg-green-950/40 font-bold" />

                {/* ── IDENTIDAD CONTABLE ── */}
                <FilaIdentidad periodos={periodos} />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── RATIOS FINANCIEROS (only in comparativo view) ── */}
      {vista === 'comparativo' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📊 Ratios Financieros (Año 3 — Madurez)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Liquidez</p>
                <p className={`text-lg font-bold ${getRatioColor(balance.ratios.liquidez, { green: 1.5, yellow: 1.0 })}`}>
                  {balance.ratios.liquidez.toFixed(1)}x
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">AC / PC</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Endeudamiento</p>
                <p className={`text-lg font-bold ${getRatioColor(balance.ratios.endeudamiento * 100, { green: 40, yellow: 60, invert: true })}`}>
                  {formatPLPercentage(balance.ratios.endeudamiento * 100)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Pasivos / Activos</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">ROE</p>
                <p className={`text-lg font-bold ${getRatioColor(balance.ratios.roe, { green: 15, yellow: 8 })}`}>
                  {formatPLPercentage(balance.ratios.roe)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Utilidad / Patrimonio</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">ROA</p>
                <p className={`text-lg font-bold ${getRatioColor(balance.ratios.roa, { green: 8, yellow: 4 })}`}>
                  {formatPLPercentage(balance.ratios.roa)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Utilidad / Activos</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Multiplicador Capital</p>
                <p className="text-lg font-bold text-foreground">
                  {balance.ratios.multiplicadorCapital.toFixed(1)}x
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Activos / Patrimonio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
