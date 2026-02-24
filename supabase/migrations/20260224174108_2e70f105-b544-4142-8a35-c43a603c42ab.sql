-- Fix 1: Add UPDATE and DELETE policies for modules table
CREATE POLICY "Users can update own modules"
  ON public.modules FOR UPDATE
  USING (auth.uid() = created_by AND is_system = FALSE);

CREATE POLICY "Users can delete own modules"
  ON public.modules FOR DELETE
  USING (auth.uid() = created_by AND is_system = FALSE);

-- Fix 2: Harden handle_new_user() with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  v_full_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), '');
  
  IF v_full_name IS NOT NULL AND LENGTH(v_full_name) > 100 THEN
    v_full_name := SUBSTRING(v_full_name, 1, 100);
  END IF;
  
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, v_full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;