import { TrendingUp, TrendingDown, DollarSign, Clock, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ActivityCalculations } from '@/types/activity';
import { CurrencyCode } from '@/types';
import { formatCurrency } from '@/lib/currency';

interface ActivityFinancialSummaryProps {
  calculations: ActivityCalculations;
  currency: string;
}

export default function ActivityFinancialSummary({ calculations, currency }: ActivityFinancialSummaryProps) {
  const isPositiveMargin = calculations.margenContribucion > 0;
  
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          7. Resumen Financiero
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2 text-xs">
                  <p><strong>Margen de Contribución:</strong> Ingresos menos costos directos de esta actividad.</p>
                  <p><strong>No incluye:</strong> Arriendo, administración, servicios públicos, marketing, etc.</p>
                  <p className="text-yellow-200 dark:text-yellow-300">💡 Para ver el EBITDA completo del proyecto (con todos los gastos), ir al Dashboard principal.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Monthly Income */}
          <div className="bg-background rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Ingresos/mes</span>
            </div>
            <div className="text-lg font-bold text-primary">
              {formatCurrency(calculations.ingresosMensualesBase, currency as CurrencyCode)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Base (Madurez)
            </div>
          </div>

          {/* Monthly OPEX */}
          <div className="bg-background rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-destructive mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium">OPEX Directo</span>
            </div>
            <div className="text-lg font-bold text-destructive">
              {formatCurrency(calculations.opexMensual, currency as CurrencyCode)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Solo esta actividad
            </div>
          </div>

          {/* Contribution Margin */}
          <div className="bg-background rounded-lg p-3 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-600">Margen Contribución</span>
                    </div>
                    <div className={`text-lg font-bold ${isPositiveMargin ? 'text-green-600' : 'text-destructive'}`}>
                      {formatCurrency(calculations.margenContribucion, currency as CurrencyCode)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {calculations.margenContribucionPorcentaje.toFixed(0)}% del ingreso
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1 text-xs">
                    <p><strong>Margen de Contribución</strong> = Ingresos - Costos Directos</p>
                    <p className="text-muted-foreground">Este NO es el EBITDA del proyecto. No incluye gastos generales (arriendo, admin, servicios).</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* CAPEX */}
          <div className="bg-background rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <span className="text-xs font-medium">CAPEX Actividad</span>
            </div>
            <div className="text-lg font-bold">
              {formatCurrency(calculations.capexTotal, currency as CurrencyCode)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Inversión inicial
            </div>
          </div>

          {/* Payback */}
          <div className="bg-background rounded-lg p-3 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">Payback Actividad</span>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {calculations.paybackActividad > 0 && calculations.paybackActividad < 999 
                        ? `${calculations.paybackActividad.toFixed(0)} meses`
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Solo esta actividad
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1 text-xs">
                    <p><strong>Payback de Actividad</strong> = CAPEX / Margen Contribución</p>
                    <p className="text-muted-foreground">Este es el payback teórico solo de esta actividad. El payback real del proyecto (con todos los gastos) se muestra en el Dashboard.</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-primary/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {calculations.ingresosHorarios > 0 && (
              <div>
                <span className="text-muted-foreground">Ingresos reservas:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(calculations.ingresosHorarios, currency as CurrencyCode)}
                </span>
              </div>
            )}
            {calculations.ingresosMembresiasPases > 0 && (
              <div>
                <span className="text-muted-foreground">Membresías/Pases:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(calculations.ingresosMembresiasPases, currency as CurrencyCode)}
                </span>
              </div>
            )}
            {calculations.ingresosTrafico > 0 && (
              <div>
                <span className="text-muted-foreground">Ingresos tráfico (neto):</span>
                <span className="ml-2 font-medium text-green-600">
                  {formatCurrency(calculations.ingresosTrafico, currency as CurrencyCode)}
                </span>
              </div>
            )}
            {calculations.ingresosClases > 0 && (
              <div>
                <span className="text-muted-foreground">Ingresos clases:</span>
                <span className="ml-2 font-medium text-green-600">
                  {formatCurrency(calculations.ingresosClases, currency as CurrencyCode)}
                </span>
              </div>
            )}
            {calculations.ingresosComplementarios > 0 && (
              <div>
                <span className="text-muted-foreground">Complementarios:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(calculations.ingresosComplementarios, currency as CurrencyCode)}
                </span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Usuarios/mes:</span>
              <span className="ml-2 font-medium">
                {Math.round(calculations.totalUsuariosMes).toLocaleString()}
              </span>
            </div>
            {calculations.opexProfesores > 0 && (
              <div>
                <span className="text-muted-foreground">Costo profesores:</span>
                <span className="ml-2 font-medium text-orange-600">
                  {formatCurrency(calculations.opexProfesores, currency as CurrencyCode)}
                </span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Ingresos anuales (base):</span>
              <span className="ml-2 font-medium">
                {formatCurrency(calculations.ingresosMensualesBase * 12, currency as CurrencyCode)}
              </span>
            </div>
          </div>
        </div>

        {/* Clarification Alert */}
        <Alert className="mt-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
            📊 Este margen solo considera <strong>costos directos</strong> de la actividad. 
            El <strong>EBITDA completo del proyecto</strong> (incluyendo arriendo, administración, servicios públicos, etc.) 
            se muestra en el <Link to="/dashboard" className="underline hover:text-blue-600 font-medium">Dashboard principal</Link>.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
