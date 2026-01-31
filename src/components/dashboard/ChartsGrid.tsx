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
import { PieChart as PieChartIcon, TrendingUp, BarChart2, Droplets } from 'lucide-react';

interface ChartsGridProps {
  metrics: DashboardMetrics;
  currency: CurrencyCode;
}

export const ChartsGrid = ({ metrics, currency }: ChartsGridProps) => {
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

  // Data for CAPEX breakdown
  const capexData = [
    { name: 'Actividades', value: metrics.capexBreakdown.actividades, color: '#22c55e' },
    { name: 'Infraestructura', value: metrics.capexBreakdown.infraestructura, color: '#3b82f6' },
    { name: 'Obra Civil', value: metrics.capexBreakdown.obraCivil, color: '#a855f7' },
  ].filter(item => item.value > 0);

  // Data for cash flow
  const cashFlowData = metrics.proyeccion.map(p => ({
    year: `Año ${p.year}`,
    flujo: p.flujoCaja / 1000000,
    acumulado: p.flujoAcumulado / 1000000,
  }));

  const formatMillions = (value: number) => `${formatNumber(value, 0)}M`;
  const formatTooltipValue = (value: number) => formatCurrency(value * 1000000, currency);

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

      {/* CAPEX Breakdown */}
      <Card className="border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-600" />
            Desglose CAPEX
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
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
                  width={100}
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
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Total CAPEX</p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(metrics.capexTotal, currency)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Chart */}
      <Card className="border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplets className="w-5 h-5 text-orange-600" />
            Flujo de Caja Acumulado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData}>
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
                <Line 
                  type="monotone" 
                  dataKey="flujo" 
                  name="Flujo Anual"
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={{ fill: '#f97316', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="acumulado" 
                  name="Acumulado"
                  stroke="#22c55e" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#22c55e', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
