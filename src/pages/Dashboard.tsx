import { useState } from 'react';
import { AppTab } from '@/types';
import { useProject } from '@/contexts/ProjectContext';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { generatePitchDeckPDF } from '@/lib/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/layout/AppHeader';
import AppSidebar from '@/components/layout/AppSidebar';
import AppTabs from '@/components/layout/AppTabs';
import ConfigurationTab from '@/components/tabs/ConfigurationTab';
import ConstructorTab from '@/components/tabs/ConstructorTab';
import ModuleCenterTab from '@/components/tabs/ModuleCenterTab';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { EstadoResultados } from '@/components/financials/EstadoResultados';
import { BalanceGeneral } from '@/components/financials/BalanceGeneral';
import { FlujoCaja } from '@/components/financials/FlujoCaja';

export default function Dashboard() {
  const { saveStatus, currentProject } = useProject();
  const { exportExcel, isExporting } = useExcelExport();
  const metrics = useDashboardMetrics();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('config');

  const handleExportPDF = () => {
    if (!currentProject || !metrics) {
      toast({ title: 'Error', description: 'No hay proyecto activo o métricas disponibles.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Generando PDF...', description: 'Esto puede tomar unos segundos.' });
    try {
      generatePitchDeckPDF(currentProject, metrics);
      setTimeout(() => {
        toast({ title: '✅ PDF generado', description: 'El pitch deck se descargó correctamente.' });
      }, 1500);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: 'Error al generar PDF', description: String(error), variant: 'destructive' });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'config':
        return <ConfigurationTab />;
      case 'constructor':
        return <ConstructorTab />;
      case 'modules':
        return <ModuleCenterTab />;
      case 'summary':
        return <DashboardTab onTabChange={setActiveTab} />;
      case 'estados-financieros':
        return currentProject ? (
          <div className="p-4 lg:p-6">
            <EstadoResultados projectId={currentProject.id} vista="anual" />
          </div>
        ) : null;
      case 'balance-general':
        return currentProject ? (
          <div className="p-4 lg:p-6">
            <BalanceGeneral projectId={currentProject.id} />
          </div>
        ) : null;
      case 'flujo-caja':
        return currentProject ? (
          <div className="p-4 lg:p-6">
            <FlujoCaja projectId={currentProject.id} />
          </div>
        ) : null;
      default:
        return <ConfigurationTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader saveStatus={saveStatus} onExportExcel={exportExcel} onExportPDF={handleExportPDF} isExporting={isExporting} />

      <div className="flex w-full">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 min-h-[calc(100vh-64px)] overflow-hidden">
          <AppTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="overflow-auto h-[calc(100vh-64px-57px)]">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
