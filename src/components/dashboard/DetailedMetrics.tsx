import { Card, CardContent } from '@/components/ui/card';
import { DashboardMetrics } from '@/types/dashboard';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/currency';
import { CurrencyCode } from '@/types';
import { 
  Percent, 
  Banknote, 
  Scale, 
  MapPin, 
  Ticket, 
  Ruler,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface DetailedMetricsProps {
  metrics: DashboardMetrics;
  currency: CurrencyCode;
}

interface MetricCardData {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  color: string;
  valueClassName?: string;
  tooltip: {
    title: string;
    description: string;
    benchmarks?: Array<{ label: string; className?: string }>;
    note?: string;
    formula?: string;
  };
}

export const DetailedMetrics = ({ metrics, currency }: DetailedMetricsProps) => {
  const getValueClassName = (metric: string): string => {
    switch (metric) {
      case 'tir':
        return metrics.tir >= 20 ? "text-green-600" :
               metrics.tir >= 15 ? "text-blue-600" :
               metrics.tir >= 10 ? "text-orange-600" :
               "text-red-600";
      case 'van':
        return metrics.van >= 0 ? "text-green-600" : "text-red-600";
      case 'ocupacion':
        return metrics.ocupacionPromedio >= 70 ? "text-green-600" :
               metrics.ocupacionPromedio >= 50 ? "text-blue-600" :
               metrics.ocupacionPromedio >= 30 ? "text-orange-600" :
               "text-red-600";
      default:
        return "";
    }
  };

  const metricCards: MetricCardData[] = [
    {
      icon: <Percent className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      label: 'TIR',
      value: formatPercent(metrics.tir),
      sublabel: 'Tasa Interna de Retorno',
      color: 'blue',
      valueClassName: getValueClassName('tir'),
      tooltip: {
        title: 'Tasa Interna de Retorno (TIR)',
        description: 'Rentabilidad promedio anual del proyecto. Considera todos los flujos de caja (inversión inicial y utilidades futuras).',
        benchmarks: [
          { label: '✅ Excelente: > 20%', className: 'text-green-600' },
          { label: '✅ Buena: 15% - 20%', className: 'text-blue-600' },
          { label: '⚠️ Aceptable: 10% - 15%', className: 'text-orange-600' },
          { label: '❌ Baja: < 10%', className: 'text-red-600' },
        ],
      },
    },
    {
      icon: <Banknote className="w-5 h-5 text-green-600 dark:text-green-400" />,
      label: 'VAN',
      value: formatCurrency(metrics.van, currency),
      sublabel: 'Valor Actual Neto',
      color: 'green',
      valueClassName: getValueClassName('van'),
      tooltip: {
        title: 'Valor Actual Neto (VAN)',
        description: `Valor presente de todos los flujos futuros, descontados a una tasa del ${12}% anual. Representa la riqueza neta que genera el proyecto.`,
        benchmarks: [
          { label: '✅ VAN positivo: Proyecto viable', className: 'text-green-600' },
          { label: '❌ VAN negativo: Proyecto no viable', className: 'text-red-600' },
        ],
        note: 'Mayor VAN = Mejor proyecto',
      },
    },
    {
      icon: <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      label: 'Punto de Equilibrio',
      value: `Mes ${metrics.puntoEquilibrioMes}`,
      sublabel: `≈ ${(metrics.puntoEquilibrioMes / 12).toFixed(1)} años`,
      color: 'purple',
      tooltip: {
        title: 'Punto de Equilibrio',
        description: 'Mes en el que el flujo acumulado recupera la inversión inicial (CAPEX). A partir de este punto, el proyecto genera retorno positivo.',
        benchmarks: [
          { label: '✅ Excelente: < 24 meses', className: 'text-green-600' },
          { label: '✅ Bueno: 24-36 meses', className: 'text-blue-600' },
          { label: '⚠️ Aceptable: 36-60 meses', className: 'text-orange-600' },
          { label: '❌ Largo: > 60 meses', className: 'text-red-600' },
        ],
        note: 'Incluye recuperación del CAPEX, no solo equilibrio operativo.',
      },
    },
    {
      icon: <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      label: 'Ocupación Promedio',
      value: formatPercent(metrics.ocupacionPromedio),
      sublabel: 'Año 1 proyectado',
      color: 'orange',
      valueClassName: getValueClassName('ocupacion'),
      tooltip: {
        title: 'Ocupación Promedio',
        description: 'Porcentaje promedio de utilización de todas las actividades, ponderado por horas de operación. Diferencia horarios pico y valle.',
        formula: 'Σ(ocupación × horas) / Σ(horas totales)',
        benchmarks: [
          { label: '✅ Excelente: > 70%', className: 'text-green-600' },
          { label: '✅ Buena: 50% - 70%', className: 'text-blue-600' },
          { label: '⚠️ Aceptable: 30% - 50%', className: 'text-orange-600' },
          { label: '❌ Baja: < 30%', className: 'text-red-600' },
        ],
      },
    },
    {
      icon: <Ticket className="w-5 h-5 text-pink-600 dark:text-pink-400" />,
      label: 'Ticket Promedio',
      value: formatCurrency(metrics.ticketPromedio, currency),
      sublabel: 'Por reserva/hora',
      color: 'pink',
      tooltip: {
        title: 'Ticket Promedio',
        description: 'Tarifa promedio por reserva/hora de todas las actividades. Calculado como promedio ponderado de las tarifas por hora de operación.',
        formula: 'Σ(tarifa × horas) / Σ(horas totales)',
        note: 'Mayor ticket = Mayor ingreso por transacción',
      },
    },
    {
      icon: <Ruler className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      label: 'Ingresos/m²',
      value: formatCurrency(metrics.ingresosPorM2Anual, currency),
      sublabel: 'Anual por m²',
      color: 'cyan',
      tooltip: {
        title: 'Ingresos por m²',
        description: 'Productividad del espacio. Mide cuántos ingresos genera cada metro cuadrado del proyecto al año.',
        formula: 'Ingresos anuales / Área total (m²)',
        benchmarks: [
          { label: '🏐 Gimnasios: $10M - $15M/m²/año' },
          { label: '🎾 Pádel/Tenis: $8M - $12M/m²/año' },
          { label: '⚽ Fútbol: $5M - $8M/m²/año' },
          { label: '🏌️ Golf simulado: $12M - $18M/m²/año' },
        ],
        note: 'Benchmarks referencia para centros deportivos en Colombia.',
      },
    },
  ];

  return (
    <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Scale className="w-5 h-5 text-muted-foreground" />
        Métricas Detalladas
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((card, idx) => (
          <Card 
            key={idx} 
            className="border-2 hover:shadow-md transition-shadow"
          >
            <CardContent className="pt-4 pb-3 text-center relative">
              {/* Tooltip icon in top-right corner */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-4">
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">{card.tooltip.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {card.tooltip.description}
                    </p>
                    
                    {card.tooltip.formula && (
                      <p className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {card.tooltip.formula}
                      </p>
                    )}
                    
                    {card.tooltip.benchmarks && (
                      <div className="space-y-1 pt-1 border-t">
                        {card.tooltip.benchmarks.map((b, i) => (
                          <p key={i} className={cn("text-xs", b.className)}>
                            {b.label}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {card.tooltip.note && (
                      <p className="text-xs text-muted-foreground italic pt-1 border-t">
                        💡 {card.tooltip.note}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
              
              <div className="flex justify-center mb-2">
                {card.icon}
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-1">
                {card.label}
              </p>
              <p className={cn("text-lg font-bold", card.valueClassName)}>
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {card.sublabel}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
