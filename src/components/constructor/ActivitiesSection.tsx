import { useState, useMemo } from 'react';
import { Search, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useModules } from '@/hooks/useModules';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { useProject } from '@/contexts/ProjectContext';
import { MODULE_CATEGORIES, ModuleCategory, ModuleData } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import ActivityCard from './ActivityCard';
import { CapexByActivityCard } from './CapexByActivityCard';
import { CurrencyCode } from '@/types';

const categoryLabels: Record<ModuleCategory, string> = {
  'deportes-raqueta': 'Deportes Raqueta',
  'deportes-colectivos': 'Deportes Colectivos',
  'fitness': 'Fitness',
  'wellness': 'Wellness',
  'coworking': 'Coworking',
  'f&b': 'F&B',
  'retail': 'Retail',
  'otros': 'Otros',
};

export default function ActivitiesSection() {
  const { currentProject } = useProject();
  const { modules, loading: modulesLoading } = useModules();
  const { activities, loading: activitiesLoading, addActivityFromModule, updateActivity, deleteActivity, duplicateActivity, saving } = useProjectActivities();
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | null>(null);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [allModulesOpen, setAllModulesOpen] = useState(false);

  // Filter modules for quick picker
  const filteredModules = useMemo(() => {
    let result = modules;
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(searchLower) ||
          m.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedCategory) {
      result = result.filter((m) => m.category === selectedCategory);
    }
    
    return result;
  }, [modules, search, selectedCategory]);

  // Modules shown in quick picker (max 6)
  const quickPickModules = filteredModules.slice(0, 6);

  const handleAddActivity = async (module: ModuleData) => {
    const activity = await addActivityFromModule(module);
    if (activity) {
      setExpandedActivityId(activity.id);
      // Scroll to new activity
      setTimeout(() => {
        const element = document.getElementById(`activity-${activity.id}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    setAllModulesOpen(false);
  };

  const currency = currentProject?.currency || 'COP';

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Selecciona un proyecto para comenzar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Module Picker Section */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <h3 className="font-semibold text-foreground mb-3">Agregar desde Módulos</h3>
        
        {/* Search and Filters */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar módulo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Badge>
            {MODULE_CATEGORIES.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Quick Pick Grid */}
        {modulesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3">
                  <div className="h-8 w-8 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded mb-1" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : quickPickModules.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No se encontraron módulos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickPickModules.map((module) => (
              <Card 
                key={module.id} 
                className="hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <CardContent className="p-3">
                  <div className="text-2xl mb-2">{module.icon}</div>
                  <h4 className="font-medium text-sm text-foreground truncate">
                    {module.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {module.default_config.cantidad || 1} {module.default_config.cantidad === 1 ? 'unidad' : 'unidades'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(module.default_config.capexCubierta || 0, currency)} c/u
                  </p>
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    disabled={saving}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddActivity(module);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View All Modules Button */}
        {filteredModules.length > 6 && (
          <Dialog open={allModulesOpen} onOpenChange={setAllModulesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full mt-3">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver todos los módulos ({filteredModules.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Todos los Módulos</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {filteredModules.map((module) => (
                  <Card key={module.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{module.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground">{module.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {module.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {categoryLabels[module.category]}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            className="w-full mt-3"
                            disabled={saving}
                            onClick={() => handleAddActivity(module)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar al Proyecto
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Added Activities Section */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-4">
          Actividades Agregadas al Proyecto
          {activities.length > 0 && (
            <span className="font-normal text-muted-foreground ml-2">
              ({activities.length})
            </span>
          )}
        </h3>

        {activitiesLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Agrega tu primera actividad
            </h4>
            <p className="text-muted-foreground max-w-md">
              Usa los módulos de arriba para agregar actividades que generarán ingresos en tu proyecto
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                expanded={expandedActivityId === activity.id}
                onToggleExpand={() => 
                  setExpandedActivityId(
                    expandedActivityId === activity.id ? null : activity.id
                  )
                }
                onUpdate={(updates) => updateActivity(activity.id, updates)}
                onDelete={() => deleteActivity(activity.id)}
                onDuplicate={() => duplicateActivity(activity.id)}
                onSave={async () => {
                  // The updateActivity already saves to DB, so this is a no-op
                  // but required for explicit save triggers from the card
                }}
                currency={currency}
                totalClubUsers={activities.reduce((sum, a) => {
                  // Calculate total users from all other activities for traffic model
                  if (a.id !== activity.id && a.config.modeloIngreso === 'reserva') {
                    const schedules = a.config.horarios || [];
                    const cantidad = a.config.cantidad || 1;
                    const duracion = a.config.duracionReserva || 1.5;
                    const jugadores = a.config.jugadoresPorReserva || 4;
                    const daysPerMonth = 30;
                    
                    let users = 0;
                    schedules.forEach((s) => {
                      const hoursPerDay = Math.max(0, s.fin - s.inicio);
                      const reservasPerDay = hoursPerDay / duracion;
                      const ocupacion = s.ocupacion / 100;
                      const reservasPerMonth = reservasPerDay * cantidad * ocupacion * daysPerMonth;
                      users += reservasPerMonth * jugadores;
                    });
                    return sum + users;
                  }
                  return sum;
                }, 0)}
              />
            ))}
          </div>
        )}
      </div>

      {/* CAPEX by Activity summary */}
      {activities.length > 0 && (
        <CapexByActivityCard 
          activities={activities} 
          currency={(currency || 'COP') as CurrencyCode} 
        />
      )}
    </div>
  );
}
