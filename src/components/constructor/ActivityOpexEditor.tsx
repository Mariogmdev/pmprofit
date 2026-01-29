import { Plus, Trash2, Users, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityConfig, ActivityCalculations, generateId } from '@/types/activity';
import { CurrencyCode } from '@/types';
import { formatCurrency } from '@/lib/currency';

interface ActivityOpexEditorProps {
  config: ActivityConfig;
  onUpdate: (updates: Partial<ActivityConfig>) => void;
  currency: string;
  calculations: ActivityCalculations;
}

export default function ActivityOpexEditor({ 
  config, 
  onUpdate, 
  currency,
  calculations 
}: ActivityOpexEditorProps) {
  // Staff
  const addStaff = () => {
    onUpdate({
      personal: [
        ...config.personal,
        { id: generateId(), cargo: '', cantidad: 1, salarioMensual: 0 },
      ],
    });
  };

  const updateStaff = (id: string, field: string, value: string | number) => {
    onUpdate({
      personal: config.personal.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    });
  };

  const deleteStaff = (id: string) => {
    onUpdate({
      personal: config.personal.filter((p) => p.id !== id),
    });
  };

  // Maintenance
  const addMaintenance = () => {
    onUpdate({
      mantenimiento: [
        ...config.mantenimiento,
        { id: generateId(), item: '', costoAnual: 0 },
      ],
    });
  };

  const updateMaintenance = (id: string, field: string, value: string | number) => {
    onUpdate({
      mantenimiento: config.mantenimiento.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    });
  };

  const deleteMaintenance = (id: string) => {
    onUpdate({
      mantenimiento: config.mantenimiento.filter((m) => m.id !== id),
    });
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          6. OPEX de esta Actividad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Staff */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Personal Específico
          </Label>
          
          {config.personal.length === 0 ? (
            <div className="text-center py-4 border-2 border-dashed rounded-lg mt-2">
              <p className="text-sm text-muted-foreground mb-2">
                Sin personal asignado
              </p>
              <Button variant="outline" size="sm" onClick={addStaff}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cargo
              </Button>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {config.personal.map((person) => (
                <div 
                  key={person.id} 
                  className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg"
                >
                  <Input
                    value={person.cargo}
                    onChange={(e) => updateStaff(person.id, 'cargo', e.target.value)}
                    placeholder="Cargo"
                    className="flex-1 min-w-[150px]"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      value={person.cantidad}
                      onChange={(e) => updateStaff(person.id, 'cantidad', parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <span className="text-xs">pers</span>
                  </div>
                  <span className="text-xs">×</span>
                  <Input
                    type="number"
                    min={0}
                    value={person.salarioMensual}
                    onChange={(e) => updateStaff(person.id, 'salarioMensual', parseFloat(e.target.value) || 0)}
                    placeholder="Salario mensual"
                    className="w-32"
                  />
                  <span className="text-xs">=</span>
                  <span className="text-sm font-medium w-28">
                    {formatCurrency(person.cantidad * person.salarioMensual, currency as CurrencyCode)}/mes
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => deleteStaff(person.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addStaff}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cargo
              </Button>
            </div>
          )}
        </div>

        {/* Maintenance */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Mantenimiento (costos anuales)
          </Label>
          
          {config.mantenimiento.length === 0 ? (
            <div className="text-center py-4 border-2 border-dashed rounded-lg mt-2">
              <p className="text-sm text-muted-foreground mb-2">
                Sin mantenimiento configurado
              </p>
              <Button variant="outline" size="sm" onClick={addMaintenance}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {config.mantenimiento.map((item) => (
                <div 
                  key={item.id} 
                  className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg"
                >
                  <Input
                    value={item.item}
                    onChange={(e) => updateMaintenance(item.id, 'item', e.target.value)}
                    placeholder="Item (ej: Césped sintético)"
                    className="flex-1 min-w-[200px]"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      value={item.costoAnual}
                      onChange={(e) => updateMaintenance(item.id, 'costoAnual', parseFloat(e.target.value) || 0)}
                      placeholder="Costo anual"
                      className="w-36"
                    />
                    <span className="text-xs">/año</span>
                  </div>
                  <span className="text-xs">=</span>
                  <span className="text-sm text-muted-foreground w-28">
                    {formatCurrency(item.costoAnual / 12, currency as CurrencyCode)}/mes
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => deleteMaintenance(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addMaintenance}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </div>
          )}
        </div>

        {/* Reposition Info */}
        {calculations.capexConsumibles > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              📦 Reposición consumibles (estimado 30% anual): 
              <span className="font-medium text-foreground ml-1">
                {formatCurrency(calculations.opexReposicion, currency as CurrencyCode)}/mes
              </span>
            </p>
          </div>
        )}

        {/* Total */}
        <div className="bg-destructive/10 rounded-lg p-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">OPEX MENSUAL:</span>
            <span className="text-xl font-bold text-destructive">
              {formatCurrency(calculations.opexMensual, currency as CurrencyCode)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Personal: {formatCurrency(calculations.opexPersonal, currency as CurrencyCode)} | 
            Mantenimiento: {formatCurrency(calculations.opexMantenimiento, currency as CurrencyCode)} | 
            Reposición: {formatCurrency(calculations.opexReposicion, currency as CurrencyCode)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
