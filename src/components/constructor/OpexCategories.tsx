import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjectOpex } from '@/hooks/useProjectOpex';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types/index';
import { NominaItem, ServiceItem, ComisionItem, RentCalculationBase, ExpenseType } from '@/types/opex';
import { ActivityConfig } from '@/types/activity';
import {
  Users, Home, Zap, Megaphone, Monitor, Shield, Wrench,
  FileText, MoreHorizontal, TrendingDown, Plus, X, DollarSign, 
  Percent, TrendingUp, Info, Loader2, Package, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpexCategoriesProps {
  projectId: string;
  currency: CurrencyCode;
}

// OPEX Templates - Padel Mundial standard items
const OPEX_TEMPLATES: Record<string, ServiceItem[]> = {
  tecnologia: [
    { concepto: 'Sistema de Reservas Padel Mundial', tipo: 'fijo', costoMensual: 2000000 },
    { concepto: 'Software POS', tipo: 'fijo', costoMensual: 150000 },
    { concepto: 'App móvil', tipo: 'fijo', costoMensual: 300000 }
  ],
  marketing: [
    { concepto: 'Agencia de Redes Padel Mundial', tipo: 'fijo', costoMensual: 2000000 },
    { concepto: 'Manejo de Comunidades Padel Mundial', tipo: 'fijo', costoMensual: 1000000 },
    { concepto: 'Google Ads', tipo: 'fijo', costoMensual: 1500000 },
    { concepto: 'Meta Ads', tipo: 'fijo', costoMensual: 1000000 }
  ],
  administrativos: [
    { concepto: 'Administración Deportiva Padel Mundial', tipo: 'fijo', costoMensual: 2500000 },
    { concepto: 'Contador', tipo: 'fijo', costoMensual: 1500000 },
    { concepto: 'Abogado', tipo: 'fijo', costoMensual: 800000 }
  ],
  seguros: [
    { concepto: 'Seguro Todo Riesgo', tipo: 'fijo', costoMensual: 500000 },
    { concepto: 'Seguro RC', tipo: 'fijo', costoMensual: 300000 }
  ],
  seguridad: [
    { concepto: 'Vigilancia 24/7', tipo: 'fijo', costoMensual: 6000000 },
    { concepto: 'Cámaras y monitoreo', tipo: 'fijo', costoMensual: 500000 }
  ],
  servicios_publicos: [
    { concepto: 'Energía eléctrica', tipo: 'fijo', costoMensual: 8000000 },
    { concepto: 'Agua', tipo: 'fijo', costoMensual: 1500000 },
    { concepto: 'Internet', tipo: 'fijo', costoMensual: 500000 },
    { concepto: 'Gas', tipo: 'fijo', costoMensual: 300000 }
  ],
  mantenimiento_general: [
    { concepto: 'Aseo general', tipo: 'fijo', costoMensual: 3000000 },
    { concepto: 'Jardinería', tipo: 'fijo', costoMensual: 800000 },
    { concepto: 'Mantenimiento preventivo', tipo: 'fijo', costoMensual: 1000000 }
  ]
};

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

  // Calculate total monthly reservations
  const totalReservasMes = useMemo(() => {
    return activities.reduce((sum, act) => {
      const config: ActivityConfig = act.config;
      const cantidad = config.cantidad || 1;
      const horarios = config.horarios || [];
      const ocupacionPromedio = horarios.length > 0
        ? horarios.reduce((s, h) => s + (h.ocupacion || 0), 0) / horarios.length / 100
        : 0.5;
      const horasOperacion = horarios.reduce((s, h) => s + ((h.fin || 0) - (h.inicio || 0)), 0);
      const diasMes = 30;
      const reservasPorDia = horasOperacion * ocupacionPromedio / (config.duracionReserva || 1.5);
      return sum + (cantidad * reservasPorDia * diasMes);
    }, 0);
  }, [activities]);

  // Calculate different income bases for rent calculations
  const ingresos = useMemo(() => {
    let totalBruto = 0;
    let soloActividades = 0;

    activities.forEach(act => {
      const config: ActivityConfig = act.config;
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
      totalBruto += ingresoEstimado;
      soloActividades += ingresoEstimado;
    });

    return {
      totalBruto,
      totalNeto: totalBruto * 0.85, // Simplified: 15% costs from third parties
      soloActividades
    };
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

  // Calculate rent base value
  const calculateArrendamientoBase = (base: RentCalculationBase, opexSinArriendo: number = 0) => {
    switch (base) {
      case 'ingresos-brutos':
        return ingresos.totalBruto;
      case 'ingresos-netos':
        return ingresos.totalNeto;
      case 'utilidades':
        return ingresos.totalBruto - opexSinArriendo;
      case 'ingresos-operacionales':
        return ingresos.soloActividades;
      default:
        return ingresos.totalBruto;
    }
  };

  const calculateArrendamiento = () => {
    const modelo = opex?.arrendamiento_modelo || 'propio';
    if (modelo === 'propio') return 0;
    if (modelo === 'fijo') return opex?.arrendamiento_fijo || 0;
    if (modelo === 'variable') {
      const base = calculateArrendamientoBase(opex?.arrendamiento_variable_base || 'ingresos-brutos');
      return base * ((opex?.arrendamiento_variable_porcentaje || 0) / 100);
    }
    if (modelo === 'mixto') {
      const base = calculateArrendamientoBase(opex?.arrendamiento_mixto_base || 'ingresos-brutos');
      return (opex?.arrendamiento_mixto_fijo || 0) + 
             base * ((opex?.arrendamiento_mixto_porcentaje || 0) / 100);
    }
    return 0;
  };

  // Calculate category total with variable expense types
  const calculateCategoryTotal = (items: ServiceItem[]) => {
    return items.reduce((sum, item) => {
      const tipo = item.tipo || 'fijo';
      if (tipo === 'fijo') {
        return sum + (item.costoMensual || 0);
      } else if (tipo === 'porcentaje-facturacion') {
        return sum + (ingresos.totalBruto * ((item.porcentaje || 0) / 100));
      } else if (tipo === 'por-reserva') {
        return sum + ((item.costoPorReserva || 0) * totalReservasMes);
      }
      return sum;
    }, 0);
  };

  // Calculate commissions total
  const calculateComisionesTotal = () => {
    const comisiones = opex?.comisiones || [];
    return comisiones.reduce((sum, com) => {
      let base = ingresos.totalBruto;
      if (com.base === 'ingresos-netos') base = ingresos.totalNeto;
      // For utilidades, we'd need to calculate OPEX first - simplified here
      if (com.base === 'utilidades') base = ingresos.totalBruto * 0.3;
      return sum + (base * ((com.porcentaje || 0) / 100));
    }, 0);
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
    updateOpex({ [field]: [...current, { concepto: '', tipo: 'fijo' as ExpenseType, costoMensual: 0 }] });
  };

  const addTemplateItem = (field: string, item: ServiceItem) => {
    const current = (opex?.[field as keyof typeof opex] as ServiceItem[]) || [];
    updateOpex({ [field]: [...current, { ...item }] });
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

  // Commission handlers
  const addComision = () => {
    const current = opex?.comisiones || [];
    updateOpex({ comisiones: [...current, { concepto: '', base: 'ingresos-brutos' as const, porcentaje: 0 }] });
  };

  const updateComision = (index: number, updates: Partial<ComisionItem>) => {
    const current = [...(opex?.comisiones || [])];
    current[index] = { ...current[index], ...updates };
    updateOpex({ comisiones: current });
  };

  const removeComision = (index: number) => {
    const current = [...(opex?.comisiones || [])];
    current.splice(index, 1);
    updateOpex({ comisiones: current });
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

  // Render editable list for service items with variable expense types
  const renderServiceList = (field: keyof typeof opex, items: ServiceItem[], placeholder: string, templateKey?: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-muted-foreground">Items</div>
        <div className="flex gap-2">
          {templateKey && OPEX_TEMPLATES[templateKey] && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Package className="w-4 h-4 mr-2" />
                  Template
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {OPEX_TEMPLATES[templateKey].map((template, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    onClick={() => addTemplateItem(field as string, template)}
                  >
                    <span className="flex-1">{template.concepto}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatCurrency(template.costoMensual || 0, currency)}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" size="sm" onClick={() => addServiceItem(field)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>
      </div>

      {items.map((item, idx) => (
        <Card key={idx} className="p-3 bg-muted/50">
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6">
                <Input
                  placeholder={placeholder}
                  value={item.concepto || ''}
                  onChange={(e) => updateServiceItem(field, idx, { concepto: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-5">
                <Select
                  value={item.tipo || 'fijo'}
                  onValueChange={(v) => updateServiceItem(field, idx, { tipo: v as ExpenseType })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fijo">💵 Monto Fijo</SelectItem>
                    <SelectItem value="porcentaje-facturacion">📊 % Facturación</SelectItem>
                    <SelectItem value="por-reserva">🎫 Por Reserva</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className="grid grid-cols-12 gap-2 items-center">
              {(item.tipo || 'fijo') === 'fijo' && (
                <>
                  <div className="col-span-9">
                    <Input
                      type="number"
                      placeholder="Valor mensual"
                      value={item.costoMensual || 0}
                      onChange={(e) => updateServiceItem(field, idx, { costoMensual: Number(e.target.value) })}
                      className="h-8 text-sm"
                      min="0"
                    />
                  </div>
                  <div className="col-span-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(item.costoMensual || 0, currency)}
                  </div>
                </>
              )}

              {item.tipo === 'porcentaje-facturacion' && (
                <>
                  <div className="col-span-3 flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="%"
                      value={item.porcentaje || 0}
                      onChange={(e) => updateServiceItem(field, idx, { porcentaje: Number(e.target.value) })}
                      className="h-8 text-sm"
                      min="0"
                      step="0.1"
                    />
                    <span className="text-muted-foreground text-xs">%</span>
                  </div>
                  <div className="col-span-6 text-xs text-muted-foreground">
                    de {formatCurrency(ingresos.totalBruto, currency)}
                  </div>
                  <div className="col-span-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(ingresos.totalBruto * ((item.porcentaje || 0) / 100), currency)}
                  </div>
                </>
              )}

              {item.tipo === 'por-reserva' && (
                <>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="$/reserva"
                      value={item.costoPorReserva || 0}
                      onChange={(e) => updateServiceItem(field, idx, { costoPorReserva: Number(e.target.value) })}
                      className="h-8 text-sm"
                      min="0"
                    />
                  </div>
                  <div className="col-span-6 text-xs text-muted-foreground">
                    × {Math.round(totalReservasMes).toLocaleString()} reservas/mes
                  </div>
                  <div className="col-span-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency((item.costoPorReserva || 0) * totalReservasMes, currency)}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}

      {items.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No hay items. Usa "Agregar" o selecciona un template.
        </div>
      )}

      <div className="flex justify-end pt-2">
        <div className="text-sm font-semibold">
          Total: <span className="text-green-600 dark:text-green-400">{formatCurrency(calculateCategoryTotal(items), currency)}</span>
        </div>
      </div>
    </div>
  );

  // Render rent base selector
  const renderRentBaseSelector = (currentBase: RentCalculationBase, onChange: (base: RentCalculationBase) => void) => (
    <div className="space-y-2">
      <Label className="text-sm">Calculado sobre:</Label>
      <RadioGroup
        value={currentBase}
        onValueChange={(v) => onChange(v as RentCalculationBase)}
        className="grid grid-cols-2 gap-2"
      >
        <Card className={cn("p-2 cursor-pointer transition-all text-center", 
          currentBase === 'ingresos-brutos' && "border-blue-500 bg-blue-50 dark:bg-blue-950/30")}>
          <RadioGroupItem value="ingresos-brutos" id="ing-brutos" className="sr-only" />
          <Label htmlFor="ing-brutos" className="cursor-pointer text-xs">
            <p className="font-medium">Ingresos Brutos</p>
            <p className="text-muted-foreground mt-1">Total facturación</p>
          </Label>
        </Card>
        
        <Card className={cn("p-2 cursor-pointer transition-all text-center", 
          currentBase === 'ingresos-netos' && "border-green-500 bg-green-50 dark:bg-green-950/30")}>
          <RadioGroupItem value="ingresos-netos" id="ing-netos" className="sr-only" />
          <Label htmlFor="ing-netos" className="cursor-pointer text-xs">
            <p className="font-medium">Ingresos Netos</p>
            <p className="text-muted-foreground mt-1">Menos costos terceros</p>
          </Label>
        </Card>
        
        <Card className={cn("p-2 cursor-pointer transition-all text-center", 
          currentBase === 'utilidades' && "border-purple-500 bg-purple-50 dark:bg-purple-950/30")}>
          <RadioGroupItem value="utilidades" id="utilidades" className="sr-only" />
          <Label htmlFor="utilidades" className="cursor-pointer text-xs">
            <p className="font-medium">Utilidades (EBITDA)</p>
            <p className="text-muted-foreground mt-1">Ingresos - OPEX</p>
          </Label>
        </Card>
        
        <Card className={cn("p-2 cursor-pointer transition-all text-center", 
          currentBase === 'ingresos-operacionales' && "border-orange-500 bg-orange-50 dark:bg-orange-950/30")}>
          <RadioGroupItem value="ingresos-operacionales" id="ing-oper" className="sr-only" />
          <Label htmlFor="ing-oper" className="cursor-pointer text-xs">
            <p className="font-medium">Ing. Operacionales</p>
            <p className="text-muted-foreground mt-1">Solo actividades</p>
          </Label>
        </Card>
      </RadioGroup>
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
          <div>
            <Label className="text-base font-semibold mb-3 block">👔 Personal Administrativo</Label>
            {renderNominaList('administrativa', opex?.nomina_administrativa || [], 'Cargo Admin')}
          </div>
          
          <div>
            <Label className="text-base font-semibold mb-3 block">🔧 Personal Operativo</Label>
            {renderNominaList('operativa', opex?.nomina_operativa || [], 'Cargo Operativo')}
          </div>
          
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
                (Cesantías, primas, vacaciones, salud, pensión, ARL)
              </span>
            </div>
          </div>
          
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
            <div className="space-y-4">
              {renderRentBaseSelector(
                opex?.arrendamiento_variable_base || 'ingresos-brutos',
                (base) => updateOpex({ arrendamiento_variable_base: base })
              )}
              
              <div>
                <Label>Porcentaje</Label>
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
                </div>
              </div>
              
              <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base de cálculo:</span>
                    <span className="font-semibold">
                      {formatCurrency(calculateArrendamientoBase(opex?.arrendamiento_variable_base || 'ingresos-brutos'), currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">× {opex?.arrendamiento_variable_porcentaje || 0}%</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Arriendo Mensual:</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(calculateArrendamiento(), currency)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {opex?.arrendamiento_modelo === 'mixto' && (
            <div className="space-y-4">
              <div>
                <Label>Parte Fija</Label>
                <Input
                  type="number"
                  value={opex?.arrendamiento_mixto_fijo || 0}
                  onChange={(e) => updateOpex({ arrendamiento_mixto_fijo: Number(e.target.value) })}
                />
              </div>
              
              {renderRentBaseSelector(
                opex?.arrendamiento_mixto_base || 'ingresos-brutos',
                (base) => updateOpex({ arrendamiento_mixto_base: base })
              )}
              
              <div>
                <Label>Porcentaje Variable</Label>
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
              
              <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Fijo:</span>
                    <span className="font-semibold">{formatCurrency(opex?.arrendamiento_mixto_fijo || 0, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variable ({opex?.arrendamiento_mixto_porcentaje || 0}%):</span>
                    <span className="font-semibold">
                      {formatCurrency(calculateArrendamientoBase(opex?.arrendamiento_mixto_base || 'ingresos-brutos') * ((opex?.arrendamiento_mixto_porcentaje || 0) / 100), currency)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(calculateArrendamiento(), currency)}
                    </span>
                  </div>
                </div>
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
          {renderServiceList('servicios_publicos', opex?.servicios_publicos || [], 'Ej: Energía eléctrica', 'servicios_publicos')}
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
          {renderServiceList('marketing', opex?.marketing || [], 'Ej: Pauta digital', 'marketing')}
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
          {renderServiceList('tecnologia', opex?.tecnologia || [], 'Ej: Software reservas', 'tecnologia')}
        </AccordionContent>
      </AccordionItem>

      {/* 6. SEGURIDAD Y VIGILANCIA (NEW) */}
      <AccordionItem value="seguridad" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold">6. Seguridad y Vigilancia</span>
            </div>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(calculateCategoryTotal(opex?.seguridad || []), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4">
          {renderServiceList('seguridad', opex?.seguridad || [], 'Ej: Vigilancia 24/7', 'seguridad')}
        </AccordionContent>
      </AccordionItem>

      {/* 7. SEGUROS */}
      <AccordionItem value="seguros" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-semibold">7. Seguros y Pólizas</span>
            </div>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(calculateCategoryTotal(opex?.seguros || []), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4">
          {renderServiceList('seguros', opex?.seguros || [], 'Ej: Póliza todo riesgo', 'seguros')}
        </AccordionContent>
      </AccordionItem>

      {/* 8. MANTENIMIENTO */}
      <AccordionItem value="mantenimiento" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold">8. Mantenimiento General</span>
            </div>
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {formatCurrency(calculateCategoryTotal(opex?.mantenimiento_general || []) + mantenimientoActividades, currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4 space-y-4">
          {renderServiceList('mantenimiento_general', opex?.mantenimiento_general || [], 'Ej: Limpieza general', 'mantenimiento_general')}
          
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

      {/* 9. ADMINISTRATIVOS */}
      <AccordionItem value="administrativos" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <span className="font-semibold">9. Administrativos y Legales</span>
            </div>
            <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
              {formatCurrency(calculateCategoryTotal(opex?.administrativos || []), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4">
          {renderServiceList('administrativos', opex?.administrativos || [], 'Ej: Contabilidad', 'administrativos')}
        </AccordionContent>
      </AccordionItem>

      {/* 10. OTROS GASTOS */}
      <AccordionItem value="otros" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-semibold">10. Otros Gastos</span>
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

      {/* 11. COMISIONES VARIABLES (NEW) */}
      <AccordionItem value="comisiones" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <Percent className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span className="font-semibold">11. Comisiones Variables</span>
            </div>
            <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
              {formatCurrency(calculateComisionesTotal(), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4 space-y-4">
          <Alert className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800">
            <Info className="w-4 h-4" />
            <AlertDescription>
              Comisiones que se pagan como % sobre ingresos o utilidades
              (ej: comisión de ventas, bonos por rendimiento)
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            {(opex?.comisiones || []).map((com, idx) => (
              <Card key={idx} className="p-4 bg-muted/50">
                <div className="space-y-3">
                  <Input
                    placeholder="Concepto (ej: Comisión ventas)"
                    value={com.concepto}
                    onChange={(e) => updateComision(idx, { concepto: e.target.value })}
                    className="h-8"
                  />
                  
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-6">
                      <Select
                        value={com.base || 'ingresos-brutos'}
                        onValueChange={(v) => updateComision(idx, { base: v as ComisionItem['base'] })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ingresos-brutos">Ingresos Brutos</SelectItem>
                          <SelectItem value="ingresos-netos">Ingresos Netos</SelectItem>
                          <SelectItem value="utilidades">Utilidades (EBITDA)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-3 flex gap-1 items-center">
                      <Input
                        type="number"
                        placeholder="%"
                        value={com.porcentaje || 0}
                        onChange={(e) => updateComision(idx, { porcentaje: Number(e.target.value) })}
                        className="h-8 text-sm"
                        min="0"
                        step="0.1"
                      />
                      <span className="text-muted-foreground text-xs">%</span>
                    </div>
                    
                    <div className="col-span-2 text-right text-sm font-semibold text-rose-600 dark:text-rose-400">
                      {formatCurrency(
                        (com.base === 'ingresos-netos' ? ingresos.totalNeto :
                         com.base === 'utilidades' ? ingresos.totalBruto * 0.3 :
                         ingresos.totalBruto) * ((com.porcentaje || 0) / 100),
                        currency
                      )}
                    </div>
                    
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeComision(idx)}
                        className="h-7 w-7 p-0"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            <Button
              variant="outline"
              onClick={addComision}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Comisión
            </Button>
          </div>
          
          <div className="flex justify-end pt-2">
            <div className="text-sm font-semibold">
              Total: <span className="text-rose-600 dark:text-rose-400">{formatCurrency(calculateComisionesTotal(), currency)}</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 12. DEPRECIACIÓN */}
      <AccordionItem value="depreciacion" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="font-semibold">12. Depreciación</span>
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
