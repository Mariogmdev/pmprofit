import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types';
import { ProjectActivity, ActivityConfig } from '@/types/activity';
import { ChevronDown, ChevronRight, Landmark } from 'lucide-react';

interface CapexByActivityCardProps {
  activities: ProjectActivity[];
  currency: CurrencyCode;
}

interface ActivityCapexRow {
  nombre: string;
  icon: string;
  cantidad: number;
  capexUnitario: number;
  capexTotal: number;
  breakdown: {
    construccion: number;
    equipamiento: number;
    mobiliario: number;
    consumibles: number;
  };
}

function calculateCapexByActivity(activities: ProjectActivity[]): ActivityCapexRow[] {
  return activities
    .map((activity) => {
      const config: ActivityConfig = activity.config as ActivityConfig;
      const cantidad = config.cantidad || 1;

      // Construction cost per unit based on cover type
      const tipoCubierta = config.tipoCubierta || 'cubierta';
      const capexConstruccionUnit =
        tipoCubierta === 'cubierta'
          ? config.capexCubierta || 0
          : tipoCubierta === 'semicubierta'
            ? config.capexSemicubierta || 0
            : config.capexAireLibre || 0;

      const equipamiento = (config.equipamientoEspecifico || []).reduce(
        (s, i) => s + (i.cantidad || 0) * (i.precioUnitario || 0),
        0
      );
      const consumibles = (config.consumibles || []).reduce(
        (s, i) => s + (i.cantidad || 0) * (i.precioUnitario || 0),
        0
      );
      const mobiliario = (config.mobiliario || []).reduce(
        (s, i) => s + (i.cantidad || 0) * (i.precioUnitario || 0),
        0
      );

      const capexUnitario = capexConstruccionUnit + equipamiento + consumibles + mobiliario;
      const capexTotal = capexConstruccionUnit * cantidad + equipamiento + consumibles + mobiliario;

      return {
        nombre: activity.name,
        icon: (activity as any).icon || '🏢',
        cantidad,
        capexUnitario,
        capexTotal,
        breakdown: {
          construccion: capexConstruccionUnit * cantidad,
          equipamiento,
          mobiliario,
          consumibles,
        },
      };
    })
    .sort((a, b) => b.capexTotal - a.capexTotal);
}

export function CapexByActivityCard({ activities, currency }: CapexByActivityCardProps) {
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  const rows = useMemo(() => calculateCapexByActivity(activities), [activities]);
  const total = rows.reduce((s, r) => s + r.capexTotal, 0);

  if (rows.length === 0 || total === 0) return null;

  return (
    <Card className="border-2 mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Landmark className="w-5 h-5 text-primary" />
          Inversión por Actividad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actividad</TableHead>
                <TableHead className="text-center w-[60px]">Cant.</TableHead>
                <TableHead className="text-right">CAPEX/unidad</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right w-[70px]">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => {
                const pct = total > 0 ? (item.capexTotal / total) * 100 : 0;
                const isExpanded = expandedActivity === item.nombre;
                return (
                  <TableRow
                    key={item.nombre}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedActivity(isExpanded ? null : item.nombre)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium">{item.nombre}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      {isExpanded && (
                        <div className="mt-2 ml-8 space-y-1 text-xs text-muted-foreground">
                          {item.breakdown.construccion > 0 && (
                            <div className="flex justify-between max-w-xs">
                              <span>Construcción</span>
                              <span className="font-mono">{formatCurrency(item.breakdown.construccion, currency)}</span>
                            </div>
                          )}
                          {item.breakdown.equipamiento > 0 && (
                            <div className="flex justify-between max-w-xs">
                              <span>Equipamiento</span>
                              <span className="font-mono">{formatCurrency(item.breakdown.equipamiento, currency)}</span>
                            </div>
                          )}
                          {item.breakdown.mobiliario > 0 && (
                            <div className="flex justify-between max-w-xs">
                              <span>Mobiliario</span>
                              <span className="font-mono">{formatCurrency(item.breakdown.mobiliario, currency)}</span>
                            </div>
                          )}
                          {item.breakdown.consumibles > 0 && (
                            <div className="flex justify-between max-w-xs">
                              <span>Consumibles</span>
                              <span className="font-mono">{formatCurrency(item.breakdown.consumibles, currency)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono">{item.cantidad}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.capexUnitario, currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrency(item.capexTotal, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {pct.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Total row */}
              <TableRow className="border-t-2 font-semibold">
                <TableCell colSpan={3}>TOTAL ACTIVIDADES</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(total, currency)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="default" className="text-xs font-mono">100%</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
