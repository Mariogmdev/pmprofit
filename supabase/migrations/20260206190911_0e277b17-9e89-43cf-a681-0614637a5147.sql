-- Add working_capital_months column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS working_capital_months integer DEFAULT 3;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.working_capital_months IS 'Number of months of OPEX to cover as working capital in initial investment. Typically 2-4 months.';