import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ObraCivil } from '@/types/infrastructure';
import { useToast } from '@/hooks/use-toast';

interface DbObraCivil {
  id: string;
  project_id: string;
  area_total_proyecto: number | null;
  costo_construccion_por_m2: number | null;
  capex_construccion: number | null;
  paisajismo: number | null;
  estudios_disenos: number | null;
  permisos_licencias: number | null;
  interventoria: number | null;
  interventoria_porcentaje: number | null;
  imprevistos_porcentaje: number | null;
  imprevistos_valor: number | null;
  capex_obra_civil_total: number | null;
  updated_at: string | null;
}

const mapDbToObraCivil = (db: DbObraCivil): ObraCivil => ({
  id: db.id,
  project_id: db.project_id,
  area_total_proyecto: db.area_total_proyecto || 0,
  costo_construccion_por_m2: db.costo_construccion_por_m2 || 0,
  capex_construccion: db.capex_construccion || 0,
  paisajismo: db.paisajismo || 0,
  estudios_disenos: db.estudios_disenos || 0,
  permisos_licencias: db.permisos_licencias || 0,
  interventoria: db.interventoria || 0,
  interventoria_porcentaje: db.interventoria_porcentaje || 5,
  imprevistos_porcentaje: db.imprevistos_porcentaje || 10,
  imprevistos_valor: db.imprevistos_valor || 0,
  capex_obra_civil_total: db.capex_obra_civil_total || 0,
  updated_at: db.updated_at || new Date().toISOString()
});

export const useObraCivil = (projectId: string) => {
  const [obraCivil, setObraCivil] = useState<ObraCivil | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadObraCivil = useCallback(async () => {
    if (!projectId) {
      setObraCivil(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Intentar cargar existente
    const { data, error } = await supabase
      .from('obra_civil')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Error loading obra civil:', error);
      toast({
        title: 'Error al cargar obra civil',
        description: error.message,
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }

    if (data) {
      setObraCivil(mapDbToObraCivil(data));
    } else {
      // Crear nuevo registro si no existe
      const { data: newData, error: insertError } = await supabase
        .from('obra_civil')
        .insert({
          project_id: projectId,
          costo_construccion_por_m2: 1800000,
          interventoria_porcentaje: 5,
          imprevistos_porcentaje: 10
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating obra civil:', insertError);
      } else if (newData) {
        setObraCivil(mapDbToObraCivil(newData));
      }
    }
    
    setLoading(false);
  }, [projectId, toast]);

  useEffect(() => {
    loadObraCivil();
  }, [loadObraCivil]);

  const updateObraCivil = async (updates: Partial<ObraCivil>) => {
    if (!obraCivil) return false;

    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.area_total_proyecto !== undefined) dbUpdates.area_total_proyecto = updates.area_total_proyecto;
    if (updates.costo_construccion_por_m2 !== undefined) dbUpdates.costo_construccion_por_m2 = updates.costo_construccion_por_m2;
    if (updates.capex_construccion !== undefined) dbUpdates.capex_construccion = updates.capex_construccion;
    if (updates.paisajismo !== undefined) dbUpdates.paisajismo = updates.paisajismo;
    if (updates.estudios_disenos !== undefined) dbUpdates.estudios_disenos = updates.estudios_disenos;
    if (updates.permisos_licencias !== undefined) dbUpdates.permisos_licencias = updates.permisos_licencias;
    if (updates.interventoria !== undefined) dbUpdates.interventoria = updates.interventoria;
    if (updates.interventoria_porcentaje !== undefined) dbUpdates.interventoria_porcentaje = updates.interventoria_porcentaje;
    if (updates.imprevistos_porcentaje !== undefined) dbUpdates.imprevistos_porcentaje = updates.imprevistos_porcentaje;
    if (updates.imprevistos_valor !== undefined) dbUpdates.imprevistos_valor = updates.imprevistos_valor;
    if (updates.capex_obra_civil_total !== undefined) dbUpdates.capex_obra_civil_total = updates.capex_obra_civil_total;

    const { error } = await supabase
      .from('obra_civil')
      .update(dbUpdates)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error updating obra civil:', error);
      return false;
    }

    setObraCivil(prev => prev ? { ...prev, ...updates } : null);
    return true;
  };

  return { obraCivil, loading, updateObraCivil, refetch: loadObraCivil };
};
