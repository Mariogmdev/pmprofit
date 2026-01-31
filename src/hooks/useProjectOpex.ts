import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProjectOpex, NominaItem, ServiceItem } from '@/types/opex';
import { Json } from '@/integrations/supabase/types';

// Helper to safely parse JSONB arrays
const parseJsonArray = <T>(data: Json | null, fallback: T[] = []): T[] => {
  if (!data) return fallback;
  if (Array.isArray(data)) return data as unknown as T[];
  return fallback;
};

export const useProjectOpex = (projectId: string) => {
  const [opex, setOpex] = useState<ProjectOpex | null>(null);
  const [loading, setLoading] = useState(true);
  const lastUpdateRef = useRef<string>('');

  useEffect(() => {
    const loadOpex = async () => {
      if (!projectId) return;
      
      setLoading(true);
      
      let { data, error } = await supabase
        .from('project_opex')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading opex:', error);
        setLoading(false);
        return;
      }
      
      if (!data) {
        // Create default opex record
        const { data: newData, error: insertError } = await supabase
          .from('project_opex')
          .insert({
            project_id: projectId,
            arrendamiento_modelo: 'propio',
            nomina_administrativa: [],
            nomina_operativa: [],
            prestaciones_porcentaje: 53.94,
            servicios_publicos: [],
            marketing: [],
            tecnologia: [],
            seguros: [],
            mantenimiento_general: [],
            administrativos: [],
            otros_gastos: [],
            depreciacion_anos: 10
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating opex:', insertError);
        } else {
          data = newData;
        }
      }
      
      if (data) {
        setOpex({
          id: data.id,
          project_id: data.project_id,
          nomina_administrativa: parseJsonArray<NominaItem>(data.nomina_administrativa),
          nomina_operativa: parseJsonArray<NominaItem>(data.nomina_operativa),
          prestaciones_porcentaje: data.prestaciones_porcentaje ?? 53.94,
          arrendamiento_modelo: (data.arrendamiento_modelo as ProjectOpex['arrendamiento_modelo']) || 'propio',
          arrendamiento_fijo: data.arrendamiento_fijo ?? 0,
          arrendamiento_variable_porcentaje: data.arrendamiento_variable_porcentaje ?? 0,
          arrendamiento_mixto_fijo: data.arrendamiento_mixto_fijo ?? 0,
          arrendamiento_mixto_porcentaje: data.arrendamiento_mixto_porcentaje ?? 0,
          servicios_publicos: parseJsonArray<ServiceItem>(data.servicios_publicos),
          marketing: parseJsonArray<ServiceItem>(data.marketing),
          tecnologia: parseJsonArray<ServiceItem>(data.tecnologia),
          seguros: parseJsonArray<ServiceItem>(data.seguros),
          mantenimiento_general: parseJsonArray<ServiceItem>(data.mantenimiento_general),
          administrativos: parseJsonArray<ServiceItem>(data.administrativos),
          otros_gastos: parseJsonArray<ServiceItem>(data.otros_gastos),
          depreciacion_anos: data.depreciacion_anos ?? 10,
          updated_at: data.updated_at || new Date().toISOString(),
        });
      }
      
      setLoading(false);
    };
    
    loadOpex();
  }, [projectId]);

  const updateOpex = useCallback(async (updates: Partial<ProjectOpex>) => {
    if (!opex || !projectId) return;
    
    // Debounce updates
    const updateKey = JSON.stringify(updates);
    if (updateKey === lastUpdateRef.current) return;
    lastUpdateRef.current = updateKey;
    
    // Optimistic update
    const newOpex = { ...opex, ...updates };
    setOpex(newOpex);
    
    // Convert to DB-compatible format
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };
    
    Object.entries(updates).forEach(([key, value]) => {
      dbUpdates[key] = value;
    });
    
    const { error } = await supabase
      .from('project_opex')
      .update(dbUpdates)
      .eq('project_id', projectId);
    
    if (error) {
      console.error('Error updating opex:', error);
      // Revert on error
      setOpex(opex);
    }
  }, [opex, projectId]);

  return { opex, loading, updateOpex };
};
