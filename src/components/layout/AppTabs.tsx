import { Settings, Activity, TrendingUp, BarChart2 } from 'lucide-react';
import { AppTab } from '@/types';
import { cn } from '@/lib/utils';

interface AppTabsProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
  { id: 'config', label: 'Configuración', icon: <Settings className="w-4 h-4" /> },
  { id: 'sports', label: 'Deportes y Actividades', icon: <Activity className="w-4 h-4" /> },
  { id: 'opex', label: 'OPEX', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'summary', label: 'Resumen', icon: <BarChart2 className="w-4 h-4" /> },
];

export default function AppTabs({ activeTab, onTabChange }: AppTabsProps) {
  return (
    <div className="border-b border-border bg-card">
      <nav className="flex overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
