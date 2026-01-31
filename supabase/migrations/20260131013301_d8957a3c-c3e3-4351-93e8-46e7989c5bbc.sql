-- Add new columns for enhanced OPEX functionality

-- 1. Variable rent base options
ALTER TABLE public.project_opex 
ADD COLUMN IF NOT EXISTS arrendamiento_variable_base TEXT DEFAULT 'ingresos-brutos';

-- 2. Mixto rent base options  
ALTER TABLE public.project_opex 
ADD COLUMN IF NOT EXISTS arrendamiento_mixto_base TEXT DEFAULT 'ingresos-brutos';

-- 3. Security category
ALTER TABLE public.project_opex 
ADD COLUMN IF NOT EXISTS seguridad JSONB DEFAULT '[]'::jsonb;

-- 4. Commissions category
ALTER TABLE public.project_opex 
ADD COLUMN IF NOT EXISTS comisiones JSONB DEFAULT '[]'::jsonb;