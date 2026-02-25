import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DashboardMetrics } from '@/types/dashboard';
import { formatCurrency, formatPercent } from '@/lib/currency';
import { CurrencyCode } from '@/types';
import { cn } from '@/lib/utils';
import { CalculationModal } from './CalculationModal';
import { CalculationType } from '@/lib/calculationExplainer';
import { 
  DollarSign, 
  TrendingUp, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  AlertCircle,
  Calculator
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeroMetricsProps {
  metrics: DashboardMetrics;
  currency: CurrencyCode;
}

export const HeroMetrics = ({ metrics, currency }: HeroMetricsProps) => {
  const [calculationModal, setCalculationModal] = useState<{
    isOpen: boolean;
    type: CalculationType;
  }>({ isOpen: false, type: 'monthly_revenue' });

  const openCalculation = (type: CalculationType) => {
    setCalculationModal({ isOpen: true, type });
  };

  const closeCalculation = () => {
    setCalculationModal({ ...calculationModal, isOpen: false });
  };

  const growthRate = metrics.proyeccion.length >= 2 
    ? ((metrics.proyeccion[metrics.proyeccion.length - 1].ingresosAnuales / metrics.proyeccion[0].ingresosAnuales - 1) * 100 / (metrics.proyeccion.length - 1))
    : 0;

  const CalculationButton = ({ type, label }: { type: CalculationType; label?: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-background/80 absolute top-2 right-2"
          onClick={() => openCalculation(type)}
        >
          <Calculator className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p className="text-xs">Ver cálculo</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Ingresos */}
        <Card className="relative overflow-hidden border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="pt-6 relative">
            <CalculationButton type="monthly_revenue" />
            
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <Badge variant="outline" className="bg-background">
                Base
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">
                Ingresos Mensuales
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(metrics.ingresosMensualesBase, currency)}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  +{growthRate.toFixed(1)}% anual
                </span>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Anual Base</p>
                <p className="font-semibold">
                  {formatCurrency(metrics.ingresosAnualesBase, currency)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Año {metrics.proyeccion.length}</p>
                <p className="font-semibold">
                  {formatCurrency(metrics.proyeccion[metrics.proyeccion.length - 1]?.ingresosAnuales || 0, currency)}
                </p>
              </div>
            </div>
          </CardContent>
          
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-200 dark:bg-green-800/30 rounded-full opacity-20" />
        </Card>
        
        {/* Card 2: EBITDA & EBIT */}
        <Card className="relative overflow-hidden border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardContent className="pt-6 relative">
            <CalculationButton type="monthly_ebitda" />
            
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "bg-background cursor-help",
                      metrics.margenEbitdaBase >= 30 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
                    )}
                  >
                    {formatPercent(metrics.margenEbitdaBase)} Margen
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1 text-xs">
                    <p><strong>EBITDA:</strong> Ganancias antes de intereses, impuestos, depreciación y amortización.</p>
                    <p><strong>EBIT:</strong> EBITDA menos depreciación.</p>
                    <p className="text-yellow-200 mt-2">💡 Para análisis de caja operativo, usar EBITDA. Para P&L contable, usar EBIT.</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">
                EBITDA Mensual
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-blue-700 dark:text-blue-400">
                {formatCurrency(metrics.ebitdaMensualBase, currency)}
              </p>
              <div className="flex items-center gap-2 text-sm">
                {metrics.margenEbitdaBase >= 30 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400 font-medium">Margen saludable</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-orange-600 dark:text-orange-400 font-medium">Margen ajustado</span>
                  </>
                )}
              </div>
            </div>
            
            <Separator className="my-4" />
            
            {/* EBIT breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>− Depreciación:</span>
                <span>{formatCurrency(metrics.depreciacionMensual, currency)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold border-t pt-2">
                <span>= EBIT Mensual:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatCurrency(metrics.ebitMensualBase, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Margen EBIT:</span>
                <span>{formatPercent(metrics.margenEbitBase)}</span>
              </div>
            </div>
          </CardContent>
          
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-200 dark:bg-blue-800/30 rounded-full opacity-20" />
        </Card>
        
        {/* Card 3: CAPEX & TIR */}
        <Card className="relative overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardContent className="pt-6 relative">
            <CalculationButton type="capex_total" />
            
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <Badge 
                variant="outline"
                className={cn(
                  "bg-background cursor-pointer hover:bg-muted",
                  metrics.tir >= 15 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
                )}
                onClick={() => openCalculation('tir')}
              >
                TIR {formatPercent(metrics.tir)}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">
                Inversión Total (CAPEX)
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-purple-700 dark:text-purple-400">
                {formatCurrency(metrics.capexTotal, currency)}
              </p>
              <div className="flex items-center gap-2 text-sm">
                {metrics.tir >= 15 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400 font-medium">TIR atractiva</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-orange-600 dark:text-orange-400 font-medium">TIR moderada</span>
                  </>
                )}
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div 
                className="cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors"
                onClick={() => openCalculation('van')}
              >
                <p className="text-muted-foreground">VAN</p>
                <p className={cn(
                  "font-semibold",
                  metrics.van >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {formatCurrency(metrics.van, currency)}
                </p>
              </div>
              <div 
                className="cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors"
                onClick={() => openCalculation('revenue_per_m2')}
              >
                <p className="text-muted-foreground">CAPEX/m²</p>
                <p className="font-semibold">
                  {metrics.areaTotal > 0 
                    ? formatCurrency(metrics.capexTotal / metrics.areaTotal, currency)
                    : '-'
                  }
                </p>
              </div>
            </div>
          </CardContent>
          
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-200 dark:bg-purple-800/30 rounded-full opacity-20" />
        </Card>
        
        {/* Card 4: Payback */}
        <Card className="relative overflow-hidden border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <CardContent className="pt-6 relative">
            <CalculationButton type="payback_months" />
            
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <Badge 
                variant="outline"
                className={cn(
                  "bg-background",
                  metrics.paybackMesesReal <= 36 ? "text-green-600 dark:text-green-400" : 
                  metrics.paybackMesesReal <= 60 ? "text-orange-600 dark:text-orange-400" : 
                  "text-red-600 dark:text-red-400"
                )}
              >
                {metrics.paybackMesesReal <= 60 ? "Bueno" : "Lento"}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">
                Periodo de Recuperación
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl lg:text-3xl font-bold text-orange-700 dark:text-orange-400">
                  {metrics.paybackMesesReal}
                </p>
                <p className="text-lg text-muted-foreground">meses</p>
              </div>
              <p className="text-sm text-muted-foreground">
                ≈ {(metrics.paybackMesesReal / 12).toFixed(1)} años
              </p>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ROI Año 1</span>
                <span className={cn(
                  "font-semibold",
                  metrics.proyeccion[0]?.roiAcumulado >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {formatPercent(metrics.proyeccion[0]?.roiAcumulado || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ROI Año {metrics.proyeccion.length}</span>
                <span className={cn(
                  "font-semibold",
                  metrics.proyeccion[metrics.proyeccion.length - 1]?.roiAcumulado >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {formatPercent(metrics.proyeccion[metrics.proyeccion.length - 1]?.roiAcumulado || 0)}
                </span>
              </div>
            </div>
          </CardContent>
          
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-200 dark:bg-orange-800/30 rounded-full opacity-20" />
        </Card>
      </div>

      {/* Calculation Modal */}
      <CalculationModal
        isOpen={calculationModal.isOpen}
        onClose={closeCalculation}
        calculationType={calculationModal.type}
        metrics={metrics}
        currency={currency}
      />
    </>
  );
};
