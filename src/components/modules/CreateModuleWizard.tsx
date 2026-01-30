import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, Trash2 } from 'lucide-react';
import { ModuleData, ModuleCategory, ModuleType, MODULE_CATEGORIES, MODULE_TYPES, ModuleSchedule, ModuleDefaultConfig } from '@/types';
import { formatCurrency } from '@/lib/currency';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';


interface CreateModuleWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (data: Partial<ModuleData>) => void;
}

interface WizardFormData {
  // Step 1
  name: string;
  category: ModuleCategory | '';
  type: ModuleType | '';
  icon: string;
  description: string;
  // Step 2
  cantidad: number;
  duracionReserva: number;
  jugadoresPorReserva: number;
  tipoCubierta: 'cubierta' | 'semicubierta' | 'aire-libre';
  // Step 3
  capexCubierta: number;
  capexSemicubierta: number;
  capexAireLibre: number;
  // Step 4
  horarios: ModuleSchedule[];
  // Step 5
  isPublic: boolean;
}

const DURATION_OPTIONS = [0.5, 1, 1.5, 2];
const COVER_OPTIONS = [
  { value: 'cubierta', label: 'Cubierta' },
  { value: 'semicubierta', label: 'Semicubierta' },
  { value: 'aire-libre', label: 'Aire Libre' },
];

const initialFormData: WizardFormData = {
  name: '',
  category: '',
  type: '',
  icon: '📦',
  description: '',
  cantidad: 1,
  duracionReserva: 1,
  jugadoresPorReserva: 4,
  tipoCubierta: 'cubierta',
  capexCubierta: 0,
  capexSemicubierta: 0,
  capexAireLibre: 0,
  horarios: [],
  isPublic: false,
};

export default function CreateModuleWizard({
  open,
  onOpenChange,
  onSuccess,
}: CreateModuleWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 5;

  const resetForm = () => {
    setFormData(initialFormData);
    setStep(1);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!formData.name || formData.name.length < 3) {
          newErrors.name = 'El nombre debe tener al menos 3 caracteres';
        }
        if (!formData.category) {
          newErrors.category = 'Selecciona una categoría';
        }
        if (!formData.type) {
          newErrors.type = 'Selecciona un tipo';
        }
        if (!formData.icon) {
          newErrors.icon = 'Ingresa un icono (emoji)';
        }
        break;
      case 2:
        if (formData.cantidad < 1) {
          newErrors.cantidad = 'La cantidad debe ser mayor a 0';
        }
        if (formData.type === 'actividad' && formData.jugadoresPorReserva < 1) {
          newErrors.jugadoresPorReserva = 'Debe ser mayor a 0';
        }
        break;
      case 3:
        if (formData.capexCubierta <= 0 && formData.capexSemicubierta <= 0 && formData.capexAireLibre <= 0) {
          newErrors.capex = 'Al menos un CAPEX debe ser mayor a 0';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    const moduleData: Partial<ModuleData> = {
      name: formData.name,
      category: formData.category as ModuleCategory,
      type: formData.type as ModuleType,
      icon: formData.icon,
      description: formData.description,
      is_public: formData.isPublic,
      default_config: {
        cantidad: formData.cantidad,
        duracionReserva: formData.type === 'actividad' ? formData.duracionReserva : undefined,
        jugadoresPorReserva: formData.type === 'actividad' ? formData.jugadoresPorReserva : undefined,
        tipoCubierta: formData.tipoCubierta,
        capexCubierta: formData.capexCubierta || undefined,
        capexSemicubierta: formData.capexSemicubierta || undefined,
        capexAireLibre: formData.capexAireLibre || undefined,
        horarios: formData.horarios.length > 0 ? formData.horarios : undefined,
      },
    };

    onSuccess(moduleData);
    resetForm();
  };

  const addSchedule = () => {
    setFormData((prev) => ({
      ...prev,
      horarios: [
        ...prev.horarios,
        { inicio: 8, fin: 12, nombre: '', tarifa: 0, tipo: 'valle' as const },
      ],
    }));
  };

  const removeSchedule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      horarios: prev.horarios.filter((_, i) => i !== index),
    }));
  };

  const updateSchedule = (index: number, field: keyof ModuleSchedule, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      horarios: prev.horarios.map((h, i) =>
        i === index ? { ...h, [field]: value } : h
      ),
    }));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i + 1 <= step ? 'bg-primary' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre del Módulo *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ej: Cancha de Pádel Premium"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="category">Categoría *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value as ModuleCategory }))}
        >
          <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {MODULE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
      </div>

      <div>
        <Label>Tipo *</Label>
        <RadioGroup
          value={formData.type}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as ModuleType }))}
          className="mt-2 space-y-2"
        >
          {MODULE_TYPES.map((type) => (
            <div key={type.id} className="flex items-start gap-2">
              <RadioGroupItem value={type.id} id={`type-${type.id}`} />
              <div>
                <Label htmlFor={`type-${type.id}`} className="cursor-pointer font-medium">
                  {type.label}
                </Label>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
        {errors.type && <p className="text-sm text-destructive mt-1">{errors.type}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="icon">Icono (emoji) *</Label>
          <Input
            id="icon"
            value={formData.icon}
            onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
            placeholder="🎾"
            className={`text-2xl ${errors.icon ? 'border-destructive' : ''}`}
            maxLength={4}
          />
          {errors.icon && <p className="text-sm text-destructive mt-1">{errors.icon}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Descripción breve del módulo..."
          maxLength={200}
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {formData.description.length}/200 caracteres
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cantidad">Cantidad típica de unidades</Label>
        <Input
          id="cantidad"
          type="number"
          min={1}
          value={formData.cantidad}
          onChange={(e) => setFormData((prev) => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
          placeholder="Ej: 4 canchas, 40 puestos"
          className={errors.cantidad ? 'border-destructive' : ''}
        />
        {errors.cantidad && <p className="text-sm text-destructive mt-1">{errors.cantidad}</p>}
      </div>

      {formData.type === 'actividad' && (
        <>
          <div>
            <Label>Duración típica de reserva</Label>
            <RadioGroup
              value={formData.duracionReserva.toString()}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, duracionReserva: parseFloat(value) }))}
              className="flex flex-wrap gap-4 mt-2"
            >
              {DURATION_OPTIONS.map((duration) => (
                <div key={duration} className="flex items-center gap-2">
                  <RadioGroupItem value={duration.toString()} id={`duration-${duration}`} />
                  <Label htmlFor={`duration-${duration}`} className="cursor-pointer">
                    {duration} hrs
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="jugadores">Jugadores/usuarios por reserva</Label>
            <Input
              id="jugadores"
              type="number"
              min={1}
              value={formData.jugadoresPorReserva}
              onChange={(e) => setFormData((prev) => ({ ...prev, jugadoresPorReserva: parseInt(e.target.value) || 1 }))}
              className={errors.jugadoresPorReserva ? 'border-destructive' : ''}
            />
            {errors.jugadoresPorReserva && (
              <p className="text-sm text-destructive mt-1">{errors.jugadoresPorReserva}</p>
            )}
          </div>
        </>
      )}

      <div>
        <Label>Tipo de cubierta más común</Label>
        <RadioGroup
          value={formData.tipoCubierta}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, tipoCubierta: value as typeof formData.tipoCubierta }))}
          className="flex flex-wrap gap-4 mt-2"
        >
          {COVER_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem value={option.value} id={`cover-${option.value}`} />
              <Label htmlFor={`cover-${option.value}`} className="cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        💡 Estos valores se usarán como default al agregar este módulo a un proyecto.
      </p>

      {errors.capex && (
        <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{errors.capex}</p>
      )}

      <div>
        <Label htmlFor="capexCubierta">CAPEX Cubierta</Label>
        <Input
          id="capexCubierta"
          type="number"
          min={0}
          value={formData.capexCubierta || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, capexCubierta: parseInt(e.target.value) || 0 }))}
          placeholder="0"
        />
        {formData.capexCubierta > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(formData.capexCubierta, 'COP')}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="capexSemicubierta">CAPEX Semicubierta</Label>
        <Input
          id="capexSemicubierta"
          type="number"
          min={0}
          value={formData.capexSemicubierta || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, capexSemicubierta: parseInt(e.target.value) || 0 }))}
          placeholder="0"
        />
        {formData.capexSemicubierta > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(formData.capexSemicubierta, 'COP')}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="capexAireLibre">CAPEX Aire Libre</Label>
        <Input
          id="capexAireLibre"
          type="number"
          min={0}
          value={formData.capexAireLibre || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, capexAireLibre: parseInt(e.target.value) || 0 }))}
          placeholder="0"
        />
        {formData.capexAireLibre > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(formData.capexAireLibre, 'COP')}
          </p>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Define horarios típicos para este tipo de actividad (opcional):
      </p>

      <div className="space-y-4">
        {formData.horarios.map((horario, index) => (
          <div key={index} className="p-4 border border-border rounded-lg space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Horario {index + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSchedule(index)}
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <Label>Nombre</Label>
              <Input
                value={horario.nombre}
                onChange={(e) => updateSchedule(index, 'nombre', e.target.value)}
                placeholder="Ej: Madrugada, Mañana, Noche..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Inicio</Label>
                <Select
                  value={horario.inicio.toString()}
                  onValueChange={(value) => updateSchedule(index, 'inicio', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fin</Label>
                <Select
                  value={horario.fin.toString()}
                  onValueChange={(value) => updateSchedule(index, 'fin', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tarifa</Label>
                <Input
                  type="number"
                  min={0}
                  value={horario.tarifa || ''}
                  onChange={(e) => updateSchedule(index, 'tarifa', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <RadioGroup
                  value={horario.tipo}
                  onValueChange={(value) => updateSchedule(index, 'tipo', value as 'pico' | 'valle')}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="pico" id={`tipo-pico-${index}`} />
                    <Label htmlFor={`tipo-pico-${index}`} className="cursor-pointer">Pico</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="valle" id={`tipo-valle-${index}`} />
                    <Label htmlFor={`tipo-valle-${index}`} className="cursor-pointer">Valle</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addSchedule} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Agregar Horario
      </Button>

      <Button variant="ghost" onClick={handleNext} className="w-full text-muted-foreground">
        Skip - Definir después
      </Button>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3">📋 Resumen</h4>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nombre:</span>
            <span className="font-medium">{formData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Categoría:</span>
            <span className="font-medium">
              {MODULE_CATEGORIES.find((c) => c.id === formData.category)?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tipo:</span>
            <span className="font-medium">
              {MODULE_TYPES.find((t) => t.id === formData.type)?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cantidad:</span>
            <span className="font-medium">{formData.cantidad} unidades</span>
          </div>
          {formData.capexCubierta > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">CAPEX cubierta:</span>
              <span className="font-medium">{formatCurrency(formData.capexCubierta, 'COP')}</span>
            </div>
          )}
          {formData.horarios.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Horarios:</span>
              <span className="font-medium">{formData.horarios.length} definidos</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="isPublic"
          checked={formData.isPublic}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublic: checked as boolean }))}
        />
        <div>
          <Label htmlFor="isPublic" className="cursor-pointer font-medium">
            Hacer este módulo público
          </Label>
          <p className="text-sm text-muted-foreground">
            Otros usuarios podrán usar este módulo en sus proyectos
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
        💡 Este módulo se guardará en "Mis Módulos" y podrás usarlo en cualquier proyecto.
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            Crear Nuevo Módulo - Paso {step} de {totalSteps}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {step === 1 && 'Información Básica'}
            {step === 2 && 'Configuración Básica'}
            {step === 3 && 'CAPEX'}
            {step === 4 && 'Horarios y Tarifas Típicas (Opcional)'}
            {step === 5 && 'Revisión y Opciones'}
          </p>
        </DialogHeader>

        {renderStepIndicator()}

        {/* Contenido con scroll - área principal scrolleable */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin">
          <div className="pb-2">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </div>
        </div>

        {/* Footer fijo */}
        <div className="flex-shrink-0 flex justify-between gap-3 pt-4 border-t bg-background">
          {step > 1 ? (
            <Button variant="outline" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {step < totalSteps ? (
            <Button onClick={handleNext}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              Crear Módulo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}