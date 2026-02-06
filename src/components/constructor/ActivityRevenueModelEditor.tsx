import { DollarSign, Users, Coffee, TrendingUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ActivityConfig, 
  RevenueModel,
  MembershipConfig,
  DailyPassConfig,
  TrafficConfig,
  DEFAULT_MEMBERSHIP_CONFIG,
  DEFAULT_DAILY_PASS_CONFIG,
  DEFAULT_TRAFFIC_CONFIG,
} from '@/types/activity';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode } from '@/types';

interface ActivityRevenueModelEditorProps {
  config: ActivityConfig;
  onUpdate: (updates: Partial<ActivityConfig>) => void;
  currency: string;
  daysPerMonth: number;
  totalClubUsers?: number; // Total users from all activities for traffic calculation
}

export default function ActivityRevenueModelEditor({ 
  config, 
  onUpdate, 
  currency,
  daysPerMonth,
  totalClubUsers = 0,
}: ActivityRevenueModelEditorProps) {
  const membershipConfig = config.membershipConfig || DEFAULT_MEMBERSHIP_CONFIG;
  const dailyPassConfig = config.dailyPassConfig || DEFAULT_DAILY_PASS_CONFIG;
  const trafficConfig = config.trafficConfig || DEFAULT_TRAFFIC_CONFIG;

  const updateMembership = (updates: Partial<MembershipConfig>) => {
    onUpdate({
      membershipConfig: { ...membershipConfig, ...updates },
    });
  };

  const updateDailyPass = (updates: Partial<DailyPassConfig>) => {
    onUpdate({
      dailyPassConfig: { ...dailyPassConfig, ...updates },
    });
  };

  const updateTraffic = (updates: Partial<TrafficConfig>) => {
    onUpdate({
      trafficConfig: { ...trafficConfig, ...updates },
    });
  };

  // Calculate traffic users
  const usuariosDeportivos = Math.round(totalClubUsers * (trafficConfig.porcentajeUsuariosClub / 100));
  const usuariosExternos = trafficConfig.visitantesExternosDia * daysPerMonth;
  const traficoTotal = usuariosDeportivos + usuariosExternos;
  
  // Traffic income calculation
  let ingresosTrafico = 0;
  if (trafficConfig.modeloOperacion === 'propia') {
    const ingresosBrutos = traficoTotal * trafficConfig.ticketPromedio * trafficConfig.consumosPorPersona;
    ingresosTrafico = ingresosBrutos * (1 - trafficConfig.costoVentas / 100);
  } else {
    ingresosTrafico = trafficConfig.ventasOperador * (trafficConfig.comisionConcesion / 100);
  }

  // Membership income
  const ingresosMembresiaAno1 = membershipConfig.miembrosProyectados[0] * membershipConfig.precioMembresia;
  
  // Daily pass income
  const ingresosPasesAno1 = dailyPassConfig.pasesProyectadosDia * daysPerMonth * dailyPassConfig.precioPase;
  
  // Mixed income
  const ingresosMixto = ingresosMembresiaAno1 + ingresosPasesAno1;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          2. Modelo de Ingresos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue Model Selection */}
        <RadioGroup
          value={config.modeloIngreso}
          onValueChange={(value: RevenueModel) => {
            const updates: Partial<ActivityConfig> = { modeloIngreso: value };
            
            // Initialize default configs based on model
            // CRITICAL: 'mixto' needs BOTH membership AND daily pass configs
            if ((value === 'membresia' || value === 'mixto') && !config.membershipConfig) {
              updates.membershipConfig = DEFAULT_MEMBERSHIP_CONFIG;
            }
            if ((value === 'pase-diario' || value === 'mixto') && !config.dailyPassConfig) {
              updates.dailyPassConfig = DEFAULT_DAILY_PASS_CONFIG;
            }
            if (value === 'trafico' && !config.trafficConfig) {
              updates.trafficConfig = DEFAULT_TRAFFIC_CONFIG;
            }
            
            onUpdate(updates);
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="reserva" id="reserva" className="mt-1" />
            <div>
              <Label htmlFor="reserva" className="font-medium cursor-pointer">Por Reserva/Hora</Label>
              <p className="text-xs text-muted-foreground">Canchas, salas, cabinas</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="membresia" id="membresia" className="mt-1" />
            <div>
              <Label htmlFor="membresia" className="font-medium cursor-pointer">Membresía Mensual</Label>
              <p className="text-xs text-muted-foreground">Gimnasio, coworking</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="pase-diario" id="pase-diario" className="mt-1" />
            <div>
              <Label htmlFor="pase-diario" className="font-medium cursor-pointer">Pase Diario</Label>
              <p className="text-xs text-muted-foreground">Entrada por día</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="mixto" id="mixto" className="mt-1" />
            <div>
              <Label htmlFor="mixto" className="font-medium cursor-pointer">Mixto</Label>
              <p className="text-xs text-muted-foreground">Membresía + Pases</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="trafico" id="trafico" className="mt-1" />
            <div>
              <Label htmlFor="trafico" className="font-medium cursor-pointer">Por Tráfico</Label>
              <p className="text-xs text-muted-foreground">F&B, retail, servicios</p>
            </div>
          </div>
        </RadioGroup>

        {/* MEMBERSHIP CONFIG */}
        {(config.modeloIngreso === 'membresia' || config.modeloIngreso === 'mixto') && (
          <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h4 className="font-medium">
                {config.modeloIngreso === 'mixto' ? '💳 Membresías' : 'Configuración Membresía'}
              </h4>
            </div>
            
            {/* Capacity Section */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-3">
              <Label className="text-sm font-medium">🏋️ Capacidad del Espacio</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Capacidad máxima simultánea</Label>
                  <Input
                    type="number"
                    min={1}
                    value={membershipConfig.capacidadMaxima}
                    onChange={(e) => updateMembership({ capacidadMaxima: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cuántas personas pueden estar al mismo tiempo
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Área total (m²)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={config.areaPorUnidad * config.cantidad}
                    onChange={(e) => onUpdate({ areaPorUnidad: (parseFloat(e.target.value) || 0) / config.cantidad })}
                  />
                  {membershipConfig.capacidadMaxima > 0 && (
                    <p className="text-xs text-muted-foreground">
                      → Densidad: {((config.areaPorUnidad * config.cantidad) / membershipConfig.capacidadMaxima).toFixed(1)} m²/persona
                      {((config.areaPorUnidad * config.cantidad) / membershipConfig.capacidadMaxima) < 5 && (
                        <span className="text-amber-600 ml-1">(recomendado: 5-8 m²/persona)</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Membership Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Precio membresía mensual</Label>
                <CurrencyInput
                  value={membershipConfig.precioMembresia}
                  onChange={(value) => updateMembership({ precioMembresia: value })}
                  currency={currency as CurrencyCode}
                />
                <p className="text-xs text-muted-foreground">/mes por persona</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Miembros activos Año 1</Label>
                <Input
                  type="number"
                  min={0}
                  value={membershipConfig.miembrosProyectados[0]}
                  onChange={(e) => {
                    const newVal = parseInt(e.target.value) || 0;
                    const newProyection = [...membershipConfig.miembrosProyectados];
                    newProyection[0] = newVal;
                    updateMembership({ miembrosProyectados: newProyection });
                  }}
                />
                <p className="text-xs text-muted-foreground">que pagan mensualmente</p>
              </div>
            </div>
            
            {/* Rotation Ratio Indicator */}
            {membershipConfig.capacidadMaxima > 0 && membershipConfig.miembrosProyectados[0] > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">📈 Ratio de Rotación:</span>
                  <span className={`font-medium ${
                    membershipConfig.miembrosProyectados[0] / membershipConfig.capacidadMaxima > 6 
                      ? 'text-amber-600' 
                      : 'text-green-600'
                  }`}>
                    {(membershipConfig.miembrosProyectados[0] / membershipConfig.capacidadMaxima).toFixed(1)}×
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {membershipConfig.miembrosProyectados[0]} miembros / {membershipConfig.capacidadMaxima} capacidad = {(membershipConfig.miembrosProyectados[0] / membershipConfig.capacidadMaxima).toFixed(1)}×
                  {membershipConfig.miembrosProyectados[0] / membershipConfig.capacidadMaxima > 6 
                    ? ' ⚠️ Ratio alto, puede haber saturación'
                    : ' ✓ Realista (típico: 3-6×)'
                  }
                </p>
              </div>
            )}

            {/* Growth Projection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">📊 Proyección Miembros (5 años)</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="crecimiento-membresia"
                    checked={membershipConfig.crecimientoAutomatico}
                    onCheckedChange={(checked) => {
                      updateMembership({ crecimientoAutomatico: checked });
                      if (checked) {
                        const base = membershipConfig.miembrosProyectados[0];
                        const rate = membershipConfig.tasaCrecimiento / 100;
                        const max = membershipConfig.maximoMiembros;
                        const newProyection = [base];
                        for (let i = 1; i < 5; i++) {
                          newProyection.push(Math.min(max, Math.round(base * (1 + rate * i))));
                        }
                        updateMembership({ miembrosProyectados: newProyection });
                      }
                    }}
                  />
                  <Label htmlFor="crecimiento-membresia" className="text-xs cursor-pointer">
                    Auto
                  </Label>
                </div>
              </div>
              
              {membershipConfig.crecimientoAutomatico && (
                <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs">Tasa anual</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="w-20 h-8"
                        value={membershipConfig.tasaCrecimiento}
                        onChange={(e) => updateMembership({ tasaCrecimiento: parseFloat(e.target.value) || 0 })}
                      />
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Máximo miembros</Label>
                    <Input
                      type="number"
                      min={1}
                      className="w-24 h-8"
                      value={membershipConfig.maximoMiembros}
                      onChange={(e) => updateMembership({ maximoMiembros: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-5 gap-2">
                {membershipConfig.miembrosProyectados.map((miembros, idx) => (
                  <div key={idx} className="space-y-1">
                    <Label className="text-xs text-center block">Año {idx + 1}</Label>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-center"
                      value={miembros}
                      disabled={membershipConfig.crecimientoAutomatico && idx > 0}
                      onChange={(e) => {
                        const newProyection = [...membershipConfig.miembrosProyectados];
                        newProyection[idx] = parseInt(e.target.value) || 0;
                        updateMembership({ miembrosProyectados: newProyection });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Membership Summary */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ingresos Mensuales Año 1:</span>
                <span className="font-semibold text-primary">
                  {membershipConfig.miembrosProyectados[0]} × {formatCurrency(membershipConfig.precioMembresia, currency as CurrencyCode)} = {formatCurrency(ingresosMembresiaAno1, currency as CurrencyCode)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Ingresos Anuales Año 1:</span>
                <span className="font-medium">
                  {formatCurrency(ingresosMembresiaAno1 * 12, currency as CurrencyCode)}/año
                </span>
              </div>
            </div>
          </div>
        )}

        {/* DAILY PASS CONFIG */}
        {(config.modeloIngreso === 'pase-diario' || config.modeloIngreso === 'mixto') && (
          <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
            <h4 className="font-medium flex items-center gap-2">
              🎟️ {config.modeloIngreso === 'mixto' ? 'Pases Diarios' : 'Configuración Pase Diario'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Precio Pase Diario</Label>
                <CurrencyInput
                  value={dailyPassConfig.precioPase}
                  onChange={(value) => updateDailyPass({ precioPase: value })}
                  currency={currency as CurrencyCode}
                />
                <p className="text-xs text-muted-foreground">/día por persona</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Capacidad Máxima Simultánea</Label>
                <Input
                  type="number"
                  min={1}
                  value={dailyPassConfig.capacidadMaxima}
                  onChange={(e) => updateDailyPass({ capacidadMaxima: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Pases vendidos/día</Label>
                <Input
                  type="number"
                  min={0}
                  value={dailyPassConfig.pasesProyectadosDia}
                  onChange={(e) => updateDailyPass({ pasesProyectadosDia: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Daily Pass Summary */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
              <div className="text-sm text-muted-foreground mb-1">
                {dailyPassConfig.pasesProyectadosDia} pases × {daysPerMonth} días × {formatCurrency(dailyPassConfig.precioPase, currency as CurrencyCode)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">→ Ingresos Pases/mes:</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(ingresosPasesAno1, currency as CurrencyCode)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TRAFFIC CONFIG */}
        {config.modeloIngreso === 'trafico' && (
          <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Configuración Por Tráfico</h4>
            </div>
            
            {/* Traffic Sources */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">📊 Fuentes de Tráfico</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <Label className="text-xs font-medium">1. Usuarios Deportivos (del club)</Label>
                  <p className="text-xs text-muted-foreground">
                    Total usuarios club/mes: {totalClubUsers.toLocaleString()} (auto-calculado)
                  </p>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">% que consume aquí:</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="w-20 h-8"
                      value={trafficConfig.porcentajeUsuariosClub}
                      onChange={(e) => updateTraffic({ porcentajeUsuariosClub: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="text-xs">%</span>
                  </div>
                  <p className="text-xs text-primary font-medium">
                    → {usuariosDeportivos.toLocaleString()} usuarios deportivos/mes
                  </p>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <Label className="text-xs font-medium">2. Externos (no practican deporte)</Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Visitantes/día:</Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-20 h-8"
                      value={trafficConfig.visitantesExternosDia}
                      onChange={(e) => updateTraffic({ visitantesExternosDia: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Días operación: {daysPerMonth}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    → {usuariosExternos.toLocaleString()} usuarios externos/mes
                  </p>
                </div>
              </div>
              
              <div className="p-2 bg-primary/10 rounded text-center">
                <span className="text-sm font-medium">
                  Total Tráfico Mensual: {traficoTotal.toLocaleString()} personas
                </span>
              </div>
            </div>

            {/* Income Model */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">💰 Modelo de Ingresos</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Ticket Promedio</Label>
                  <Input
                    type="number"
                    min={0}
                    value={trafficConfig.ticketPromedio}
                    onChange={(e) => updateTraffic({ ticketPromedio: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Consumos por Persona</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={trafficConfig.consumosPorPersona}
                    onChange={(e) => updateTraffic({ consumosPorPersona: parseFloat(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>

            {/* Operation Model */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">📦 Modelo Operativo</Label>
              <RadioGroup
                value={trafficConfig.modeloOperacion}
                onValueChange={(value: 'propia' | 'concesion') => updateTraffic({ modeloOperacion: value })}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="propia" id="op-propia" />
                  <Label htmlFor="op-propia" className="font-normal cursor-pointer">
                    Operación Propia
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="concesion" id="op-concesion" />
                  <Label htmlFor="op-concesion" className="font-normal cursor-pointer">
                    Concesión
                  </Label>
                </div>
              </RadioGroup>

              {trafficConfig.modeloOperacion === 'propia' ? (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Costo de Ventas (insumos, productos):</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="w-20 h-8"
                      value={trafficConfig.costoVentas}
                      onChange={(e) => updateTraffic({ costoVentas: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="text-xs">%</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Comisión a cobrar:</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="w-20 h-8"
                      value={trafficConfig.comisionConcesion}
                      onChange={(e) => updateTraffic({ comisionConcesion: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="text-xs">%</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ventas estimadas operador/mes:</Label>
                    <Input
                      type="number"
                      min={0}
                      value={trafficConfig.ventasOperador}
                      onChange={(e) => updateTraffic({ ventasOperador: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    (Sin OPEX adicional, operador corre con todo)
                  </p>
                </div>
              )}
            </div>

            {/* Traffic Summary */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {trafficConfig.modeloOperacion === 'propia' ? 'Margen Bruto Mensual:' : 'Ingreso Concesión/mes:'}
                </span>
                <span className="font-semibold text-primary">
                  {formatCurrency(ingresosTrafico, currency as CurrencyCode)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* RESERVATION/MIXED MODEL - Show duration options */}
        {['reserva', 'mixto'].includes(config.modeloIngreso) && (
          <div className="p-4 border rounded-lg space-y-3 bg-muted/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Duración de Reserva</Label>
                <RadioGroup
                  value={config.duracionReserva.toString()}
                  onValueChange={(value) => onUpdate({ duracionReserva: parseFloat(value) })}
                  className="flex flex-wrap gap-3"
                >
                  {[0.5, 1, 1.5, 2].map((duration) => (
                    <div key={duration} className="flex items-center space-x-2">
                      <RadioGroupItem value={duration.toString()} id={`duration-${duration}`} />
                      <Label htmlFor={`duration-${duration}`} className="font-normal cursor-pointer">
                        {duration} {duration === 1 ? 'hora' : 'horas'}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Usuarios por Reserva</Label>
                <Input
                  type="number"
                  min={1}
                  value={config.jugadoresPorReserva}
                  onChange={(e) => onUpdate({ jugadoresPorReserva: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mixed Model Summary */}
        {config.modeloIngreso === 'mixto' && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 space-y-3">
            <h4 className="font-medium text-green-700 dark:text-green-300">📊 Resumen Ingresos Mixto</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Membresías:</span>
                <span className="font-medium">{formatCurrency(ingresosMembresiaAno1, currency as CurrencyCode)}/mes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pases Diarios:</span>
                <span className="font-medium">{formatCurrency(ingresosPasesAno1, currency as CurrencyCode)}/mes</span>
              </div>
              <div className="border-t border-green-200 dark:border-green-700 pt-2 flex justify-between items-center">
                <span className="font-medium">TOTAL:</span>
                <span className="font-bold text-green-600 text-lg">
                  {formatCurrency(ingresosMixto, currency as CurrencyCode)}/mes
                </span>
              </div>
            </div>
            {/* Distribution */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Distribución:</span>
              <span className="font-medium">{ingresosMixto > 0 ? ((ingresosMembresiaAno1 / ingresosMixto) * 100).toFixed(0) : 0}% membresías</span>
              <span>•</span>
              <span className="font-medium">{ingresosMixto > 0 ? ((ingresosPasesAno1 / ingresosMixto) * 100).toFixed(0) : 0}% pases</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}