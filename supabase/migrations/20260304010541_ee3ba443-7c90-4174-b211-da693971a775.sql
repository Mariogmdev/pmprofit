
CREATE OR REPLACE FUNCTION public.duplicate_project(
  original_project_id UUID,
  new_project_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_project_id UUID;
  v_user_id UUID;
BEGIN
  -- Verify ownership
  SELECT user_id INTO v_user_id FROM projects WHERE id = original_project_id;
  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Duplicate project
  INSERT INTO projects (
    user_id, name, location, area_total, currency, currency_symbol,
    discount_rate, inflation_rate, projection_years,
    opening_hour, opening_minute, closing_hour, closing_minute,
    days_per_month, weekend_different, weekend_opening_hour, weekend_closing_hour,
    holidays_different, working_capital_months, occupancy_growth_rate,
    tax_rate, residual_asset_rate, opening_date
  )
  SELECT
    user_id, new_project_name, location, area_total, currency, currency_symbol,
    discount_rate, inflation_rate, projection_years,
    opening_hour, opening_minute, closing_hour, closing_minute,
    days_per_month, weekend_different, weekend_opening_hour, weekend_closing_hour,
    holidays_different, working_capital_months, occupancy_growth_rate,
    tax_rate, residual_asset_rate, opening_date
  FROM projects
  WHERE id = original_project_id
  RETURNING id INTO new_project_id;

  -- Duplicate activities
  INSERT INTO project_activities (
    project_id, name, module_id, quantity, config, capex, opex_monthly, revenue_monthly, order_index
  )
  SELECT
    new_project_id, name, module_id, quantity, config, capex, opex_monthly, revenue_monthly, order_index
  FROM project_activities
  WHERE project_id = original_project_id;

  -- Duplicate OPEX
  INSERT INTO project_opex (
    project_id, nomina_administrativa, nomina_operativa, prestaciones_porcentaje,
    arrendamiento_modelo, arrendamiento_fijo, arrendamiento_variable_porcentaje,
    arrendamiento_variable_base, arrendamiento_mixto_fijo, arrendamiento_mixto_porcentaje,
    arrendamiento_mixto_base, servicios_publicos, marketing, tecnologia, seguros,
    mantenimiento_general, seguridad, administrativos, comisiones, otros_gastos,
    depreciacion_anos, incluir_depreciacion, incluir_4x1000,
    comisiones_bancarias, incluir_comision_datafono, comision_datafono_porcentaje,
    porcentaje_ventas_datafono, gastos_financieros,
    incluir_iva, porcentaje_ingresos_iva, tarifa_iva, iva_pagado_estimado,
    incluir_retenciones, retenciones, impuestos
  )
  SELECT
    new_project_id, nomina_administrativa, nomina_operativa, prestaciones_porcentaje,
    arrendamiento_modelo, arrendamiento_fijo, arrendamiento_variable_porcentaje,
    arrendamiento_variable_base, arrendamiento_mixto_fijo, arrendamiento_mixto_porcentaje,
    arrendamiento_mixto_base, servicios_publicos, marketing, tecnologia, seguros,
    mantenimiento_general, seguridad, administrativos, comisiones, otros_gastos,
    depreciacion_anos, incluir_depreciacion, incluir_4x1000,
    comisiones_bancarias, incluir_comision_datafono, comision_datafono_porcentaje,
    porcentaje_ventas_datafono, gastos_financieros,
    incluir_iva, porcentaje_ingresos_iva, tarifa_iva, iva_pagado_estimado,
    incluir_retenciones, retenciones, impuestos
  FROM project_opex
  WHERE project_id = original_project_id;

  -- Duplicate obra civil
  INSERT INTO obra_civil (
    project_id, area_total_proyecto, costo_construccion_por_m2, capex_construccion,
    paisajismo, estudios_disenos, permisos_licencias, interventoria,
    interventoria_porcentaje, imprevistos_porcentaje, imprevistos_valor, capex_obra_civil_total
  )
  SELECT
    new_project_id, area_total_proyecto, costo_construccion_por_m2, capex_construccion,
    paisajismo, estudios_disenos, permisos_licencias, interventoria,
    interventoria_porcentaje, imprevistos_porcentaje, imprevistos_valor, capex_obra_civil_total
  FROM obra_civil
  WHERE project_id = original_project_id;

  -- Duplicate spaces
  INSERT INTO project_spaces (
    project_id, name, type, area, capex_por_m2, breakdown,
    genera_ingresos, configuracion_ingresos, order_index
  )
  SELECT
    new_project_id, name, type, area, capex_por_m2, breakdown,
    genera_ingresos, configuracion_ingresos, order_index
  FROM project_spaces
  WHERE project_id = original_project_id;

  RETURN new_project_id;
END;
$$;
