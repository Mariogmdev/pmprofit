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
  Ruler 
} from 'lucide-react';

interface DetailedMetricsProps {
  metrics: DashboardMetrics;
  currency: CurrencyCode;
}

export const DetailedMetrics = ({ metrics, currency }: DetailedMetricsProps) => {
  const metricCards = [
    {
      icon: <Percent className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      label: 'TIR',
      value: formatPercent(metrics.tir),
      sublabel: 'Tasa Interna de Retorno',
      color: 'blue',
    },
    {
      icon: <Banknote className="w-5 h-5 text-green-600 dark:text-green-400" />,
      label: 'VAN',
      value: formatCurrency(metrics.van, currency),
      sublabel: 'Valor Actual Neto',
      color: 'green',
      highlight: metrics.van >= 0,
    },
    {
      icon: <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      label: 'Punto de Equilibrio',
      value: `Mes ${metrics.puntoEquilibrioMes}`,
      sublabel: `≈ ${(metrics.puntoEquilibrioMes / 12).toFixed(1)} años`,
      color: 'purple',
    },
    {
      icon: <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      label: 'Ocupación Promedio',
      value: formatPercent(metrics.ocupacionPromedio),
      sublabel: 'Año 1 proyectado',
      color: 'orange',
    },
    {
      icon: <Ticket className="w-5 h-5 text-pink-600 dark:text-pink-400" />,
      label: 'Ticket Promedio',
      value: formatCurrency(metrics.ticketPromedio, currency),
      sublabel: 'Por reserva/hora',
      color: 'pink',
    },
    {
      icon: <Ruler className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      label: 'Ingresos/m²',
      value: formatCurrency(metrics.ingresosPorM2Anual, currency),
      sublabel: 'Anual por m²',
      color: 'cyan',
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
            <CardContent className="pt-4 pb-3 text-center">
              <div className="flex justify-center mb-2">
                {card.icon}
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-1">
                {card.label}
              </p>
              <p className="text-lg font-bold">
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
