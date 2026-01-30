import { Plus, Trash2, Building2, Cog, Package, Armchair, Info, Home, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ActivityConfig, ActivityCalculations, CoverType, generateId } from '@/types/activity';
import { CurrencyCode } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

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

  const selectedCapex = config.tipoCubierta === 'cubierta'
    ? config.capexCubierta
    : config.tipoCubierta === 'semicubierta'
      ? config.capexSemicubierta
      : config.capexAireLibre;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          5. CAPEX de esta Actividad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info about construction */}
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
            Esta sección incluye el costo de <strong>construir</strong> las {config.cantidad} {config.tipoUnidad} de {activityName}.
            La Obra Civil (Sección B) calculará por separado las <strong>áreas comunes</strong> (recepción, pasillos, etc).
          </AlertDescription>
        </Alert>

        {/* Construction Section */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4" />
            Construcción de la Actividad
          </Label>
          
          {/* Cover Type Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Tipo de Construcción</Label>
              <RadioGroup
                value={config.tipoCubierta}
                onValueChange={(v: CoverType) => onUpdate({ tipoCubierta: v })}
                className="grid grid-cols-3 gap-3 mt-2"
              >
                <Card className={cn(
                  "p-3 cursor-pointer transition-all border-2",
                  config.tipoCubierta === 'cubierta' && "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                )}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cubierta" id="cubierta" />
                    <Label htmlFor="cubierta" className="cursor-pointer flex flex-col">
                      <span className="flex items-center gap-1 font-medium">
                        <Building2 className="w-4 h-4" /> Cubierta
                      </span>
                      <span className="text-xs text-muted-foreground">Techo + paredes</span>
                    </Label>
                  </div>
                </Card>
                
                <Card className={cn(
                  "p-3 cursor-pointer transition-all border-2",
                  config.tipoCubierta === 'semicubierta' && "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                )}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="semicubierta" id="semicubierta" />
                    <Label htmlFor="semicubierta" className="cursor-pointer flex flex-col">
                      <span className="flex items-center gap-1 font-medium">
                        <Home className="w-4 h-4" /> Semi-cubierta
                      </span>
                      <span className="text-xs text-muted-foreground">Solo techo</span>
                    </Label>
                  </div>
                </Card>
                
                <Card className={cn(
                  "p-3 cursor-pointer transition-all border-2",
                  config.tipoCubierta === 'aire-libre' && "border-green-500 bg-green-50 dark:bg-green-950/30"
                )}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="aire-libre" id="aire-libre" />
                    <Label htmlFor="aire-libre" className="cursor-pointer flex flex-col">
                      <span className="flex items-center gap-1 font-medium">
                        <Sun className="w-4 h-4" /> Aire Libre
                      </span>
                      <span className="text-xs text-muted-foreground">Sin techo</span>
                    </Label>
                  </div>
                </Card>
              </RadioGroup>
            </div>

            {/* CAPEX by type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Costo Cubierta (por {config.tipoUnidad})</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.capexCubierta}
                  onChange={(e) => onUpdate({ capexCubierta: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Costo Semi-cubierta</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.capexSemicubierta}
                  onChange={(e) => onUpdate({ capexSemicubierta: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Costo Aire Libre</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.capexAireLibre}
                  onChange={(e) => onUpdate({ capexAireLibre: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Construcción Total</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {config.cantidad} × {formatCurrency(selectedCapex, currency as CurrencyCode)} ({config.tipoCubierta})
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(calculations.capexConstruccion, currency as CurrencyCode)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Activity-Specific Equipment */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Equipamiento Específico
          </Label>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Equipos adicionales de {activityName} (además de la construcción básica).
            Ej: cristales especiales, iluminación deportiva, sistemas de audio.
          </p>
          
          {(!config.equipamientoEspecifico || config.equipamientoEspecifico.length === 0) ? (
            <div className="text-center py-4 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Sin equipamiento adicional
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
                  className="flex flex-wrap items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800"
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
                  <span className="text-sm font-semibold w-24 text-purple-700 dark:text-purple-300">
                    {formatCurrency(item.cantidad * item.precioUnitario, currency as CurrencyCode)}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => deleteEquipamiento(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addEquipamiento}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar
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
          
          {config.consumibles.length === 0 ? (
            <div className="text-center py-4 border-2 border-dashed rounded-lg mt-2">
              <p className="text-sm text-muted-foreground mb-2">
                Sin consumibles configurados
              </p>
              <Button variant="outline" size="sm" onClick={addConsumable}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
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
                Agregar
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
          
          {config.mobiliario.length === 0 ? (
            <div className="text-center py-4 border-2 border-dashed rounded-lg mt-2">
              <p className="text-sm text-muted-foreground mb-2">
                Sin mobiliario configurado
              </p>
              <Button variant="outline" size="sm" onClick={addMobiliario}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
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
                Agregar
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Total Summary */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-300 dark:border-green-700">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>🏗️ Construcción:</span>
                <span className="font-semibold">
                  {formatCurrency(calculations.capexConstruccion, currency as CurrencyCode)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>⚙️ Equipamiento:</span>
                <span className="font-semibold">
                  {formatCurrency(calculations.capexEquipamiento, currency as CurrencyCode)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>📦 Consumibles:</span>
                <span className="font-semibold">
                  {formatCurrency(calculations.capexConsumibles, currency as CurrencyCode)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>🪑 Mobiliario:</span>
                <span className="font-semibold">
                  {formatCurrency(calculations.capexMobiliario, currency as CurrencyCode)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">CAPEX TOTAL ACTIVIDAD:</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(calculations.capexTotal, currency as CurrencyCode)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
