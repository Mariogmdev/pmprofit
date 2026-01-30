import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActivityConfig } from '@/types/activity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

interface ActivityBasicConfigProps {
  config: ActivityConfig;
  onUpdate: (updates: Partial<ActivityConfig>) => void;
}

const UNIT_TYPES = ['Cancha', 'Espacio', 'Sala', 'Puesto', 'Cabina', 'Unidad', 'Mesa', 'Local'];

export default function ActivityBasicConfig({ config, onUpdate }: ActivityBasicConfigProps) {
  // Show players per reservation only for reservation model
  const showPlayersPerReservation = config.modeloIngreso === 'reserva' || config.modeloIngreso === 'mixto';

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          1. Configuración Básica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad de Unidades</Label>
            <Input
              id="cantidad"
              type="number"
              min={1}
              value={config.cantidad}
              onChange={(e) => onUpdate({ cantidad: parseInt(e.target.value) || 1 })}
            />
          </div>

          {/* Unit Type */}
          <div className="space-y-2">
            <Label htmlFor="tipoUnidad">Tipo de Unidad</Label>
            <Select
              value={config.tipoUnidad}
              onValueChange={(value) => onUpdate({ tipoUnidad: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {UNIT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Area per Unit */}
          <div className="space-y-2">
            <Label htmlFor="areaPorUnidad">Área por Unidad (m²)</Label>
            <Input
              id="areaPorUnidad"
              type="number"
              min={0}
              value={config.areaPorUnidad || ''}
              onChange={(e) => onUpdate({ areaPorUnidad: parseFloat(e.target.value) || 0 })}
              placeholder="Opcional"
            />
          </div>

          {/* Players per Reservation - Only show for relevant models */}
          {showPlayersPerReservation && (
            <div className="space-y-2">
              <Label htmlFor="jugadores">Usuarios por Reserva</Label>
              <Input
                id="jugadores"
                type="number"
                min={1}
                value={config.jugadoresPorReserva}
                onChange={(e) => onUpdate({ jugadoresPorReserva: parseInt(e.target.value) || 1 })}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
