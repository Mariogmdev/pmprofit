-- Tabla para OPEX del proyecto
CREATE TABLE IF NOT EXISTS public.project_opex (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Nómina
  nomina_administrativa JSONB DEFAULT '[]'::jsonb,
  nomina_operativa JSONB DEFAULT '[]'::jsonb,
  prestaciones_porcentaje NUMERIC DEFAULT 53.94,
  
  -- Arrendamiento
  arrendamiento_modelo TEXT DEFAULT 'propio',
  arrendamiento_fijo NUMERIC DEFAULT 0,
  arrendamiento_variable_porcentaje NUMERIC DEFAULT 0,
  arrendamiento_mixto_fijo NUMERIC DEFAULT 0,
  arrendamiento_mixto_porcentaje NUMERIC DEFAULT 0,
  
  -- Otras categorías (JSONB para flexibilidad)
  servicios_publicos JSONB DEFAULT '[]'::jsonb,
  marketing JSONB DEFAULT '[]'::jsonb,
  tecnologia JSONB DEFAULT '[]'::jsonb,
  seguros JSONB DEFAULT '[]'::jsonb,
  mantenimiento_general JSONB DEFAULT '[]'::jsonb,
  administrativos JSONB DEFAULT '[]'::jsonb,
  otros_gastos JSONB DEFAULT '[]'::jsonb,
  
  -- Depreciación
  depreciacion_anos INTEGER DEFAULT 10,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE public.project_opex ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage opex of own projects"
  ON public.project_opex FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_opex.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Índice para búsqueda por proyecto
CREATE INDEX project_opex_project_id_idx ON public.project_opex(project_id);

-- Trigger para updated_at
CREATE TRIGGER project_opex_updated_at
  BEFORE UPDATE ON public.project_opex
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();