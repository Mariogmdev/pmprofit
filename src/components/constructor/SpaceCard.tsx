import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ProjectSpace, SPACE_TEMPLATES, BreakdownItem } from '@/types/infrastructure';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types/index';
import { ChevronUp, ChevronDown, Trash2, Plus, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpaceCardProps {
  space: ProjectSpace;
  currency: CurrencyCode;
  onUpdate: (id: string, data: Partial<ProjectSpace>) => void;
  onDelete: (id: string) => void;
}

export const SpaceCard = ({ space, currency, onUpdate, onDelete }: SpaceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const template = SPACE_TEMPLATES.find(t => t.type === space.type);
  const icon = template?.icon || '🏢';

  // Calcular CAPEX: breakdown items + (area * capex_por_m2)
  const { breakdownTotal, areaCapex, capexTotal } = useMemo(() => {
    const breakdownTotal = (space.breakdown || []).reduce(
      (sum, item) => sum + ((item.cantidad || 0) * (item.precioUnitario || 0)),
      0
    );
    const areaCapex = (space.area || 0) * (space.capex_por_m2 || 0);
    return {
      breakdownTotal,
      areaCapex,
      capexTotal: breakdownTotal + areaCapex
    };
  }, [space.breakdown, space.area, space.capex_por_m2]);

  const updateBreakdownItem = (idx: number, field: keyof BreakdownItem, value: string | number) => {
    const newBreakdown = [...(space.breakdown || [])];
    newBreakdown[idx] = { ...newBreakdown[idx], [field]: value };
    onUpdate(space.id, { breakdown: newBreakdown });
  };

  const addBreakdownItem = () => {
    const newBreakdown = [
      ...(space.breakdown || []),
      { item: '', cantidad: 1, precioUnitario: 0 }
    ];
    onUpdate(space.id, { breakdown: newBreakdown });
  };

  const removeBreakdownItem = (idx: number) => {
    const newBreakdown = (space.breakdown || []).filter((_, i) => i !== idx);
    onUpdate(space.id, { breakdown: newBreakdown });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar "${space.name}"?`)) {
      onDelete(space.id);
    }
  };

  return (
    <Card className={cn(
      'border-2 transition-all duration-200',
      isExpanded ? 'border-purple-300 dark:border-purple-700 shadow-lg' : 'border-border'
    )}>
      {/* Header - siempre visible */}
      <div
        className="p-4 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h4 className="font-semibold text-lg">{space.name}</h4>
            <p className="text-sm text-muted-foreground">
              {space.area} m² • <span className="font-medium text-purple-600 dark:text-purple-400">{formatCurrency(capexTotal, currency)}</span> CAPEX
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Contenido expandido */}
      {isExpanded && (
        <CardContent className="space-y-6 pt-0 border-t">
          {/* Configuración básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <Label>Nombre del Espacio</Label>
              <Input
                value={space.name}
                onChange={(e) => onUpdate(space.id, { name: e.target.value })}
                placeholder="Ej: Recepción Principal"
              />
            </div>
            <div>
              <Label>Área (m²)</Label>
              <Input
                type="number"
                value={space.area}
                onChange={(e) => onUpdate(space.id, { area: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>

          {/* CAPEX por m² */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <Label className="text-sm font-medium">CAPEX por m² (mobiliario/acabados base)</Label>
            <div className="flex items-center gap-3 mt-2">
              <CurrencyInput
                value={space.capex_por_m2 || 0}
                onChange={(value) => onUpdate(space.id, { capex_por_m2: value })}
                currency={currency}
                className="max-w-[200px]"
              />
              <span className="text-muted-foreground">×</span>
              <span className="text-sm">{space.area} m²</span>
              <span className="text-muted-foreground">=</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {formatCurrency(areaCapex, currency)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Breakdown detallado */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" />
                Detalle de CAPEX (Items adicionales)
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addBreakdownItem}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar Item
              </Button>
            </div>

            {(!space.breakdown || space.breakdown.length === 0) ? (
              <Card className="p-6 text-center bg-muted/30">
                <Package className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">
                  No hay items adicionales en el breakdown
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Agrega mobiliario, equipos u otros componentes del CAPEX
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {/* Header de la tabla */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-3 py-2 bg-muted/50 rounded-t">
                  <div className="col-span-5">Descripción</div>
                  <div className="col-span-2 text-center">Cantidad</div>
                  <div className="col-span-2 text-right">Precio Unit.</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-1"></div>
                </div>
                
                {/* Items */}
                {space.breakdown.map((item, idx) => (
                  <Card key={idx} className="p-3 bg-muted/30">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input
                          placeholder="Ej: Escritorios ejecutivos"
                          value={item.item}
                          onChange={(e) => updateBreakdownItem(idx, 'item', e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.cantidad}
                          onChange={(e) => updateBreakdownItem(idx, 'cantidad', Number(e.target.value))}
                          className="text-center bg-background"
                        />
                      </div>
                      <div className="col-span-2">
                        <CurrencyInput
                          value={item.precioUnitario || 0}
                          onChange={(value) => updateBreakdownItem(idx, 'precioUnitario', value)}
                          currency={currency}
                          className="bg-background"
                        />
                      </div>
                      <div className="col-span-2 text-right font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency((item.cantidad || 0) * (item.precioUnitario || 0), currency)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBreakdownItem(idx)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {/* Subtotal breakdown */}
                {space.breakdown.length > 0 && (
                  <div className="flex justify-end px-3 py-2 text-sm">
                    <span className="text-muted-foreground mr-2">Subtotal Items:</span>
                    <span className="font-semibold">{formatCurrency(breakdownTotal, currency)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Resumen del espacio */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-4">
              <div className="space-y-2">
                {areaCapex > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CAPEX por m² ({space.area}m² × {formatCurrency(space.capex_por_m2, currency)}):</span>
                    <span>{formatCurrency(areaCapex, currency)}</span>
                  </div>
                )}
                {breakdownTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items del breakdown ({space.breakdown?.length || 0} items):</span>
                    <span>{formatCurrency(breakdownTotal, currency)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">CAPEX Total {space.name}:</span>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(capexTotal, currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      )}
    </Card>
  );
};
