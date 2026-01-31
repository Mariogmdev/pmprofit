-- Add new columns for OPEX corrections
ALTER TABLE public.project_opex 
ADD COLUMN IF NOT EXISTS incluir_depreciacion BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS incluir_4x1000 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS comisiones_bancarias JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS incluir_comision_datafono BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS comision_datafono_porcentaje NUMERIC DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS porcentaje_ventas_datafono NUMERIC DEFAULT 70,
ADD COLUMN IF NOT EXISTS gastos_financieros JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS incluir_iva BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS porcentaje_ingresos_iva NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tarifa_iva NUMERIC DEFAULT 19,
ADD COLUMN IF NOT EXISTS iva_pagado_estimado NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS incluir_retenciones BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS retenciones JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS impuestos JSONB DEFAULT '[]'::jsonb;