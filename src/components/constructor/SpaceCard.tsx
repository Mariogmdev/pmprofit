import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ProjectSpace, SPACE_TEMPLATES, BreakdownItem } from '@/types/infrastructure';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types/index';
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
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

  const capexTotal = useMemo(() => {
    const breakdownTotal = space.breakdown.reduce(
      (sum, item) => sum + (item.cantidad * item.precioUnitario),
      0
    );
    const areaTotal = space.area * (space.capex_por_m2 || 0);
    return breakdownTotal + areaTotal;
  }, [space.breakdown, space.area, space.capex_por_m2]);

  const updateBreakdownItem = (idx: number, field: keyof BreakdownItem, value: string | number) => {
    const newBreakdown = [...space.breakdown];
    newBreakdown[idx] = { ...newBreakdown[idx], [field]: value };
    onUpdate(space.id, { breakdown: newBreakdown });
  };

  const addBreakdownItem = () => {
    const newBreakdown = [
      ...space.breakdown,
      { item: '', cantidad: 1, precioUnitario: 0 }
    ];
    onUpdate(space.id, { breakdown: newBreakdown });
  };

  const removeBreakdownItem = (idx: number) => {
    const newBreakdown = space.breakdown.filter((_, i) => i !== idx);
    onUpdate(space.id, { breakdown: newBreakdown });
  };

  return (
    <Card className={cn('border-2 transition-colors', isExpanded && 'border-purple-200')}>
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h4 className="font-semibold">{space.name}</h4>
            <p className="text-sm text-muted-foreground">
              {space.area} m² • {formatCurrency(capexTotal, currency)} CAPEX
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(space.id);
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
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
        <CardContent className="space-y-6 pt-0">
          <Separator />

          {/* Configuración básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre del Espacio</Label>
              <Input
                value={space.name}
                onChange={(e) => onUpdate(space.id, { name: e.target.value })}
              />
            </div>
            <div>
              <Label>Área (m²)</Label>
              <Input
                type="number"
                value={space.area}
                onChange={(e) => onUpdate(space.id, { area: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* CAPEX por m² opcional */}
          <div>
            <Label>CAPEX por m² (opcional, para mobiliario/acabados base)</Label>
            <Input
              type="number"
              value={space.capex_por_m2}
              onChange={(e) => onUpdate(space.id, { capex_por_m2: Number(e.target.value) })}
              placeholder="Ej: 500,000"
            />
            {space.capex_por_m2 > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                → CAPEX base: {formatCurrency(space.area * space.capex_por_m2, currency)}
              </p>
            )}
          </div>

          {/* CAPEX Breakdown */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              💰 Detalle de CAPEX (Items adicionales)
            </Label>
            <div className="space-y-3">
              {space.breakdown.map((item, idx) => (
                <Card key={idx} className="p-3 bg-muted/50">
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      placeholder="Descripción"
                      value={item.item}
                      onChange={(e) => updateBreakdownItem(idx, 'item', e.target.value)}
                      className="flex-1 min-w-[150px]"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Cant"
                        value={item.cantidad}
                        onChange={(e) => updateBreakdownItem(idx, 'cantidad', Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-muted-foreground">×</span>
                      <Input
                        type="number"
                        placeholder="Precio"
                        value={item.precioUnitario}
                        onChange={(e) => updateBreakdownItem(idx, 'precioUnitario', Number(e.target.value))}
                        className="w-32"
                      />
                      <span className="font-medium w-28 text-right">
                        {formatCurrency(item.cantidad * item.precioUnitario, currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBreakdownItem(idx)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={addBreakdownItem}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Item
              </Button>
            </div>
          </div>

          {/* Resumen */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">CAPEX Total {space.name}:</span>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(capexTotal, currency)}
                </span>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      )}
    </Card>
  );
};
