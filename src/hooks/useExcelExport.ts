import { useState, useCallback, useMemo } from 'react';
import { exportarExcelCompleto } from '@/lib/excelExport';
import { calculateEstadoResultados } from '@/lib/estadoResultadosCalculations';
import { calculateBalanceGeneral } from '@/lib/balanceGeneralCalculations';
import { useProject } from '@/contexts/ProjectContext';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { useProjectOpex } from '@/hooks/useProjectOpex';
import { useProjectSpaces } from '@/hooks/useProjectSpaces';
import { useObraCivil } from '@/hooks/useObraCivil';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { ActivityConfig } from '@/types/activity';

export function useExcelExport() {
  const { currentProject } = useProject();
  const projectId = currentProject?.id || '';
  const projectName = currentProject?.name || 'Proyecto';
  const { activities } = useProjectActivities();
  const { opex } = useProjectOpex(projectId);
  const { spaces } = useProjectSpaces(projectId);
  const { obraCivil } = useObraCivil(projectId);
  const metrics = useDashboardMetrics();

  const [isExporting, setIsExporting] = useState(false);

  const daysPerMonth = currentProject?.days_per_month || 30;
  const inflationRate = currentProject?.inflation_rate || 3;
  const depreciacionAnos = opex?.depreciacion_anos || 10;

  // CAPEX calculation (same as EstadoResultados/BalanceGeneral)
  const capexData = useMemo(() => {
    const capexActividades = activities.reduce((sum, activity) => {
      const config: ActivityConfig = activity.config;
      const cantidad = config.cantidad || 1;
      const tipoCubierta = config.tipoCubierta || 'cubierta';
      let capexConstruccion = 0;
      if (tipoCubierta === 'cubierta') capexConstruccion = (config.capexCubierta || 0) * cantidad;
      else if (tipoCubierta === 'semicubierta') capexConstruccion = (config.capexSemicubierta || 0) * cantidad;
      else capexConstruccion = (config.capexAireLibre || 0) * cantidad;

      const equipamiento = (config.equipamientoEspecifico || []).reduce((s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0);
      const consumibles = (config.consumibles || []).reduce((s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0);
      const mobiliario = (config.mobiliario || []).reduce((s, item) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0);
      return sum + capexConstruccion + equipamiento + consumibles + mobiliario;
    }, 0);

    const capexEspacios = spaces.reduce((sum, space) => {
      const areaCapex = (space.area || 0) * ((space as any).capex_por_m2 || 0);
      const breakdownTotal = ((space.breakdown as Array<{ cantidad?: number; precioUnitario?: number }>) || []).reduce(
        (s: number, item: { cantidad?: number; precioUnitario?: number }) => s + ((item.cantidad || 0) * (item.precioUnitario || 0)), 0,
      );
      return sum + areaCapex + breakdownTotal;
    }, 0);

    const capexObraCivil = obraCivil?.capex_obra_civil_total || 0;
    const subtotal = capexActividades + capexEspacios + capexObraCivil;
    const imprevistosPct = obraCivil?.imprevistos_porcentaje ?? 10;
    const imprevistos = subtotal * (imprevistosPct / 100);
    const capexSinWC = subtotal + imprevistos;

    return { capexSinWC, workingCapital: 0 };
  }, [activities, spaces, obraCivil]);

  const canExport = !metrics.loading && !!opex && activities.length > 0;

  const exportExcel = useCallback(async () => {
    if (!canExport) return;

    setIsExporting(true);
    try {
      const projectionYears = currentProject?.projection_years || 5;
      const pl = calculateEstadoResultados(
        projectId,
        activities,
        opex!,
        capexData.capexSinWC,
        capexData.workingCapital,
        0.35,
        depreciacionAnos,
        daysPerMonth,
        inflationRate,
        projectionYears,
      );

      const balance = calculateBalanceGeneral(
        projectId,
        pl,
        capexData.capexSinWC,
        capexData.workingCapital,
      );

      exportarExcelCompleto(projectName, metrics, pl, balance);
    } catch (error) {
      console.error('Error exportando Excel:', error);
    } finally {
      setIsExporting(false);
    }
  }, [canExport, projectId, projectName, activities, opex, capexData, daysPerMonth, inflationRate, depreciacionAnos, metrics, currentProject]);

  return { exportExcel, isExporting, canExport };
}
