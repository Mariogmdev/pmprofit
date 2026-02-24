import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProjectSpace, BreakdownItem, SpaceIncomeConfig } from '@/types/infrastructure';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface DbProjectSpace {
  id: string;
  project_id: string;
  type: string;
  name: string;
  area: number | null;
  capex_por_m2: number | null;
  breakdown: unknown;
  genera_ingresos: boolean | null;
  configuracion_ingresos: unknown;
  order_index: number | null;
  created_at: string | null;
  updated_at: string | null;
}

const parseBreakdown = (breakdown: unknown): BreakdownItem[] => {
  if (!breakdown) return [];
  if (Array.isArray(breakdown)) {
    return breakdown.map(item => ({
      item: String(item?.item || ''),
      cantidad: Number(item?.cantidad || 0),
      precioUnitario: Number(item?.precioUnitario || 0)
    }));
  }
  return [];
};

const parseIncomeConfig = (config: unknown): SpaceIncomeConfig | null => {
  if (!config || typeof config !== 'object') return null;
  const c = config as Record<string, unknown>;
  return {
    modelo: (c.modelo as 'alquiler' | 'concesion' | 'venta') || 'alquiler',
    ingresoMensual: Number(c.ingresoMensual || 0)
  };
};

const mapDbToProjectSpace = (db: DbProjectSpace): ProjectSpace => ({
  id: db.id,
  project_id: db.project_id,
  type: db.type as ProjectSpace['type'],
  name: db.name,
  area: db.area || 0,
  capex_por_m2: db.capex_por_m2 || 0,
  breakdown: parseBreakdown(db.breakdown),
  genera_ingresos: db.genera_ingresos || false,
  configuracion_ingresos: parseIncomeConfig(db.configuracion_ingresos),
  order_index: db.order_index || 0,
  created_at: db.created_at || new Date().toISOString(),
  updated_at: db.updated_at || new Date().toISOString()
});

export const useProjectSpaces = (projectId: string) => {
  const [spaces, setSpaces] = useState<ProjectSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSpaces = useCallback(async () => {
    if (!projectId) {
      setSpaces([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('project_spaces')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index');

    if (error) {
      logger.dev('Error loading spaces:', error);
      toast({
        title: 'Error al cargar espacios',
        description: error.message,
        variant: 'destructive'
      });
    } else if (data) {
      setSpaces(data.map(mapDbToProjectSpace));
    }
    setLoading(false);
  }, [projectId, toast]);

  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);

  const addSpace = async (space: Partial<ProjectSpace>) => {
    const insertData = {
      project_id: space.project_id!,
      type: space.type!,
      name: space.name!,
      area: space.area || 0,
      capex_por_m2: space.capex_por_m2 || 0,
      breakdown: JSON.parse(JSON.stringify(space.breakdown || [])),
      genera_ingresos: space.genera_ingresos || false,
      configuracion_ingresos: space.configuracion_ingresos ? JSON.parse(JSON.stringify(space.configuracion_ingresos)) : null,
      order_index: space.order_index || spaces.length
    };

    const { data, error } = await supabase
      .from('project_spaces')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.dev('Error adding space:', error);
      toast({
        title: 'Error al agregar espacio',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }

    if (data) {
      const newSpace = mapDbToProjectSpace(data);
      setSpaces(prev => [...prev, newSpace]);
      toast({ title: 'Espacio agregado ✓' });
      return newSpace;
    }
    return null;
  };

  const updateSpace = async (id: string, updates: Partial<ProjectSpace>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.area !== undefined) dbUpdates.area = updates.area;
    if (updates.capex_por_m2 !== undefined) dbUpdates.capex_por_m2 = updates.capex_por_m2;
    if (updates.breakdown !== undefined) dbUpdates.breakdown = updates.breakdown;
    if (updates.genera_ingresos !== undefined) dbUpdates.genera_ingresos = updates.genera_ingresos;
    if (updates.configuracion_ingresos !== undefined) dbUpdates.configuracion_ingresos = updates.configuracion_ingresos;
    if (updates.order_index !== undefined) dbUpdates.order_index = updates.order_index;
    if (updates.type !== undefined) dbUpdates.type = updates.type;

    const { error } = await supabase
      .from('project_spaces')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      logger.dev('Error updating space:', error);
      toast({
        title: 'Error al actualizar espacio',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    setSpaces(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    return true;
  };

  const deleteSpace = async (id: string) => {
    const { error } = await supabase
      .from('project_spaces')
      .delete()
      .eq('id', id);

    if (error) {
      logger.dev('Error deleting space:', error);
      toast({
        title: 'Error al eliminar espacio',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    setSpaces(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Espacio eliminado' });
    return true;
  };

  return { spaces, loading, addSpace, updateSpace, deleteSpace, refetch: loadSpaces };
};
