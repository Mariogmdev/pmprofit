import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { calculateCashFlow } from '@/lib/cashFlowCalculations';
import { calculateEstadoResultados } from '@/lib/estadoResultadosCalculations';
import { useProject } from '@/contexts/ProjectContext';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { useProjectOpex } from '@/hooks/useProjectOpex';
import { useProjectSpaces } from '@/hooks/useProjectSpaces';
import { useObraCivil } from '@/hooks/useObraCivil';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { ActivityConfig } from '@/types/activity';


interface FlujoCajaProps {
  projectId: string;
}

export function FlujoCaja({ projectId }: FlujoCajaProps) {
  const { currentProject } = useProject();
  const { activities, loading: activitiesLoading } = useProjectActivities();
  const { opex, loading: opexLoading } = useProjectOpex(projectId);
  const { spaces, loading: spacesLoading } = useProjectSpaces(projectId);
  const { obraCivil, loading: obraCivilLoading } = useObraCivil(projectId);
  const metrics = useDashboardMetrics();

  const loading = activitiesLoading || opexLoading || spacesLoading || obraCivilLoading || metrics.loading;
  const daysPerMonth = currentProject?.days_per_month || 30;
  const inflationRate = currentProject?.inflation_rate || 3;
  const projectionYears = currentProject?.projection_years || 5;
  const discountRate = (currentProject?.discount_rate || 10) / 100;

  // Calculate CAPEX (same as BalanceGeneral)
  const capexData = useMemo(() => {
    const capexActividades = activities.reduce((sum, activity) => {
      const config: ActivityConfig = activity.config;
      const cantidad = config.cantidad || 1;
      const tipoCubierta = config.tipoCubierta || 'cubierta';
      let capexConstruccion = 0;
      if (tipoCubierta === 'cubierta') capexConstruccion = (config.capexCubierta || 0) * cantidad;
      else if (tipoCubierta === 'semicubierta') capexConstruccion = (config.capexSemicubierta || 0) * cantidad;
      else capexConstruccion = (config.capexAireLibre || 0) * cantidad;

      const equipamiento = (config.equipamientoEspecifico || []).reduce(
        (s: number, item: { cantidad?: number; precioUnitario?: number }) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0);
      const consumibles = (config.consumibles || []).reduce(
        (s: number, item: { cantidad?: number; precioUnitario?: number }) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0);
      const mobiliario = (config.mobiliario || []).reduce(
        (s: number, item: { cantidad?: number; precioUnitario?: number }) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0);
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
      (currentProject?.tax_rate ?? 35) / 100,
      opex.depreciacion_anos || 10,
      daysPerMonth,
      inflationRate,
      projectionYears,
    );
  }, [projectId, activities, opex, capexData, daysPerMonth, inflationRate, projectionYears]);

  // Calculate Cash Flow
  const cf = useMemo(() => {
    if (!pl) return null;
    return calculateCashFlow(metrics, pl, discountRate, (currentProject?.tax_rate ?? 35) / 100, (currentProject?.residual_asset_rate ?? 40) / 100);
  }, [metrics, pl, discountRate]);

  if (loading || !cf) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-muted-foreground text-sm">Calculando Flujo de Caja...</div>
        </CardContent>
      </Card>
    );
  }

  // ── Formatting helpers ──
  const fmtM = (v: number) => {
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (abs >= 1_000_000)
      return `${sign}$${(abs / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}M`;
    if (abs >= 1_000)
      return `${sign}$${(abs / 1_000).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}K`;
    return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // ── Chart data ──
  const chartData = cf.filas.map(f => ({
    name: f.label,
    flujoLibre: Math.round(f.flujoCajaLibre / 1_000_000),
    acumulado: Math.round(f.flujoAcumulado / 1_000_000),
    operativo: Math.round(f.flujoOperativo / 1_000_000),
    ebitda: Math.round(f.ebitdaAnual / 1_000_000),
  }));

  return (
    <div className="space-y-6">
      {/* ── KPIs principales ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">TIR</p>
            <p className={`text-2xl font-bold mt-1 ${cf.tir > 0.20 ? 'text-green-600' : cf.tir > 0.10 ? 'text-yellow-600' : 'text-destructive'}`}>
              {(cf.tir * 100).toFixed(1)}%
            </p>
            <Badge variant={cf.tir > 0.20 ? 'default' : 'secondary'} className="mt-1 text-xs">
              {cf.tir > 0.25 ? 'Muy atractiva' : cf.tir > 0.15 ? 'Atractiva' : 'Revisar'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">VAN</p>
            <p className={`text-2xl font-bold mt-1 ${cf.van > 0 ? 'text-green-600' : 'text-destructive'}`}>
              {fmtM(cf.van)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Tasa {(discountRate * 100).toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">Payback</p>
            <p className={`text-2xl font-bold mt-1 ${cf.paybackMeses <= 36 ? 'text-green-600' : 'text-yellow-600'}`}>
              {cf.paybackMeses} meses
            </p>
            <p className="text-xs text-muted-foreground mt-1">{cf.paybackAnos.toFixed(1)} años · interpolado mensual</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">MOIC</p>
            <p className={`text-2xl font-bold mt-1 ${cf.moic > 1.5 ? 'text-green-600' : 'text-yellow-600'}`}>
              {cf.moic.toFixed(2)}x
            </p>
            <p className="text-xs text-muted-foreground mt-1">Múltiplo inversión</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabla Cash Flow ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            📋 Proyección Cash Flow — {projectionYears} años
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground min-w-[200px]">Concepto</th>
                  {cf.filas.map(f => (
                    <th key={f.year} className="text-right px-3 py-2 font-semibold text-muted-foreground min-w-[110px]">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* EBITDA */}
                <tr className="border-b border-border/30 hover:bg-muted/20">
                  <td className="px-3 py-1.5 text-muted-foreground">EBITDA Anual</td>
                  {cf.filas.map(f => (
                    <td key={f.year} className="px-3 py-1.5 text-right tabular-nums">
                      {f.ebitdaAnual !== 0 ? fmtM(f.ebitdaAnual) : '—'}
                    </td>
                  ))}
                </tr>

                {/* Depreciación */}
                <tr className="border-b border-border/30 hover:bg-muted/20">
                  <td className="px-3 py-1.5 text-muted-foreground">Depreciación & Amort.</td>
                  {cf.filas.map(f => (
                    <td key={f.year} className="px-3 py-1.5 text-right tabular-nums">
                      {f.depreciacionAnual !== 0 ? `(${fmtM(f.depreciacionAnual)})` : '—'}
                    </td>
                  ))}
                </tr>

                {/* EBIT */}
                <tr className="border-b border-border/30 hover:bg-muted/20 font-medium">
                  <td className="px-3 py-1.5">EBIT</td>
                  {cf.filas.map(f => (
                    <td key={f.year} className="px-3 py-1.5 text-right tabular-nums">
                      {f.ebitAnual !== 0 ? fmtM(f.ebitAnual) : '—'}
                    </td>
                  ))}
                </tr>

                {/* Impuesto */}
                <tr className="border-b border-border/30 hover:bg-muted/20">
                  <td className="px-3 py-1.5 text-muted-foreground">Impuesto renta (35%)</td>
                  {cf.filas.map(f => (
                    <td key={f.year} className="px-3 py-1.5 text-right tabular-nums">
                      {f.impuestoAnual !== 0 ? `(${fmtM(f.impuestoAnual)})` : '—'}
                    </td>
                  ))}
                </tr>

                {/* Flujo Operativo */}
                <tr className="border-b border-border/50 bg-blue-50/50 dark:bg-blue-950/20 font-semibold">
                  <td className="px-3 py-2">Flujo Caja Operativo</td>
                  {cf.filas.map(f => (
                    <td key={f.year} className={`px-3 py-2 text-right tabular-nums ${f.flujoOperativo > 0 ? 'text-blue-700 dark:text-blue-400' : ''}`}>
                      {f.flujoOperativo !== 0 ? fmtM(f.flujoOperativo) : '—'}
                    </td>
                  ))}
                </tr>

                {/* Separator */}
                <tr><td colSpan={cf.filas.length + 1} className="h-1" /></tr>

                {/* CAPEX */}
                <tr className="border-b border-border/30 hover:bg-muted/20">
                  <td className="px-3 py-1.5 text-muted-foreground">CAPEX + Working Capital</td>
                  {cf.filas.map(f => (
                    <td key={f.year} className={`px-3 py-1.5 text-right tabular-nums ${f.capexInversion < 0 ? 'text-destructive font-medium' : ''}`}>
                      {f.capexInversion !== 0 ? fmtM(f.capexInversion) : '—'}
                    </td>
                  ))}
                </tr>

                {/* Valor residual */}
                <tr className="border-b border-border/30 hover:bg-muted/20">
                  <td className="px-3 py-1.5 text-muted-foreground">Valor Residual (40%)</td>
                  {cf.filas.map(f => (
                    <td key={f.year} className={`px-3 py-1.5 text-right tabular-nums ${f.valorResidual > 0 ? 'text-green-600 font-medium' : ''}`}>
                      {f.valorResidual !== 0 ? fmtM(f.valorResidual) : '—'}
                    </td>
                  ))}
                </tr>

                {/* FCL */}
                <tr className="border-b border-border/50 bg-primary/5 font-bold">
                  <td className="px-3 py-2">Flujo Caja Libre</td>
                  {cf.filas.map(f => (
                    <td key={f.year} className={`px-3 py-2 text-right tabular-nums ${f.flujoCajaLibre >= 0 ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
                      {fmtM(f.flujoCajaLibre)}
                    </td>
                  ))}
                </tr>

                {/* Acumulado */}
                <tr className="border-b border-border/50 hover:bg-muted/20 italic">
                  <td className="px-3 py-1.5">Flujo Acumulado</td>
                  {cf.filas.map(f => (
                    <td key={f.year} className={`px-3 py-1.5 text-right tabular-nums ${f.flujoAcumulado >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {fmtM(f.flujoAcumulado)}
                    </td>
                  ))}
                </tr>

                {/* Payback */}
                <tr className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-3 py-1.5 text-muted-foreground">Payback alcanzado</td>
                  {cf.filas.map(f => (
                    <td key={f.year} className="px-3 py-1.5 text-right">
                      {f.paybackAlcanzado
                        ? <span className="text-green-600 font-semibold">✓ SÍ</span>
                        : <span className="text-muted-foreground">NO</span>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Gráfico 1: Flujo acumulado (área) ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📈 Flujo Acumulado — Punto de Recuperación</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAcum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={(v) => `$${v}M`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(v: number) => [`$${v}M`, '']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="acumulado" stroke="hsl(var(--primary))" fill="url(#gradAcum)" name="Flujo Acumulado" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Gráfico 2: FCL vs EBITDA (barras) ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📊 EBITDA vs Flujo de Caja Libre por Año</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.filter(d => d.name !== 'Año 0')} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={(v) => `$${v}M`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    `$${v}M`,
                    name === 'ebitda' ? 'EBITDA' : 'Flujo Caja Libre',
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend formatter={(v) => (v === 'ebitda' ? 'EBITDA' : 'Flujo Caja Libre')} />
                <Bar dataKey="ebitda" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="flujoLibre" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── CAPEX Breakdown ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">🏗️ CAPEX Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {([
              ['Actividades deportivas', cf.capexBreakdown.actividadesDeportivas],
              ['Espacios / Infraestructura', cf.capexBreakdown.espaciosInfraestructura],
              ['Obra civil', cf.capexBreakdown.obraCivil],
              ['Imprevistos (10%)', cf.capexBreakdown.imprevistos],
            ] as [string, number][]).map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-border/30">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium tabular-nums">{fmtM(value)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-1.5 border-b border-border/50 font-semibold">
              <span className="text-sm">Subtotal CAPEX</span>
              <span className="text-sm tabular-nums">{fmtM(cf.capexBreakdown.subtotalCapex)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Working Capital</span>
              <span className="text-sm font-medium tabular-nums">{fmtM(cf.capexBreakdown.workingCapital)}</span>
            </div>
            <div className="flex justify-between items-center py-2 bg-primary/5 px-2 rounded-md font-bold">
              <span className="text-sm">CAPEX TOTAL</span>
              <span className="text-sm tabular-nums">{fmtM(cf.capexBreakdown.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
