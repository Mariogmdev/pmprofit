import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useProjectSpaces } from '@/hooks/useProjectSpaces';
import { useObraCivil } from '@/hooks/useObraCivil';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types/index';
import { ActivityConfig } from '@/types/activity';
import { Calculator, Building2, HardHat, Zap, Info } from 'lucide-react';

interface InfrastructureSummaryProps {
  projectId: string;
  currency: CurrencyCode;
}

export const InfrastructureSummary = ({ projectId, currency }: InfrastructureSummaryProps) => {
  const { spaces } = useProjectSpaces(projectId);
  const { obraCivil } = useObraCivil(projectId);
  const { activities } = useProjectActivities();

  // Calculate CAPEX for common spaces (equipment/furniture only, construction is in Obra Civil)
  const capexEspacios = useMemo(() => {
    return spaces.reduce((sum, space) => {
      // Sum breakdown items only (furniture, equipment)
      const breakdownTotal = (space.breakdown || []).reduce(
        (s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)),
        0
      );
      return sum + breakdownTotal;
    }, 0);
  }, [spaces]);

  // CAPEX Obra Civil - construction of common areas only
  const capexObraCivil = useMemo(() => {
    return obraCivil?.capex_obra_civil_total || 0;
  }, [obraCivil]);

  // Calculate CAPEX for activities (construction + equipment + consumables + furniture)
  const capexActividades = useMemo(() => {
    return activities.reduce((sum, activity) => {
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
      
      // Activity-specific equipment
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
  }, [activities]);

  const capexTotal = capexActividades + capexEspacios + capexObraCivil;

  return (
    <Card className="border-4 border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-950/30 dark:via-blue-950/30 dark:to-purple-950/30">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <Calculator className="w-7 h-7 text-green-600 dark:text-green-400" />
          Resumen CAPEX Total del Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Activities - Construction + Equipment */}
          <Card className="bg-white/80 dark:bg-background/80">
            <CardContent className="pt-6">
              <div className="text-center">
                <Zap className="w-8 h-8 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                <p className="text-sm text-muted-foreground">Actividades</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(capexActividades, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activities.length} actividades (construcción + equipamiento)
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Common Spaces - Equipment only */}
          <Card className="bg-white/80 dark:bg-background/80">
            <CardContent className="pt-6">
              <div className="text-center">
                <Building2 className="w-8 h-8 mx-auto text-purple-600 dark:text-purple-400 mb-2" />
                <p className="text-sm text-muted-foreground">Equipamiento Espacios</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(capexEspacios, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {spaces.length} espacios (mobiliario, equipos)
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Obra Civil - Common areas construction */}
          <Card className="bg-white/80 dark:bg-background/80">
            <CardContent className="pt-6">
              <div className="text-center">
                <HardHat className="w-8 h-8 mx-auto text-orange-600 dark:text-orange-400 mb-2" />
                <p className="text-sm text-muted-foreground">Obra Civil</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(capexObraCivil, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Espacios comunes + circulaciones
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        {/* Total */}
        <div className="bg-white dark:bg-background rounded-lg p-6 border-2 border-green-400 dark:border-green-600">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-muted-foreground mb-1 font-semibold">CAPEX TOTAL DEL PROYECTO</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                Actividades + Espacios + Obra Civil (sin duplicar)
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(capexTotal, currency)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
