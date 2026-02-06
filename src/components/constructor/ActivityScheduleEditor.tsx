import { useState } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActivityConfig, ActivitySchedule, ActivityCalculations, generateId } from '@/types/activity';
import { CurrencyCode } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface ActivityScheduleEditorProps {
  config: ActivityConfig;
  onUpdate: (updates: Partial<ActivityConfig>) => void;
  currency: string;
  calculations: ActivityCalculations;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ActivityScheduleEditor({ 
  config, 
  onUpdate, 
  currency,
  calculations 
}: ActivityScheduleEditorProps) {
  const [activeTab, setActiveTab] = useState<'LV' | 'SD'>('LV');

  const schedulesByDay = {
    LV: config.horarios.filter((h) => h.diaSemana === 'LV' || !h.diaSemana),
    SD: config.horarios.filter((h) => h.diaSemana === 'SD'),
  };

  const addSchedule = () => {
    const newSchedule: ActivitySchedule = {
      id: generateId(),
      nombre: 'Nuevo Horario',
      inicio: 8,
      fin: 12,
      tarifa: 100000,
      tipo: 'valle',
      ocupacion: 50,
      diaSemana: activeTab,
    };
    onUpdate({
      horarios: [...config.horarios, newSchedule],
    });
  };

  const updateSchedule = (id: string, updates: Partial<ActivitySchedule>) => {
    onUpdate({
      horarios: config.horarios.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      ),
    });
  };

  const deleteSchedule = (id: string) => {
    onUpdate({
      horarios: config.horarios.filter((h) => h.id !== id),
    });
  };

  const currentSchedules = schedulesByDay[activeTab];

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          2. Horarios y Tarifas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'LV' | 'SD')}>
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
            <TabsTrigger value="LV">Lunes - Viernes</TabsTrigger>
            <TabsTrigger value="SD">Sábado - Domingo</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {currentSchedules.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  No hay horarios definidos para {activeTab === 'LV' ? 'días entre semana' : 'fines de semana'}
                </p>
                <Button onClick={addSchedule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Horario
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {currentSchedules.map((schedule, index) => (
                  <div 
                    key={schedule.id} 
                    className={cn(
                      "border rounded-lg p-4 space-y-4",
                      schedule.tipo === 'pico' 
                        ? "border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20" 
                        : "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Horario {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSchedule(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                          value={schedule.nombre}
                          onChange={(e) => updateSchedule(schedule.id, { nombre: e.target.value })}
                          placeholder="Ej: Mañana"
                        />
                      </div>

                      {/* Start Time */}
                      <div className="space-y-2">
                        <Label>Inicio</Label>
                        <Select
                          value={schedule.inicio.toString()}
                          onValueChange={(v) => updateSchedule(schedule.id, { inicio: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURS.map((h) => (
                              <SelectItem key={h} value={h.toString()}>
                                {h.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* End Time */}
                      <div className="space-y-2">
                        <Label>Fin</Label>
                        <Select
                          value={schedule.fin.toString()}
                          onValueChange={(v) => updateSchedule(schedule.id, { fin: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURS.filter((h) => h > schedule.inicio).map((h) => (
                              <SelectItem key={h} value={h.toString()}>
                                {h.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Rate */}
                      <div className="space-y-2">
                        <Label>Tarifa por Reserva</Label>
                        <CurrencyInput
                          value={schedule.tarifa}
                          onChange={(value) => updateSchedule(schedule.id, { tarifa: value })}
                          currency={currency as CurrencyCode}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Type */}
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <RadioGroup
                          value={schedule.tipo}
                          onValueChange={(v: 'pico' | 'valle') => updateSchedule(schedule.id, { tipo: v })}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pico" id={`pico-${schedule.id}`} />
                            <Label htmlFor={`pico-${schedule.id}`} className="font-normal cursor-pointer text-orange-600">
                              Pico
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="valle" id={`valle-${schedule.id}`} />
                            <Label htmlFor={`valle-${schedule.id}`} className="font-normal cursor-pointer text-blue-600">
                              Valle
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Occupation Slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Ocupación Esperada</Label>
                          <span className="text-sm font-medium">{schedule.ocupacion}%</span>
                        </div>
                        <Slider
                          value={[schedule.ocupacion]}
                          onValueChange={([value]) => updateSchedule(schedule.id, { ocupacion: value })}
                          min={0}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addSchedule} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Horario
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Summary */}
        {config.horarios.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 mt-4 space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              📊 Resumen Automático
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Horas Pico (por unidad):</span>
                <span className="ml-1 font-medium text-orange-600">
                  {calculations.totalHorasPico.toFixed(1)} hrs/sem ({calculations.porcentajePico.toFixed(0)}%)
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Horas Valle (por unidad):</span>
                <span className="ml-1 font-medium text-blue-600">
                  {calculations.totalHorasValle.toFixed(1)} hrs/sem ({calculations.porcentajeValle.toFixed(0)}%)
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Tarifa Promedio:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(calculations.tarifaPromedio, currency as CurrencyCode)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Turnos por día:</span>
                <span className="ml-2 font-medium">
                  {calculations.turnosPorDia.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Ingresos Base:</span>
                <span className="ml-2 font-medium text-primary">
                  {formatCurrency(calculations.ingresosMensualesBase, currency as CurrencyCode)}/mes
                </span>
              </div>
            </div>
            
            {/* CRITICAL: Weighted average occupation - the key metric */}
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ocupación Promedio Ponderada:</span>
                <span className="text-lg font-bold text-primary">
                  {calculations.ocupacionPromedio.toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ✨ Esta es tu ocupación <strong>OBJETIVO</strong> (100% madurez del proyecto).
                En la proyección mensual verás cómo el proyecto arranca al 70% y crece hasta alcanzar este objetivo.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
