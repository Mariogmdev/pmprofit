import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardMetrics, CHART_COLORS } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/lib/currency';
import { CurrencyCode } from '@/types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  CartesianGrid
} from 'recharts';
import { PieChart as PieChartIcon, TrendingUp, BarChart2, Droplets, ChevronDown, ChevronRight, HardHat } from 'lucide-react';
import { useState } from 'react';

interface ChartsGridProps {
  metrics: DashboardMetrics;
  currency: CurrencyCode;
}

export const ChartsGrid = ({ metrics, currency }: ChartsGridProps) => {
  const [obraCivilExpanded, setObraCivilExpanded] = useState(false);
  // Data for income composition pie chart
  const incomeData = metrics.ingresosPorActividad.length > 0 
    ? metrics.ingresosPorActividad 
    : [{ nombre: 'Sin actividades', valor: 1, porcentaje: 100, color: '#e5e7eb' }];

  // Data for EBITDA evolution
  const ebitdaData = metrics.proyeccion.map(p => ({
    year: `Año ${p.year}`,
    ingresos: p.ingresosAnuales / 1000000,
    opex: p.opexAnual / 1000000,
    ebitda: p.ebitdaAnual / 1000000,
  }));

  // Data for CAPEX breakdown (5 categories)
  const capexData = [
    { name: 'Actividades', value: metrics.capexBreakdown.actividades, color: '#10b981' },
    { name: 'Infraestructura', value: metrics.capexBreakdown.infraestructura, color: '#3b82f6' },
    { name: 'Obra Civil', value: metrics.capexBreakdown.obraCivil, color: '#8b5cf6' },
    { name: 'Imprevistos', value: metrics.capexBreakdown.imprevistos, color: '#f59e0b' },
    { name: 'Working Capital', value: metrics.capexBreakdown.workingCapital, color: '#06b6d4' },
  ].filter(item => item.value > 0);

  // Obra Civil internal breakdown
  const obraCivilItems = metrics.obraCivilDetail ? [
    { concepto: 'Construcción', valor: metrics.obraCivilDetail.construccion },
    { concepto: 'Estudios y Diseños', valor: metrics.obraCivilDetail.estudiosDisenos },
    { concepto: 'Interventoría', valor: metrics.obraCivilDetail.interventoria },
    { concepto: 'Paisajismo', valor: metrics.obraCivilDetail.paisajismo },
    { concepto: 'Permisos y Licencias', valor: metrics.obraCivilDetail.permisosLicencias },
  ].filter(item => item.valor > 0) : [];

  // Data for cash flow
  const cashFlowData = metrics.proyeccion.map(p => ({
    year: `Año ${p.year}`,
    flujo: p.flujoCaja / 1000000,
    acumulado: p.flujoAcumulado / 1000000,
  }));

  const formatMillions = (value: number) => `${formatNumber(value, 0)}M`;
  const formatTooltipValue = (value: number) => formatCurrency(value * 1000000, currency);

  // Year 1 breakdown data (filter out zero-only sources)
  const year1BreakdownData = metrics.year1Monthly || [];
  const hasReservas = year1BreakdownData.some(m => m.reservas > 0);
  const hasMembresias = year1BreakdownData.some(m => m.membresias > 0);
  const hasPases = year1BreakdownData.some(m => m.pases > 0);
  const hasComplementarios = year1BreakdownData.some(m => m.complementarios > 0);
  const hasClases = year1BreakdownData.some(m => m.clases > 0);
  const hasTrafico = year1BreakdownData.some(m => m.trafico > 0);
  const hasAnyBreakdown = hasReservas || hasMembresias || hasPases || hasComplementarios || hasClases || hasTrafico;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
      {/* Income Composition Pie Chart */}
      <Card className="border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-green-600" />
            Composición de Ingresos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="valor"
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, currency)}
                  labelFormatter={(label) => label}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {incomeData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate flex-1">{item.nombre}</span>
                  <span className="text-muted-foreground font-medium">
                    {item.porcentaje.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EBITDA Evolution Chart */}
      <Card className="border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Evolución EBITDA ({metrics.proyeccion.length} años)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ebitdaData}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEbitda" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  tickFormatter={formatMillions} 
                  tick={{ fontSize: 12 }} 
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  formatter={(value: number) => formatTooltipValue(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="ingresos" 
                  name="Ingresos"
                  stroke="#22c55e" 
                  fill="url(#colorIngresos)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="ebitda" 
                  name="EBITDA"
                  stroke="#3b82f6" 
                  fill="url(#colorEbitda)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Year 1 Income Breakdown by Source */}
      {hasAnyBreakdown && year1BreakdownData.length > 0 && (
        <Card className="border-2 col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              Año 1 — Ingresos por Fuente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={year1BreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    tickFormatter={(v) => `${formatNumber(v / 1000000, 1)}M`}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value, currency)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {hasReservas && (
                    <Area type="monotone" dataKey="reservas" name="Reservas" 
                      stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} strokeWidth={1.5} />
                  )}
                  {hasMembresias && (
                    <Area type="monotone" dataKey="membresias" name="Membresías" 
                      stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} strokeWidth={1.5} />
                  )}
                  {hasPases && (
                    <Area type="monotone" dataKey="pases" name="Pases" 
                      stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} strokeWidth={1.5} />
                  )}
                  {hasComplementarios && (
                    <Area type="monotone" dataKey="complementarios" name="Complementarios" 
                      stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} strokeWidth={1.5} />
                  )}
                  {hasClases && (
                    <Area type="monotone" dataKey="clases" name="Clases" 
                      stackId="1" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} strokeWidth={1.5} />
                  )}
                  {hasTrafico && (
                    <Area type="monotone" dataKey="trafico" name="Tráfico" 
                      stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} strokeWidth={1.5} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CAPEX Breakdown */}
      <Card className="border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-600" />
            Desglose CAPEX
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capexData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  tickFormatter={(v) => formatMillions(v / 1000000)}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={120}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, currency)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" name="CAPEX" radius={[0, 4, 4, 0]}>
                  {capexData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Obra Civil expandable breakdown */}
          {obraCivilItems.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <button
                onClick={() => setObraCivilExpanded(!obraCivilExpanded)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                {obraCivilExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <HardHat className="w-4 h-4 text-purple-500" />
                Desglose Obra Civil
              </button>
              
              {obraCivilExpanded && (
                <div className="mt-3 space-y-2 pl-6">
                  {obraCivilItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.concepto}</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(item.valor, currency)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm font-semibold border-t pt-2 mt-2">
                    <span>Total Obra Civil</span>
                    <span className="text-purple-600 dark:text-purple-400">
                      {formatCurrency(metrics.capexBreakdown.obraCivil, currency)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Total CAPEX</p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(metrics.capexTotal, currency)}
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
