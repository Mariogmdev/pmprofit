import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { NominaItem, ServiceItem, ComisionItem, RentCalculationBase, ExpenseType, BankCommissionItem, RetencionItem } from '@/types/opex';
import { ActivityConfig } from '@/types/activity';
import {
  Users, Home, Zap, Megaphone, Monitor, Shield, Wrench,
  FileText, MoreHorizontal, TrendingDown, Plus, X, DollarSign, 
  Percent, TrendingUp, Info, Loader2, Package, ShieldCheck,
  CreditCard, AlertTriangle
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

  // Calculate reservations for specific activities
  const calculateReservasForActivities = (actividadesIncluidas?: string[]) => {
    const activitiesToInclude = actividadesIncluidas && actividadesIncluidas.length > 0
      ? activities.filter(a => actividadesIncluidas.includes(a.id))
      : activities;

    return activitiesToInclude.reduce((sum, act) => {
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
  };

  // Calculate total monthly reservations
  const totalReservasMes = useMemo(() => {
    return calculateReservasForActivities(undefined);
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

  // Calculate category total with variable expense types (MUST BE BEFORE useMemo that uses it)
  const calculateCategoryTotal = (items: ServiceItem[]) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => {
      const tipo = item.tipo || 'fijo';
      if (tipo === 'fijo') {
        return sum + (item.costoMensual || 0);
      } else if (tipo === 'porcentaje-facturacion') {
        return sum + (ingresos.totalBruto * ((item.porcentaje || 0) / 100));
      } else if (tipo === 'por-reserva') {
        const reservasAplicables = calculateReservasForActivities(item.actividadesIncluidas);
        const reservasConPorcentaje = reservasAplicables * ((item.porcentajeReservas || 100) / 100);
        return sum + ((item.costoPorReserva || 0) * reservasConPorcentaje);
      }
      return sum;
    }, 0);
  };

  // Calculate OPEX base (without rent and commissions) for utility-based calculations
  const opexBaseSinArriendoNiComisiones = useMemo(() => {
    const nominaAdmin = (opex?.nomina_administrativa || []).reduce(
      (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
    );
    const nominaOperativo = (opex?.nomina_operativa || []).reduce(
      (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
    );
    const nominaBase = nominaAdmin + nominaOperativo + nominaActividades;
    const prestaciones = nominaBase * ((opex?.prestaciones_porcentaje || 53.94) / 100);
    const totalNomina = nominaBase + prestaciones;
    
    const serviciosPublicos = calculateCategoryTotal(opex?.servicios_publicos || []);
    const marketing = calculateCategoryTotal(opex?.marketing || []);
    const tecnologia = calculateCategoryTotal(opex?.tecnologia || []);
    const seguridad = calculateCategoryTotal(opex?.seguridad || []);
    const seguros = calculateCategoryTotal(opex?.seguros || []);
    const mantenimientoGeneral = calculateCategoryTotal(opex?.mantenimiento_general || []);
    const administrativos = calculateCategoryTotal(opex?.administrativos || []);
    const otrosGastos = calculateCategoryTotal(opex?.otros_gastos || []);
    
    // Financial expenses
    let gastosFinancieros = 0;
    if (opex?.incluir_4x1000) {
      gastosFinancieros += ingresos.totalBruto * 0.004;
    }
    gastosFinancieros += (opex?.comisiones_bancarias || []).reduce((s, i) => s + (i.costoMensual || 0), 0);
    if (opex?.incluir_comision_datafono !== false) {
      gastosFinancieros += ingresos.totalBruto * 
                 ((opex?.porcentaje_ventas_datafono ?? 70) / 100) * 
                 ((opex?.comision_datafono_porcentaje ?? 2.5) / 100);
    }
    
    // Taxes
    let impuestos = 0;
    if (opex?.incluir_iva) {
      const ivaCobrado = ingresos.totalBruto * 
                         ((opex?.porcentaje_ingresos_iva ?? 0) / 100) * 
                         ((opex?.tarifa_iva ?? 19) / 100);
      impuestos += Math.max(0, ivaCobrado - (opex?.iva_pagado_estimado ?? 0));
    }
    if (opex?.incluir_retenciones) {
      impuestos += (opex?.retenciones || []).reduce((s, i) => {
        const base = i.base === 'ingresos' ? ingresos.totalBruto : ingresos.totalBruto * 0.3;
        return s + (base * ((i.porcentaje || 0) / 100));
      }, 0);
    }
    
    return totalNomina + serviciosPublicos + marketing + tecnologia + seguridad + 
           seguros + mantenimientoGeneral + mantenimientoActividades + administrativos + 
           gastosFinancieros + impuestos + otrosGastos;
  }, [opex, nominaActividades, mantenimientoActividades, activities, ingresos]);

  // Calculate utilities before rent (for rent on utilities)
  const utilidadesAntesArriendo = useMemo(() => {
    return Math.max(0, ingresos.totalBruto - opexBaseSinArriendoNiComisiones);
  }, [ingresos.totalBruto, opexBaseSinArriendoNiComisiones]);

  // Calculate rent base value
  const calculateArrendamientoBase = (base: RentCalculationBase) => {
    switch (base) {
      case 'ingresos-brutos':
        return ingresos.totalBruto;
      case 'ingresos-netos':
        return ingresos.totalNeto;
      case 'utilidades':
        return utilidadesAntesArriendo;
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


  // Calculate OPEX without commissions (includes rent, for calculating utility-based commissions)
  const opexSinComisiones = useMemo(() => {
    return opexBaseSinArriendoNiComisiones + calculateArrendamiento();
  }, [opexBaseSinArriendoNiComisiones, opex?.arrendamiento_modelo, opex?.arrendamiento_fijo, 
      opex?.arrendamiento_variable_porcentaje, opex?.arrendamiento_variable_base,
      opex?.arrendamiento_mixto_fijo, opex?.arrendamiento_mixto_porcentaje, opex?.arrendamiento_mixto_base]);

  // Calculate utilities for commissions (Ingresos - OPEX sin comisiones)
  const utilidadesParaComisiones = useMemo(() => {
    return Math.max(0, ingresos.totalBruto - opexSinComisiones);
  }, [ingresos.totalBruto, opexSinComisiones]);

  // Calculate commissions total (FIXED - use real utilities)
  const calculateComisionesTotal = () => {
    const comisiones = opex?.comisiones || [];
    return comisiones.reduce((sum, com) => {
      let base = ingresos.totalBruto;
      if (com.base === 'ingresos-netos') base = ingresos.totalNeto;
      if (com.base === 'utilidades') base = utilidadesParaComisiones;
      return sum + (base * ((com.porcentaje || 0) / 100));
    }, 0);
  };

  // Helper to get commission base value
  const getComisionBaseValue = (base: string) => {
    switch (base) {
      case 'ingresos-netos':
        return ingresos.totalNeto;
      case 'utilidades':
        return utilidadesParaComisiones;
      default:
        return ingresos.totalBruto;
    }
  };

  // Calculate financial expenses
  const calculateGastosFinancieros = () => {
    let total = 0;
    
    // 4x1000
    if (opex?.incluir_4x1000) {
      total += ingresos.totalBruto * 0.004;
    }
    
    // Bank commissions
    total += (opex?.comisiones_bancarias || []).reduce((s, i) => s + (i.costoMensual || 0), 0);
    
    // Dataphone commissions
    if (opex?.incluir_comision_datafono) {
      total += ingresos.totalBruto * 
               ((opex?.porcentaje_ventas_datafono || 70) / 100) * 
               ((opex?.comision_datafono_porcentaje || 2.5) / 100);
    }
    
    return total;
  };

  // Calculate taxes
  const calculateImpuestos = () => {
    let total = 0;
    
    // IVA
    if (opex?.incluir_iva) {
      const ivaCobrado = ingresos.totalBruto * 
                         ((opex?.porcentaje_ingresos_iva || 0) / 100) * 
                         ((opex?.tarifa_iva || 19) / 100);
      const ivaNeto = Math.max(0, ivaCobrado - (opex?.iva_pagado_estimado || 0));
      total += ivaNeto;
    }
    
    // Retentions
    if (opex?.incluir_retenciones) {
      total += (opex?.retenciones || []).reduce((s, i) => {
        const base = i.base === 'ingresos' ? ingresos.totalBruto : ingresos.totalBruto * 0.3;
        return s + (base * ((i.porcentaje || 0) / 100));
      }, 0);
    }
    
    return total;
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

  // Bank commission handlers
  const addBankCommission = () => {
    const current = opex?.comisiones_bancarias || [];
    updateOpex({ comisiones_bancarias: [...current, { concepto: '', costoMensual: 0 }] });
  };

  const updateBankCommission = (index: number, updates: Partial<BankCommissionItem>) => {
    const current = [...(opex?.comisiones_bancarias || [])];
    current[index] = { ...current[index], ...updates };
    updateOpex({ comisiones_bancarias: current });
  };

  const removeBankCommission = (index: number) => {
    const current = [...(opex?.comisiones_bancarias || [])];
    current.splice(index, 1);
    updateOpex({ comisiones_bancarias: current });
  };

  // Retention handlers
  const addRetencion = () => {
    const current = opex?.retenciones || [];
    updateOpex({ retenciones: [...current, { concepto: '', base: 'ingresos' as const, porcentaje: 0 }] });
  };

  const updateRetencion = (index: number, updates: Partial<RetencionItem>) => {
    const current = [...(opex?.retenciones || [])];
    current[index] = { ...current[index], ...updates };
    updateOpex({ retenciones: current });
  };

  const removeRetencion = (index: number) => {
    const current = [...(opex?.retenciones || [])];
    current.splice(index, 1);
    updateOpex({ retenciones: current });
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
              <CurrencyInput
                value={item.salarioMensual || 0}
                onChange={(value) => updateNominaItem(type, idx, { salarioMensual: value })}
                currency={currency}
                className="h-8 text-sm"
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
                    <CurrencyInput
                      value={item.costoMensual || 0}
                      onChange={(value) => updateServiceItem(field, idx, { costoMensual: value })}
                      currency={currency}
                      className="h-8 text-sm"
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
                <div className="col-span-12 space-y-3">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-3">
                      <Label className="text-xs">Costo/Reserva</Label>
                      <CurrencyInput
                        value={item.costoPorReserva || 0}
                        onChange={(value) => updateServiceItem(field, idx, { costoPorReserva: value })}
                        currency={currency}
                        className="h-8 text-sm"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-xs">% Reservas</Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={item.porcentajeReservas || 100}
                        onChange={(e) => updateServiceItem(field, idx, { porcentajeReservas: Number(e.target.value) })}
                        className="h-8 text-sm"
                        min="0"
                        max="100"
                      />
                    </div>
                    
                    <div className="col-span-7">
                      <Label className="text-xs">Actividades</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-8 justify-start text-left font-normal text-sm">
                            <span className="truncate">
                              {!item.actividadesIncluidas || item.actividadesIncluidas.length === 0 || 
                               item.actividadesIncluidas.length === activities.length
                                ? "Todas las actividades"
                                : `${item.actividadesIncluidas.length} seleccionadas`
                              }
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold">Seleccionar Actividades</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const allIds = activities.map(a => a.id);
                                  updateServiceItem(field, idx, { 
                                    actividadesIncluidas: 
                                      item.actividadesIncluidas?.length === activities.length ? [] : allIds
                                  });
                                }}
                              >
                                {item.actividadesIncluidas?.length === activities.length ? "Ninguna" : "Todas"}
                              </Button>
                            </div>
                            <Separator />
                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                              {activities.map((activity) => (
                                <div key={activity.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`activity-${idx}-${activity.id}`}
                                    checked={!item.actividadesIncluidas || 
                                             item.actividadesIncluidas.length === 0 ||
                                             item.actividadesIncluidas.includes(activity.id)}
                                    onCheckedChange={(checked) => {
                                      const allIds = activities.map(a => a.id);
                                      const current = item.actividadesIncluidas?.length ? 
                                        item.actividadesIncluidas : allIds;
                                      const updated = checked
                                        ? [...current.filter(id => id !== activity.id), activity.id]
                                        : current.filter(id => id !== activity.id);
                                      updateServiceItem(field, idx, { actividadesIncluidas: updated });
                                    }}
                                  />
                                  <Label
                                    htmlFor={`activity-${idx}-${activity.id}`}
                                    className="text-sm cursor-pointer flex-1"
                                  >
                                    {activity.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 p-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reservas/mes (actividades sel.):</span>
                        <span className="font-semibold">
                          {Math.round(calculateReservasForActivities(item.actividadesIncluidas)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">× {item.porcentajeReservas || 100}%:</span>
                        <span className="font-semibold">
                          {Math.round(calculateReservasForActivities(item.actividadesIncluidas) * 
                            ((item.porcentajeReservas || 100) / 100)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">× {formatCurrency(item.costoPorReserva || 0, currency)}:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(
                            Math.round(calculateReservasForActivities(item.actividadesIncluidas) * 
                            ((item.porcentajeReservas || 100) / 100)) * (item.costoPorReserva || 0),
                            currency
                          )}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
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

  // Render rent base selector (using divs instead of RadioGroup to prevent auto-scroll)
  const renderRentBaseSelector = (currentBase: RentCalculationBase, onChange: (base: RentCalculationBase) => void) => (
    <div className="space-y-2">
      <Label className="text-sm">Calculado sobre:</Label>
      <div className="grid grid-cols-2 gap-2">
        <div
          onClick={() => onChange('ingresos-brutos')}
          className={cn(
            "p-2 cursor-pointer transition-all text-center rounded-lg border-2",
            currentBase === 'ingresos-brutos' 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm" 
              : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
          )}
        >
          <p className="font-medium text-xs">Ingresos Brutos</p>
          <p className="text-muted-foreground mt-1 text-xs">Total facturación</p>
        </div>
        
        <div
          onClick={() => onChange('ingresos-netos')}
          className={cn(
            "p-2 cursor-pointer transition-all text-center rounded-lg border-2",
            currentBase === 'ingresos-netos' 
              ? "border-green-500 bg-green-50 dark:bg-green-950/30 shadow-sm" 
              : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
          )}
        >
          <p className="font-medium text-xs">Ingresos Netos</p>
          <p className="text-muted-foreground mt-1 text-xs">Menos costos terceros</p>
        </div>
        
        <div
          onClick={() => onChange('utilidades')}
          className={cn(
            "p-2 cursor-pointer transition-all text-center rounded-lg border-2",
            currentBase === 'utilidades' 
              ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-sm" 
              : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
          )}
        >
          <p className="font-medium text-xs">Utilidades (EBITDA)</p>
          <p className="text-muted-foreground mt-1 text-xs">Ingresos - OPEX</p>
        </div>
        
        <div
          onClick={() => onChange('ingresos-operacionales')}
          className={cn(
            "p-2 cursor-pointer transition-all text-center rounded-lg border-2",
            currentBase === 'ingresos-operacionales' 
              ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-sm" 
              : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
          )}
        >
          <p className="font-medium text-xs">Ing. Operacionales</p>
          <p className="text-muted-foreground mt-1 text-xs">Solo actividades</p>
        </div>
      </div>
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
            <div className="grid grid-cols-4 gap-3 mt-2">
              <div
                onClick={() => updateOpex({ arrendamiento_modelo: 'propio' })}
                className={cn(
                  "p-3 cursor-pointer transition-all rounded-lg border-2 flex flex-col items-center gap-1",
                  opex?.arrendamiento_modelo === 'propio' 
                    ? "border-green-500 bg-green-50 dark:bg-green-950/30 shadow-sm" 
                    : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                )}
              >
                <Home className="w-5 h-5" />
                <span className="text-sm">Propio</span>
              </div>
              
              <div
                onClick={() => updateOpex({ arrendamiento_modelo: 'fijo' })}
                className={cn(
                  "p-3 cursor-pointer transition-all rounded-lg border-2 flex flex-col items-center gap-1",
                  opex?.arrendamiento_modelo === 'fijo' 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm" 
                    : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                )}
              >
                <DollarSign className="w-5 h-5" />
                <span className="text-sm">Fijo</span>
              </div>
              
              <div
                onClick={() => updateOpex({ arrendamiento_modelo: 'variable' })}
                className={cn(
                  "p-3 cursor-pointer transition-all rounded-lg border-2 flex flex-col items-center gap-1",
                  opex?.arrendamiento_modelo === 'variable' 
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-sm" 
                    : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                )}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm">Variable</span>
              </div>
              
              <div
                onClick={() => updateOpex({ arrendamiento_modelo: 'mixto' })}
                className={cn(
                  "p-3 cursor-pointer transition-all rounded-lg border-2 flex flex-col items-center gap-1",
                  opex?.arrendamiento_modelo === 'mixto' 
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-sm" 
                    : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                )}
              >
                <Percent className="w-5 h-5" />
                <span className="text-sm">Mixto</span>
              </div>
            </div>
          </div>
          
          {opex?.arrendamiento_modelo === 'fijo' && (
            <div>
              <Label>Valor Mensual Fijo</Label>
              <CurrencyInput
                value={opex?.arrendamiento_fijo || 0}
                onChange={(value) => updateOpex({ arrendamiento_fijo: value })}
                currency={currency}
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
                    <span className="text-muted-foreground">
                      Base ({
                        opex?.arrendamiento_variable_base === 'ingresos-brutos' ? 'Ingresos Brutos' :
                        opex?.arrendamiento_variable_base === 'ingresos-netos' ? 'Ingresos Netos' :
                        opex?.arrendamiento_variable_base === 'utilidades' ? 'Utilidades (EBITDA)' :
                        opex?.arrendamiento_variable_base === 'ingresos-operacionales' ? 'Ing. Operacionales' :
                        'Ingresos Brutos'
                      }):
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(calculateArrendamientoBase(opex?.arrendamiento_variable_base || 'ingresos-brutos'), currency)}
                    </span>
                  </div>
                  {opex?.arrendamiento_variable_base === 'utilidades' && (
                    <div className="text-xs text-muted-foreground">
                      = Ingresos ({formatCurrency(ingresos.totalBruto, currency)}) - OPEX sin arriendo ({formatCurrency(opexBaseSinArriendoNiComisiones, currency)})
                    </div>
                  )}
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
                <CurrencyInput
                  value={opex?.arrendamiento_mixto_fijo || 0}
                  onChange={(value) => updateOpex({ arrendamiento_mixto_fijo: value })}
                  currency={currency}
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
                    <span>
                      Variable ({opex?.arrendamiento_mixto_porcentaje || 0}% de {
                        opex?.arrendamiento_mixto_base === 'ingresos-brutos' ? 'Ingresos Brutos' :
                        opex?.arrendamiento_mixto_base === 'ingresos-netos' ? 'Ingresos Netos' :
                        opex?.arrendamiento_mixto_base === 'utilidades' ? 'Utilidades' :
                        opex?.arrendamiento_mixto_base === 'ingresos-operacionales' ? 'Ing. Op.' :
                        'Ingresos Brutos'
                      }):
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(
                        calculateArrendamientoBase(opex?.arrendamiento_mixto_base || 'ingresos-brutos') * 
                        ((opex?.arrendamiento_mixto_porcentaje || 0) / 100),
                        currency
                      )}
                    </span>
                  </div>
                  {opex?.arrendamiento_mixto_base === 'utilidades' && (
                    <div className="text-xs text-muted-foreground">
                      Utilidades = {formatCurrency(utilidadesAntesArriendo, currency)}
                    </div>
                  )}
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
          {renderServiceList('marketing', opex?.marketing || [], 'Ej: Redes sociales', 'marketing')}
        </AccordionContent>
      </AccordionItem>

      {/* 5. TECNOLOGÍA */}
      <AccordionItem value="tecnologia" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span className="font-semibold">5. Tecnología</span>
            </div>
            <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
              {formatCurrency(calculateCategoryTotal(opex?.tecnologia || []), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4">
          {renderServiceList('tecnologia', opex?.tecnologia || [], 'Ej: Software de reservas', 'tecnologia')}
        </AccordionContent>
      </AccordionItem>

      {/* 6. SEGURIDAD */}
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

      {/* 10. GASTOS FINANCIEROS (NEW) */}
      <AccordionItem value="financieros" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span className="font-semibold">10. Gastos Financieros</span>
            </div>
            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
              {formatCurrency(calculateGastosFinancieros(), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4 space-y-6">
          {/* 4x1000 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">💳 4x1000 (Impuesto transacciones)</Label>
              <Switch
                checked={opex?.incluir_4x1000 ?? false}
                onCheckedChange={(checked) => updateOpex({ incluir_4x1000: checked })}
              />
            </div>
            
            {opex?.incluir_4x1000 && (
              <Card className="bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ingresos mensuales:</span>
                    <span className="font-semibold">{formatCurrency(ingresos.totalBruto, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">× 0.4% (4x1000):</span>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                      {formatCurrency(ingresos.totalBruto * 0.004, currency)}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>
          
          <Separator />
          
          {/* Bank Commissions */}
          <div>
            <Label className="text-base font-semibold mb-3 block">🏦 Comisiones Bancarias</Label>
            <div className="space-y-2">
              {(opex?.comisiones_bancarias || []).map((item, idx) => (
                <Card key={idx} className="p-2 bg-muted/50">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <Input
                        placeholder="Ej: Cuota manejo cuenta"
                        value={item.concepto || ''}
                        onChange={(e) => updateBankCommission(idx, { concepto: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-4">
                      <CurrencyInput
                        value={item.costoMensual || 0}
                        onChange={(value) => updateBankCommission(idx, { costoMensual: value })}
                        currency={currency}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-1 text-right text-sm font-semibold text-teal-600 dark:text-teal-400">
                      {formatCurrency(item.costoMensual || 0, currency)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => removeBankCommission(idx)} className="h-7 w-7 p-0">
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              <Button variant="outline" size="sm" onClick={addBankCommission} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {/* Dataphone Commissions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">💳 Comisiones Datáfono/Pasarela</Label>
              <Switch
                checked={opex?.incluir_comision_datafono ?? true}
                onCheckedChange={(checked) => updateOpex({ incluir_comision_datafono: checked })}
              />
            </div>
            
            {opex?.incluir_comision_datafono && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Porcentaje Comisión</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        value={opex?.comision_datafono_porcentaje ?? 2.5}
                        onChange={(e) => updateOpex({ comision_datafono_porcentaje: Number(e.target.value) })}
                        className="w-24"
                        step="0.1"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm">% Ventas con Datáfono</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        value={opex?.porcentaje_ventas_datafono ?? 70}
                        onChange={(e) => updateOpex({ porcentaje_ventas_datafono: Number(e.target.value) })}
                        className="w-24"
                        step="1"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
                
                <Card className="bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ingresos:</span>
                      <span className="font-semibold">{formatCurrency(ingresos.totalBruto, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">× {opex?.porcentaje_ventas_datafono ?? 70}% (ventas con datáfono):</span>
                      <span className="font-semibold">
                        {formatCurrency(ingresos.totalBruto * ((opex?.porcentaje_ventas_datafono ?? 70) / 100), currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">× {opex?.comision_datafono_porcentaje ?? 2.5}% (comisión):</span>
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {formatCurrency(
                          ingresos.totalBruto * 
                          ((opex?.porcentaje_ventas_datafono ?? 70) / 100) * 
                          ((opex?.comision_datafono_porcentaje ?? 2.5) / 100),
                          currency
                        )}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 11. IMPUESTOS (NEW) */}
      <AccordionItem value="impuestos" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold">11. Impuestos</span>
            </div>
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {formatCurrency(calculateImpuestos(), currency)}/mes
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4 space-y-6">
          <Alert className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Importante:</strong> Los impuestos se calculan mensualmente como
              estimación. Consulta con tu contador para el cálculo preciso según tu
              régimen tributario.
            </AlertDescription>
          </Alert>
          
          {/* IVA */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">📊 IVA por Pagar</Label>
              <Switch
                checked={opex?.incluir_iva ?? false}
                onCheckedChange={(checked) => updateOpex({ incluir_iva: checked })}
              />
            </div>
            
            {opex?.incluir_iva && (
              <div className="space-y-3">
                <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <Info className="w-4 h-4" />
                  <AlertDescription className="text-xs">
                    IVA = IVA cobrado (sobre ventas) - IVA pagado (sobre compras)
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">% Ingresos gravados con IVA</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        value={opex?.porcentaje_ingresos_iva ?? 0}
                        onChange={(e) => updateOpex({ porcentaje_ingresos_iva: Number(e.target.value) })}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Tarifa IVA</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        value={opex?.tarifa_iva ?? 19}
                        onChange={(e) => updateOpex({ tarifa_iva: Number(e.target.value) })}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
                
                <Card className="bg-muted/50 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA Cobrado (sobre ventas):</span>
                      <span className="font-semibold">
                        {formatCurrency(
                          ingresos.totalBruto * 
                          ((opex?.porcentaje_ingresos_iva ?? 0) / 100) * 
                          ((opex?.tarifa_iva ?? 19) / 100),
                          currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">IVA Pagado (estimado):</span>
                      <CurrencyInput
                        value={opex?.iva_pagado_estimado ?? 0}
                        onChange={(value) => updateOpex({ iva_pagado_estimado: value })}
                        currency={currency}
                        className="w-32 h-8"
                      />
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base">
                      <span className="font-bold">IVA Neto a Pagar:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(
                          Math.max(0, 
                            (ingresos.totalBruto * 
                            ((opex?.porcentaje_ingresos_iva ?? 0) / 100) * 
                            ((opex?.tarifa_iva ?? 19) / 100)) -
                            (opex?.iva_pagado_estimado ?? 0)
                          ),
                          currency
                        )}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Retenciones */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">🧾 Retenciones</Label>
              <Switch
                checked={opex?.incluir_retenciones ?? false}
                onCheckedChange={(checked) => updateOpex({ incluir_retenciones: checked })}
              />
            </div>
            
            {opex?.incluir_retenciones && (
              <div className="space-y-2">
                {(opex?.retenciones || []).map((item, idx) => (
                  <Card key={idx} className="p-2 bg-muted/50">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input
                          placeholder="Tipo (ej: Retefte ICA)"
                          value={item.concepto || ''}
                          onChange={(e) => updateRetencion(idx, { concepto: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <Select
                          value={item.base || 'ingresos'}
                          onValueChange={(v) => updateRetencion(idx, { base: v as 'ingresos' | 'compras' })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ingresos">Ingresos</SelectItem>
                            <SelectItem value="compras">Compras</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 flex gap-1 items-center">
                        <Input
                          type="number"
                          placeholder="%"
                          value={item.porcentaje || 0}
                          onChange={(e) => updateRetencion(idx, { porcentaje: Number(e.target.value) })}
                          className="h-8 text-sm"
                          min="0"
                          step="0.1"
                        />
                        <span className="text-xs">%</span>
                      </div>
                      <div className="col-span-1 text-right text-xs font-semibold text-amber-600">
                        {formatCurrency(
                          (item.base === 'ingresos' ? ingresos.totalBruto : ingresos.totalBruto * 0.3) * 
                          ((item.porcentaje || 0) / 100),
                          currency
                        )}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => removeRetencion(idx)} className="h-7 w-7 p-0">
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                <Button variant="outline" size="sm" onClick={addRetencion} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Retención
                </Button>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 12. OTROS GASTOS */}
      <AccordionItem value="otros" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-semibold">12. Otros Gastos</span>
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

      {/* 13. COMISIONES VARIABLES */}
      <AccordionItem value="comisiones" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <Percent className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span className="font-semibold">13. Comisiones Variables</span>
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
                  <div className="flex items-start gap-2">
                    <Input
                      placeholder="Concepto (ej: Comisión ventas)"
                      value={com.concepto}
                      onChange={(e) => updateComision(idx, { concepto: e.target.value })}
                      className="h-8 flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComision(idx)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-6">
                      <Label className="text-xs text-muted-foreground">Base de cálculo</Label>
                      <Select
                        value={com.base || 'ingresos-brutos'}
                        onValueChange={(v) => updateComision(idx, { base: v as ComisionItem['base'] })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ingresos-brutos">💰 Ingresos Brutos</SelectItem>
                          <SelectItem value="ingresos-netos">📉 Ingresos Netos</SelectItem>
                          <SelectItem value="utilidades">📊 Utilidades (EBITDA)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-6">
                      <Label className="text-xs text-muted-foreground">Porcentaje</Label>
                      <div className="flex gap-1 items-center">
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
                    </div>
                  </div>
                  
                  {/* Calculation details card */}
                  <Card className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 p-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Base ({
                            com.base === 'ingresos-brutos' ? 'Ingresos Brutos' :
                            com.base === 'ingresos-netos' ? 'Ingresos Netos' :
                            com.base === 'utilidades' ? 'Utilidades' :
                            'Ingresos Brutos'
                          }):
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(getComisionBaseValue(com.base), currency)}
                        </span>
                      </div>
                      {com.base === 'utilidades' && (
                        <div className="text-[10px] text-muted-foreground">
                          = Ingresos Brutos ({formatCurrency(ingresos.totalBruto, currency)}) - OPEX sin comisiones ({formatCurrency(opexSinComisiones, currency)})
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">× {com.porcentaje || 0}%</span>
                        <span></span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex justify-between text-sm">
                        <span className="font-bold">Comisión:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(
                            getComisionBaseValue(com.base) * ((com.porcentaje || 0) / 100),
                            currency
                          )}
                        </span>
                      </div>
                    </div>
                  </Card>
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

      {/* 14. DEPRECIACIÓN (with optional checkbox) */}
      <AccordionItem value="depreciacion" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="font-semibold">14. Depreciación</span>
            </div>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {opex?.incluir_depreciacion !== false ? "(Ver Resumen)" : "(Excluida)"}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluir-depreciacion"
              checked={opex?.incluir_depreciacion !== false}
              onCheckedChange={(checked) => updateOpex({ incluir_depreciacion: !!checked })}
            />
            <Label htmlFor="incluir-depreciacion" className="cursor-pointer">
              Incluir depreciación en el OPEX
            </Label>
          </div>
          
          <Alert className={cn(
            opex?.incluir_depreciacion !== false 
              ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" 
              : "bg-muted/50"
          )}>
            <Info className="w-4 h-4" />
            <AlertDescription>
              {opex?.incluir_depreciacion !== false 
                ? "La depreciación se calculará automáticamente y se incluirá en el OPEX mensual."
                : "La depreciación NO se incluirá en el OPEX mensual. Útil para análisis de flujo de caja."}
            </AlertDescription>
          </Alert>
          
          {opex?.incluir_depreciacion !== false && (
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
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
