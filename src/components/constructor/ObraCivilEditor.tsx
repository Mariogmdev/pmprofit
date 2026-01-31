import { useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useObraCivil } from '@/hooks/useObraCivil';
import { useProjectSpaces } from '@/hooks/useProjectSpaces';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types/index';
import { HardHat, Loader2, Building2, Zap, Route, AlertTriangle } from 'lucide-react';

interface ObraCivilEditorProps {
  projectId: string;
  currency: CurrencyCode;
}

export const ObraCivilEditor = ({ projectId, currency }: ObraCivilEditorProps) => {
  const { obraCivil, loading, updateObraCivil } = useObraCivil(projectId);
  const { spaces } = useProjectSpaces(projectId);
  const { activities } = useProjectActivities();
  
  const lastCalculosRef = useRef<string>('');

  // Calculate areas - activities are built in Section A, NOT here
  const areas = useMemo(() => {
    // Area of activities (informational only - built in Section A)
    const areaActividades = activities.reduce((sum, act) => {
      const config = act.config;
      const areaPorUnidad = config.areaPorUnidad || 0;
      const cantidad = config.cantidad || 1;
      return sum + (cantidad * areaPorUnidad);
    }, 0);
    
    // Area of common spaces
    const areaEspacios = spaces.reduce((sum, sp) => sum + (sp.area || 0), 0);
    
    // Circulation area (estimated 30% of common spaces)
    const areaCirculaciones = Math.round(areaEspacios * 0.3);
    
    // Area to be built in Obra Civil (spaces + circulations only)
    const areaObraCivil = areaEspacios + areaCirculaciones;
    
    // Total project area (informational)
    const areaTotal = areaActividades + areaObraCivil;
    
    return {
      areaActividades,
      areaEspacios,
      areaCirculaciones,
      areaObraCivil,
      areaTotal
    };
  }, [activities, spaces]);

  // Automatic calculations - NO contingencies here (moved to summary)
  const calculos = useMemo(() => {
    // Construction ONLY for common areas + circulations (NOT activities)
    const capexConstruccion = areas.areaObraCivil * (obraCivil?.costo_construccion_por_m2 || 0);
    const interventoria = capexConstruccion * ((obraCivil?.interventoria_porcentaje || 5) / 100);
    
    // Total WITHOUT contingencies (they're calculated on total project CAPEX in summary)
    const capexTotal = capexConstruccion +
      (obraCivil?.paisajismo || 0) +
      (obraCivil?.estudios_disenos || 0) +
      (obraCivil?.permisos_licencias || 0) +
      interventoria;

    return { capexConstruccion, interventoria, capexTotal };
  }, [areas.areaObraCivil, obraCivil]);

  // Auto-update calculations in DB (with debounce to avoid loops)
  useEffect(() => {
    if (!obraCivil) return;
    
    const calculosKey = JSON.stringify({
      areaObraCivil: areas.areaObraCivil,
      areaTotal: areas.areaTotal,
      ...calculos
    });
    
    if (calculosKey === lastCalculosRef.current) return;
    lastCalculosRef.current = calculosKey;

    const timer = setTimeout(() => {
      updateObraCivil({
        area_total_proyecto: areas.areaTotal,
        capex_construccion: calculos.capexConstruccion,
        interventoria: calculos.interventoria,
        capex_obra_civil_total: calculos.capexTotal
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [areas, calculos, obraCivil, updateObraCivil]);

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
          Obra Civil (Solo Áreas Comunes)
        </CardTitle>
        <CardDescription>
          La construcción de las actividades (canchas, salas, etc) se calcula en Sección A.
          Aquí solo se incluye construcción de espacios comunes y circulaciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Area breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4 text-center">
              <Zap className="w-6 h-6 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
              <p className="text-xs text-muted-foreground">Área Actividades</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {areas.areaActividades.toLocaleString()} m²
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (Construidas en Sección A)
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-4 text-center">
              <Building2 className="w-6 h-6 mx-auto text-purple-600 dark:text-purple-400 mb-2" />
              <p className="text-xs text-muted-foreground">Espacios Comunes</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {areas.areaEspacios.toLocaleString()} m²
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (Recepción, vestuarios, etc)
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="pt-4 text-center">
              <Route className="w-6 h-6 mx-auto text-green-600 dark:text-green-400 mb-2" />
              <p className="text-xs text-muted-foreground">Circulaciones</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {areas.areaCirculaciones.toLocaleString()} m²
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (Pasillos, accesos - 30%)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Area to build in Obra Civil */}
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Área a Construir en Obra Civil</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Espacios comunes ({areas.areaEspacios} m²) + Circulaciones ({areas.areaCirculaciones} m²)
                </p>
              </div>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {areas.areaObraCivil.toLocaleString()} m²
              </p>
            </div>
          </CardContent>
        </Card>

        <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            <strong>Área Total del Proyecto:</strong> {areas.areaTotal.toLocaleString()} m²
            <br />
            • Actividades: {areas.areaActividades.toLocaleString()} m² (construidas en Sección A)
            <br />
            • Obra Civil: {areas.areaObraCivil.toLocaleString()} m² (construidas aquí)
          </AlertDescription>
        </Alert>

        <Separator />

        {/* Construction cost */}
        <div>
          <Label>Costo de Construcción por m² (espacios comunes)</Label>
          <Input
            type="number"
            value={obraCivil?.costo_construccion_por_m2 || 0}
            onChange={(e) => updateObraCivil({ costo_construccion_por_m2: Number(e.target.value) })}
            placeholder="Ej: 1,800,000"
          />
          <p className="text-sm text-muted-foreground mt-1">
            → CAPEX Construcción: {formatCurrency(calculos.capexConstruccion, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ({areas.areaObraCivil} m² × {formatCurrency(obraCivil?.costo_construccion_por_m2 || 0, currency)}/m²)
          </p>
        </div>

        <Separator />

        {/* Additions */}
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

        {/* Total */}
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-300 dark:border-orange-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-semibold">CAPEX Obra Civil:</span>
                <p className="text-xs text-muted-foreground">
                  (Construcción + Adicionales + Interventoría)
                </p>
              </div>
              <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(calculos.capexTotal, currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 mt-4">
          <AlertTriangle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            <strong>Nota:</strong> Los imprevistos se calculan sobre el CAPEX total del proyecto 
            en el Resumen Final (abajo), no solo sobre la obra civil.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
