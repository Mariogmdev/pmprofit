import { Plus, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityConfig, ActivityCalculations, CoverType, generateId } from '@/types/activity';
import { CurrencyCode } from '@/types';
import { formatCurrency } from '@/lib/currency';

interface ActivityCapexEditorProps {
  config: ActivityConfig;
  onUpdate: (updates: Partial<ActivityConfig>) => void;
  currency: string;
  calculations: ActivityCalculations;
}

export default function ActivityCapexEditor({ 
  config, 
  onUpdate, 
  currency,
  calculations 
}: ActivityCapexEditorProps) {
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
        {/* Infrastructure */}
        <div>
          <Label className="text-sm font-medium">🏗️ Infraestructura</Label>
          
          <div className="mt-3 space-y-4">
            {/* Cover Type */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Tipo de Cubierta</Label>
              <RadioGroup
                value={config.tipoCubierta}
                onValueChange={(v: CoverType) => onUpdate({ tipoCubierta: v })}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cubierta" id="cubierta" />
                  <Label htmlFor="cubierta" className="font-normal cursor-pointer">
                    Cubierta
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="semicubierta" id="semicubierta" />
                  <Label htmlFor="semicubierta" className="font-normal cursor-pointer">
                    Semicubierta
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="aire-libre" id="aire-libre" />
                  <Label htmlFor="aire-libre" className="font-normal cursor-pointer">
                    Aire Libre
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* CAPEX by type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Costo Cubierta/unidad</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.capexCubierta}
                  onChange={(e) => onUpdate({ capexCubierta: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Costo Semicubierta/unidad</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.capexSemicubierta}
                  onChange={(e) => onUpdate({ capexSemicubierta: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Costo Aire Libre/unidad</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.capexAireLibre}
                  onChange={(e) => onUpdate({ capexAireLibre: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              → {config.cantidad} {config.tipoUnidad} × {formatCurrency(selectedCapex, currency as CurrencyCode)} = 
              <span className="font-semibold text-foreground ml-1">
                {formatCurrency(calculations.capexInfraestructura, currency as CurrencyCode)}
              </span>
            </div>
          </div>
        </div>

        {/* Consumables */}
        <div>
          <Label className="text-sm font-medium">📦 Consumibles Iniciales</Label>
          
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

        {/* Furniture */}
        <div>
          <Label className="text-sm font-medium">🪑 Mobiliario y Equipamiento</Label>
          
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

        {/* Total */}
        <div className="bg-primary/10 rounded-lg p-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">CAPEX TOTAL:</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(calculations.capexTotal, currency as CurrencyCode)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Infraestructura: {formatCurrency(calculations.capexInfraestructura, currency as CurrencyCode)} | 
            Consumibles: {formatCurrency(calculations.capexConsumibles, currency as CurrencyCode)} | 
            Mobiliario: {formatCurrency(calculations.capexMobiliario, currency as CurrencyCode)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
