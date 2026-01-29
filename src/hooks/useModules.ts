import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ModuleData, ModuleCategory, ModuleDefaultConfig } from '@/types';
import { SYSTEM_MODULES } from '@/data/systemModules';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

type FilterOrigin = 'all' | 'system' | 'mine';

interface UseModulesReturn {
  modules: ModuleData[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: ModuleCategory | null;
  setCategoryFilter: (category: ModuleCategory | null) => void;
  originFilter: FilterOrigin;
  setOriginFilter: (origin: FilterOrigin) => void;
  filteredModules: ModuleData[];
  createModule: (data: Partial<ModuleData>) => Promise<ModuleData | null>;
  updateModule: (id: string, data: Partial<ModuleData>) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
  refreshModules: () => Promise<void>;
}

// Helper function to convert database row to ModuleData
function mapRowToModule(row: {
  id: string;
  name: string;
  category: string;
  type: string;
  default_config: Json;
  created_by: string | null;
  is_public: boolean | null;
  is_system: boolean | null;
  usage_count: number | null;
  created_at: string | null;
}): ModuleData {
  const config = row.default_config as Record<string, unknown>;
  return {
    id: row.id,
    name: row.name,
    category: row.category as ModuleCategory,
    type: row.type as ModuleData['type'],
    icon: (config?.icon as string) || '📦',
    description: (config?.description as string) || '',
    default_config: config as unknown as ModuleDefaultConfig,
    created_by: row.created_by,
    is_public: row.is_public ?? false,
    is_system: row.is_system ?? false,
    usage_count: row.usage_count ?? 0,
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

export function useModules(): UseModulesReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ModuleCategory | null>(null);
  const [originFilter, setOriginFilter] = useState<FilterOrigin>('all');

  // Seed system modules if they don't exist
  const seedSystemModules = useCallback(async () => {
    try {
      const { count } = await supabase
        .from('modules')
        .select('*', { count: 'exact', head: true })
        .eq('is_system', true);

      if (count === 0) {
        const modulesToInsert = SYSTEM_MODULES.map((m) => ({
          name: m.name,
          category: m.category,
          type: m.type,
          default_config: JSON.parse(JSON.stringify({
            ...m.default_config,
            icon: m.icon,
            description: m.description,
          })),
          is_public: m.is_public,
          is_system: m.is_system,
          usage_count: m.usage_count,
          created_by: null,
        }));

        const { error: insertError } = await supabase
          .from('modules')
          .insert(modulesToInsert);

        if (insertError) {
          console.error('Error seeding modules:', insertError);
        } else {
          console.log('✅ System modules seeded successfully');
        }
      }
    } catch (err) {
      console.error('Error checking/seeding modules:', err);
    }
  }, []);

  // Fetch all modules
  const fetchModules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await seedSystemModules();

      const { data, error: fetchError } = await supabase
        .from('modules')
        .select('*')
        .order('usage_count', { ascending: false });

      if (fetchError) {
        setError('Error al cargar los módulos');
        console.error('Error fetching modules:', fetchError);
        return;
      }

      const mappedModules = (data || []).map(mapRowToModule);
      setModules(mappedModules);
    } catch (err) {
      setError('Error al cargar los módulos');
      console.error('Error fetching modules:', err);
    } finally {
      setLoading(false);
    }
  }, [seedSystemModules]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Filter modules based on search, category, and origin
  const filteredModules = useMemo(() => {
    return modules.filter((module) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = module.name.toLowerCase().includes(query);
        const matchesDescription = module.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDescription) return false;
      }

      // Category filter
      if (categoryFilter && module.category !== categoryFilter) {
        return false;
      }

      // Origin filter
      if (originFilter === 'system' && !module.is_system) {
        return false;
      }
      if (originFilter === 'mine' && module.created_by !== user?.id) {
        return false;
      }

      return true;
    });
  }, [modules, searchQuery, categoryFilter, originFilter, user?.id]);

  const createModule = async (data: Partial<ModuleData>): Promise<ModuleData | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para crear un módulo',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const moduleToInsert = {
        name: data.name || 'Nuevo Módulo',
        category: data.category || 'otros',
        type: data.type || 'actividad',
        default_config: JSON.parse(JSON.stringify({
          ...data.default_config,
          icon: data.icon || '📦',
          description: data.description || '',
        })),
        is_public: data.is_public ?? false,
        is_system: false,
        usage_count: 0,
        created_by: user.id,
      };

      const { data: created, error: createError } = await supabase
        .from('modules')
        .insert([moduleToInsert])
        .select()
        .single();

      if (createError) {
        console.error('Error creating module:', createError);
        toast({
          title: 'Error',
          description: 'No se pudo crear el módulo',
          variant: 'destructive',
        });
        return null;
      }

      const newModule = mapRowToModule(created);
      setModules((prev) => [newModule, ...prev]);

      toast({
        title: 'Módulo creado',
        description: `"${newModule.name}" se creó correctamente`,
      });

      return newModule;
    } catch (err) {
      console.error('Error creating module:', err);
      return null;
    }
  };

  const updateModule = async (id: string, data: Partial<ModuleData>) => {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (data.name) updateData.name = data.name;
      if (data.category) updateData.category = data.category;
      if (data.type) updateData.type = data.type;
      if (data.is_public !== undefined) updateData.is_public = data.is_public;
      if (data.default_config || data.icon || data.description) {
        const existingModule = modules.find((m) => m.id === id);
        updateData.default_config = {
          ...existingModule?.default_config,
          ...data.default_config,
          icon: data.icon || existingModule?.icon,
          description: data.description || existingModule?.description,
        };
      }

      const { error: updateError } = await supabase
        .from('modules')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating module:', updateError);
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el módulo',
          variant: 'destructive',
        });
        return;
      }

      setModules((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, ...data }
            : m
        )
      );

      toast({
        title: 'Módulo actualizado',
        description: 'Los cambios se guardaron correctamente',
      });
    } catch (err) {
      console.error('Error updating module:', err);
    }
  };

  const deleteModule = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting module:', deleteError);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el módulo',
          variant: 'destructive',
        });
        return;
      }

      setModules((prev) => prev.filter((m) => m.id !== id));

      toast({
        title: 'Módulo eliminado',
        description: 'El módulo se eliminó correctamente',
      });
    } catch (err) {
      console.error('Error deleting module:', err);
    }
  };

  return {
    modules,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    originFilter,
    setOriginFilter,
    filteredModules,
    createModule,
    updateModule,
    deleteModule,
    refreshModules: fetchModules,
  };
}
