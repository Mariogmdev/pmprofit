import { TrendingUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityConfig } from '@/types/activity';

interface ActivityOccupationEditorProps {
  config: ActivityConfig;
  onUpdate: (updates: Partial<ActivityConfig>) => void;
}

export default function ActivityOccupationEditor({ config, onUpdate }: ActivityOccupationEditorProps) {
  const updateOccupation = (ano: number, field: 'pico' | 'valle', value: number) => {
    const updatedOccupation = config.ocupacionAnual.map((o) =>
      o.ano === ano ? { ...o, [field]: Math.min(100, Math.max(0, value)) } : o
    );
    onUpdate({ ocupacionAnual: updatedOccupation });
  };

  const applyAutoGrowth = () => {
    if (!config.crecimientoAutomatico) return;
    
    const rate = config.tasaCrecimiento / 100;
    const baseOccupation = config.ocupacionAnual[0] || { pico: 60, valle: 30 };
    
    const updatedOccupation = config.ocupacionAnual.map((o, index) => ({
      ...o,
      pico: Math.min(100, Math.round(baseOccupation.pico * (1 + rate * index))),
      valle: Math.min(100, Math.round(baseOccupation.valle * (1 + rate * index))),
    }));
    
    onUpdate({ ocupacionAnual: updatedOccupation });
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          3. Proyección de Ocupación (5 años)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto Growth Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Switch
              id="autoGrowth"
              checked={config.crecimientoAutomatico}
              onCheckedChange={(checked) => {
                onUpdate({ crecimientoAutomatico: checked });
                if (checked) {
                  setTimeout(() => applyAutoGrowth(), 0);
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
                  onUpdate({ tasaCrecimiento: parseFloat(e.target.value) || 0 });
                  setTimeout(() => applyAutoGrowth(), 0);
                }}
                className="w-20 h-8"
              />
              <span className="text-sm">%</span>
            </div>
          )}
        </div>

        {/* Occupation Table */}
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
                        onChange={(e) => updateOccupation(year.ano, 'pico', parseInt(e.target.value) || 0)}
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
                        onChange={(e) => updateOccupation(year.ano, 'valle', parseInt(e.target.value) || 0)}
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
      </CardContent>
    </Card>
  );
}
