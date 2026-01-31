import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useProjectOpex } from '@/hooks/useProjectOpex';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types/index';
import { NominaItem, ServiceItem } from '@/types/opex';
import { ActivityConfig } from '@/types/activity';
import {
  Users, Home, Zap, Megaphone, Monitor, Shield, Wrench,
  FileText, MoreHorizontal, TrendingDown, Plus, X, DollarSign, Percent, TrendingUp, Info, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpexCategoriesProps {
  projectId: string;
  currency: CurrencyCode;
}

export const OpexCategories = ({ projectId, currency }: OpexCategoriesProps) => {
  const { opex, loading, updateOpex } = useProjectOpex(projectId);
  const { activities } = useProjectActivities();

  // Calculate payroll from activities
  const nominaActividades = useMemo(() => {
    return activities.reduce((sum, act) => {
      const config: ActivityConfig = act.config;
      const personal = config.personal || [];
      return sum + personal.reduce((s, p) => s + ((p.cantidad || 0) * (p.salarioMensual || 0)), 0);
    }, 0);
  }, [activities]);

  // Calculate maintenance from activities (annual cost / 12 for monthly)
  const mantenimientoActividades = useMemo(() => {
    return activities.reduce((sum, act) => {
      const config: ActivityConfig = act.config;
      const mantenimiento = config.mantenimiento || [];
      const costoAnual = mantenimiento.reduce((s, m) => s + (m.costoAnual || 0), 0);
      return sum + (costoAnual / 12);
    }, 0);
  }, [activities]);

  // Calculate monthly revenue from activities (using useActivityCalculations logic inline)
  const ingresosMensuales = useMemo(() => {
    // This is simplified - in real app would use the calculations hook
    // For now estimate based on config data
    return activities.reduce((sum, act) => {
      const config: ActivityConfig = act.config;
      // Rough estimate - actual calculation is complex
      const cantidad = config.cantidad || 1;
      const horarios = config.horarios || [];
      const tarifaPromedio = horarios.length > 0 
        ? horarios.reduce((s, h) => s + (h.tarifa || 0), 0) / horarios.length 
        : 0;
      const ocupacionPromedio = horarios.length > 0
        ? horarios.reduce((s, h) => s + (h.ocupacion || 0), 0) / horarios.length / 100
        : 0.5;
      const horasOperacion = horarios.reduce((s, h) => s + ((h.fin || 0) - (h.inicio || 0)), 0);
      const diasMes = 30;
      const ingresoEstimado = cantidad * tarifaPromedio * horasOperacion * ocupacionPromedio * diasMes / (config.duracionReserva || 1.5);
      return sum + ingresoEstimado;
    }, 0);
  }, [activities]);

  // Helper functions
  const calculateNominaBase = () => {
    const adminTotal = (opex?.nomina_administrativa || []).reduce(
      (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
    );
    const operativoTotal = (opex?.nomina_operativa || []).reduce(
      (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
    );
    return adminTotal + operativoTotal;
  };

  const calculatePrestaciones = () => {
    const base = calculateNominaBase() + nominaActividades;
    return base * ((opex?.prestaciones_porcentaje || 53.94) / 100);
  };

  const calculateNominaTotal = () => {
    return calculateNominaBase() + nominaActividades + calculatePrestaciones();
  };

  const calculateArrendamiento = () => {
    const modelo = opex?.arrendamiento_modelo || 'propio';
    if (modelo === 'propio') return 0;
    if (modelo === 'fijo') return opex?.arrendamiento_fijo || 0;
    if (modelo === 'variable') {
      return ingresosMensuales * ((opex?.arrendamiento_variable_porcentaje || 0) / 100);
    }
    if (modelo === 'mixto') {
      return (opex?.arrendamiento_mixto_fijo || 0) + 
             ingresosMensuales * ((opex?.arrendamiento_mixto_porcentaje || 0) / 100);
    }
    return 0;
  };

  const calculateCategoryTotal = (items: ServiceItem[]) => {
    return items.reduce((s, i) => s + (i.costoMensual || 0), 0);
  };

  // Handlers for editable lists
  const addNominaItem = (type: 'administrativa' | 'operativa') => {
    const field = type === 'administrativa' ? 'nomina_administrativa' : 'nomina_operativa';
    const current = opex?.[field] || [];
    updateOpex({ [field]: [...current, { cargo: '', cantidad: 1, salarioMensual: 0 }] });
  };

  const updateNominaItem = (type: 'administrativa' | 'operativa', index: number, updates: Partial<NominaItem>) => {
    const field = type === 'administrativa' ? 'nomina_administrativa' : 'nomina_operativa';
    const current = [...(opex?.[field] || [])];
    current[index] = { ...current[index], ...updates };
    updateOpex({ [field]: current });
  };

  const removeNominaItem = (type: 'administrativa' | 'operativa', index: number) => {
    const field = type === 'administrativa' ? 'nomina_administrativa' : 'nomina_operativa';
    const current = [...(opex?.[field] || [])];
    current.splice(index, 1);
    updateOpex({ [field]: current });
  };

  const addServiceItem = (field: keyof typeof opex) => {
    const current = (opex?.[field] as ServiceItem[]) || [];
    updateOpex({ [field]: [...current, { concepto: '', costoMensual: 0 }] });
  };

  const updateServiceItem = (field: keyof typeof opex, index: number, updates: Partial<ServiceItem>) => {
    const current = [...((opex?.[field] as ServiceItem[]) || [])];
    current[index] = { ...current[index], ...updates };
    updateOpex({ [field]: current });
  };

  const removeServiceItem = (field: keyof typeof opex, index: number) => {
    const current = [...((opex?.[field] as ServiceItem[]) || [])];
    current.splice(index, 1);
    updateOpex({ [field]: current });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render editable list for nomina items
  const renderNominaList = (type: 'administrativa' | 'operativa', items: NominaItem[], icon: string) => (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
        <div className="col-span-5">Cargo</div>
        <div className="col-span-2 text-center">Cant</div>
        <div className="col-span-2 text-right">Salario/mes</div>
        <div className="col-span-2 text-right">Total</div>
        <div className="col-span-1"></div>
      </div>
      {items.map((item, idx) => (
        <Card key={idx} className="p-2 bg-muted/50">
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-5">
              <Input
                placeholder="Ej: Gerente General"
                value={item.cargo || ''}
                onChange={(e) => updateNominaItem(type, idx, { cargo: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                value={item.cantidad || 0}
                onChange={(e) => updateNominaItem(type, idx, { cantidad: Number(e.target.value) })}
                className="h-8 text-sm text-center"
                min="0"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                value={item.salarioMensual || 0}
                onChange={(e) => updateNominaItem(type, idx, { salarioMensual: Number(e.target.value) })}
                className="h-8 text-sm text-right"
                min="0"
              />
            </div>
            <div className="col-span-2 text-right text-sm font-semibold text-green-600 dark:text-green-400">
              {formatCurrency((item.cantidad || 0) * (item.salarioMensual || 0), currency)}
            </div>
            <div className="col-span-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeNominaItem(type, idx)}
                className="h-7 w-7 p-0"
              >
                <X className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => addNominaItem(type)}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar {icon}
      </Button>
    </div>
  );

  // Render editable list for service items
  const renderServiceList = (field: keyof typeof opex, items: ServiceItem[], placeholder: string) => (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
        <div className="col-span-8">Concepto</div>
        <div className="col-span-3 text-right">Costo/mes</div>
        <div className="col-span-1"></div>
      </div>
      {items.map((item, idx) => (
        <Card key={idx} className="p-2 bg-muted/50">
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-8">
              <Input
                placeholder={placeholder}
                value={item.concepto || ''}
                onChange={(e) => updateServiceItem(field, idx, { concepto: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-3">
              <Input
                type="number"
                value={item.costoMensual || 0}
                onChange={(e) => updateServiceItem(field, idx, { costoMensual: Number(e.target.value) })}
                className="h-8 text-sm text-right"
                min="0"
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeServiceItem(field, idx)}
                className="h-7 w-7 p-0"
              >
                <X className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => addServiceItem(field)}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar Item
      </Button>
    </div>
  );

  return (
    <Accordion type="multiple" className="space-y-3">
      {/* 1. NÓMINA Y PERSONAL */}
      <AccordionItem value="nomina" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold">1. Nómina y Personal</span>
            </div>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {formatCurrency(calculateNominaTotal(), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4 space-y-6">
          {/* Personal Administrativo */}
          <div>
            <Label className="text-base font-semibold mb-3 block">👔 Personal Administrativo</Label>
            {renderNominaList('administrativa', opex?.nomina_administrativa || [], 'Cargo Admin')}
          </div>
          
          {/* Personal Operativo */}
          <div>
            <Label className="text-base font-semibold mb-3 block">🔧 Personal Operativo</Label>
            {renderNominaList('operativa', opex?.nomina_operativa || [], 'Cargo Operativo')}
          </div>
          
          {/* Personal de Actividades (read-only) */}
          <div>
            <Label className="text-base font-semibold mb-3 block">🎾 Personal de Actividades (desde Sección A)</Label>
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Suma de personal definido en cada actividad
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (No editable aquí - configurar en cada actividad)
                  </p>
                </div>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(nominaActividades, currency)}
                </p>
              </div>
            </Card>
          </div>
          
          {/* Prestaciones Sociales */}
          <div>
            <Label className="text-base font-semibold mb-2 block">📋 Prestaciones Sociales</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={opex?.prestaciones_porcentaje ?? 53.94}
                onChange={(e) => updateOpex({ prestaciones_porcentaje: Number(e.target.value) })}
                className="w-24"
                step="0.01"
                min="0"
              />
              <span className="text-muted-foreground">%</span>
              <span className="text-sm text-muted-foreground">
                (Incluye: cesantías, primas, vacaciones, salud, pensión, ARL)
              </span>
            </div>
          </div>
          
          {/* Resumen Nómina */}
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Admin + Operativo:</span>
                  <span className="font-semibold">{formatCurrency(calculateNominaBase(), currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Personal Actividades:</span>
                  <span className="font-semibold">{formatCurrency(nominaActividades, currency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Nómina:</span>
                  <span className="font-semibold">{formatCurrency(calculateNominaBase() + nominaActividades, currency)}</span>
                </div>
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <span>+ Prestaciones ({opex?.prestaciones_porcentaje ?? 53.94}%):</span>
                  <span className="font-semibold">{formatCurrency(calculatePrestaciones(), currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total Nómina:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(calculateNominaTotal(), currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>

      {/* 2. ARRENDAMIENTO */}
      <AccordionItem value="arrendamiento" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <Home className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="font-semibold">2. Arrendamiento</span>
            </div>
            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
              {formatCurrency(calculateArrendamiento(), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4 space-y-4">
          <div>
            <Label>Modelo de Arrendamiento</Label>
            <RadioGroup
              value={opex?.arrendamiento_modelo || 'propio'}
              onValueChange={(v) => updateOpex({ arrendamiento_modelo: v as any })}
              className="grid grid-cols-4 gap-3 mt-2"
            >
              <Card className={cn("p-3 cursor-pointer transition-all", opex?.arrendamiento_modelo === 'propio' && "border-green-500 bg-green-50 dark:bg-green-950/30")}>
                <RadioGroupItem value="propio" id="propio" className="sr-only" />
                <Label htmlFor="propio" className="cursor-pointer flex flex-col items-center gap-1">
                  <Home className="w-5 h-5" />
                  <span className="text-sm">Propio</span>
                </Label>
              </Card>
              
              <Card className={cn("p-3 cursor-pointer transition-all", opex?.arrendamiento_modelo === 'fijo' && "border-blue-500 bg-blue-50 dark:bg-blue-950/30")}>
                <RadioGroupItem value="fijo" id="fijo" className="sr-only" />
                <Label htmlFor="fijo" className="cursor-pointer flex flex-col items-center gap-1">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm">Fijo</span>
                </Label>
              </Card>
              
              <Card className={cn("p-3 cursor-pointer transition-all", opex?.arrendamiento_modelo === 'variable' && "border-purple-500 bg-purple-50 dark:bg-purple-950/30")}>
                <RadioGroupItem value="variable" id="variable" className="sr-only" />
                <Label htmlFor="variable" className="cursor-pointer flex flex-col items-center gap-1">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm">Variable</span>
                </Label>
              </Card>
              
              <Card className={cn("p-3 cursor-pointer transition-all", opex?.arrendamiento_modelo === 'mixto' && "border-orange-500 bg-orange-50 dark:bg-orange-950/30")}>
                <RadioGroupItem value="mixto" id="mixto" className="sr-only" />
                <Label htmlFor="mixto" className="cursor-pointer flex flex-col items-center gap-1">
                  <Percent className="w-5 h-5" />
                  <span className="text-sm">Mixto</span>
                </Label>
              </Card>
            </RadioGroup>
          </div>
          
          {opex?.arrendamiento_modelo === 'fijo' && (
            <div>
              <Label>Valor Mensual Fijo</Label>
              <Input
                type="number"
                value={opex?.arrendamiento_fijo || 0}
                onChange={(e) => updateOpex({ arrendamiento_fijo: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          )}
          
          {opex?.arrendamiento_modelo === 'variable' && (
            <div>
              <Label>Porcentaje sobre Ingresos</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={opex?.arrendamiento_variable_porcentaje || 0}
                  onChange={(e) => updateOpex({ arrendamiento_variable_porcentaje: Number(e.target.value) })}
                  className="w-24"
                  step="0.1"
                  min="0"
                />
                <span className="text-muted-foreground">%</span>
                <span className="text-sm text-muted-foreground">→</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {formatCurrency(calculateArrendamiento(), currency)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ingresos mensuales: {formatCurrency(ingresosMensuales, currency)}
              </p>
            </div>
          )}
          
          {opex?.arrendamiento_modelo === 'mixto' && (
            <div className="space-y-3">
              <div>
                <Label>Parte Fija</Label>
                <Input
                  type="number"
                  value={opex?.arrendamiento_mixto_fijo || 0}
                  onChange={(e) => updateOpex({ arrendamiento_mixto_fijo: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Parte Variable (% sobre ingresos)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={opex?.arrendamiento_mixto_porcentaje || 0}
                    onChange={(e) => updateOpex({ arrendamiento_mixto_porcentaje: Number(e.target.value) })}
                    className="w-24"
                    step="0.1"
                    min="0"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
              <Card className="bg-orange-50 dark:bg-orange-950/30 p-3">
                <p className="text-sm">
                  Total: <span className="font-semibold">{formatCurrency(calculateArrendamiento(), currency)}/mes</span>
                </p>
              </Card>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* 3. SERVICIOS PÚBLICOS */}
      <AccordionItem value="servicios" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="font-semibold">3. Servicios Públicos</span>
            </div>
            <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
              {formatCurrency(calculateCategoryTotal(opex?.servicios_publicos || []), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4">
          {renderServiceList('servicios_publicos', opex?.servicios_publicos || [], 'Ej: Energía eléctrica')}
        </AccordionContent>
      </AccordionItem>

      {/* 4. MARKETING */}
      <AccordionItem value="marketing" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <span className="font-semibold">4. Marketing y Publicidad</span>
            </div>
            <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">
              {formatCurrency(calculateCategoryTotal(opex?.marketing || []), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4">
          {renderServiceList('marketing', opex?.marketing || [], 'Ej: Pauta digital')}
        </AccordionContent>
      </AccordionItem>

      {/* 5. TECNOLOGÍA */}
      <AccordionItem value="tecnologia" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span className="font-semibold">5. Tecnología y Software</span>
            </div>
            <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
              {formatCurrency(calculateCategoryTotal(opex?.tecnologia || []), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4">
          {renderServiceList('tecnologia', opex?.tecnologia || [], 'Ej: Software reservas')}
        </AccordionContent>
      </AccordionItem>

      {/* 6. SEGUROS */}
      <AccordionItem value="seguros" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-semibold">6. Seguros y Pólizas</span>
            </div>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(calculateCategoryTotal(opex?.seguros || []), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4">
          {renderServiceList('seguros', opex?.seguros || [], 'Ej: Póliza todo riesgo')}
        </AccordionContent>
      </AccordionItem>

      {/* 7. MANTENIMIENTO */}
      <AccordionItem value="mantenimiento" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold">7. Mantenimiento General</span>
            </div>
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {formatCurrency(calculateCategoryTotal(opex?.mantenimiento_general || []) + mantenimientoActividades, currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4 space-y-4">
          {renderServiceList('mantenimiento_general', opex?.mantenimiento_general || [], 'Ej: Limpieza general')}
          
          {/* Mantenimiento de Actividades (read-only) */}
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Mantenimiento desde actividades (Sección A)
                </p>
              </div>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                + {formatCurrency(mantenimientoActividades, currency)}
              </p>
            </div>
          </Card>
        </AccordionContent>
      </AccordionItem>

      {/* 8. ADMINISTRATIVOS */}
      <AccordionItem value="administrativos" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold">8. Administrativos y Legales</span>
            </div>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(calculateCategoryTotal(opex?.administrativos || []), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4">
          {renderServiceList('administrativos', opex?.administrativos || [], 'Ej: Contabilidad')}
        </AccordionContent>
      </AccordionItem>

      {/* 9. OTROS GASTOS */}
      <AccordionItem value="otros" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-semibold">9. Otros Gastos</span>
            </div>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {formatCurrency(calculateCategoryTotal(opex?.otros_gastos || []), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4">
          {renderServiceList('otros_gastos', opex?.otros_gastos || [], 'Ej: Imprevistos mensuales')}
        </AccordionContent>
      </AccordionItem>

      {/* 10. DEPRECIACIÓN */}
      <AccordionItem value="depreciacion" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="font-semibold">10. Depreciación</span>
            </div>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              (Ver Resumen)
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4 space-y-4">
          <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <Info className="w-4 h-4" />
            <AlertDescription>
              La depreciación se calcula automáticamente en el Resumen Final,
              dividiendo el CAPEX total del proyecto entre los años de vida útil.
            </AlertDescription>
          </Alert>
          
          <div>
            <Label>Años de Vida Útil</Label>
            <Input
              type="number"
              value={opex?.depreciacion_anos ?? 10}
              onChange={(e) => updateOpex({ depreciacion_anos: Number(e.target.value) })}
              className="w-32"
              min="1"
              max="50"
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
