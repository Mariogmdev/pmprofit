import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjectSpaces } from '@/hooks/useProjectSpaces';
import { useObraCivil } from '@/hooks/useObraCivil';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types/index';
import { ActivityConfig } from '@/types/activity';
import { Calculator, Building2, HardHat, Zap, AlertTriangle } from 'lucide-react';

interface InfrastructureSummaryProps {
  projectId: string;
  currency: CurrencyCode;
}

export const InfrastructureSummary = ({ projectId, currency }: InfrastructureSummaryProps) => {
  const { spaces } = useProjectSpaces(projectId);
  const { obraCivil } = useObraCivil(projectId);
  const { activities } = useProjectActivities();
  
  const [imprevistosPorcentaje, setImprevistosPorcentaje] = useState(10);

  const summary = useMemo(() => {
    // 1. CAPEX Actividades (construction + equipment + consumables + furniture)
    const capexActividades = activities.reduce((sum, activity) => {
      const config: ActivityConfig = activity.config;
      const cantidad = config.cantidad || 1;
      
      // Construction cost for this activity
      const tipoCubierta = config.tipoCubierta || 'cubierta';
      let capexConstruccion = 0;
      if (tipoCubierta === 'cubierta') {
        capexConstruccion = (config.capexCubierta || 0) * cantidad;
      } else if (tipoCubierta === 'semicubierta') {
        capexConstruccion = (config.capexSemicubierta || 0) * cantidad;
      } else {
        capexConstruccion = (config.capexAireLibre || 0) * cantidad;
      }
      
      // Specific equipment
      const equipamientoTotal = (config.equipamientoEspecifico || []).reduce(
        (s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)),
        0
      );
      
      // Consumables
      const consumiblesTotal = (config.consumibles || []).reduce(
        (s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)),
        0
      );
      
      // Furniture
      const mobiliarioTotal = (config.mobiliario || []).reduce(
        (s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)),
        0
      );
      
      return sum + capexConstruccion + equipamientoTotal + consumiblesTotal + mobiliarioTotal;
    }, 0);

    // 2. CAPEX Espacios (equipment/furniture only)
    const capexEspacios = spaces.reduce((sum, space) => {
      const breakdownTotal = (space.breakdown || []).reduce(
        (s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)),
        0
      );
      return sum + breakdownTotal;
    }, 0);

    // 3. CAPEX Obra Civil (common areas construction - WITHOUT contingencies)
    const capexObraCivil = obraCivil?.capex_obra_civil_total || 0;

    // 4. SUBTOTAL (before contingencies)
    const subtotal = capexActividades + capexEspacios + capexObraCivil;

    // 5. Contingencies on TOTAL project CAPEX
    const imprevistosValor = subtotal * (imprevistosPorcentaje / 100);

    // 6. FINAL TOTAL
    const capexTotal = subtotal + imprevistosValor;

    return {
      capexActividades,
      capexEspacios,
      capexObraCivil,
      subtotal,
      imprevistosValor,
      capexTotal
    };
  }, [activities, spaces, obraCivil, imprevistosPorcentaje]);

  return (
    <Card className="border-4 border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-950/30 dark:via-blue-950/30 dark:to-purple-950/30">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <Calculator className="w-7 h-7 text-green-600 dark:text-green-400" />
          Resumen CAPEX Total del Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Component cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Activities */}
          <Card className="bg-white/80 dark:bg-background/80">
            <CardContent className="pt-6">
              <div className="text-center">
                <Zap className="w-8 h-8 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                <p className="text-sm text-muted-foreground">Actividades</p>
                <p className="text-xs text-muted-foreground mb-2">(construcción + equipamiento)</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(summary.capexActividades, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activities.length} actividades
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Common Spaces */}
          <Card className="bg-white/80 dark:bg-background/80">
            <CardContent className="pt-6">
              <div className="text-center">
                <Building2 className="w-8 h-8 mx-auto text-purple-600 dark:text-purple-400 mb-2" />
                <p className="text-sm text-muted-foreground">Espacios Comunes</p>
                <p className="text-xs text-muted-foreground mb-2">(equipamiento)</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(summary.capexEspacios, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {spaces.length} espacios
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Obra Civil */}
          <Card className="bg-white/80 dark:bg-background/80">
            <CardContent className="pt-6">
              <div className="text-center">
                <HardHat className="w-8 h-8 mx-auto text-orange-600 dark:text-orange-400 mb-2" />
                <p className="text-sm text-muted-foreground">Obra Civil</p>
                <p className="text-xs text-muted-foreground mb-2">(áreas comunes + circulaciones)</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(summary.capexObraCivil, currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        {/* Subtotal */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">Subtotal (antes de imprevistos)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Actividades + Espacios + Obra Civil
                </p>
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(summary.subtotal, currency)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contingencies */}
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    Imprevistos
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sobre el CAPEX total del proyecto (recomendado: 10-15%)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={imprevistosPorcentaje}
                    onChange={(e) => setImprevistosPorcentaje(Number(e.target.value))}
                    className="w-20 text-right"
                    min="0"
                    max="100"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {imprevistosPorcentaje}% sobre {formatCurrency(summary.subtotal, currency)}
                </span>
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(summary.imprevistosValor, currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* FINAL TOTAL */}
        <Card className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 border-4 border-green-400 dark:border-green-600">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-muted-foreground mb-1 text-lg font-semibold">CAPEX TOTAL DEL PROYECTO</p>
                <p className="text-sm text-muted-foreground">
                  Actividades + Espacios + Obra Civil + Imprevistos
                </p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(summary.capexTotal, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed breakdown */}
        <Card className="bg-white/80 dark:bg-background/80">
          <CardContent className="pt-4">
            <p className="text-sm font-semibold mb-3 text-muted-foreground">Desglose:</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Actividades:</span>
                <span className="font-medium">{formatCurrency(summary.capexActividades, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Espacios Comunes:</span>
                <span className="font-medium">{formatCurrency(summary.capexEspacios, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Obra Civil:</span>
                <span className="font-medium">{formatCurrency(summary.capexObraCivil, currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-blue-600 dark:text-blue-400">
                <span className="font-medium">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(summary.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span className="font-medium">+ Imprevistos ({imprevistosPorcentaje}%):</span>
                <span className="font-semibold">{formatCurrency(summary.imprevistosValor, currency)}</span>
              </div>
              <Separator className="border-green-300 dark:border-green-700" />
              <div className="flex justify-between text-green-600 dark:text-green-400 text-lg">
                <span className="font-bold">TOTAL:</span>
                <span className="font-bold">{formatCurrency(summary.capexTotal, currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
