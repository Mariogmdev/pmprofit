import { TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityCalculations } from '@/types/activity';
import { CurrencyCode } from '@/types';
import { formatCurrency } from '@/lib/currency';

interface ActivityFinancialSummaryProps {
  calculations: ActivityCalculations;
  currency: string;
}

export default function ActivityFinancialSummary({ calculations, currency }: ActivityFinancialSummaryProps) {
  const isPositiveMargin = calculations.margen > 0;
  
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          7. Resumen Financiero
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
              {formatCurrency(calculations.ingresosMensualesAno1, currency as CurrencyCode)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Año 1
            </div>
          </div>

          {/* Monthly OPEX */}
          <div className="bg-background rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-destructive mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium">OPEX/mes</span>
            </div>
            <div className="text-lg font-bold text-destructive">
              {formatCurrency(calculations.opexMensual, currency as CurrencyCode)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Costos operativos
            </div>
          </div>

          {/* Margin */}
          <div className="bg-background rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">Margen</span>
            </div>
            <div className={`text-lg font-bold ${isPositiveMargin ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(calculations.margen, currency as CurrencyCode)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {calculations.margenPorcentaje.toFixed(0)}% del ingreso
            </div>
          </div>

          {/* CAPEX */}
          <div className="bg-background rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <span className="text-xs font-medium">CAPEX Total</span>
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
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Payback</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {calculations.payback > 0 && calculations.payback < 999 
                ? `${calculations.payback.toFixed(1)} meses`
                : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Recuperación inversión
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-primary/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Ingresos por reservas:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(calculations.ingresosHorarios, currency as CurrencyCode)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Ingresos complementarios:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(calculations.ingresosComplementarios, currency as CurrencyCode)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Usuarios/mes:</span>
              <span className="ml-2 font-medium">
                {Math.round(calculations.totalUsuariosMes).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Ingresos anuales (Año 1):</span>
              <span className="ml-2 font-medium">
                {formatCurrency(calculations.ingresosMensualesAno1 * 12, currency as CurrencyCode)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
