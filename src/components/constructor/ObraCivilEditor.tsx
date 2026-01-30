import { useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useObraCivil } from '@/hooks/useObraCivil';
import { useProjectSpaces } from '@/hooks/useProjectSpaces';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types/index';
import { HardHat, Loader2 } from 'lucide-react';

interface ObraCivilEditorProps {
  projectId: string;
  currency: CurrencyCode;
}

export const ObraCivilEditor = ({ projectId, currency }: ObraCivilEditorProps) => {
  const { obraCivil, loading, updateObraCivil } = useObraCivil(projectId);
  const { spaces } = useProjectSpaces(projectId);
  const { activities } = useProjectActivities();
  
  const lastCalculosRef = useRef<string>('');

  // Calcular área total automáticamente
  const areaTotalCalculada = useMemo(() => {
    const areaActividades = activities.reduce((sum, act) => {
      const config = act.config;
      const areaPorUnidad = config.areaPorUnidad || 0;
      const cantidad = config.cantidad || 1;
      return sum + (cantidad * areaPorUnidad);
    }, 0);
    const areaEspacios = spaces.reduce((sum, sp) => sum + sp.area, 0);
    return areaActividades + areaEspacios;
  }, [activities, spaces]);

  // Cálculos automáticos
  const calculos = useMemo(() => {
    const capexConstruccion = areaTotalCalculada * (obraCivil?.costo_construccion_por_m2 || 0);
    const interventoria = capexConstruccion * ((obraCivil?.interventoria_porcentaje || 5) / 100);
    
    const subtotal = capexConstruccion +
      (obraCivil?.paisajismo || 0) +
      (obraCivil?.estudios_disenos || 0) +
      (obraCivil?.permisos_licencias || 0) +
      interventoria;
    
    const imprevistosValor = subtotal * ((obraCivil?.imprevistos_porcentaje || 10) / 100);
    const capexTotal = subtotal + imprevistosValor;

    return { capexConstruccion, interventoria, imprevistosValor, capexTotal };
  }, [areaTotalCalculada, obraCivil]);

  // Auto-update cálculos en DB (con debounce para evitar loops)
  useEffect(() => {
    if (!obraCivil) return;
    
    const calculosKey = JSON.stringify({
      areaTotalCalculada,
      ...calculos
    });
    
    if (calculosKey === lastCalculosRef.current) return;
    lastCalculosRef.current = calculosKey;

    const timer = setTimeout(() => {
      updateObraCivil({
        area_total_proyecto: areaTotalCalculada,
        capex_construccion: calculos.capexConstruccion,
        interventoria: calculos.interventoria,
        imprevistos_valor: calculos.imprevistosValor,
        capex_obra_civil_total: calculos.capexTotal
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [areaTotalCalculada, calculos, obraCivil, updateObraCivil]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border-2 border-orange-200 dark:border-orange-800">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30">
        <CardTitle className="flex items-center gap-2">
          <HardHat className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          Obra Civil y Construcción
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Área total */}
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <Label className="text-sm text-muted-foreground">Área Total del Proyecto</Label>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {areaTotalCalculada.toLocaleString()} m²
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            (Auto-calculado: actividades + espacios comunes)
          </p>
        </div>

        {/* Costo construcción */}
        <div>
          <Label>Costo de Construcción por m²</Label>
          <Input
            type="number"
            value={obraCivil?.costo_construccion_por_m2 || 0}
            onChange={(e) => updateObraCivil({ costo_construccion_por_m2: Number(e.target.value) })}
            placeholder="Ej: 1,800,000"
          />
          <p className="text-sm text-muted-foreground mt-1">
            → CAPEX Construcción: {formatCurrency(calculos.capexConstruccion, currency)}
          </p>
        </div>

        <Separator />

        {/* Adicionales */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Adicionales</Label>
          
          <div>
            <Label>Paisajismo y Exteriores</Label>
            <Input
              type="number"
              value={obraCivil?.paisajismo || 0}
              onChange={(e) => updateObraCivil({ paisajismo: Number(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>Estudios y Diseños</Label>
            <Input
              type="number"
              value={obraCivil?.estudios_disenos || 0}
              onChange={(e) => updateObraCivil({ estudios_disenos: Number(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>Permisos y Licencias</Label>
            <Input
              type="number"
              value={obraCivil?.permisos_licencias || 0}
              onChange={(e) => updateObraCivil({ permisos_licencias: Number(e.target.value) })}
            />
          </div>
          
          <div>
            <Label>Interventoría ({obraCivil?.interventoria_porcentaje || 5}%)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={obraCivil?.interventoria_porcentaje || 5}
                onChange={(e) => updateObraCivil({ interventoria_porcentaje: Number(e.target.value) })}
                className="w-24"
                min="0"
                max="100"
              />
              <Input
                type="number"
                value={Math.round(calculos.interventoria)}
                disabled
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              (Auto-calculado sobre CAPEX construcción)
            </p>
          </div>
        </div>

        <Separator />

        {/* Imprevistos */}
        <div>
          <Label>Imprevistos ({obraCivil?.imprevistos_porcentaje || 10}%)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={obraCivil?.imprevistos_porcentaje || 10}
              onChange={(e) => updateObraCivil({ imprevistos_porcentaje: Number(e.target.value) })}
              className="w-24"
              min="0"
              max="100"
            />
            <Input
              type="number"
              value={Math.round(calculos.imprevistosValor)}
              disabled
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            (Auto-calculado sobre subtotal)
          </p>
        </div>

        <Separator />

        {/* Total */}
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-300 dark:border-orange-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold">CAPEX Obra Civil Total:</span>
              <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(calculos.capexTotal, currency)}
              </span>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
