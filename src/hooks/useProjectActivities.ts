import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ProjectActivity, 
  ActivityConfig, 
  DEFAULT_ACTIVITY_CONFIG,
  generateId 
} from '@/types/activity';
import { ModuleData, ModuleDefaultConfig } from '@/types';
import { Json } from '@/integrations/supabase/types';

export function useProjectActivities() {
  const { currentProject } = useProject();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch activities for current project
  const fetchActivities = useCallback(async () => {
    if (!currentProject) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_activities')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching activities:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las actividades',
          variant: 'destructive',
        });
        return;
      }

      // Transform DB data to our activity format
      const transformedActivities: ProjectActivity[] = (data || []).map((item) => ({
        id: item.id,
        project_id: item.project_id,
        module_id: item.module_id || undefined,
        name: item.name,
        icon: (item.config as Record<string, unknown>)?.icon as string || '📦',
        config: transformConfigFromDB(item.config as Record<string, unknown>),
        order_index: item.order_index || 0,
        created_at: item.created_at || new Date().toISOString(),
      }));

      setActivities(transformedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [currentProject, toast]);

  useEffect(() => {
    fetchActivities();
  }, [currentProject?.id]);

  // Transform config from DB format to our format
  function transformConfigFromDB(dbConfig: Record<string, unknown> | null): ActivityConfig {
    if (!dbConfig) return DEFAULT_ACTIVITY_CONFIG;
    
    return {
      cantidad: (dbConfig.cantidad as number) || DEFAULT_ACTIVITY_CONFIG.cantidad,
      tipoUnidad: (dbConfig.tipoUnidad as string) || DEFAULT_ACTIVITY_CONFIG.tipoUnidad,
      areaPorUnidad: (dbConfig.areaPorUnidad as number) || DEFAULT_ACTIVITY_CONFIG.areaPorUnidad,
      modeloIngreso: (dbConfig.modeloIngreso as ActivityConfig['modeloIngreso']) || DEFAULT_ACTIVITY_CONFIG.modeloIngreso,
      duracionReserva: (dbConfig.duracionReserva as number) || DEFAULT_ACTIVITY_CONFIG.duracionReserva,
      jugadoresPorReserva: (dbConfig.jugadoresPorReserva as number) || DEFAULT_ACTIVITY_CONFIG.jugadoresPorReserva,
      membershipConfig: dbConfig.membershipConfig as ActivityConfig['membershipConfig'],
      dailyPassConfig: dbConfig.dailyPassConfig as ActivityConfig['dailyPassConfig'],
      trafficConfig: dbConfig.trafficConfig as ActivityConfig['trafficConfig'],
      horarios: (dbConfig.horarios as ActivityConfig['horarios']) || DEFAULT_ACTIVITY_CONFIG.horarios,
      ocupacionAnual: (dbConfig.ocupacionAnual as ActivityConfig['ocupacionAnual']) || DEFAULT_ACTIVITY_CONFIG.ocupacionAnual,
      ocupacionMensual: dbConfig.ocupacionMensual as ActivityConfig['ocupacionMensual'],
      modoOcupacion: (dbConfig.modoOcupacion as ActivityConfig['modoOcupacion']) || 'anual',
      crecimientoAutomatico: (dbConfig.crecimientoAutomatico as boolean) ?? DEFAULT_ACTIVITY_CONFIG.crecimientoAutomatico,
      tasaCrecimiento: (dbConfig.tasaCrecimiento as number) || DEFAULT_ACTIVITY_CONFIG.tasaCrecimiento,
      alquileres: (dbConfig.alquileres as ActivityConfig['alquileres']) || DEFAULT_ACTIVITY_CONFIG.alquileres,
      tieneClases: (dbConfig.tieneClases as boolean) ?? DEFAULT_ACTIVITY_CONFIG.tieneClases,
      configuracionClases: dbConfig.configuracionClases as ActivityConfig['configuracionClases'],
      tipoCubierta: (dbConfig.tipoCubierta as ActivityConfig['tipoCubierta']) || DEFAULT_ACTIVITY_CONFIG.tipoCubierta,
      capexCubierta: (dbConfig.capexCubierta as number) || DEFAULT_ACTIVITY_CONFIG.capexCubierta,
      capexSemicubierta: (dbConfig.capexSemicubierta as number) || DEFAULT_ACTIVITY_CONFIG.capexSemicubierta,
      capexAireLibre: (dbConfig.capexAireLibre as number) || DEFAULT_ACTIVITY_CONFIG.capexAireLibre,
      consumibles: (dbConfig.consumibles as ActivityConfig['consumibles']) || DEFAULT_ACTIVITY_CONFIG.consumibles,
      mobiliario: (dbConfig.mobiliario as ActivityConfig['mobiliario']) || DEFAULT_ACTIVITY_CONFIG.mobiliario,
      personal: (dbConfig.personal as ActivityConfig['personal']) || DEFAULT_ACTIVITY_CONFIG.personal,
      mantenimiento: (dbConfig.mantenimiento as ActivityConfig['mantenimiento']) || DEFAULT_ACTIVITY_CONFIG.mantenimiento,
    };
  }

  // Transform module config to activity config
  function transformModuleToActivityConfig(moduleConfig: ModuleDefaultConfig): ActivityConfig {
    return {
      ...DEFAULT_ACTIVITY_CONFIG,
      cantidad: moduleConfig.cantidad || 1,
      duracionReserva: moduleConfig.duracionReserva || 1.5,
      jugadoresPorReserva: moduleConfig.jugadoresPorReserva || 4,
      tipoCubierta: moduleConfig.tipoCubierta || 'cubierta',
      capexCubierta: moduleConfig.capexCubierta || 0,
      capexSemicubierta: moduleConfig.capexSemicubierta || 0,
      capexAireLibre: moduleConfig.capexAireLibre || 0,
      horarios: (moduleConfig.horarios || []).map((h) => ({
        ...h,
        id: generateId(),
        ocupacion: moduleConfig.ocupacionMes1?.[h.tipo] || (h.tipo === 'pico' ? 60 : 30),
        diaSemana: 'LV' as const,
      })),
      alquileres: (moduleConfig.alquileres || []).map((a) => ({
        ...a,
        id: generateId(),
      })),
      ocupacionAnual: DEFAULT_ACTIVITY_CONFIG.ocupacionAnual.map((oa, idx) => ({
        ...oa,
        pico: (moduleConfig.ocupacionMes1?.pico || 60) + (idx * 10),
        valle: (moduleConfig.ocupacionMes1?.valle || 30) + (idx * 10),
      })),
    };
  }

  // Add activity from module
  const addActivityFromModule = async (module: ModuleData): Promise<ProjectActivity | null> => {
    if (!currentProject) {
      toast({
        title: 'Error',
        description: 'Selecciona un proyecto primero',
        variant: 'destructive',
      });
      return null;
    }

    setSaving(true);
    try {
      const newConfig = transformModuleToActivityConfig(module.default_config);
      const configWithIcon = { ...newConfig, icon: module.icon };
      
      const { data, error } = await supabase
        .from('project_activities')
        .insert({
          project_id: currentProject.id,
          module_id: module.id,
          name: module.name,
          config: configWithIcon as unknown as Json,
          order_index: activities.length,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding activity:', error);
        toast({
          title: 'Error',
          description: 'No se pudo agregar la actividad',
          variant: 'destructive',
        });
        return null;
      }

      // Increment module usage count
      await supabase
        .from('modules')
        .update({ usage_count: (module.usage_count || 0) + 1 })
        .eq('id', module.id);

      const newActivity: ProjectActivity = {
        id: data.id,
        project_id: data.project_id,
        module_id: data.module_id || undefined,
        name: data.name,
        icon: module.icon,
        config: newConfig,
        order_index: data.order_index || 0,
        created_at: data.created_at || new Date().toISOString(),
      };

      setActivities((prev) => [...prev, newActivity]);

      toast({
        title: 'Actividad agregada',
        description: `"${module.name}" se agregó al proyecto`,
      });

      return newActivity;
    } catch (error) {
      console.error('Error adding activity:', error);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Update activity
  const updateActivity = async (id: string, updates: Partial<ProjectActivity>) => {
    setSaving(true);
    try {
      const activity = activities.find((a) => a.id === id);
      if (!activity) return;

      const updatedConfig = updates.config 
        ? { ...updates.config, icon: updates.icon || activity.icon }
        : { ...activity.config, icon: updates.icon || activity.icon };

      const { error } = await supabase
        .from('project_activities')
        .update({
          name: updates.name ?? activity.name,
          config: updatedConfig as unknown as Json,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating activity:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron guardar los cambios',
          variant: 'destructive',
        });
        return;
      }

      setActivities((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, ...updates, config: updates.config || a.config }
            : a
        )
      );
    } catch (error) {
      console.error('Error updating activity:', error);
    } finally {
      setSaving(false);
    }
  };

  // Delete activity
  const deleteActivity = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('project_activities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting activity:', error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la actividad',
          variant: 'destructive',
        });
        return;
      }

      setActivities((prev) => prev.filter((a) => a.id !== id));

      toast({
        title: 'Actividad eliminada',
        description: 'La actividad se eliminó correctamente',
      });
    } catch (error) {
      console.error('Error deleting activity:', error);
    } finally {
      setSaving(false);
    }
  };

  // Duplicate activity
  const duplicateActivity = async (id: string): Promise<ProjectActivity | null> => {
    const activity = activities.find((a) => a.id === id);
    if (!activity || !currentProject) return null;

    setSaving(true);
    try {
      const configWithIcon = { ...activity.config, icon: activity.icon };
      
      const { data, error } = await supabase
        .from('project_activities')
        .insert({
          project_id: currentProject.id,
          module_id: activity.module_id,
          name: `${activity.name} (copia)`,
          config: configWithIcon as unknown as Json,
          order_index: activities.length,
        })
        .select()
        .single();

      if (error) {
        console.error('Error duplicating activity:', error);
        toast({
          title: 'Error',
          description: 'No se pudo duplicar la actividad',
          variant: 'destructive',
        });
        return null;
      }

      const duplicated: ProjectActivity = {
        id: data.id,
        project_id: data.project_id,
        module_id: data.module_id || undefined,
        name: data.name,
        icon: activity.icon,
        config: activity.config,
        order_index: data.order_index || 0,
        created_at: data.created_at || new Date().toISOString(),
      };

      setActivities((prev) => [...prev, duplicated]);

      toast({
        title: 'Actividad duplicada',
        description: `Se creó una copia de "${activity.name}"`,
      });

      return duplicated;
    } catch (error) {
      console.error('Error duplicating activity:', error);
      return null;
    } finally {
      setSaving(false);
    }
  };

  return {
    activities,
    loading,
    saving,
    addActivityFromModule,
    updateActivity,
    deleteActivity,
    duplicateActivity,
    refreshActivities: fetchActivities,
  };
}
