import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProjectOpex, NominaItem, ServiceItem, ComisionItem, RentCalculationBase, BankCommissionItem, RetencionItem } from '@/types/opex';
import { Json } from '@/integrations/supabase/types';

// Helper to safely parse JSONB arrays
const parseJsonArray = <T>(data: Json | null, fallback: T[] = []): T[] => {
  if (!data) return fallback;
  if (Array.isArray(data)) return data as unknown as T[];
  return fallback;
};

// Global store for OPEX data to share state between hook instances
const opexStore = new Map<string, { opex: ProjectOpex | null; version: number }>();
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const subscribeToStore = (callback: () => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const getSnapshot = (projectId: string) => {
  return opexStore.get(projectId) || { opex: null, version: 0 };
};

export const useProjectOpex = (projectId: string) => {
  const [loading, setLoading] = useState(true);
  const lastUpdateRef = useRef<string>('');

  // Use external store to sync across all hook instances
  const storeData = useSyncExternalStore(
    subscribeToStore,
    () => getSnapshot(projectId),
    () => getSnapshot(projectId)
  );

  const opex = storeData.opex;

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
            arrendamiento_variable_base: 'ingresos-brutos',
            arrendamiento_mixto_base: 'ingresos-brutos',
            nomina_administrativa: [],
            nomina_operativa: [],
            prestaciones_porcentaje: 53.94,
            servicios_publicos: [],
            marketing: [],
            tecnologia: [],
            seguridad: [],
            seguros: [],
            mantenimiento_general: [],
            administrativos: [],
            otros_gastos: [],
            comisiones: [],
            depreciacion_anos: 10,
            incluir_depreciacion: true,
            incluir_4x1000: false,
            comisiones_bancarias: [],
            incluir_comision_datafono: true,
            comision_datafono_porcentaje: 2.5,
            porcentaje_ventas_datafono: 70,
            gastos_financieros: [],
            incluir_iva: false,
            porcentaje_ingresos_iva: 0,
            tarifa_iva: 19,
            iva_pagado_estimado: 0,
            incluir_retenciones: false,
            retenciones: [],
            impuestos: []
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
        const parsedOpex: ProjectOpex = {
          id: data.id,
          project_id: data.project_id,
          nomina_administrativa: parseJsonArray<NominaItem>(data.nomina_administrativa),
          nomina_operativa: parseJsonArray<NominaItem>(data.nomina_operativa),
          prestaciones_porcentaje: data.prestaciones_porcentaje ?? 53.94,
          arrendamiento_modelo: (data.arrendamiento_modelo as ProjectOpex['arrendamiento_modelo']) || 'propio',
          arrendamiento_fijo: data.arrendamiento_fijo ?? 0,
          arrendamiento_variable_porcentaje: data.arrendamiento_variable_porcentaje ?? 0,
          arrendamiento_variable_base: (data.arrendamiento_variable_base as RentCalculationBase) || 'ingresos-brutos',
          arrendamiento_mixto_fijo: data.arrendamiento_mixto_fijo ?? 0,
          arrendamiento_mixto_porcentaje: data.arrendamiento_mixto_porcentaje ?? 0,
          arrendamiento_mixto_base: (data.arrendamiento_mixto_base as RentCalculationBase) || 'ingresos-brutos',
          servicios_publicos: parseJsonArray<ServiceItem>(data.servicios_publicos),
          marketing: parseJsonArray<ServiceItem>(data.marketing),
          tecnologia: parseJsonArray<ServiceItem>(data.tecnologia),
          seguridad: parseJsonArray<ServiceItem>(data.seguridad),
          seguros: parseJsonArray<ServiceItem>(data.seguros),
          mantenimiento_general: parseJsonArray<ServiceItem>(data.mantenimiento_general),
          administrativos: parseJsonArray<ServiceItem>(data.administrativos),
          otros_gastos: parseJsonArray<ServiceItem>(data.otros_gastos),
          comisiones: parseJsonArray<ComisionItem>(data.comisiones),
          depreciacion_anos: data.depreciacion_anos ?? 10,
          incluir_depreciacion: data.incluir_depreciacion ?? true,
          incluir_4x1000: data.incluir_4x1000 ?? false,
          comisiones_bancarias: parseJsonArray<BankCommissionItem>(data.comisiones_bancarias),
          incluir_comision_datafono: data.incluir_comision_datafono ?? true,
          comision_datafono_porcentaje: data.comision_datafono_porcentaje ?? 2.5,
          porcentaje_ventas_datafono: data.porcentaje_ventas_datafono ?? 70,
          gastos_financieros: parseJsonArray<ServiceItem>(data.gastos_financieros),
          incluir_iva: data.incluir_iva ?? false,
          porcentaje_ingresos_iva: data.porcentaje_ingresos_iva ?? 0,
          tarifa_iva: data.tarifa_iva ?? 19,
          iva_pagado_estimado: data.iva_pagado_estimado ?? 0,
          incluir_retenciones: data.incluir_retenciones ?? false,
          retenciones: parseJsonArray<RetencionItem>(data.retenciones),
          impuestos: parseJsonArray<ServiceItem>(data.impuestos),
          updated_at: data.updated_at || new Date().toISOString(),
        };

        const currentData = opexStore.get(projectId);
        opexStore.set(projectId, { 
          opex: parsedOpex, 
          version: (currentData?.version || 0) + 1 
        });
        notifyListeners();
      }
      
      setLoading(false);
    };
    
    loadOpex();
  }, [projectId]);

  const updateOpex = useCallback(async (updates: Partial<ProjectOpex>) => {
    const currentData = opexStore.get(projectId);
    if (!currentData?.opex || !projectId) return;
    
    // Debounce updates
    const updateKey = JSON.stringify(updates);
    if (updateKey === lastUpdateRef.current) return;
    lastUpdateRef.current = updateKey;
    
    // Optimistic update - update store and notify all listeners
    const newOpex = { ...currentData.opex, ...updates };
    opexStore.set(projectId, { 
      opex: newOpex, 
      version: currentData.version + 1 
    });
    notifyListeners();
    
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
      opexStore.set(projectId, currentData);
      notifyListeners();
    }
  }, [projectId]);

  return { opex, loading, updateOpex };
};
