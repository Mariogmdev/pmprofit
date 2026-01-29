import { Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityConfig, generateId } from '@/types/activity';
import { CurrencyCode } from '@/types';
import { formatCurrency } from '@/lib/currency';

interface ActivityRentalsEditorProps {
  config: ActivityConfig;
  onUpdate: (updates: Partial<ActivityConfig>) => void;
  currency: string;
}

export default function ActivityRentalsEditor({ config, onUpdate, currency }: ActivityRentalsEditorProps) {
  const addRental = () => {
    onUpdate({
      alquileres: [
        ...config.alquileres,
        { id: generateId(), item: '', porcentaje: 30, precio: 10000 },
      ],
    });
  };

  const updateRental = (id: string, field: string, value: string | number) => {
    onUpdate({
      alquileres: config.alquileres.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    });
  };

  const deleteRental = (id: string) => {
    onUpdate({
      alquileres: config.alquileres.filter((r) => r.id !== id),
    });
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-primary" />
          4. Ingresos Complementarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Equipment Rentals */}
        <div>
          <Label className="text-sm font-medium">Alquiler de Equipos</Label>
          
          {config.alquileres.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed rounded-lg mt-2">
              <p className="text-sm text-muted-foreground mb-3">
                No hay alquileres configurados
              </p>
              <Button variant="outline" size="sm" onClick={addRental}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {config.alquileres.map((rental) => (
                <div 
                  key={rental.id} 
                  className="flex flex-wrap items-end gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1 min-w-[150px] space-y-1">
                    <Label className="text-xs">Item</Label>
                    <Input
                      value={rental.item}
                      onChange={(e) => updateRental(rental.id, 'item', e.target.value)}
                      placeholder="Ej: Palas, Bolas"
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">% usuarios</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={rental.porcentaje}
                        onChange={(e) => updateRental(rental.id, 'porcentaje', parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                  <div className="w-36 space-y-1">
                    <Label className="text-xs">Precio</Label>
                    <Input
                      type="number"
                      min={0}
                      value={rental.precio}
                      onChange={(e) => updateRental(rental.id, 'precio', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRental(rental.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              
              <Button variant="outline" size="sm" onClick={addRental}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </div>
          )}
        </div>

        {/* Classes Toggle */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Clases / Entrenamientos</Label>
              <p className="text-xs text-muted-foreground">
                Ofrecer clases como ingreso adicional
              </p>
            </div>
            <Switch
              checked={config.tieneClases}
              onCheckedChange={(checked) => {
                onUpdate({
                  tieneClases: checked,
                  configuracionClases: checked
                    ? { clasesPorDia: 2, precioClase: 50000, descuento: 0 }
                    : undefined,
                });
              }}
            />
          </div>

          {config.tieneClases && config.configuracionClases && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label className="text-xs">Clases por día</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.configuracionClases.clasesPorDia}
                  onChange={(e) =>
                    onUpdate({
                      configuracionClases: {
                        ...config.configuracionClases!,
                        clasesPorDia: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Precio por clase</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.configuracionClases.precioClase}
                  onChange={(e) =>
                    onUpdate({
                      configuracionClases: {
                        ...config.configuracionClases!,
                        precioClase: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Descuento (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={config.configuracionClases.descuento}
                  onChange={(e) =>
                    onUpdate({
                      configuracionClases: {
                        ...config.configuracionClases!,
                        descuento: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
