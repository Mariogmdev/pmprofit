import { Plus, Trash2, Cog, AlertTriangle, Package, Armchair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ActivityConfig, ActivityCalculations, generateId } from '@/types/activity';
import { CurrencyCode } from '@/types';
import { formatCurrency } from '@/lib/currency';

interface ActivityCapexEditorProps {
  config: ActivityConfig;
  onUpdate: (updates: Partial<ActivityConfig>) => void;
  currency: string;
  calculations: ActivityCalculations;
  activityName?: string;
}

export default function ActivityCapexEditor({ 
  config, 
  onUpdate, 
  currency,
  calculations,
  activityName = 'la actividad'
}: ActivityCapexEditorProps) {
  // Equipment handlers
  const addEquipamiento = () => {
    onUpdate({
      equipamientoEspecifico: [
        ...(config.equipamientoEspecifico || []),
        { id: generateId(), item: '', cantidad: 1, precioUnitario: 0 },
      ],
    });
  };

  const updateEquipamiento = (id: string, field: string, value: string | number) => {
    onUpdate({
      equipamientoEspecifico: (config.equipamientoEspecifico || []).map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    });
  };

  const deleteEquipamiento = (id: string) => {
    onUpdate({
      equipamientoEspecifico: (config.equipamientoEspecifico || []).filter((e) => e.id !== id),
    });
  };

  // Consumables handlers
  const addConsumable = () => {
    onUpdate({
      consumibles: [
        ...config.consumibles,
        { id: generateId(), item: '', cantidad: 1, precioUnitario: 0 },
      ],
    });
  };

  const updateConsumable = (id: string, field: string, value: string | number) => {
    onUpdate({
      consumibles: config.consumibles.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  };

  const deleteConsumable = (id: string) => {
    onUpdate({
      consumibles: config.consumibles.filter((c) => c.id !== id),
    });
  };

  // Furniture handlers
  const addMobiliario = () => {
    onUpdate({
      mobiliario: [
        ...config.mobiliario,
        { id: generateId(), item: '', cantidad: 1, precioUnitario: 0 },
      ],
    });
  };

  const updateMobiliario = (id: string, field: string, value: string | number) => {
    onUpdate({
      mobiliario: config.mobiliario.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    });
  };

  const deleteMobiliario = (id: string) => {
    onUpdate({
      mobiliario: config.mobiliario.filter((m) => m.id !== id),
    });
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Cog className="h-4 w-4 text-primary" />
          5. CAPEX de esta Actividad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning about construction being in Section B */}
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">
            Sobre el CAPEX de Construcción
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
            El costo de <strong>construcción</strong> (obra civil: paredes, techo, piso base) 
            se calcula en <strong>Sección B: Obra Civil</strong> usando el costo por m².
            <br /><br />
            Aquí solo incluye <strong>equipamiento específico</strong> de {activityName}
            (equipos deportivos, sistemas especiales, instalaciones únicas).
          </AlertDescription>
        </Alert>

        {/* Activity-Specific Equipment */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Equipamiento Específico de la Actividad
          </Label>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Incluye equipos y sistemas propios de {activityName} (NO construcción básica).
            <br />
            Ejemplos: cristales panorámicos, iluminación LED deportiva, redes profesionales, marcadores electrónicos.
          </p>
          
          {(!config.equipamientoEspecifico || config.equipamientoEspecifico.length === 0) ? (
            <div className="text-center py-4 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Sin equipamiento configurado
              </p>
              <Button variant="outline" size="sm" onClick={addEquipamiento}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Equipamiento
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {config.equipamientoEspecifico.map((item) => (
                <div 
                  key={item.id} 
                  className="flex flex-wrap items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <Input
                    value={item.item}
                    onChange={(e) => updateEquipamiento(item.id, 'item', e.target.value)}
                    placeholder="Ej: Cristales panorámicos"
                    className="flex-1 min-w-[120px]"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => updateEquipamiento(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <span className="text-xs">unid</span>
                  </div>
                  <span className="text-xs">×</span>
                  <Input
                    type="number"
                    min={0}
                    value={item.precioUnitario}
                    onChange={(e) => updateEquipamiento(item.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                    className="w-28"
                  />
                  <span className="text-xs">=</span>
                  <span className="text-sm font-semibold w-24 text-blue-700 dark:text-blue-300">
                    {formatCurrency(item.cantidad * item.precioUnitario, currency as CurrencyCode)}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => deleteEquipamiento(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addEquipamiento}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Equipamiento
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Consumables */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Consumibles Iniciales
          </Label>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Materiales consumibles necesarios para iniciar operaciones.
          </p>
          
          {config.consumibles.length === 0 ? (
            <div className="text-center py-4 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Sin consumibles configurados
              </p>
              <Button variant="outline" size="sm" onClick={addConsumable}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Consumible
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {config.consumibles.map((item) => (
                <div 
                  key={item.id} 
                  className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg"
                >
                  <Input
                    value={item.item}
                    onChange={(e) => updateConsumable(item.id, 'item', e.target.value)}
                    placeholder="Item"
                    className="flex-1 min-w-[120px]"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => updateConsumable(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <span className="text-xs">unid</span>
                  </div>
                  <span className="text-xs">×</span>
                  <Input
                    type="number"
                    min={0}
                    value={item.precioUnitario}
                    onChange={(e) => updateConsumable(item.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                    className="w-28"
                  />
                  <span className="text-xs">=</span>
                  <span className="text-sm font-medium w-24">
                    {formatCurrency(item.cantidad * item.precioUnitario, currency as CurrencyCode)}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => deleteConsumable(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addConsumable}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Consumible
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Furniture */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Armchair className="h-4 w-4" />
            Mobiliario
          </Label>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Muebles y elementos no deportivos.
          </p>
          
          {config.mobiliario.length === 0 ? (
            <div className="text-center py-4 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Sin mobiliario configurado
              </p>
              <Button variant="outline" size="sm" onClick={addMobiliario}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Mobiliario
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {config.mobiliario.map((item) => (
                <div 
                  key={item.id} 
                  className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg"
                >
                  <Input
                    value={item.item}
                    onChange={(e) => updateMobiliario(item.id, 'item', e.target.value)}
                    placeholder="Item"
                    className="flex-1 min-w-[120px]"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => updateMobiliario(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <span className="text-xs">unid</span>
                  </div>
                  <span className="text-xs">×</span>
                  <Input
                    type="number"
                    min={0}
                    value={item.precioUnitario}
                    onChange={(e) => updateMobiliario(item.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                    className="w-28"
                  />
                  <span className="text-xs">=</span>
                  <span className="text-sm font-medium w-24">
                    {formatCurrency(item.cantidad * item.precioUnitario, currency as CurrencyCode)}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => deleteMobiliario(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addMobiliario}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Mobiliario
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Total Summary */}
        <div className="bg-primary/10 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Equipamiento específico:</span>
              <span className="font-semibold">
                {formatCurrency(calculations.capexEquipamiento, currency as CurrencyCode)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Consumibles iniciales:</span>
              <span className="font-semibold">
                {formatCurrency(calculations.capexConsumibles, currency as CurrencyCode)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Mobiliario:</span>
              <span className="font-semibold">
                {formatCurrency(calculations.capexMobiliario, currency as CurrencyCode)}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <span className="font-semibold">CAPEX TOTAL ACTIVIDAD:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(calculations.capexTotal, currency as CurrencyCode)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              (No incluye construcción - ver Sección B: Obra Civil)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
