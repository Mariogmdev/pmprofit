-- Tabla para espacios/infraestructura
CREATE TABLE IF NOT EXISTS public.project_spaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  area NUMERIC DEFAULT 0,
  capex_por_m2 NUMERIC DEFAULT 0,
  breakdown JSONB DEFAULT '[]'::jsonb,
  genera_ingresos BOOLEAN DEFAULT false,
  configuracion_ingresos JSONB,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para obra civil
CREATE TABLE IF NOT EXISTS public.obra_civil (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  area_total_proyecto NUMERIC DEFAULT 0,
  costo_construccion_por_m2 NUMERIC DEFAULT 0,
  capex_construccion NUMERIC DEFAULT 0,
  paisajismo NUMERIC DEFAULT 0,
  estudios_disenos NUMERIC DEFAULT 0,
  permisos_licencias NUMERIC DEFAULT 0,
  interventoria NUMERIC DEFAULT 0,
  interventoria_porcentaje NUMERIC DEFAULT 5,
  imprevistos_porcentaje NUMERIC DEFAULT 10,
  imprevistos_valor NUMERIC DEFAULT 0,
  capex_obra_civil_total NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.project_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_civil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage spaces of own projects" 
ON public.project_spaces 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_spaces.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage obra civil of own projects" 
ON public.obra_civil 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = obra_civil.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Índices
CREATE INDEX project_spaces_project_id_idx ON public.project_spaces(project_id);
CREATE INDEX obra_civil_project_id_idx ON public.obra_civil(project_id);

-- Trigger updated_at
CREATE TRIGGER project_spaces_updated_at
  BEFORE UPDATE ON public.project_spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER obra_civil_updated_at
  BEFORE UPDATE ON public.obra_civil
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();