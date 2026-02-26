import { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  DollarSign,
  Clock,
  Calculator,
  MapPin,
  Calendar,
  Percent,
  BarChart3,
} from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { CURRENCIES, CurrencyCode, PROJECTION_YEARS_OPTIONS, Project } from '@/types';
import {
  calculateHoursPerDay,
  calculateHoursPerMonth,
  calculateDaysPerYear,
  formatTime,
  generateHourOptions,
  generateMinuteOptions,
} from '@/lib/time';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const configSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  location: z.string().optional(),
  area_total: z.number().min(0, 'El área debe ser mayor a 0').optional().nullable(),
  opening_date: z.date().optional().nullable(),
  currency: z.string(),
  custom_currency_code: z.string().optional(),
  custom_currency_symbol: z.string().optional(),
  discount_rate: z.number().min(0).max(100, 'Debe ser entre 0% y 100%'),
  inflation_rate: z.number().min(-10).max(50, 'Debe ser entre -10% y 50%'),
  projection_years: z.number(),
  working_capital_months: z.number().min(0).max(12, 'Debe ser entre 0 y 12 meses'),
  occupancy_growth_rate: z.number().min(0).max(20),
  tax_rate: z.number().min(0).max(50),
  residual_asset_rate: z.number().min(0).max(80),
  opening_hour: z.number().min(0).max(23),
  opening_minute: z.number(),
  closing_hour: z.number().min(0).max(23),
  closing_minute: z.number(),
  days_per_month: z.number().min(1).max(31),
  weekend_different: z.boolean(),
  weekend_opening_hour: z.number().optional().nullable(),
  weekend_closing_hour: z.number().optional().nullable(),
  holidays_different: z.boolean(),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function ConfigurationTab() {
  const { currentProject, updateProject } = useProject();
  const [customCurrency, setCustomCurrency] = useState(false);

  const hourOptions = useMemo(() => generateHourOptions(), []);
  const minuteOptions = useMemo(() => generateMinuteOptions(), []);

  const getDefaultValues = useCallback((project: Project | null): ConfigFormData => ({
    name: project?.name || '',
    location: project?.location || '',
    area_total: project?.area_total || null,
    opening_date: project?.opening_date ? new Date(project.opening_date) : null,
    currency: project?.currency || 'COP',
    custom_currency_code: '',
    custom_currency_symbol: '',
    discount_rate: project?.discount_rate || 15,
    inflation_rate: project?.inflation_rate || 3.5,
    projection_years: project?.projection_years || 5,
    working_capital_months: project?.working_capital_months ?? 3,
    occupancy_growth_rate: project?.occupancy_growth_rate ?? 5,
    tax_rate: project?.tax_rate ?? 35,
    residual_asset_rate: project?.residual_asset_rate ?? 40,
    opening_hour: project?.opening_hour || 6,
    opening_minute: project?.opening_minute || 0,
    closing_hour: project?.closing_hour || 22,
    closing_minute: project?.closing_minute || 0,
    days_per_month: project?.days_per_month || 30,
    weekend_different: project?.weekend_different || false,
    weekend_opening_hour: project?.weekend_opening_hour || null,
    weekend_closing_hour: project?.weekend_closing_hour || null,
    holidays_different: project?.holidays_different || false,
  }), []);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: getDefaultValues(currentProject),
  });

  // Reset form when project changes
  useEffect(() => {
    if (currentProject) {
      reset(getDefaultValues(currentProject));
    }
  }, [currentProject?.id, reset, getDefaultValues]);

  const watchedValues = watch();
  const selectedCurrency = watchedValues.currency;
  const weekendDifferent = watchedValues.weekend_different;

  // Auto-save functionality
  useEffect(() => {
    if (!currentProject || !isDirty) return;

    const saveTimeout = setTimeout(() => {
      handleSubmit(onSubmit)();
    }, 30000); // 30 seconds

    return () => clearTimeout(saveTimeout);
  }, [watchedValues, isDirty, currentProject]);

  const onSubmit = async (data: ConfigFormData) => {
    if (!currentProject) return;

    const updates: Partial<Project> = {
      name: data.name,
      location: data.location || null,
      area_total: data.area_total,
      opening_date: data.opening_date?.toISOString().split('T')[0] || null,
      currency: (customCurrency ? 'CUSTOM' : data.currency) as CurrencyCode,
      currency_symbol: customCurrency
        ? data.custom_currency_symbol || '$'
        : CURRENCIES[data.currency as keyof typeof CURRENCIES]?.symbol || '$',
      discount_rate: data.discount_rate,
      inflation_rate: data.inflation_rate,
      projection_years: data.projection_years,
      working_capital_months: data.working_capital_months,
      occupancy_growth_rate: data.occupancy_growth_rate,
      tax_rate: data.tax_rate,
      residual_asset_rate: data.residual_asset_rate,
      opening_hour: data.opening_hour,
      opening_minute: data.opening_minute,
      closing_hour: data.closing_hour,
      closing_minute: data.closing_minute,
      days_per_month: data.days_per_month,
      weekend_different: data.weekend_different,
      weekend_opening_hour: data.weekend_opening_hour,
      weekend_closing_hour: data.weekend_closing_hour,
      holidays_different: data.holidays_different,
    };

    await updateProject(currentProject.id, updates);
  };

  // Calculated values
  const hoursPerDay = useMemo(() => {
    return calculateHoursPerDay(
      watchedValues.opening_hour,
      watchedValues.opening_minute,
      watchedValues.closing_hour,
      watchedValues.closing_minute
    );
  }, [
    watchedValues.opening_hour,
    watchedValues.opening_minute,
    watchedValues.closing_hour,
    watchedValues.closing_minute,
  ]);

  const hoursPerMonth = useMemo(() => {
    return calculateHoursPerMonth(hoursPerDay, watchedValues.days_per_month);
  }, [hoursPerDay, watchedValues.days_per_month]);

  const daysPerYear = useMemo(() => {
    return calculateDaysPerYear(watchedValues.days_per_month);
  }, [watchedValues.days_per_month]);

  const operatingHoursDisplay = useMemo(() => {
    return `${formatTime(watchedValues.opening_hour, watchedValues.opening_minute)} - ${formatTime(watchedValues.closing_hour, watchedValues.closing_minute)}`;
  }, [
    watchedValues.opening_hour,
    watchedValues.opening_minute,
    watchedValues.closing_hour,
    watchedValues.closing_minute,
  ]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No hay proyecto seleccionado
          </h3>
          <p className="text-muted-foreground">
            Crea o selecciona un proyecto para comenzar a configurarlo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 animate-fade-in">
      {/* Sección 1: Información Básica */}
      <section className="card-section">
        <h2 className="card-section-header">
          <Building2 className="w-5 h-5 text-primary" />
          Información Básica
        </h2>

        <div className="form-section">
          <div className="form-row">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Proyecto *</Label>
              <Input
                id="name"
                placeholder="Ej: Club Deportivo Norte"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="input-error">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                <MapPin className="w-4 h-4 inline mr-1" />
                Ubicación
              </Label>
              <Input
                id="location"
                placeholder="Ej: Bogotá, Colombia"
                {...register('location')}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="space-y-2">
              <Label htmlFor="area_total">Área Total (m²)</Label>
              <Input
                id="area_total"
                type="number"
                placeholder="Ej: 5000"
                {...register('area_total', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha Apertura Estimada
              </Label>
              <Controller
                name="opening_date"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sección 2: Configuración Financiera */}
      <section className="card-section">
        <h2 className="card-section-header">
          <DollarSign className="w-5 h-5 text-primary" />
          Configuración Financiera
        </h2>

        <div className="form-section">
          <div className="space-y-4">
            <Label className="text-base font-medium">💱 Moneda Base</Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={customCurrency ? 'CUSTOM' : field.value}
                  onValueChange={(value) => {
                    if (value === 'CUSTOM') {
                      setCustomCurrency(true);
                    } else {
                      setCustomCurrency(false);
                      field.onChange(value);
                    }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                >
                  {Object.values(CURRENCIES).map((currency) => (
                    <div
                      key={currency.code}
                      className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <RadioGroupItem value={currency.code} id={currency.code} />
                      <Label htmlFor={currency.code} className="cursor-pointer flex-1">
                        <span className="font-medium">{currency.code}</span>
                        <span className="text-muted-foreground ml-1">
                          - {currency.name} ({currency.symbol})
                        </span>
                      </Label>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                    <RadioGroupItem value="CUSTOM" id="CUSTOM" />
                    <Label htmlFor="CUSTOM" className="cursor-pointer">
                      Personalizada
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />

            {customCurrency && (
              <div className="form-row pl-6 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="custom_currency_code">Código ISO</Label>
                  <Input
                    id="custom_currency_code"
                    placeholder="XXX"
                    maxLength={3}
                    {...register('custom_currency_code')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom_currency_symbol">Símbolo</Label>
                  <Input
                    id="custom_currency_symbol"
                    placeholder="$"
                    maxLength={3}
                    {...register('custom_currency_symbol')}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <Label className="text-base font-medium mb-4 block">
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Parámetros Financieros
            </Label>

            <div className="form-row-3">
              <div className="space-y-2">
                <Label htmlFor="discount_rate">
                  <Percent className="w-4 h-4 inline mr-1" />
                  Tasa de Descuento (VAN)
                </Label>
                <div className="relative">
                  <Input
                    id="discount_rate"
                    type="number"
                    step="0.1"
                    {...register('discount_rate', { valueAsNumber: true })}
                    className={errors.discount_rate ? 'border-destructive pr-8' : 'pr-8'}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
                {errors.discount_rate && (
                  <p className="input-error">{errors.discount_rate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="inflation_rate">Inflación Anual Proyectada</Label>
                <div className="relative">
                  <Input
                    id="inflation_rate"
                    type="number"
                    step="0.1"
                    {...register('inflation_rate', { valueAsNumber: true })}
                    className={errors.inflation_rate ? 'border-destructive pr-8' : 'pr-8'}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
                {errors.inflation_rate && (
                  <p className="input-error">{errors.inflation_rate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="projection_years">Horizonte de Proyección</Label>
                <Controller
                  name="projection_years"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECTION_YEARS_OPTIONS.map((years) => (
                          <SelectItem key={years} value={years.toString()}>
                            {years} años
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="working_capital_months" className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Capital de Trabajo (meses OPEX)
                </Label>
                <div className="relative">
                  <Input
                    id="working_capital_months"
                    type="number"
                    min="0"
                    max="12"
                    step="1"
                    {...register('working_capital_months', { valueAsNumber: true })}
                    className={errors.working_capital_months ? 'border-destructive pr-16' : 'pr-16'}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    meses
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Reserva de liquidez para cubrir operación inicial. Típicamente 2-4 meses.
                </p>
                {errors.working_capital_months && (
                  <p className="input-error">{errors.working_capital_months.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Supuestos del Modelo */}
          <div className="mt-6 pt-6 border-t border-border">
            <Label className="text-base font-medium mb-4 block">
              <Calculator className="w-4 h-4 inline mr-2" />
              Supuestos del Modelo
            </Label>

            <div className="form-row-3">
              <div className="space-y-2">
                <Label htmlFor="occupancy_growth_rate">
                  Crecimiento Ocupación Anual
                </Label>
                <div className="relative">
                  <Input
                    id="occupancy_growth_rate"
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    {...register('occupancy_growth_rate', { valueAsNumber: true })}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %/año
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Incremento en ocupación cada año hasta alcanzar el máximo (95%)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_rate">
                  Impuesto a la Renta
                </Label>
                <div className="relative">
                  <Input
                    id="tax_rate"
                    type="number"
                    step="1"
                    min="0"
                    max="50"
                    {...register('tax_rate', { valueAsNumber: true })}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Colombia: 35% | Zona franca: 20% | Ajustar según régimen
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="residual_asset_rate">
                  Valor Residual de Activos
                </Label>
                <div className="relative">
                  <Input
                    id="residual_asset_rate"
                    type="number"
                    step="5"
                    min="0"
                    max="80"
                    {...register('residual_asset_rate', { valueAsNumber: true })}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  % del CAPEX (sin WC) recuperable al final. 40% es conservador.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 3: Horarios de Operación */}
      <section className="card-section">
        <h2 className="card-section-header">
          <Clock className="w-5 h-5 text-primary" />
          Horarios de Operación
        </h2>

        <div className="form-section">
          <div className="form-row-3">
            <div className="space-y-2">
              <Label>Hora Apertura</Label>
              <div className="flex gap-2">
                <Controller
                  name="opening_hour"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hourOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Controller
                  name="opening_minute"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {minuteOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            :{option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hora Cierre</Label>
              <div className="flex gap-2">
                <Controller
                  name="closing_hour"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hourOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Controller
                  name="closing_minute"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {minuteOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            :{option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="days_per_month">Días Operación/Mes</Label>
              <Input
                id="days_per_month"
                type="number"
                min={1}
                max={31}
                {...register('days_per_month', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <Controller
              name="weekend_different"
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weekend_different"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="weekend_different" className="cursor-pointer">
                    Fines de semana tienen horario diferente
                  </Label>
                </div>
              )}
            />

            {weekendDifferent && (
              <div className="form-row pl-6 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label>Hora Apertura (Fin de semana)</Label>
                  <Controller
                    name="weekend_opening_hour"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString() || '8'}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {hourOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora Cierre (Fin de semana)</Label>
                  <Controller
                    name="weekend_closing_hour"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString() || '20'}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {hourOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            )}

            <Controller
              name="holidays_different"
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="holidays_different"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="holidays_different" className="cursor-pointer">
                    Festivos tienen horario diferente
                  </Label>
                </div>
              )}
            />
          </div>
        </div>
      </section>

      {/* Sección 4: Cálculos Automáticos */}
      <section className="info-box">
        <h2 className="card-section-header">
          <Calculator className="w-5 h-5 text-info" />
          Resumen Operativo
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
          <div>
            <p className="text-sm text-muted-foreground">Horas operación/día</p>
            <p className="text-2xl font-semibold text-foreground">
              {hoursPerDay.toFixed(1)} <span className="text-sm font-normal">hrs</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Horas operación/mes</p>
            <p className="text-2xl font-semibold text-foreground">
              {hoursPerMonth.toFixed(0)} <span className="text-sm font-normal">hrs</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Días operación/año</p>
            <p className="text-2xl font-semibold text-foreground">
              {daysPerYear} <span className="text-sm font-normal">días</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Horario</p>
            <p className="text-lg font-semibold text-foreground">
              {operatingHoursDisplay}
            </p>
          </div>
        </div>
      </section>

      {/* Save button (hidden, auto-save is enabled) */}
      <div className="flex justify-end">
        <Button type="submit" className="gap-2">
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
}
