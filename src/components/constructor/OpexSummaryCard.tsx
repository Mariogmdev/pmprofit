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
    // Payroll from activities
    const nominaActividades = activities.reduce((sum, act) => {
      const config: ActivityConfig = act.config;
      const personal = config.personal || [];
      return sum + personal.reduce((s, p) => s + ((p.cantidad || 0) * (p.salarioMensual || 0)), 0);
    }, 0);

    // Maintenance from activities (annual cost / 12 for monthly)
    const mantenimientoActividades = activities.reduce((sum, act) => {
      const config: ActivityConfig = act.config;
      const mantenimiento = config.mantenimiento || [];
      const costoAnual = mantenimiento.reduce((s, m) => s + (m.costoAnual || 0), 0);
      return sum + (costoAnual / 12);
    }, 0);

    // Monthly revenue from activities (simplified estimate)
    const ingresosMensuales = activities.reduce((sum, act) => {
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
      return sum + ingresoEstimado;
    }, 0);

    // CAPEX calculation for depreciation
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

    // Calculate individual categories
    const nominaAdmin = (opex?.nomina_administrativa || []).reduce(
      (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
    );
    const nominaOperativo = (opex?.nomina_operativa || []).reduce(
      (s, i) => s + ((i.cantidad || 0) * (i.salarioMensual || 0)), 0
    );
    const nominaBase = nominaAdmin + nominaOperativo + nominaActividades;
    const prestaciones = nominaBase * ((opex?.prestaciones_porcentaje || 53.94) / 100);
    const totalNomina = nominaBase + prestaciones;

    // Rent
    let arrendamiento = 0;
    const modelo = opex?.arrendamiento_modelo || 'propio';
    if (modelo === 'fijo') arrendamiento = opex?.arrendamiento_fijo || 0;
    if (modelo === 'variable') arrendamiento = ingresosMensuales * ((opex?.arrendamiento_variable_porcentaje || 0) / 100);
    if (modelo === 'mixto') {
      arrendamiento = (opex?.arrendamiento_mixto_fijo || 0) + 
                      ingresosMensuales * ((opex?.arrendamiento_mixto_porcentaje || 0) / 100);
    }

    // Other categories
    const serviciosPublicos = (opex?.servicios_publicos || []).reduce((s, i) => s + (i.costoMensual || 0), 0);
    const marketing = (opex?.marketing || []).reduce((s, i) => s + (i.costoMensual || 0), 0);
    const tecnologia = (opex?.tecnologia || []).reduce((s, i) => s + (i.costoMensual || 0), 0);
    const seguros = (opex?.seguros || []).reduce((s, i) => s + (i.costoMensual || 0), 0);
    const mantenimientoGeneral = (opex?.mantenimiento_general || []).reduce((s, i) => s + (i.costoMensual || 0), 0);
    const administrativos = (opex?.administrativos || []).reduce((s, i) => s + (i.costoMensual || 0), 0);
    const otrosGastos = (opex?.otros_gastos || []).reduce((s, i) => s + (i.costoMensual || 0), 0);

    // Depreciation
    const depreciacionAnos = opex?.depreciacion_anos || 10;
    const depreciacion = capexTotal / depreciacionAnos / 12;

    // Total OPEX
    const opexMensualTotal = totalNomina + arrendamiento + serviciosPublicos + marketing +
      tecnologia + seguros + mantenimientoGeneral + mantenimientoActividades +
      administrativos + otrosGastos + depreciacion;

    // Metrics
    const opexComoPorcentaje = ingresosMensuales > 0 ? (opexMensualTotal / ingresosMensuales) * 100 : 0;
    const ebitdaMensual = ingresosMensuales - (opexMensualTotal - depreciacion);
    const margenEbitda = ingresosMensuales > 0 ? (ebitdaMensual / ingresosMensuales) * 100 : 0;

    return {
      totalNomina,
      arrendamiento,
      serviciosPublicos,
      marketing,
      tecnologia,
      seguros,
      mantenimientoGeneral: mantenimientoGeneral + mantenimientoActividades,
      administrativos,
      otrosGastos,
      depreciacion,
      opexMensualTotal,
      ingresosMensuales,
      opexComoPorcentaje,
      ebitdaMensual,
      margenEbitda,
      capexTotal,
      depreciacionAnos
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
            <span className="text-muted-foreground">Seguros:</span>
            <span className="font-semibold">{formatCurrency(summary.seguros, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mantenimiento:</span>
            <span className="font-semibold">{formatCurrency(summary.mantenimientoGeneral, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Administrativos:</span>
            <span className="font-semibold">{formatCurrency(summary.administrativos, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Otros Gastos:</span>
            <span className="font-semibold">{formatCurrency(summary.otrosGastos, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Depreciación:</span>
            <span className="font-semibold">{formatCurrency(summary.depreciacion, currency)}</span>
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
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Depreciación: {formatCurrency(summary.capexTotal, currency)} ÷ {summary.depreciacionAnos} años ÷ 12 meses
              </span>
              <span className="font-semibold">{formatCurrency(summary.depreciacion, currency)}/mes</span>
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
