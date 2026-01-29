-- 1. TABLA PROFILES (extender auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. TABLA PROJECTS
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  area_total NUMERIC,
  opening_date DATE,
  
  -- Configuración financiera
  currency TEXT DEFAULT 'COP' NOT NULL,
  currency_symbol TEXT DEFAULT '$',
  discount_rate NUMERIC DEFAULT 15,
  inflation_rate NUMERIC DEFAULT 3.5,
  projection_years INTEGER DEFAULT 5,
  
  -- Horarios operación
  opening_hour NUMERIC DEFAULT 6,
  opening_minute NUMERIC DEFAULT 0,
  closing_hour NUMERIC DEFAULT 22,
  closing_minute NUMERIC DEFAULT 0,
  days_per_month INTEGER DEFAULT 30,
  
  weekend_different BOOLEAN DEFAULT FALSE,
  weekend_opening_hour NUMERIC,
  weekend_closing_hour NUMERIC,
  
  holidays_different BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- 3. TABLA PROJECT_ACTIVITIES (para fase siguiente)
CREATE TABLE public.project_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  module_id UUID,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  config JSONB,
  capex NUMERIC DEFAULT 0,
  opex_monthly NUMERIC DEFAULT 0,
  revenue_monthly NUMERIC DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage activities of own projects"
  ON public.project_activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_activities.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- 4. TABLA MODULES (para fase siguiente)
CREATE TABLE public.modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('actividad', 'espacio', 'servicio')),
  default_config JSONB NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  is_public BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public or system modules"
  ON public.modules FOR SELECT
  USING (is_public = TRUE OR is_system = TRUE OR created_by = auth.uid());

CREATE POLICY "Users can create modules"
  ON public.modules FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- 5. ÍNDICES para performance
CREATE INDEX projects_user_id_idx ON public.projects(user_id);
CREATE INDEX project_activities_project_id_idx ON public.project_activities(project_id);
CREATE INDEX modules_category_idx ON public.modules(category);
CREATE INDEX modules_type_idx ON public.modules(type);

-- 6. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();