import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Coffee, 
  Users, 
  TrendingUp, 
  DollarSign,
  ShoppingBag,
  Utensils,
  ArrowRight,
  Info
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TrafficActivityData {
  activityId: string;
  nombre: string;
  icon: string;
  
  // Traffic sources
  usuariosClub: number;
  usuariosExternos: number;
  traficoTotal: number;
  
  // Income calculation
  ticketPromedio: number;
  consumosPorPersona: number;
  ingresosBrutos: number;
  
  // Costs/Commissions
  modeloOperacion: 'propia' | 'concesion';
  costoVentasPorcentaje: number;
  costoVentas: number;
  comisionPorcentaje?: number;
  
  // Net income
  ingresosNetos: number;
  margenBruto: number;
}

interface TrafficBreakdownSectionProps {
  trafficActivities: TrafficActivityData[];
  currency: CurrencyCode;
  totalClubUsers: number;
}

export const TrafficBreakdownSection = ({ 
  trafficActivities, 
  currency,
  totalClubUsers 
}: TrafficBreakdownSectionProps) => {
  if (trafficActivities.length === 0) {
    return null;
  }

  // Calculate totals
  const totals = trafficActivities.reduce((acc, act) => ({
    traficoTotal: acc.traficoTotal + act.traficoTotal,
    ingresosBrutos: acc.ingresosBrutos + act.ingresosBrutos,
    costoVentas: acc.costoVentas + act.costoVentas,
    ingresosNetos: acc.ingresosNetos + act.ingresosNetos,
  }), { traficoTotal: 0, ingresosBrutos: 0, costoVentas: 0, ingresosNetos: 0 });

  const margenTotal = totals.ingresosBrutos > 0 
    ? (totals.ingresosNetos / totals.ingresosBrutos) * 100 
    : 0;

  const getActivityIcon = (nombre: string) => {
    const lowerName = nombre.toLowerCase();
    if (lowerName.includes('bar') || lowerName.includes('cafet')) {
      return <Coffee className="w-5 h-5" />;
    }
    if (lowerName.includes('tienda') || lowerName.includes('retail') || lowerName.includes('shop')) {
      return <ShoppingBag className="w-5 h-5" />;
    }
    if (lowerName.includes('restaurant') || lowerName.includes('comida')) {
      return <Utensils className="w-5 h-5" />;
    }
    return <Coffee className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Coffee className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Ingresos por Tráfico
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground">
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs p-4">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Modelo de Tráfico</p>
                  <p className="text-xs text-muted-foreground">
                    Ingresos generados por servicios que dependen del flujo de usuarios del club 
                    (cafetería, bar, tienda, etc.)
                  </p>
                  <div className="text-xs space-y-1 pt-2 border-t">
                    <p><strong>Fórmula:</strong></p>
                    <p className="bg-muted px-2 py-1 rounded font-mono">
                      Tráfico × Ticket × Consumos = Bruto
                    </p>
                    <p className="bg-muted px-2 py-1 rounded font-mono">
                      Bruto - Costo Ventas = Neto
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </h3>
          <p className="text-sm text-muted-foreground">
            Servicios que generan ingresos basados en el flujo de usuarios
          </p>
        </div>
      </div>

      {/* Traffic Source Summary */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            Fuente de Tráfico Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-background/60 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Usuarios Club</p>
              <p className="text-lg font-bold text-amber-600">
                {totalClubUsers.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">/mes</p>
            </div>
            <div className="p-3 bg-background/60 rounded-lg flex flex-col items-center justify-center">
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="p-3 bg-background/60 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Consumidores</p>
              <p className="text-lg font-bold text-green-600">
                {totals.traficoTotal.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalClubUsers > 0 ? ((totals.traficoTotal / totalClubUsers) * 100).toFixed(0) : 0}% conversión
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trafficActivities.map((activity) => (
          <Card key={activity.activityId} className="overflow-hidden">
            <CardHeader className="pb-2 bg-muted/30">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{activity.icon}</span>
                  <span>{activity.nombre}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    activity.modeloOperacion === 'propia' 
                      ? "bg-blue-100 text-blue-700 border-blue-200" 
                      : "bg-purple-100 text-purple-700 border-purple-200"
                  )}
                >
                  {activity.modeloOperacion === 'propia' ? 'Operación Propia' : 'Concesión'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Traffic breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Desglose de Tráfico
                </p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Club</p>
                    <p className="font-medium">{activity.usuariosClub.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground">Externos</p>
                    <p className="font-medium">{activity.usuariosExternos.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-2 bg-amber-100 dark:bg-amber-900/30 rounded">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold text-amber-600">{activity.traficoTotal.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Financial calculation */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Cálculo Financiero
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>
                      {activity.traficoTotal.toLocaleString()} × {formatCurrency(activity.ticketPromedio, currency)} × {activity.consumosPorPersona}x
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ingresos Brutos:</span>
                    <span className="font-medium">{formatCurrency(activity.ingresosBrutos, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center text-destructive">
                    <span>
                      {activity.modeloOperacion === 'propia' 
                        ? `Costo Ventas (${activity.costoVentasPorcentaje}%):` 
                        : `Operador (${100 - (activity.comisionPorcentaje || 0)}%):`
                      }
                    </span>
                    <span>-{formatCurrency(activity.costoVentas, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t font-medium">
                    <span>Ingresos Netos:</span>
                    <span className="text-green-600 font-bold">
                      {formatCurrency(activity.ingresosNetos, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Margin indicator */}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Margen Bruto:</span>
                  <Badge 
                    variant="outline"
                    className={cn(
                      activity.margenBruto >= 55 ? "bg-green-100 text-green-700" :
                      activity.margenBruto >= 40 ? "bg-blue-100 text-blue-700" :
                      "bg-orange-100 text-orange-700"
                    )}
                  >
                    {activity.margenBruto.toFixed(1)}%
                  </Badge>
                </div>
                {activity.modeloOperacion === 'propia' && activity.margenBruto < 50 && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Margen bajo (típico F&B: 55-65%)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Totals Summary */}
      {trafficActivities.length > 1 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Ingresos por Tráfico</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totals.ingresosNetos, currency)}/mes
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tráfico Total</p>
                  <p className="font-medium">{totals.traficoTotal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Brutos</p>
                  <p className="font-medium">{formatCurrency(totals.ingresosBrutos, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Margen</p>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    {margenTotal.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
