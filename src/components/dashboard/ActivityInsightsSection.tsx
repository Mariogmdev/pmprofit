import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertTriangle,
  Target,
  DollarSign,
  BarChart3,
  Edit,
  ChevronRight,
  CheckCircle2,
  Lightbulb,
  Info,
  Percent
} from 'lucide-react';
import { ActivityInsight } from '@/types/dashboard';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityInsightsSectionProps {
  activities: ActivityInsight[];
  topByRevenue: ActivityInsight[];
  topByMargin: ActivityInsight[];
  worstPerformers: ActivityInsight[];
  currency: CurrencyCode;
  onEditActivity?: (activityId: string) => void;
}

export const ActivityInsightsSection = ({ 
  activities,
  topByRevenue,
  topByMargin,
  worstPerformers,
  currency,
  onEditActivity 
}: ActivityInsightsSectionProps) => {
  const [sortBy, setSortBy] = useState<'ingresos' | 'margen' | 'roi'>('ingresos');
  const [isTableOpen, setIsTableOpen] = useState(false);
  
  if (activities.length === 0) {
    return null;
  }
  
  // Sort activities
  const sortedActivities = [...activities].sort((a, b) => {
    switch (sortBy) {
      case 'ingresos':
        return b.ingresosMensuales - a.ingresosMensuales;
      case 'margen':
        return b.margenEbitda - a.margenEbitda;
      case 'roi':
        return b.roiAnual - a.roiAnual;
      default:
        return 0;
    }
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-3 h-3 text-orange-600" />;
      case 'info': return <Info className="w-3 h-3 text-blue-600" />;
      case 'opportunity': return <Lightbulb className="w-3 h-3 text-purple-600" />;
      default: return null;
    }
  };

  const getSortButtonStyles = (option: 'ingresos' | 'margen' | 'roi') => {
    const isActive = sortBy === option;
    const baseStyles = "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5";
    
    if (isActive) {
      switch (option) {
        case 'ingresos':
          return cn(baseStyles, "bg-green-600 text-white shadow-sm");
        case 'margen':
          return cn(baseStyles, "bg-blue-600 text-white shadow-sm");
        case 'roi':
          return cn(baseStyles, "bg-purple-600 text-white shadow-sm");
      }
    }
    
    return cn(baseStyles, "text-muted-foreground hover:text-foreground hover:bg-muted/80");
  };

  const getSortIcon = (option: 'ingresos' | 'margen' | 'roi') => {
    switch (option) {
      case 'ingresos':
        return <DollarSign className="w-3 h-3" />;
      case 'margen':
        return <Percent className="w-3 h-3" />;
      case 'roi':
        return <TrendingUp className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Análisis por Actividad</h3>
            <p className="text-sm text-muted-foreground">
              Rendimiento detallado de cada deporte y servicio
            </p>
          </div>
        </div>
        
        {/* Sort selector with colored buttons */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          <div className="flex bg-muted rounded-lg p-1 gap-1">
            {(['ingresos', 'margen', 'roi'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={getSortButtonStyles(option)}
              >
                {getSortIcon(option)}
                {option === 'ingresos' ? 'Ingresos' : option === 'margen' ? 'Margen' : 'ROI'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Performers */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4 text-green-600" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topByRevenue.slice(0, 3).map((activity, idx) => (
              <div 
                key={activity.activityId} 
                className="flex items-center justify-between p-2 bg-background/60 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{activity.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{activity.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(activity.ingresosMensuales, currency)}/mes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                    #{idx + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {activity.margenEbitda.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Needs Attention */}
        {worstPerformers.length > 0 && (
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                Requieren Atención
                {/* Tooltip explaining criteria */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1 text-muted-foreground hover:text-foreground">
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs p-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">Criterios de Atención</p>
                      <p className="text-xs text-muted-foreground">
                        Una actividad aparece aquí si cumple alguno de estos criterios:
                      </p>
                      <div className="space-y-2 pt-1 border-t">
                        <div>
                          <p className="text-xs font-medium text-orange-600">⚠️ Margen bajo (&lt; 30%)</p>
                          <p className="text-xs text-muted-foreground">
                            Benchmark industria: 35-45% para centros deportivos
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-orange-600">⚠️ Baja ocupación (&lt; 70% del target)</p>
                          <p className="text-xs text-muted-foreground">
                            La ocupación real está muy por debajo de tu proyección
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-red-600">❌ EBITDA negativo</p>
                          <p className="text-xs text-muted-foreground">
                            La actividad no cubre sus costos operativos
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground italic pt-1 border-t">
                        💡 Click en el ícono de editar para optimizar estos parámetros
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {worstPerformers.map((activity) => (
                <div 
                  key={activity.activityId} 
                  className="flex items-center justify-between p-2 bg-background/60 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{activity.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{activity.nombre}</p>
                      <div className="flex gap-1 mt-1">
                        {activity.margenEbitda < 30 && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 bg-orange-100 text-orange-700 border-orange-200">
                            Margen bajo
                          </Badge>
                        )}
                        {activity.ocupacionPromedio < activity.ocupacionTarget * 0.7 && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 bg-red-100 text-red-700 border-red-200">
                            Baja ocupación
                          </Badge>
                        )}
                        {activity.ebitdaMensual < 0 && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 bg-red-100 text-red-700 border-red-200">
                            EBITDA negativo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {onEditActivity && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEditActivity(activity.activityId)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Detailed Table - Collapsible */}
      <Collapsible open={isTableOpen} onOpenChange={setIsTableOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Detalle por Actividad ({activities.length})</span>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  isTableOpen && "rotate-90"
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium">Actividad</th>
                      <th className="text-right py-2 px-2 font-medium">
                        <span className={cn(
                          "inline-flex items-center gap-1",
                          sortBy === 'ingresos' && "text-green-600"
                        )}>
                          Ingresos/mes
                          {sortBy === 'ingresos' && <TrendingDown className="w-3 h-3" />}
                        </span>
                      </th>
                      <th className="text-right py-2 px-2 font-medium">EBITDA</th>
                      <th className="text-center py-2 px-2 font-medium">
                        <span className={cn(
                          "inline-flex items-center gap-1",
                          sortBy === 'margen' && "text-blue-600"
                        )}>
                          Margen
                          {sortBy === 'margen' && <TrendingDown className="w-3 h-3" />}
                        </span>
                      </th>
                      <th className="text-center py-2 px-2 font-medium">Ocupación</th>
                      <th className="text-center py-2 px-2 font-medium">
                        <span className={cn(
                          "inline-flex items-center gap-1",
                          sortBy === 'roi' && "text-purple-600"
                        )}>
                          Payback
                        </span>
                      </th>
                      <th className="text-right py-2 px-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedActivities.map((activity) => (
                      <tr key={activity.activityId} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span>{activity.icon}</span>
                            <div>
                              <p className="font-medium">{activity.nombre}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {activity.categoria}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <p className="font-medium">
                            {formatCurrency(activity.ingresosMensuales, currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.porcentajeIngresosTotales.toFixed(1)}% del total
                          </p>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <p className={cn(
                            "font-medium",
                            activity.ebitdaMensual >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {formatCurrency(activity.ebitdaMensual, currency)}
                          </p>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge className={cn(
                            "font-medium",
                            activity.margenEbitda >= 40 ? "bg-green-100 text-green-700" :
                            activity.margenEbitda >= 25 ? "bg-blue-100 text-blue-700" :
                            "bg-orange-100 text-orange-700"
                          )}>
                            {activity.margenEbitda.toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <div className="w-20 mx-auto">
                            <Progress 
                              value={Math.min(100, activity.capacidadUtilizada)} 
                              className="h-2"
                            />
                            <p className="text-xs text-center text-muted-foreground mt-1">
                              {activity.ocupacionPromedio.toFixed(0)}%
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm font-medium">
                            {activity.paybackMeses < 999 ? `${activity.paybackMeses}m` : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          {onEditActivity && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onEditActivity(activity.activityId)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Activity insights summary */}
              {sortedActivities.some(a => a.insights.length > 0) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Alertas y oportunidades</p>
                  <div className="flex flex-wrap gap-2">
                    {sortedActivities.flatMap(a => 
                      a.insights.slice(0, 1).map((insight, i) => (
                        <div 
                          key={`${a.activityId}-${i}`}
                          className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full"
                        >
                          {getInsightIcon(insight.type)}
                          <span className="font-medium">{a.nombre}:</span>
                          <span className="text-muted-foreground">{insight.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
