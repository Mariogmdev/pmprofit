import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DashboardInsight } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle,
  ChevronRight 
} from 'lucide-react';

interface AutoInsightsProps {
  insights: DashboardInsight[];
  onNavigate?: (tab: 'config' | 'constructor' | 'modules') => void;
}

export const AutoInsights = ({ insights, onNavigate }: AutoInsightsProps) => {
  if (insights.length === 0) return null;

  const getIcon = (type: DashboardInsight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    }
  };

  const getBorderColor = (type: DashboardInsight['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20';
      case 'warning':
        return 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20';
      case 'info':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20';
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20';
    }
  };

  // Group and sort insights by priority
  const sortedInsights = [...insights].sort((a, b) => {
    const priority = { error: 0, warning: 1, success: 2, info: 3 };
    return priority[a.type] - priority[b.type];
  });

  return (
    <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.5s' }}>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Info className="w-5 h-5 text-muted-foreground" />
        Análisis Automático
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sortedInsights.slice(0, 6).map((insight) => (
          <Alert 
            key={insight.id} 
            className={cn(
              "border transition-all hover:shadow-md",
              getBorderColor(insight.type)
            )}
          >
            <div className="flex items-start gap-3">
              {getIcon(insight.type)}
              <div className="flex-1 min-w-0">
                <AlertTitle className="text-sm font-semibold mb-1">
                  {insight.title}
                </AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  {insight.description}
                </AlertDescription>
                {insight.action && onNavigate && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 mt-2 text-xs"
                    onClick={() => onNavigate(insight.action!.tab!)}
                  >
                    {insight.action.label}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </div>
  );
};
