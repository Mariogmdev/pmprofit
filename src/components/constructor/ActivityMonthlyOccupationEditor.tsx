import { useState } from 'react';
import { TrendingUp, Calendar, LineChart } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityConfig, OccupationMonth, OccupationYear } from '@/types/activity';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types';

interface ActivityMonthlyOccupationEditorProps {
  config: ActivityConfig;
  onUpdate: (updates: Partial<ActivityConfig>) => void;
  currency: string;
  monthlyIncome: (pico: number, valle: number) => number; // Function to calculate income for given occupation
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

export default function ActivityMonthlyOccupationEditor({ 
  config, 
  onUpdate,
  currency,
  monthlyIncome,
}: ActivityMonthlyOccupationEditorProps) {
  const [curveType, setCurveType] = useState<CurveType>('lineal');
  const [startPico, setStartPico] = useState(40);
  const [startValle, setStartValle] = useState(20);
  const [endPico, setEndPico] = useState(80);
  const [endValle, setEndValle] = useState(50);

  const ocupacionMensual = config.ocupacionMensual || DEFAULT_MONTHLY_OCCUPATION;

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
  const applyCurve = () => {
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
    
    onUpdate({ ocupacionMensual: newOccupation });
  };

  // Calculate average occupation for Year 1
  const avgPicoAno1 = Math.round(ocupacionMensual.reduce((sum, o) => sum + o.pico, 0) / 12);
  const avgValleAno1 = Math.round(ocupacionMensual.reduce((sum, o) => sum + o.valle, 0) / 12);
  const avgPromedioAno1 = Math.round((avgPicoAno1 + avgValleAno1) / 2);

  // Calculate total annual income
  const ingresoAnualAno1 = ocupacionMensual.reduce((sum, o) => sum + monthlyIncome(o.pico, o.valle), 0);
  const ingresoMensualPromedioAno1 = ingresoAnualAno1 / 12;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          3. Proyección de Ocupación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
                    const promedio = (year.pico + year.valle) / 2;
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
            {/* Curve Generator */}
            <div className="p-4 border rounded-lg space-y-3 bg-muted/20">
              <Label className="text-sm font-medium">📈 Aplicar Curva de Crecimiento Automática</Label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Mes 1 - Pico</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="h-8"
                      value={startPico}
                      onChange={(e) => setStartPico(parseInt(e.target.value) || 0)}
                    />
                    <span className="text-xs">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mes 1 - Valle</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="h-8"
                      value={startValle}
                      onChange={(e) => setStartValle(parseInt(e.target.value) || 0)}
                    />
                    <span className="text-xs">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mes 12 - Pico</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="h-8"
                      value={endPico}
                      onChange={(e) => setEndPico(parseInt(e.target.value) || 0)}
                    />
                    <span className="text-xs">%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mes 12 - Valle</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="h-8"
                      value={endValle}
                      onChange={(e) => setEndValle(parseInt(e.target.value) || 0)}
                    />
                    <span className="text-xs">%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Label className="text-xs">Tipo curva:</Label>
                <RadioGroup
                  value={curveType}
                  onValueChange={(v: CurveType) => setCurveType(v)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lineal" id="curve-lineal" />
                    <Label htmlFor="curve-lineal" className="text-xs cursor-pointer">Lineal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="s-curve" id="curve-s" />
                    <Label htmlFor="curve-s" className="text-xs cursor-pointer">S-Curve</Label>
                  </div>
                </RadioGroup>
                
                <Button size="sm" variant="outline" onClick={applyCurve}>
                  Aplicar Curva
                </Button>
              </div>
            </div>

            {/* Monthly Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Mes</th>
                    <th className="text-center py-2 px-2 font-medium text-orange-600">Pico (%)</th>
                    <th className="text-center py-2 px-2 font-medium text-blue-600">Valle (%)</th>
                    <th className="text-center py-2 px-2 font-medium">Promedio</th>
                    <th className="text-right py-2 px-2 font-medium">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {ocupacionMensual.map((month) => {
                    const promedio = (month.pico + month.valle) / 2;
                    const income = monthlyIncome(month.pico, month.valle);
                    return (
                      <tr key={month.mes} className="border-b">
                        <td className="py-2 px-2 font-medium">
                          {MONTH_NAMES[month.mes - 1]} (M{month.mes})
                        </td>
                        <td className="py-1 px-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={month.pico}
                            onChange={(e) => updateMonthlyOccupation(month.mes, 'pico', parseInt(e.target.value) || 0)}
                            className="w-16 h-7 text-center mx-auto text-xs"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={month.valle}
                            onChange={(e) => updateMonthlyOccupation(month.mes, 'valle', parseInt(e.target.value) || 0)}
                            className="w-16 h-7 text-center mx-auto text-xs"
                          />
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
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Promedio Año 1:</span>
                <span className="font-medium">
                  Pico {avgPicoAno1}% | Valle {avgValleAno1}% | Promedio {avgPromedioAno1}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ingresos promedio/mes Año 1:</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(ingresoMensualPromedioAno1, currency as CurrencyCode)}
                </span>
              </div>
            </div>

            {/* Years 2-5 Projection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Proyección Años 2-5:</Label>
              <div className="grid grid-cols-4 gap-2">
                {config.ocupacionAnual.slice(1).map((year) => (
                  <div key={year.ano} className="p-2 border rounded-lg space-y-1">
                    <Label className="text-xs block text-center">Año {year.ano}</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={year.pico}
                        onChange={(e) => updateAnnualOccupation(year.ano, 'pico', parseInt(e.target.value) || 0)}
                        className="w-full h-7 text-xs text-center"
                        placeholder="Pico"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={year.valle}
                        onChange={(e) => updateAnnualOccupation(year.ano, 'valle', parseInt(e.target.value) || 0)}
                        className="w-full h-7 text-xs text-center"
                        placeholder="Valle"
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      P:{year.pico}% V:{year.valle}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}