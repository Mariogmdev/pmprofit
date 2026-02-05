import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Calendar, LineChart, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { ActivityConfig, OccupationMonth, OccupationYear, ActivitySchedule } from '@/types/activity';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types';

interface ActivityMonthlyOccupationEditorProps {
  config: ActivityConfig;
  onUpdate: (updates: Partial<ActivityConfig>) => void;
  currency: string;
  monthlyIncome: (pico: number, valle: number) => number; // Function to calculate income for given occupation
  calculatedOccupancy?: number; // Weighted average occupancy from schedules
  calculatedPico?: number;      // Weighted average of PICO schedules
  calculatedValle?: number;     // Weighted average of VALLE schedules
  horasPico?: number;           // Total hours of PICO schedules
  horasValle?: number;          // Total hours of VALLE schedules
}

type CurveType = 'lineal' | 's-curve';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const DEFAULT_MONTHLY_OCCUPATION: OccupationMonth[] = [
  { mes: 1, pico: 40, valle: 20 },
  { mes: 2, pico: 45, valle: 22 },
  { mes: 3, pico: 50, valle: 25 },
  { mes: 4, pico: 55, valle: 28 },
  { mes: 5, pico: 60, valle: 30 },
  { mes: 6, pico: 65, valle: 35 },
  { mes: 7, pico: 68, valle: 38 },
  { mes: 8, pico: 70, valle: 40 },
  { mes: 9, pico: 72, valle: 42 },
  { mes: 10, pico: 75, valle: 45 },
  { mes: 11, pico: 78, valle: 48 },
  { mes: 12, pico: 80, valle: 50 },
];

// Calculate average occupation by type (pico/valle) from schedules - WEIGHTED BY DAYS
const calculateAverageOccupationByType = (horarios: ActivitySchedule[]) => {
  console.log('=== Calculating Occupation by Type (WEIGHTED) ===');
  
  // Separate schedules by day type
  const horariosLV = horarios.filter(h => h.diaSemana === 'LV' || !h.diaSemana);
  const horariosSD = horarios.filter(h => h.diaSemana === 'SD');
  
  // Calculate weekly hours (L-V: 5 days, S-D: 2 days)
  let horasPicoSemana = 0;
  let horasValleSemana = 0;
  let sumOcupacionPicoSemana = 0;
  let sumOcupacionValleSemana = 0;
  
  // L-V schedules (5 days per week)
  horariosLV.forEach(horario => {
    const horasPorDia = Math.max(0, horario.fin - horario.inicio);
    const horasSemana = horasPorDia * 5; // 5 days L-V
    
    if (horario.tipo === 'pico') {
      horasPicoSemana += horasSemana;
      sumOcupacionPicoSemana += horario.ocupacion * horasSemana;
    } else {
      horasValleSemana += horasSemana;
      sumOcupacionValleSemana += horario.ocupacion * horasSemana;
    }
  });
  
  // S-D schedules (2 days per week)
  horariosSD.forEach(horario => {
    const horasPorDia = Math.max(0, horario.fin - horario.inicio);
    const horasSemana = horasPorDia * 2; // 2 days S-D
    
    if (horario.tipo === 'pico') {
      horasPicoSemana += horasSemana;
      sumOcupacionPicoSemana += horario.ocupacion * horasSemana;
    } else {
      horasValleSemana += horasSemana;
      sumOcupacionValleSemana += horario.ocupacion * horasSemana;
    }
  });
  
  const totalHorasSemana = horasPicoSemana + horasValleSemana;
  
  const ocupacionPromedioPico = horasPicoSemana > 0 
    ? sumOcupacionPicoSemana / horasPicoSemana 
    : 50;
  const ocupacionPromedioValle = horasValleSemana > 0 
    ? sumOcupacionValleSemana / horasValleSemana 
    : 30;
  const ocupacionPromedioTotal = totalHorasSemana > 0 
    ? (sumOcupacionPicoSemana + sumOcupacionValleSemana) / totalHorasSemana 
    : (ocupacionPromedioPico + ocupacionPromedioValle) / 2;
  
  console.log('Horas Pico semana:', horasPicoSemana);
  console.log('Horas Valle semana:', horasValleSemana);
  console.log('Total horas semana:', totalHorasSemana);
  console.log('% Pico:', totalHorasSemana > 0 ? ((horasPicoSemana / totalHorasSemana) * 100).toFixed(1) : 0);
  console.log('% Valle:', totalHorasSemana > 0 ? ((horasValleSemana / totalHorasSemana) * 100).toFixed(1) : 0);
  console.log('Ocupación Pico promedio:', ocupacionPromedioPico.toFixed(1));
  console.log('Ocupación Valle promedio:', ocupacionPromedioValle.toFixed(1));
  console.log('Ocupación Total promedio:', ocupacionPromedioTotal.toFixed(1));
  console.log('=== END ===');
  
  return {
    pico: Math.round(ocupacionPromedioPico),
    valle: Math.round(ocupacionPromedioValle),
    promedio: Math.round(ocupacionPromedioTotal),
    // Return weighted hours for display
    horasPicoSemana,
    horasValleSemana,
    totalHorasSemana
  };
};

export default function ActivityMonthlyOccupationEditor({ 
  config, 
  onUpdate,
  currency,
  monthlyIncome,
  calculatedOccupancy = 0,
  calculatedPico = 0,
  calculatedValle = 0,
  horasPico = 0,
  horasValle = 0,
}: ActivityMonthlyOccupationEditorProps) {
  const [curveType, setCurveType] = useState<CurveType>('lineal');
  const [maduracionFactor, setMaduracionFactor] = useState(1.0); // 100% - Month 12 target (equal to schedules)
  const [inicioFactor, setInicioFactor] = useState(0.7); // 70% - Month 1 start
  
  // Base occupation from schedules - WITH WEIGHTED HOURS
  const ocupacionBase = useMemo(() => {
    const result = calculateAverageOccupationByType(config.horarios || []);
    console.log('Occupation base calculated:', result);
    return result;
  }, [config.horarios]);
  
  // Use the calculated weighted hours from ocupacionBase (fallback to props)
  const horasPicoCalculadas = ocupacionBase.horasPicoSemana || horasPico || 0;
  const horasValleCalculadas = ocupacionBase.horasValleSemana || horasValle || 0;
  const totalHoras = horasPicoCalculadas + horasValleCalculadas;
  
  // Calculate weighted average for any pico/valle values
  const calculateWeightedAverage = (pico: number, valle: number): number => {
    if (totalHoras === 0) return (pico + valle) / 2;
    return (pico * horasPicoCalculadas + valle * horasValleCalculadas) / totalHoras;
  };
  
  // Hours distribution percentage for display
  const porcentajePico = totalHoras > 0 ? (horasPicoCalculadas / totalHoras) * 100 : 50;
  const porcentajeValle = totalHoras > 0 ? (horasValleCalculadas / totalHoras) * 100 : 50;
  
  // Check if Year 1 projection is realistic vs schedule occupancy
  const year1Avg = config.ocupacionAnual[0] 
    ? calculateWeightedAverage(config.ocupacionAnual[0].pico, config.ocupacionAnual[0].valle)
    : 0;
  const occupancyDiff = calculatedOccupancy > 0 ? year1Avg - calculatedOccupancy : 0;
  const isOptimistic = occupancyDiff > 15;
  const isPessimistic = occupancyDiff < -15;

  const ocupacionMensual = config.ocupacionMensual || DEFAULT_MONTHLY_OCCUPATION;

  // Calculate Year 1 averages from monthly data
  const year1MonthlyAverages = useMemo(() => {
    const avgPico = Math.round(ocupacionMensual.reduce((sum, o) => sum + o.pico, 0) / 12);
    const avgValle = Math.round(ocupacionMensual.reduce((sum, o) => sum + o.valle, 0) / 12);
    return { pico: avgPico, valle: avgValle };
  }, [ocupacionMensual]);

  // Sync Year 1 in ocupacionAnual when monthly data changes (only in monthly mode)
  useEffect(() => {
    if (config.modoOcupacion === 'mensual') {
      const currentYear1 = config.ocupacionAnual[0];
      if (
        currentYear1 &&
        (currentYear1.pico !== year1MonthlyAverages.pico || 
         currentYear1.valle !== year1MonthlyAverages.valle)
      ) {
        const updatedAnual = [...config.ocupacionAnual];
        updatedAnual[0] = {
          ...updatedAnual[0],
          pico: year1MonthlyAverages.pico,
          valle: year1MonthlyAverages.valle,
        };
        onUpdate({ ocupacionAnual: updatedAnual });
      }
    }
  }, [config.modoOcupacion, year1MonthlyAverages, config.ocupacionAnual]);

  const updateMonthlyOccupation = (mes: number, field: 'pico' | 'valle', value: number) => {
    const updated = ocupacionMensual.map((o) =>
      o.mes === mes ? { ...o, [field]: Math.min(100, Math.max(0, value)) } : o
    );
    onUpdate({ ocupacionMensual: updated });
  };

  const updateAnnualOccupation = (ano: number, field: 'pico' | 'valle', value: number) => {
    const updated = config.ocupacionAnual.map((o) =>
      o.ano === ano ? { ...o, [field]: Math.min(100, Math.max(0, value)) } : o
    );
    onUpdate({ ocupacionAnual: updated });
  };

  // Apply automatic curve
  // Generate monthly projection based on schedule base occupation and growth factors
  const generateMonthlyProjection = () => {
    const basePico = ocupacionBase.pico || calculatedPico || 50;
    const baseValle = ocupacionBase.valle || calculatedValle || 30;
    
    console.log('=== GENERATING MONTHLY PROJECTION ===');
    console.log('Base Pico:', basePico, 'Base Valle:', baseValle);
    console.log('Inicio factor:', inicioFactor, 'Madurez factor:', maduracionFactor);
    
    // Month 1 starts at inicio factor of base
    // Month 12 ends at maduracion factor of base
    const startPico = Math.min(100, Math.round(basePico * inicioFactor));
    const startValle = Math.min(100, Math.round(baseValle * inicioFactor));
    const endPico = Math.min(100, Math.round(basePico * maduracionFactor));
    const endValle = Math.min(100, Math.round(baseValle * maduracionFactor));
    
    console.log('Start Pico:', startPico, 'Start Valle:', startValle);
    console.log('End Pico:', endPico, 'End Valle:', endValle);
    
    const newOccupation: OccupationMonth[] = [];
    
    for (let i = 0; i < 12; i++) {
      let factor: number;
      
      if (curveType === 'lineal') {
        factor = i / 11;
      } else {
        // S-curve: slow start, fast middle, slow end
        const x = i / 11;
        factor = 1 / (1 + Math.exp(-10 * (x - 0.5)));
      }
      
      newOccupation.push({
        mes: i + 1,
        pico: Math.round(startPico + (endPico - startPico) * factor),
        valle: Math.round(startValle + (endValle - startValle) * factor),
      });
    }
    
    console.log('Generated occupations:', newOccupation);
    console.log('Month 1:', newOccupation[0]);
    console.log('Month 7:', newOccupation[6]);
    console.log('Month 12:', newOccupation[11]);
    console.log('=== END GENERATION ===');
    
    onUpdate({ ocupacionMensual: newOccupation });
  };
  
  // Force regeneration clearing old data first
  const forceRegenerateProjection = () => {
    console.log('=== FORCE REGENERATE: Clearing old data ===');
    // Clear existing monthly data first, then regenerate
    onUpdate({ ocupacionMensual: [] });
    // Use setTimeout to ensure state update propagates before regenerating
    setTimeout(() => {
      generateMonthlyProjection();
    }, 100);
  };

  // Calculate average occupation for Year 1 (monthly mode)
  const avgPicoAno1 = year1MonthlyAverages.pico;
  const avgValleAno1 = year1MonthlyAverages.valle;
  // Use weighted average based on hours distribution
  const avgPromedioAno1 = Math.round(calculateWeightedAverage(avgPicoAno1, avgValleAno1));

  // Calculate total annual income (sum of all 12 months)
  const ingresoAnualAno1 = ocupacionMensual.reduce((sum, o) => sum + monthlyIncome(o.pico, o.valle), 0);
  const ingresoMensualPromedioAno1 = ingresoAnualAno1 / 12;
  
  // Calculate income for each month individually
  const ingresosPerMonth = useMemo(() => 
    ocupacionMensual.map(o => monthlyIncome(o.pico, o.valle)),
    [ocupacionMensual, monthlyIncome]
  );

  // BASE INCOME: Income at 100% maturity using target occupations from schedules
  // This is the "Ingresos Base" shown in the educational panel
  const ingresoBase100Madurez = useMemo(() => {
    // Use the target occupations (what schedules define as 100% maturity)
    const picoObjetivo = ocupacionBase.pico || calculatedPico || 50;
    const valleObjetivo = ocupacionBase.valle || calculatedValle || 30;
    return monthlyIncome(picoObjetivo, valleObjetivo);
  }, [monthlyIncome, ocupacionBase, calculatedPico, calculatedValle]);

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          3. Proyección de Ocupación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Educational Context Card */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
            📊 Entendiendo las Proyecciones
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2 bg-white/60 dark:bg-black/20 rounded">
              <span className="font-medium text-emerald-700 dark:text-emerald-300">Ocupación Objetivo:</span>
              <span className="ml-1 font-bold text-emerald-800 dark:text-emerald-200">{calculatedOccupancy.toFixed(0)}%</span>
              <p className="text-emerald-600 dark:text-emerald-400 mt-0.5">
                De tus horarios (100% madurez)
              </p>
            </div>
            <div className="p-2 bg-white/60 dark:bg-black/20 rounded">
              <span className="font-medium text-emerald-700 dark:text-emerald-300">Ingresos Base:</span>
              <span className="ml-1 font-bold text-emerald-800 dark:text-emerald-200">{formatCurrency(ingresoBase100Madurez, currency as CurrencyCode)}/mes</span>
              <p className="text-emerald-600 dark:text-emerald-400 mt-0.5">
                Al 100% madurez ({calculatedOccupancy.toFixed(0)}% ocupación)
              </p>
            </div>
            <div className="p-2 bg-white/60 dark:bg-black/20 rounded">
              <span className="font-medium text-emerald-700 dark:text-emerald-300">Curva Año 1:</span>
              <span className="ml-1 font-bold text-emerald-800 dark:text-emerald-200">{Math.round(inicioFactor * 100)}% → {Math.round(maduracionFactor * 100)}%</span>
              <p className="text-emerald-600 dark:text-emerald-400 mt-0.5">
                Proyecto arranca bajo, crece gradualmente
              </p>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center justify-center gap-4 p-3 bg-muted/50 rounded-lg">
          <RadioGroup
            value={config.modoOcupacion || 'anual'}
            onValueChange={(value: 'anual' | 'mensual') => {
              onUpdate({ 
                modoOcupacion: value,
                ocupacionMensual: value === 'mensual' && !config.ocupacionMensual 
                  ? DEFAULT_MONTHLY_OCCUPATION 
                  : config.ocupacionMensual,
              });
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="anual" id="modo-anual" />
              <Label htmlFor="modo-anual" className="cursor-pointer flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Anual (simplificado)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mensual" id="modo-mensual" />
              <Label htmlFor="modo-mensual" className="cursor-pointer flex items-center gap-1">
                <LineChart className="h-4 w-4" />
                Mensual Año 1 (detallado)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* ANNUAL MODE */}
        {config.modoOcupacion !== 'mensual' && (
          <>
            {/* Calculated Occupancy Reference */}
            {calculatedOccupancy > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      💡 Basado en tus horarios, la ocupación promedio calculada es {calculatedOccupancy.toFixed(0)}%
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Pico: {calculatedPico.toFixed(0)}% • Valle: {calculatedValle.toFixed(0)}%
                      <br />
                      Usa estos valores como punto de partida realista para Año 1
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Apply the ACTUAL calculated pico and valle values from schedules
                      const updated = [...config.ocupacionAnual];
                      updated[0] = { 
                        ...updated[0], 
                        pico: Math.round(calculatedPico),
                        valle: Math.round(calculatedValle)
                      };
                      onUpdate({ ocupacionAnual: updated });
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Aplicar {calculatedPico.toFixed(0)}%/{calculatedValle.toFixed(0)}%
                  </button>
                </div>
              </div>
            )}
            
            {/* Warning if projection differs too much from schedule */}
            {calculatedOccupancy > 0 && (isOptimistic || isPessimistic) && (
              <div className={`p-3 rounded-lg border ${isOptimistic ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'}`}>
                <p className="text-sm font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  {isOptimistic 
                    ? `Tu proyección Año 1 (${year1Avg.toFixed(0)}%) es ${occupancyDiff.toFixed(0)}% mayor que tu ocupación de horarios (${calculatedOccupancy.toFixed(0)}%). Esto puede ser optimista.`
                    : `Tu proyección Año 1 (${year1Avg.toFixed(0)}%) es ${Math.abs(occupancyDiff).toFixed(0)}% menor que tu ocupación de horarios (${calculatedOccupancy.toFixed(0)}%). Esto puede ser conservador.`
                  }
                </p>
              </div>
            )}
          
            {/* Auto Growth Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Switch
                  id="autoGrowth"
                  checked={config.crecimientoAutomatico}
                  onCheckedChange={(checked) => {
                    onUpdate({ crecimientoAutomatico: checked });
                    if (checked) {
                      const rate = config.tasaCrecimiento / 100;
                      const base = config.ocupacionAnual[0];
                      const updated = config.ocupacionAnual.map((o, index) => ({
                        ...o,
                        pico: Math.min(100, Math.round(base.pico * (1 + rate * index))),
                        valle: Math.min(100, Math.round(base.valle * (1 + rate * index))),
                      }));
                      onUpdate({ ocupacionAnual: updated });
                    }
                  }}
                />
                <Label htmlFor="autoGrowth" className="cursor-pointer">
                  Aplicar crecimiento automático
                </Label>
              </div>
              {config.crecimientoAutomatico && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Tasa anual:</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={config.tasaCrecimiento}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) / 100 || 0;
                      const base = config.ocupacionAnual[0];
                      const updated = config.ocupacionAnual.map((o, index) => ({
                        ...o,
                        pico: Math.min(100, Math.round(base.pico * (1 + rate * index))),
                        valle: Math.min(100, Math.round(base.valle * (1 + rate * index))),
                      }));
                      onUpdate({ 
                        tasaCrecimiento: parseFloat(e.target.value) || 0,
                        ocupacionAnual: updated,
                      });
                    }}
                    className="w-20 h-8"
                  />
                  <span className="text-sm">%</span>
                </div>
              )}
            </div>

            {/* Annual Occupation Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Año</th>
                    <th className="text-center py-2 px-3 font-medium text-orange-600">Pico (%)</th>
                    <th className="text-center py-2 px-3 font-medium text-blue-600">Valle (%)</th>
                    <th className="text-center py-2 px-3 font-medium">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {config.ocupacionAnual.map((year) => {
                    // Use weighted average based on hours distribution
                    const promedio = calculateWeightedAverage(year.pico, year.valle);
                    return (
                      <tr key={year.ano} className="border-b">
                        <td className="py-2 px-3 font-medium">Año {year.ano}</td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={year.pico}
                            onChange={(e) => updateAnnualOccupation(year.ano, 'pico', parseInt(e.target.value) || 0)}
                            disabled={config.crecimientoAutomatico && year.ano > 1}
                            className="w-20 h-8 text-center mx-auto"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={year.valle}
                            onChange={(e) => updateAnnualOccupation(year.ano, 'valle', parseInt(e.target.value) || 0)}
                            disabled={config.crecimientoAutomatico && year.ano > 1}
                            className="w-20 h-8 text-center mx-auto"
                          />
                        </td>
                        <td className="py-2 px-3 text-center text-muted-foreground">
                          {promedio.toFixed(0)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* MONTHLY MODE */}
        {config.modoOcupacion === 'mensual' && (
          <>
            {/* Hours Distribution Info */}
            {totalHoras > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-700 dark:text-blue-300 font-medium">
                      Distribución de horas por unidad (semanal):
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                      <strong>Pico:</strong> {horasPicoCalculadas.toFixed(1)} hrs/sem por unidad ({porcentajePico.toFixed(0)}%) • 
                      <strong>Valle:</strong> {horasValleCalculadas.toFixed(1)} hrs/sem por unidad ({porcentajeValle.toFixed(0)}%)
                    </p>
                    <p className="text-blue-600/80 dark:text-blue-400/80 text-xs mt-1">
                      El promedio de cada mes se calcula: (Pico × {porcentajePico.toFixed(0)}% + Valle × {porcentajeValle.toFixed(0)}%) 
                    </p>
                  </div>
                </div>
              </div>
            )}
          
            {/* Simplified Slider-Based Configuration */}
            <div className="p-4 border rounded-lg space-y-5 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-900/20 dark:to-blue-900/20">
              <div>
                <Label className="text-sm font-medium">📈 Configuración de Curva de Crecimiento</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Basado en tu ocupación promedio ponderada: <span className="font-medium">{ocupacionBase.promedio}%</span>
                  {' '}(Pico: {ocupacionBase.pico}%, Valle: {ocupacionBase.valle}%)
                </p>
              </div>
              
              {/* Curve Type */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Tipo de curva:</Label>
                <RadioGroup
                  value={curveType}
                  onValueChange={(v: CurveType) => setCurveType(v)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lineal" id="curve-lineal" />
                    <Label htmlFor="curve-lineal" className="text-sm cursor-pointer">
                      Lineal (crecimiento constante)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="s-curve" id="curve-s" />
                    <Label htmlFor="curve-s" className="text-sm cursor-pointer">
                      S-Curve (lento inicio, rápido medio, lento final)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Maturity Factor Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    🎯 Madurez del proyecto (Mes 12): {Math.round(maduracionFactor * 100)}%
                  </Label>
                  <span className="text-sm font-medium text-primary">
                    Pico {Math.min(100, Math.round(ocupacionBase.pico * maduracionFactor))}%, 
                    Valle {Math.min(100, Math.round(ocupacionBase.valle * maduracionFactor))}%
                  </span>
                </div>
                <Slider
                  value={[maduracionFactor]}
                  onValueChange={(v) => setMaduracionFactor(v[0])}
                  min={0.8}
                  max={1.0}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>80% (conservador)</span>
                  <span>100% (igual a horarios)</span>
                </div>
              </div>

              {/* Start Factor Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    🚀 Inicio del proyecto (Mes 1): {Math.round(inicioFactor * 100)}%
                  </Label>
                  <span className="text-sm font-medium text-amber-600">
                    Pico {Math.round(ocupacionBase.pico * inicioFactor)}%, 
                    Valle {Math.round(ocupacionBase.valle * inicioFactor)}%
                  </span>
                </div>
                <Slider
                  value={[inicioFactor]}
                  onValueChange={(v) => setInicioFactor(v[0])}
                  min={0.3}
                  max={1.0}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>30% (arranque muy lento)</span>
                  <span>70%</span>
                  <span>100% (desde el inicio)</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={generateMonthlyProjection} className="flex-1" size="lg">
                  Generar Proyección Mensual
                </Button>
                <Button 
                  onClick={forceRegenerateProjection} 
                  variant="outline" 
                  size="lg"
                  className="flex-1"
                  title="Limpia datos viejos y regenera la proyección desde cero"
                >
                  🔄 Regenerar (Limpiar Datos Viejos)
                </Button>
              </div>
            </div>

            {/* Monthly Table - Read Only */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-2 px-2 font-medium">Mes</th>
                    <th className="text-center py-2 px-2 font-medium text-orange-600">
                      Pico (%)
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        ({porcentajePico.toFixed(0)}% hrs)
                      </span>
                    </th>
                    <th className="text-center py-2 px-2 font-medium text-blue-600">
                      Valle (%)
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        ({porcentajeValle.toFixed(0)}% hrs)
                      </span>
                    </th>
                    <th className="text-center py-2 px-2 font-medium">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              Promedio
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              Promedio ponderado:<br />
                              (Pico × {horasPico.toFixed(1)}h + Valle × {horasValle.toFixed(1)}h) / {totalHoras.toFixed(1)}h
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="text-right py-2 px-2 font-medium">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {ocupacionMensual.map((month, idx) => {
                    const promedio = calculateWeightedAverage(month.pico, month.valle);
                    const income = ingresosPerMonth[idx];
                    return (
                      <tr key={month.mes} className="border-b hover:bg-muted/20">
                        <td className="py-2 px-2 font-medium">
                          {MONTH_NAMES[month.mes - 1]} (M{month.mes})
                        </td>
                        <td className="py-2 px-2 text-center text-orange-600 font-medium">
                          {month.pico}%
                        </td>
                        <td className="py-2 px-2 text-center text-blue-600 font-medium">
                          {month.valle}%
                        </td>
                        <td className="py-2 px-2 text-center text-muted-foreground">
                          {promedio.toFixed(0)}%
                        </td>
                        <td className="py-2 px-2 text-right text-muted-foreground text-xs">
                          {formatCurrency(income, currency as CurrencyCode)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Year 1 Summary */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">Promedio Año 1 (de 12 meses):</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pico: {avgPicoAno1}% • Valle: {avgValleAno1}% • 
                    <span className="font-medium ml-1">Promedio ponderado: {avgPromedioAno1}%</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Ingreso Año 1</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(ingresoAnualAno1, currency as CurrencyCode)}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Ingresos promedio/mes:</span>
                <span className="font-semibold">
                  {formatCurrency(ingresoMensualPromedioAno1, currency as CurrencyCode)}
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground italic">
                ✓ Estos promedios se sincronizan automáticamente con el Año 1 de la proyección anual
              </p>
            </div>

            {/* Years 2-5 Projection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Proyección Años 2-5 (simplificado):</Label>
              <p className="text-xs text-muted-foreground">
                Ingresa los valores de ocupación proyectados. El promedio del Año 1 ({avgPicoAno1}%/{avgValleAno1}%) 
                se calcula automáticamente desde los datos mensuales.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {config.ocupacionAnual.slice(1).map((year) => {
                  const yearPromedio = calculateWeightedAverage(year.pico, year.valle);
                  return (
                    <div key={year.ano} className="p-2 border rounded-lg space-y-1">
                      <Label className="text-xs block text-center font-medium">Año {year.ano}</Label>
                      <div className="flex gap-1">
                        <div className="flex-1">
                          <Label className="text-[10px] text-orange-600">Pico</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={year.pico}
                            onChange={(e) => updateAnnualOccupation(year.ano, 'pico', parseInt(e.target.value) || 0)}
                            className="w-full h-7 text-xs text-center"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-[10px] text-blue-600">Valle</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={year.valle}
                            onChange={(e) => updateAnnualOccupation(year.ano, 'valle', parseInt(e.target.value) || 0)}
                            className="w-full h-7 text-xs text-center"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        Prom: {yearPromedio.toFixed(0)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}