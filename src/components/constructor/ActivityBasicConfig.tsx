import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActivityConfig, RevenueModel } from '@/types/activity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

interface ActivityBasicConfigProps {
  config: ActivityConfig;
  onUpdate: (updates: Partial<ActivityConfig>) => void;
}

const UNIT_TYPES = ['Cancha', 'Espacio', 'Sala', 'Puesto', 'Cabina', 'Unidad'];
const DURATION_OPTIONS = [0.5, 1, 1.5, 2];

export default function ActivityBasicConfig({ config, onUpdate }: ActivityBasicConfigProps) {
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

          {/* Players per Reservation */}
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
        </div>

        {/* Revenue Model */}
        <div className="space-y-3">
          <Label>Modelo de Ingresos</Label>
          <RadioGroup
            value={config.modeloIngreso}
            onValueChange={(value: RevenueModel) => onUpdate({ modeloIngreso: value })}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="reserva" id="reserva" />
              <Label htmlFor="reserva" className="font-normal cursor-pointer">
                Por Reserva/Hora
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="membresia" id="membresia" />
              <Label htmlFor="membresia" className="font-normal cursor-pointer">
                Membresía Mensual
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pase-diario" id="pase-diario" />
              <Label htmlFor="pase-diario" className="font-normal cursor-pointer">
                Pase Diario
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mixto" id="mixto" />
              <Label htmlFor="mixto" className="font-normal cursor-pointer">
                Mixto
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Duration (only for reservation model) */}
        {(config.modeloIngreso === 'reserva' || config.modeloIngreso === 'mixto') && (
          <div className="space-y-3">
            <Label>Duración de Reserva</Label>
            <RadioGroup
              value={config.duracionReserva.toString()}
              onValueChange={(value) => onUpdate({ duracionReserva: parseFloat(value) })}
              className="flex flex-wrap gap-4"
            >
              {DURATION_OPTIONS.map((duration) => (
                <div key={duration} className="flex items-center space-x-2">
                  <RadioGroupItem value={duration.toString()} id={`duration-${duration}`} />
                  <Label htmlFor={`duration-${duration}`} className="font-normal cursor-pointer">
                    {duration} {duration === 1 ? 'hora' : 'horas'}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
