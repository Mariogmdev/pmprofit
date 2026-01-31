import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { SpaceInsight } from '@/types/dashboard';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SpaceInsightsSectionProps {
  spaces: SpaceInsight[];
  currency: CurrencyCode;
}

// Icon mapping for space types
const getSpaceIcon = (tipo: string): string => {
  switch (tipo) {
    case 'recepcion': return '🏢';
    case 'vestuarios': return '🚿';
    case 'parqueadero': return '🅿️';
    case 'cafeteria': return '☕';
    case 'tienda': return '🛒';
    case 'oficinas': return '💼';
    case 'bodega': return '📦';
    case 'mantenimiento': return '🔧';
    case 'terraza': return '🌳';
    default: return '🏠';
  }
};

const getSpaceLabel = (tipo: string): string => {
  switch (tipo) {
    case 'recepcion': return 'Recepción';
    case 'vestuarios': return 'Vestuarios';
    case 'parqueadero': return 'Parqueadero';
    case 'cafeteria': return 'Cafetería';
    case 'tienda': return 'Tienda';
    case 'oficinas': return 'Oficinas';
    case 'bodega': return 'Bodega';
    case 'mantenimiento': return 'Mantenimiento';
    case 'terraza': return 'Terraza';
    default: return 'Otro';
  }
};

export const SpaceInsightsSection = ({ 
  spaces,
  currency
}: SpaceInsightsSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (spaces.length === 0) {
    return null;
  }
  
  // Separate revenue-generating and support spaces
  const revenueSpaces = spaces.filter(s => s.ingresosMensuales > 0);
  const supportSpaces = spaces.filter(s => s.ingresosMensuales === 0);
  
  // Calculate totals
  const totalCapex = spaces.reduce((s, sp) => s + sp.capex, 0);
  const totalArea = spaces.reduce((s, sp) => s + sp.area, 0);
  const totalRevenue = revenueSpaces.reduce((s, sp) => s + sp.ingresosMensuales, 0);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-3 h-3 text-orange-600" />;
      case 'info': return <Info className="w-3 h-3 text-blue-600" />;
      default: return null;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Análisis de Espacios ({spaces.length})
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Área: {totalArea.toLocaleString()} m²</span>
                  <span>CAPEX: {formatCurrency(totalCapex, currency)}</span>
                  {totalRevenue > 0 && (
                    <span className="text-green-600">
                      +{formatCurrency(totalRevenue, currency)}/mes
                    </span>
                  )}
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  isOpen && "rotate-90"
                )} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Revenue generating spaces */}
            {revenueSpaces.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Generan Ingresos
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {revenueSpaces.map((space) => (
                    <div 
                      key={space.spaceId}
                      className="p-3 border rounded-lg bg-green-50/50 dark:bg-green-950/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getSpaceIcon(space.tipo)}</span>
                          <div>
                            <p className="font-medium text-sm">{space.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {space.area} m²
                            </p>
                          </div>
                        </div>
                        {space.roi > 0 && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              space.roi >= 15 
                                ? "bg-green-100 text-green-700 border-green-200" 
                                : "bg-orange-100 text-orange-700 border-orange-200"
                            )}
                          >
                            ROI {space.roi.toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">CAPEX</p>
                          <p className="font-medium">{formatCurrency(space.capex, currency)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ingresos/mes</p>
                          <p className="font-medium text-green-600">
                            {formatCurrency(space.ingresosMensuales, currency)}
                          </p>
                        </div>
                      </div>
                      
                      {space.insights.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                          {space.insights.map((insight, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs">
                              {getInsightIcon(insight.type)}
                              <span>{insight.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Support spaces */}
            {supportSpaces.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Espacios de Soporte
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium">Espacio</th>
                        <th className="text-right py-2 px-2 font-medium">Área</th>
                        <th className="text-right py-2 px-2 font-medium">CAPEX</th>
                        <th className="text-right py-2 px-2 font-medium">CAPEX/m²</th>
                        <th className="text-center py-2 px-2 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supportSpaces.map((space) => (
                        <tr key={space.spaceId} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <span>{getSpaceIcon(space.tipo)}</span>
                              <span className="font-medium">{space.nombre}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-right">
                            {space.area > 0 ? `${space.area} m²` : '-'}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {formatCurrency(space.capex, currency)}
                          </td>
                          <td className="py-2 px-2 text-right text-muted-foreground">
                            {space.area > 0 
                              ? formatCurrency(space.capex / space.area, currency)
                              : '-'
                            }
                          </td>
                          <td className="py-2 px-2 text-center">
                            {space.insights.length > 0 ? (
                              <div className="flex justify-center">
                                {getInsightIcon(space.insights[0].type)}
                              </div>
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Summary */}
            <div className="pt-3 border-t">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Espacios</p>
                  <p className="text-lg font-bold">{spaces.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Área Total</p>
                  <p className="text-lg font-bold">{totalArea.toLocaleString()} m²</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CAPEX Total</p>
                  <p className="text-lg font-bold">{formatCurrency(totalCapex, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CAPEX/m² Prom.</p>
                  <p className="text-lg font-bold">
                    {totalArea > 0 ? formatCurrency(totalCapex / totalArea, currency) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};