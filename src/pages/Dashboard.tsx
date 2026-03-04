import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppTab } from '@/types';
import { useProject } from '@/contexts/ProjectContext';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { generatePitchDeckPDF } from '@/lib/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronRight, Rocket } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import AppSidebar from '@/components/layout/AppSidebar';
import AppTabs from '@/components/layout/AppTabs';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import ConfigurationTab from '@/components/tabs/ConfigurationTab';
import ConstructorTab from '@/components/tabs/ConstructorTab';
import ModuleCenterTab from '@/components/tabs/ModuleCenterTab';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { EstadoResultados } from '@/components/financials/EstadoResultados';
import { BalanceGeneral } from '@/components/financials/BalanceGeneral';
import { FlujoCaja } from '@/components/financials/FlujoCaja';

function WelcomeEmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Rocket className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">¡Bienvenido a ProFit! 🎉</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Crea tu primer proyecto y descubre cuánto puede rendir tu club deportivo. Solo necesitas 15 minutos.
      </p>
      <div className="flex items-center gap-4 mb-8">
        {['Configura', 'Modela', 'Exporta'].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">{i + 1}</span>
              <span className="text-sm font-medium text-foreground">{step}</span>
            </div>
            {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        ))}
      </div>
      <Button onClick={onCreateProject} size="lg" className="gap-2">
        <ArrowRight className="w-4 h-4" />
        Crear Mi Primer Proyecto
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const { saveStatus, currentProject, projects } = useProject();
  const { exportExcel, isExporting } = useExcelExport();
  const metrics = useDashboardMetrics();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('config');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleExportPDF = useCallback(() => {
    if (!currentProject || !metrics) {
      toast({ title: 'Error', description: 'No hay proyecto activo o métricas disponibles.', variant: 'destructive' });
      return;
    }
    console.log('PDF export: project =', currentProject.name, 'TIR =', metrics.tir);
    toast({ title: 'Generando PDF...', description: 'Esto puede tomar unos segundos.' });
    try {
      generatePitchDeckPDF(currentProject, metrics);
      setTimeout(() => {
        toast({ title: 'PDF generado', description: 'El pitch deck se descargo correctamente.' });
      }, 1500);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: 'Error al generar PDF', description: String(error), variant: 'destructive' });
    }
  }, [currentProject, metrics, toast]);
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

  const showEmptyState = projects.length === 0 && !currentProject;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader saveStatus={saveStatus} onExportExcel={exportExcel} onExportPDF={handleExportPDF} isExporting={isExporting} />

      {showEmptyState ? (
        <WelcomeEmptyState onCreateProject={() => setActiveTab('config')} />
      ) : (
        <div className="flex w-full">
          <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 min-h-[calc(100vh-64px)] overflow-hidden">
            <AppTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="overflow-auto h-[calc(100vh-64px-57px)]">
              {renderTabContent()}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
