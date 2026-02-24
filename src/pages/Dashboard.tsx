import { useState } from 'react';
import { AppTab } from '@/types';
import { useProject } from '@/contexts/ProjectContext';
import AppHeader from '@/components/layout/AppHeader';
import AppSidebar from '@/components/layout/AppSidebar';
import AppTabs from '@/components/layout/AppTabs';
import ConfigurationTab from '@/components/tabs/ConfigurationTab';
import ConstructorTab from '@/components/tabs/ConstructorTab';
import ModuleCenterTab from '@/components/tabs/ModuleCenterTab';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { EstadoResultados } from '@/components/financials/EstadoResultados';

export default function Dashboard() {
  const { saveStatus, currentProject } = useProject();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('config');

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
      default:
        return <ConfigurationTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader saveStatus={saveStatus} />

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
