import { GraduationCap, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ActivityConfig, 
  ClassesConfig,
  DEFAULT_CLASSES_CONFIG,
  ClassPaymentModel,
  TeacherPaymentModel 
} from '@/types/activity';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types';

interface ActivityClassesEditorProps {
  config: ActivityConfig;
  onUpdate: (updates: Partial<ActivityConfig>) => void;
  currency: string;
  daysPerMonth: number;
}

export default function ActivityClassesEditor({ 
  config, 
  onUpdate, 
  currency,
  daysPerMonth 
}: ActivityClassesEditorProps) {
  const classesConfig = config.configuracionClases || DEFAULT_CLASSES_CONFIG;
  
  const updateClasses = (updates: Partial<ClassesConfig>) => {
    onUpdate({
      configuracionClases: { ...classesConfig, ...updates },
    });
  };

  // Calculate class hours per day
  const horasClasesDia = classesConfig.clasesPorDia * classesConfig.duracionClase;
  
  // Calculate total available hours from schedules
  const totalHorasDisponibles = config.horarios.reduce((sum, h) => sum + (h.fin - h.inicio), 0);
  
  // Warning if classes exceed available hours
  const excedeHoras = horasClasesDia > totalHorasDisponibles && totalHorasDisponibles > 0;

  // Calculate incomes
  const clasesMes = classesConfig.clasesPorDia * daysPerMonth * config.cantidad;
  
  let ingresosClases = 0;
  if (classesConfig.modeloCobro === 'por-alumno') {
    const alumnosReales = classesConfig.alumnosPorClase * (classesConfig.ocupacionClase / 100);
    ingresosClases = clasesMes * alumnosReales * classesConfig.precioAlumno;
  } else {
    ingresosClases = clasesMes * classesConfig.precioClase;
  }

  // Calculate teacher costs
  let costoProfesores = 0;
  if (classesConfig.modeloProfesor === 'fijo') {
    costoProfesores = classesConfig.cantidadProfesores * classesConfig.salarioProfesor;
  } else {
    costoProfesores = clasesMes * classesConfig.pagoClase;
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          Clases / Entrenamientos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <Label className="text-sm font-medium">Ofrecer Clases/Entrenamientos</Label>
            <p className="text-xs text-muted-foreground">
              Ingresos adicionales por clases grupales o personalizadas
            </p>
          </div>
          <Switch
            checked={config.tieneClases}
            onCheckedChange={(checked) => {
              onUpdate({
                tieneClases: checked,
                configuracionClases: checked ? DEFAULT_CLASSES_CONFIG : undefined,
              });
            }}
          />
        </div>

        {config.tieneClases && (
          <div className="space-y-6 pt-2">
            {/* Basic Class Config */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Clases Diarias (por unidad)</Label>
                <Input
                  type="number"
                  min={0}
                  value={classesConfig.clasesPorDia}
                  onChange={(e) => updateClasses({ clasesPorDia: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Duración Clase (hrs)</Label>
                <Input
                  type="number"
                  min={0.5}
                  max={4}
                  step={0.5}
                  value={classesConfig.duracionClase}
                  onChange={(e) => updateClasses({ duracionClase: parseFloat(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Alumnos por Clase</Label>
                <Input
                  type="number"
                  min={1}
                  value={classesConfig.alumnosPorClase}
                  onChange={(e) => updateClasses({ alumnosPorClase: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            {/* Payment Model */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Modelo de Cobro</Label>
              <RadioGroup
                value={classesConfig.modeloCobro}
                onValueChange={(value: ClassPaymentModel) => updateClasses({ modeloCobro: value })}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="por-alumno" id="por-alumno" />
                  <Label htmlFor="por-alumno" className="font-normal cursor-pointer">
                    Por Alumno (precio individual)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="por-clase" id="por-clase" />
                  <Label htmlFor="por-clase" className="font-normal cursor-pointer">
                    Por Clase Completa (precio fijo)
                  </Label>
                </div>
              </RadioGroup>

              {classesConfig.modeloCobro === 'por-alumno' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-xs">Precio por Alumno</Label>
                    <Input
                      type="number"
                      min={0}
                      value={classesConfig.precioAlumno}
                      onChange={(e) => updateClasses({ precioAlumno: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Ocupación Promedio Clase (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={classesConfig.ocupacionClase}
                      onChange={(e) => updateClasses({ ocupacionClase: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      De {classesConfig.alumnosPorClase} cupos disponibles
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-2 max-w-xs">
                    <Label className="text-xs">Precio por Clase</Label>
                    <Input
                      type="number"
                      min={0}
                      value={classesConfig.precioClase}
                      onChange={(e) => updateClasses({ precioClase: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Teacher Cost Model */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Costo Profesor</Label>
              <RadioGroup
                value={classesConfig.modeloProfesor}
                onValueChange={(value: TeacherPaymentModel) => updateClasses({ modeloProfesor: value })}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fijo" id="prof-fijo" />
                  <Label htmlFor="prof-fijo" className="font-normal cursor-pointer">
                    Salario Fijo Mensual
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="por-clase" id="prof-clase" />
                  <Label htmlFor="prof-clase" className="font-normal cursor-pointer">
                    Pago por Clase
                  </Label>
                </div>
              </RadioGroup>

              {classesConfig.modeloProfesor === 'fijo' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-xs">Salario Profesor /mes</Label>
                    <Input
                      type="number"
                      min={0}
                      value={classesConfig.salarioProfesor}
                      onChange={(e) => updateClasses({ salarioProfesor: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Cantidad Profesores</Label>
                    <Input
                      type="number"
                      min={1}
                      value={classesConfig.cantidadProfesores}
                      onChange={(e) => updateClasses({ cantidadProfesores: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-2 max-w-xs">
                    <Label className="text-xs">Pago por Clase</Label>
                    <Input
                      type="number"
                      min={0}
                      value={classesConfig.pagoClase}
                      onChange={(e) => updateClasses({ pagoClase: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Total: {clasesMes} clases × {formatCurrency(classesConfig.pagoClase, currency as CurrencyCode)} = {formatCurrency(costoProfesores, currency as CurrencyCode)}/mes
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Selection for Classes */}
            {config.horarios.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Horarios de Clases</Label>
                <p className="text-xs text-muted-foreground">
                  Selecciona en qué horarios se impartirán las clases
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {config.horarios.map((horario) => (
                    <div key={horario.id} className="flex items-center space-x-2 p-2 bg-muted/30 rounded">
                      <Checkbox
                        id={`clase-${horario.id}`}
                        checked={classesConfig.horariosClases.includes(horario.id)}
                        onCheckedChange={(checked) => {
                          const newHorarios = checked
                            ? [...classesConfig.horariosClases, horario.id]
                            : classesConfig.horariosClases.filter(id => id !== horario.id);
                          updateClasses({ horariosClases: newHorarios });
                        }}
                      />
                      <Label htmlFor={`clase-${horario.id}`} className="text-sm cursor-pointer">
                        {horario.nombre || `${horario.inicio}:00-${horario.fin}:00`}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning if classes exceed available hours */}
            {excedeHoras && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ Las horas de clases ({horasClasesDia} hrs/día) exceden las horas disponibles ({totalHorasDisponibles} hrs/día). 
                  Estas horas NO estarán disponibles para reservas normales.
                </AlertDescription>
              </Alert>
            )}

            {/* Summary */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
              <h4 className="font-medium text-sm">📊 Resumen Clases</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Clases/mes:</span>
                  <span className="font-medium ml-2">{clasesMes}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Horas clases/día:</span>
                  <span className="font-medium ml-2">{horasClasesDia} hrs</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ingresos clases:</span>
                  <span className="font-medium ml-2 text-green-600">
                    {formatCurrency(ingresosClases, currency as CurrencyCode)}/mes
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Costo profesores:</span>
                  <span className="font-medium ml-2 text-orange-600">
                    {formatCurrency(costoProfesores, currency as CurrencyCode)}/mes
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">Margen clases:</span>
                <span className="font-semibold ml-2 text-primary">
                  {formatCurrency(ingresosClases - costoProfesores, currency as CurrencyCode)}/mes
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}