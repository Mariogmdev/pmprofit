import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useProjectOpex } from '@/hooks/useProjectOpex';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { useProjectSpaces } from '@/hooks/useProjectSpaces';
import { useObraCivil } from '@/hooks/useObraCivil';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types/index';
import { ActivityConfig } from '@/types/activity';
import { ServiceItem, RentCalculationBase } from '@/types/opex';
import { Receipt, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpexSummaryCardProps {
  projectId: string;
  currency: CurrencyCode;
}

export const OpexSummaryCard = ({ projectId, currency }: OpexSummaryCardProps) => {
  const { opex } = useProjectOpex(projectId);
  const { activities } = useProjectActivities();
  const { spaces } = useProjectSpaces(projectId);
  const { obraCivil } = useObraCivil(projectId);

  const summary = useMemo(() => {
    // === INCOME CALCULATIONS ===
    let ingresosBrutos = 0;
    let ingresosOperacionales = 0;
    let totalReservas = 0;

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
      const duracion = config.duracionReserva || 1.5;
      const reservasPorDia = horasOperacion * ocupacionPromedio / duracion;
      const ingresoEstimado = cantidad * tarifaPromedio * horasOperacion * ocupacionPromedio * diasMes / duracion;
      
      ingresosBrutos += ingresoEstimado;
      ingresosOperacionales += ingresoEstimado;
      totalReservas += cantidad * reservasPorDia * diasMes;
    });

    const ingresosNetos = ingresosBrutos * 0.85; // 15% third-party costs

    // === HELPER: Calculate reservations for specific activities ===
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

    // === PAYROLL FROM ACTIVITIES ===
    const nominaActividades = activities.reduce((sum, act) => {
      const config: ActivityConfig = act.config;
      const personal = config.personal || [];
      return sum + personal.reduce((s, p) => s + ((p.cantidad || 0) * (p.salarioMensual || 0)), 0);
    }, 0);

    // === MAINTENANCE FROM ACTIVITIES ===
    const mantenimientoActividades = activities.reduce((sum, act) => {
      const config: ActivityConfig = act.config;
      const mantenimiento = config.mantenimiento || [];
      const costoAnual = mantenimiento.reduce((s, m) => s + (m.costoAnual || 0), 0);
      return sum + (costoAnual / 12);
    }, 0);

    // === CAPEX CALCULATION ===
    const capexActividades = activities.reduce((sum, activity) => {
      const config: ActivityConfig = activity.config;
      const cantidad = config.cantidad || 1;
      const tipoCubierta = config.tipoCubierta || 'cubierta';
      let capexConstruccion = 0;
      if (tipoCubierta === 'cubierta') {
        capexConstruccion = (config.capexCubierta || 0) * cantidad;
      } else if (tipoCubierta === 'semicubierta') {
        capexConstruccion = (config.capexSemicubierta || 0) * cantidad;
      } else {
        capexConstruccion = (config.capexAireLibre || 0) * cantidad;
      }
      const equipamientoTotal = (config.equipamientoEspecifico || []).reduce(
        (s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0
      );
      const consumiblesTotal = (config.consumibles || []).reduce(
        (s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0
      );
      const mobiliarioTotal = (config.mobiliario || []).reduce(
        (s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0
      );
      return sum + capexConstruccion + equipamientoTotal + consumiblesTotal + mobiliarioTotal;
    }, 0);

    const capexEspacios = spaces.reduce((sum, space) => {
      const breakdownTotal = (space.breakdown || []).reduce(
        (s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0
      );
      return sum + breakdownTotal;
    }, 0);

    const capexObraCivil = obraCivil?.capex_obra_civil_total || 0;
    const capexTotal = capexActividades + capexEspacios + capexObraCivil;

    // === HELPER: Calculate category total with variable types (FIXED) ===
    const calculateCategoryTotal = (items: ServiceItem[]) => {
      if (!items || items.length === 0) return 0;
      return items.reduce((sum, item) => {
        const tipo = item.tipo || 'fijo';
        if (tipo === 'fijo') {
          return sum + (item.costoMensual || 0);
        } else if (tipo === 'porcentaje-facturacion') {
          return sum + (ingresosBrutos * ((item.porcentaje || 0) / 100));
        } else if (tipo === 'por-reserva') {
          const reservasAplicables = calculateReservasForActivities(item.actividadesIncluidas);
          const reservasConPorcentaje = reservasAplicables * ((item.porcentajeReservas || 100) / 100);
          return sum + ((item.costoPorReserva || 0) * reservasConPorcentaje);
        }
        return sum;
      }, 0);
    };

    // === 1. PAYROLL ===
    const nominaAdmin = (opex?.nomina_administrativa || []).reduce(
      (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
    );
    const nominaOperativo = (opex?.nomina_operativa || []).reduce(
      (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
    );
    const nominaBase = nominaAdmin + nominaOperativo + nominaActividades;
    const prestaciones = nominaBase * ((opex?.prestaciones_porcentaje || 53.94) / 100);
    const totalNomina = nominaBase + prestaciones;

    // === 2-9. CATEGORIES (FIXED) ===
    const serviciosPublicos = calculateCategoryTotal(opex?.servicios_publicos || []);
    const marketing = calculateCategoryTotal(opex?.marketing || []);
    const tecnologia = calculateCategoryTotal(opex?.tecnologia || []);
    const seguridad = calculateCategoryTotal(opex?.seguridad || []);
    const seguros = calculateCategoryTotal(opex?.seguros || []);
    const mantenimientoGeneral = calculateCategoryTotal(opex?.mantenimiento_general || []);
    const administrativos = calculateCategoryTotal(opex?.administrativos || []);
    const otrosGastos = calculateCategoryTotal(opex?.otros_gastos || []);

    // === 10. FINANCIAL EXPENSES (NEW) ===
    let gastosFinancieros = 0;
    
    // 4x1000
    if (opex?.incluir_4x1000) {
      gastosFinancieros += ingresosBrutos * 0.004;
    }
    
    // Bank commissions
    gastosFinancieros += (opex?.comisiones_bancarias || []).reduce(
      (s, i) => s + (i.costoMensual || 0), 0
    );
    
    // Dataphone commissions
    if (opex?.incluir_comision_datafono !== false) {
      gastosFinancieros += ingresosBrutos * 
                          ((opex?.porcentaje_ventas_datafono ?? 70) / 100) * 
                          ((opex?.comision_datafono_porcentaje ?? 2.5) / 100);
    }

    // === 11. TAXES (NEW) ===
    let impuestos = 0;
    
    // IVA
    if (opex?.incluir_iva) {
      const ivaCobrado = ingresosBrutos * 
                         ((opex?.porcentaje_ingresos_iva ?? 0) / 100) * 
                         ((opex?.tarifa_iva ?? 19) / 100);
      impuestos += Math.max(0, ivaCobrado - (opex?.iva_pagado_estimado ?? 0));
    }
    
    // Retentions
    if (opex?.incluir_retenciones) {
      impuestos += (opex?.retenciones || []).reduce((s, i) => {
        const base = i.base === 'ingresos' ? ingresosBrutos : ingresosBrutos * 0.3;
        return s + (base * ((i.porcentaje || 0) / 100));
      }, 0);
    }

    // === DEPRECIATION (OPTIONAL - explicitly check for false) ===
    const depreciacionAnos = opex?.depreciacion_anos || 10;
    const incluirDepreciacion = opex?.incluir_depreciacion !== false;
    const depreciacion = incluirDepreciacion
      ? (capexTotal / depreciacionAnos / 12)
      : 0;

    // === SUBTOTAL (without rent and commissions for calculating utilities) ===
    const opexSinArriendoNiComisiones = totalNomina + serviciosPublicos + marketing +
      tecnologia + seguridad + seguros + mantenimientoGeneral + mantenimientoActividades +
      administrativos + gastosFinancieros + impuestos + otrosGastos + depreciacion;

    // === HELPER: Calculate rent base ===
    const calculateRentBase = (base: RentCalculationBase): number => {
      switch (base) {
        case 'ingresos-brutos':
          return ingresosBrutos;
        case 'ingresos-netos':
          return ingresosNetos;
        case 'utilidades':
          return ingresosBrutos - opexSinArriendoNiComisiones;
        case 'ingresos-operacionales':
          return ingresosOperacionales;
        default:
          return ingresosBrutos;
      }
    };

    // === RENT ===
    let arrendamiento = 0;
    const modelo = opex?.arrendamiento_modelo || 'propio';
    if (modelo === 'fijo') {
      arrendamiento = opex?.arrendamiento_fijo || 0;
    } else if (modelo === 'variable') {
      const base = calculateRentBase(opex?.arrendamiento_variable_base || 'ingresos-brutos');
      arrendamiento = base * ((opex?.arrendamiento_variable_porcentaje || 0) / 100);
    } else if (modelo === 'mixto') {
      const base = calculateRentBase(opex?.arrendamiento_mixto_base || 'ingresos-brutos');
      arrendamiento = (opex?.arrendamiento_mixto_fijo || 0) + 
                      base * ((opex?.arrendamiento_mixto_porcentaje || 0) / 100);
    }

    // === UTILITIES BEFORE COMMISSIONS ===
    // OPEX sin comisiones = todo lo anterior + arrendamiento
    const opexSinComisiones = opexSinArriendoNiComisiones + arrendamiento;
    const utilidadesAntesComisiones = Math.max(0, ingresosBrutos - opexSinComisiones);

    // === COMMISSIONS (FIXED - use real utilities) ===
    const comisiones = (opex?.comisiones || []).reduce((sum, com) => {
      let base = ingresosBrutos;
      if (com.base === 'ingresos-netos') base = ingresosNetos;
      if (com.base === 'utilidades') base = utilidadesAntesComisiones;
      return sum + (base * ((com.porcentaje || 0) / 100));
    }, 0);

    // === TOTAL OPEX ===
    const opexMensualTotal = opexSinComisiones + comisiones;

    // === METRICS ===
    const ebitdaMensual = ingresosBrutos - (opexMensualTotal - depreciacion);
    const opexComoPorcentaje = ingresosBrutos > 0 ? (opexMensualTotal / ingresosBrutos) * 100 : 0;
    const margenEbitda = ingresosBrutos > 0 ? (ebitdaMensual / ingresosBrutos) * 100 : 0;

    return {
      // Categories
      nominaAdmin,
      nominaOperativo,
      nominaActividades,
      prestaciones,
      totalNomina,
      arrendamiento,
      serviciosPublicos,
      marketing,
      tecnologia,
      seguridad,
      seguros,
      mantenimientoGeneral,
      mantenimientoActividades,
      administrativos,
      gastosFinancieros,
      impuestos,
      otrosGastos,
      comisiones,
      depreciacion,
      // Totals
      opexMensualTotal,
      ingresosMensuales: ingresosBrutos,
      opexComoPorcentaje,
      ebitdaMensual,
      margenEbitda,
      capexTotal,
      depreciacionAnos,
      incluirDepreciacion
    };
  }, [opex, activities, spaces, obraCivil]);

  const showWarning = summary.opexComoPorcentaje > 70;

  return (
    <Card className="border-4 border-red-300 dark:border-red-700 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/30 dark:via-orange-950/30 dark:to-yellow-950/30">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <Receipt className="w-7 h-7 text-red-600 dark:text-red-400" />
          Resumen OPEX Mensual Total
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Breakdown by category */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nómina Total:</span>
            <span className="font-semibold">{formatCurrency(summary.totalNomina, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Arrendamiento:</span>
            <span className="font-semibold">{formatCurrency(summary.arrendamiento, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Servicios Públicos:</span>
            <span className="font-semibold">{formatCurrency(summary.serviciosPublicos, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Marketing:</span>
            <span className="font-semibold">{formatCurrency(summary.marketing, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tecnología:</span>
            <span className="font-semibold">{formatCurrency(summary.tecnologia, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seguridad:</span>
            <span className="font-semibold">{formatCurrency(summary.seguridad, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seguros:</span>
            <span className="font-semibold">{formatCurrency(summary.seguros, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mantenimiento:</span>
            <span className="font-semibold">
              {formatCurrency(summary.mantenimientoGeneral + summary.mantenimientoActividades, currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Administrativos:</span>
            <span className="font-semibold">{formatCurrency(summary.administrativos, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gastos Financieros:</span>
            <span className="font-semibold">{formatCurrency(summary.gastosFinancieros, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Impuestos:</span>
            <span className="font-semibold">{formatCurrency(summary.impuestos, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Otros Gastos:</span>
            <span className="font-semibold">{formatCurrency(summary.otrosGastos, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Comisiones:</span>
            <span className="font-semibold">{formatCurrency(summary.comisiones, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Depreciación:</span>
            <span className={cn(
              "font-semibold",
              !summary.incluirDepreciacion && "text-muted-foreground"
            )}>
              {summary.incluirDepreciacion 
                ? formatCurrency(summary.depreciacion, currency)
                : "(No incluida)"
              }
            </span>
          </div>
        </div>
        
        <Separator />
        
        {/* Total OPEX */}
        <Card className="bg-white dark:bg-background border-2 border-red-400 dark:border-red-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">OPEX Mensual Total:</span>
              <span className="text-4xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.opexMensualTotal, currency)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <Card className={cn(
            "border-2",
            showWarning 
              ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700" 
              : "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700"
          )}>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">OPEX como % Ingresos</p>
              <p className={cn(
                "text-3xl font-bold",
                showWarning ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
              )}>
                {summary.opexComoPorcentaje.toFixed(1)}%
              </p>
              {showWarning && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ Muy alto</p>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700">
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">EBITDA Mensual</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(summary.ebitdaMensual, currency)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-300 dark:border-purple-700">
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Margen EBITDA</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {summary.margenEbitda.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Depreciation detail */}
        <Card className={cn("bg-muted/50", !summary.incluirDepreciacion && "opacity-60")}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {summary.incluirDepreciacion 
                  ? `Depreciación: ${formatCurrency(summary.capexTotal, currency)} ÷ ${summary.depreciacionAnos} años ÷ 12 meses`
                  : "Depreciación excluida del OPEX"}
              </span>
              <span className="font-semibold">
                {summary.incluirDepreciacion 
                  ? `${formatCurrency(summary.depreciacion, currency)}/mes`
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {showWarning && (
          <Alert className="bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertTitle className="text-red-700 dark:text-red-400">⚠️ OPEX Alto</AlertTitle>
            <AlertDescription className="text-red-600 dark:text-red-400">
              El OPEX representa el {summary.opexComoPorcentaje.toFixed(1)}% de los ingresos.
              <br />
              <strong>Recomendación:</strong> Mantener OPEX por debajo del 70% de ingresos
              para asegurar rentabilidad sostenible.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
