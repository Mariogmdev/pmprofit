import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProjectionYear, ProjectionViewMode } from '@/types/dashboard';
import { formatCurrency, formatPercent } from '@/lib/currency';
import { CurrencyCode } from '@/types';
import { cn } from '@/lib/utils';
import { CalendarDays, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

interface ProjectionTableProps {
  proyeccion: ProjectionYear[];
  viewMode: ProjectionViewMode;
  onViewModeChange: (mode: ProjectionViewMode) => void;
  currency: CurrencyCode;
  year1Monthly?: Array<{ mes: string; ingresos: number; opex: number; ebitda: number }>;
}

export const ProjectionTable = ({ 
  proyeccion, 
  viewMode, 
  onViewModeChange,
  currency,
  year1Monthly,
}: ProjectionTableProps) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const monthlyRows = year1Monthly || (() => {
    // Fallback (should be rare): smooth linear ramp 0.7 -> 1.0 to avoid flat months.
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const year = proyeccion[0];
    if (!year) return [];
    return months.map((mes, idx) => {
      const factor = 0.7 + (0.3 * (idx / 11));
      const ingresos = year.ingresosMensuales * factor;
      const opex = year.opexMensual * factor;
      return { mes, ingresos, opex, ebitda: ingresos - opex };
    });
  })();

  // Generate quarterly data
  const generateQuarterlyData = () => {
    return proyeccion.map(year => ({
      year: year.year,
      quarters: [
        { q: 'Q1', ingresos: year.ingresosAnuales * 0.22, opex: year.opexAnual * 0.24, ebitda: year.ebitdaAnual * 0.20 },
        { q: 'Q2', ingresos: year.ingresosAnuales * 0.24, opex: year.opexAnual * 0.25, ebitda: year.ebitdaAnual * 0.23 },
        { q: 'Q3', ingresos: year.ingresosAnuales * 0.26, opex: year.opexAnual * 0.25, ebitda: year.ebitdaAnual * 0.27 },
        { q: 'Q4', ingresos: year.ingresosAnuales * 0.28, opex: year.opexAnual * 0.26, ebitda: year.ebitdaAnual * 0.30 },
      ]
    }));
  };

  return (
    <Card className="border-2 animate-fade-in" style={{ animationDelay: '0.7s' }}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Proyección Financiera
          </CardTitle>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'anual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('anual')}
            >
              Anual
            </Button>
            <Button
              variant={viewMode === 'mensual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('mensual')}
            >
              Mensual Año 1
            </Button>
            <Button
              variant={viewMode === 'trimestral' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('trimestral')}
            >
              Trimestral
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          {viewMode === 'anual' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Año</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">OPEX</TableHead>
                  <TableHead className="text-right">EBITDA</TableHead>
                  <TableHead className="text-right">Margen %</TableHead>
                  <TableHead className="text-right">Flujo Caja</TableHead>
                  <TableHead className="text-right">ROI Acum.</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proyeccion.map((year) => (
                  <TableRow 
                    key={year.year}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      year.paybackAlcanzado && !proyeccion[year.year - 2]?.paybackAlcanzado && "bg-green-50 dark:bg-green-950/20"
                    )}
                    onClick={() => setSelectedYear(selectedYear === year.year ? null : year.year)}
                  >
                    <TableCell className="font-medium">
                      Año {year.year}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(year.ingresosAnuales, currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600 dark:text-red-400">
                      {formatCurrency(year.opexAnual, currency)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-semibold",
                      year.ebitdaAnual >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {formatCurrency(year.ebitdaAnual, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(year.margenEbitda)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      year.flujoCaja >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {formatCurrency(year.flujoCaja, currency)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      year.roiAcumulado >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {formatPercent(year.roiAcumulado)}
                    </TableCell>
                    <TableCell>
                      {year.paybackAlcanzado && !proyeccion[year.year - 2]?.paybackAlcanzado && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {viewMode === 'mensual' && proyeccion[0] && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Mes</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">OPEX</TableHead>
                  <TableHead className="text-right">EBITDA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(monthlyRows || []).map((month, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{month.mes}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(month.ingresos, currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600 dark:text-red-400">
                      {formatCurrency(month.opex, currency)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-semibold",
                      month.ebitda >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {formatCurrency(month.ebitda, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {viewMode === 'trimestral' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Periodo</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">OPEX</TableHead>
                  <TableHead className="text-right">EBITDA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generateQuarterlyData().map((yearData) => (
                  yearData.quarters.map((q, qIdx) => (
                    <TableRow key={`${yearData.year}-${qIdx}`}>
                      <TableCell className="font-medium">
                        A{yearData.year} {q.q}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(q.ingresos, currency)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600 dark:text-red-400">
                        {formatCurrency(q.opex, currency)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono font-semibold",
                        q.ebitda >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {formatCurrency(q.ebitda, currency)}
                      </TableCell>
                    </TableRow>
                  ))
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Payback alcanzado</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span>Valores positivos</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span>Valores negativos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
