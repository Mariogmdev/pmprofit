import { X, Clock, DollarSign, Users, Building2, TrendingUp, ShoppingBag } from 'lucide-react';
import { ModuleData, MODULE_CATEGORIES, MODULE_TYPES } from '@/types';
import { formatCurrency } from '@/lib/currency';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface ModuleDetailModalProps {
  module: ModuleData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ModuleDetailModal({
  module,
  open,
  onOpenChange,
}: ModuleDetailModalProps) {
  const { toast } = useToast();

  if (!module) return null;

  const config = module.default_config;
  const categoryLabel = MODULE_CATEGORIES.find(c => c.id === module.category)?.label || module.category;
  const typeInfo = MODULE_TYPES.find(t => t.id === module.type);

  const handleUseInProject = () => {
    toast({
      title: 'Próximamente',
      description: 'Esta funcionalidad estará disponible en la Fase 3',
    });
  };

  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getCubiertoLabel = (tipo: string) => {
    switch (tipo) {
      case 'cubierta': return 'Cubierta';
      case 'semicubierta': return 'Semicubierta';
      case 'aire-libre': return 'Aire Libre';
      default: return tipo;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{module.icon}</span>
            <div>
              <DialogTitle className="text-xl">{module.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{categoryLabel}</Badge>
                <Badge variant="secondary">{typeInfo?.label}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-6 pb-6">
            {/* Description */}
            <p className="text-muted-foreground">{module.description}</p>

            {/* Configuración Básica */}
            <div>
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-primary" />
                Configuración Básica
              </h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cantidad:</span>
                  <span className="font-medium">{config.cantidad} unidades</span>
                </div>
                {config.duracionReserva && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duración reserva:</span>
                    <span className="font-medium">{config.duracionReserva} horas</span>
                  </div>
                )}
                {config.jugadoresPorReserva && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jugadores por reserva:</span>
                    <span className="font-medium">{config.jugadoresPorReserva} personas</span>
                  </div>
                )}
                {config.tipoCubierta && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo cubierta:</span>
                    <span className="font-medium">{getCubiertoLabel(config.tipoCubierta)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* CAPEX */}
            {(config.capexCubierta || config.capexSemicubierta || config.capexAireLibre) && (
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-primary" />
                  CAPEX
                </h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  {config.capexCubierta && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cubierta:</span>
                      <span className="font-medium">{formatCurrency(config.capexCubierta, 'COP')}</span>
                    </div>
                  )}
                  {config.capexSemicubierta && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Semicubierta:</span>
                      <span className="font-medium">{formatCurrency(config.capexSemicubierta, 'COP')}</span>
                    </div>
                  )}
                  {config.capexAireLibre && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Aire libre:</span>
                      <span className="font-medium">{formatCurrency(config.capexAireLibre, 'COP')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Horarios */}
            {config.horarios && config.horarios.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-primary" />
                  Horarios Típicos
                </h4>
                <div className="bg-muted/50 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-medium">Horario</th>
                        <th className="text-left p-3 font-medium">Rango</th>
                        <th className="text-right p-3 font-medium">Tarifa</th>
                        <th className="text-center p-3 font-medium">Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.horarios.map((h, idx) => (
                        <tr key={idx} className="border-t border-border">
                          <td className="p-3">{h.nombre}</td>
                          <td className="p-3 text-muted-foreground">
                            {formatTime(h.inicio)} - {formatTime(h.fin)}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(h.tarifa, 'COP')}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={h.tipo === 'pico' ? 'default' : 'secondary'}>
                              {h.tipo === 'pico' ? 'Pico' : 'Valle'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Ocupación */}
            {config.ocupacionMes1 && (
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Ocupación Esperada Mes 1
                </h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pico:</span>
                    <span className="font-medium">{config.ocupacionMes1.pico}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valle:</span>
                    <span className="font-medium">{config.ocupacionMes1.valle}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Alquileres */}
            {config.alquileres && config.alquileres.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Alquileres/Complementarios
                </h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  {config.alquileres.map((a, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {a.item}: {a.porcentaje}% usuarios
                      </span>
                      <span className="font-medium">{formatCurrency(a.precio, 'COP')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-border pt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>📊 Usado {module.usage_count} veces</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🏷️ {module.is_system ? 'Módulo del Sistema' : 'Módulo Personal'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📅 Creado: {new Date(module.created_at).toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })}</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 pt-0 border-t border-border mt-4">
          <Button onClick={handleUseInProject} className="w-full">
            Usar en mi Proyecto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
