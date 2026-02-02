import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useProject } from '@/contexts/ProjectContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { ProjectionViewMode } from '@/types/dashboard';
import { CurrencyCode } from '@/types';
import { HeroMetrics } from './HeroMetrics';
import { AutoInsights } from './AutoInsights';
import { ActivityInsightsSection } from './ActivityInsightsSection';
import { SpaceInsightsSection } from './SpaceInsightsSection';
import { ChartsGrid } from './ChartsGrid';
import { ProjectionTable } from './ProjectionTable';
import { DetailedMetrics } from './DetailedMetrics';
import { DashboardSkeleton } from './DashboardSkeleton';
import { formatCurrency } from '@/lib/currency';
import { FileDown, FileSpreadsheet, Share2, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardTabProps {
  onTabChange?: (tab: 'config' | 'constructor' | 'modules') => void;
}

export const DashboardTab = ({ onTabChange }: DashboardTabProps) => {
  const { currentProject } = useProject();
  const metrics = useDashboardMetrics();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ProjectionViewMode>('anual');
  
  const currency = (currentProject?.currency || 'COP') as CurrencyCode;

  const handleExportPDF = () => {
    toast({
      title: 'Exportar PDF',
      description: 'Esta funcionalidad estará disponible próximamente.',
    });
  };

  const handleExportExcel = () => {
    // Generate CSV data
    const headers = ['Año', 'Ingresos Anuales', 'OPEX Anual', 'EBITDA Anual', 'Margen %', 'Flujo Caja', 'ROI Acumulado'];
    const rows = metrics.proyeccion.map(p => [
      `Año ${p.year}`,
      p.ingresosAnuales,
      p.opexAnual,
      p.ebitdaAnual,
      `${p.margenEbitda.toFixed(1)}%`,
      p.flujoCaja,
      `${p.roiAcumulado.toFixed(1)}%`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentProject?.name || 'proyecto'}_proyeccion_financiera.csv`;
    link.click();

    toast({
      title: 'Exportación exitosa',
      description: 'El archivo CSV se ha descargado correctamente.',
    });
  };

  const handleShare = () => {
    // Copy summary to clipboard
    const summary = `
📊 Resumen Ejecutivo - ${currentProject?.name || 'Proyecto'}

💰 Ingresos Mensuales (Año 1): ${formatCurrency(metrics.ingresosMensualesAno1, currency)}
📈 EBITDA Mensual: ${formatCurrency(metrics.ebitdaMensualAno1, currency)} (${metrics.margenEbitdaAno1.toFixed(1)}%)
🏗️ CAPEX Total: ${formatCurrency(metrics.capexTotal, currency)}
⏱️ Payback: ${metrics.paybackMeses} meses (${(metrics.paybackMeses / 12).toFixed(1)} años)
📊 TIR: ${metrics.tir.toFixed(1)}%
💵 VAN: ${formatCurrency(metrics.van, currency)}
    `.trim();

    navigator.clipboard.writeText(summary);
    
    toast({
      title: 'Copiado al portapapeles',
      description: 'El resumen ejecutivo se ha copiado correctamente.',
    });
  };

  const handleEditActivity = (activityId: string) => {
    // Navigate to constructor tab - in a real implementation this would scroll to the specific activity
    if (onTabChange) {
      onTabChange('constructor');
    }
  };

  if (metrics.loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 p-6 pb-20">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Resumen Ejecutivo
          </h2>
          <p className="text-muted-foreground mt-1">
            Análisis financiero completo del proyecto
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileDown className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button size="sm" onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartir
          </Button>
        </div>
      </div>
      
      {/* Section 1: Hero Metrics */}
      <HeroMetrics metrics={metrics} currency={currency} />
      
      {/* Section 2: Insights Automáticos */}
      <AutoInsights insights={metrics.insights} onNavigate={onTabChange} />
      
      {/* Section 3: Activity Insights - NEW */}
      <ActivityInsightsSection 
        activities={metrics.activityInsights}
        topByRevenue={metrics.topActivitiesByRevenue}
        topByMargin={metrics.topActivitiesByMargin}
        worstPerformers={metrics.worstPerformers}
        currency={currency}
        onEditActivity={handleEditActivity}
      />
      
      {/* Section 4: Space Insights - NEW */}
      <SpaceInsightsSection 
        spaces={metrics.spaceInsights}
        currency={currency}
      />
      
      {/* Section 5: Visualizaciones */}
      <ChartsGrid metrics={metrics} currency={currency} />
      
      {/* Section 6: Proyección 5 Años */}
      <ProjectionTable 
        proyeccion={metrics.proyeccion}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currency={currency}
         year1Monthly={metrics.year1Monthly}
      />
      
      {/* Section 7: Métricas Detalladas */}
      <DetailedMetrics metrics={metrics} currency={currency} />
    </div>
  );
};
