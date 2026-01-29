import { useState } from 'react';
import { AppTab } from '@/types';
import { useProject } from '@/contexts/ProjectContext';
import AppHeader from '@/components/layout/AppHeader';
import AppSidebar from '@/components/layout/AppSidebar';
import AppTabs from '@/components/layout/AppTabs';
import ConfigurationTab from '@/components/tabs/ConfigurationTab';
import PlaceholderTab from '@/components/tabs/PlaceholderTab';

export default function Dashboard() {
  const { saveStatus } = useProject();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('config');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'config':
        return <ConfigurationTab />;
      case 'sports':
        return <PlaceholderTab title="Deportes y Actividades - En Construcción" />;
      case 'opex':
        return <PlaceholderTab title="OPEX - En Construcción" />;
      case 'summary':
        return <PlaceholderTab title="Resumen - En Construcción" />;
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
