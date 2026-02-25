import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardMetrics } from '@/types/dashboard';
import { formatCurrency } from '@/lib/currency';
import { CurrencyCode, AppTab } from '@/types';
import { cn } from '@/lib/utils';
import { TrendingUp, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

interface ViabilityBannerProps {
  metrics: DashboardMetrics;
  currency: CurrencyCode;
  discountRate: number;
  onNavigate?: (tab: AppTab) => void;
}

export const ViabilityBanner = ({ metrics, currency, discountRate, onNavigate }: ViabilityBannerProps) => {
  const spread = metrics.tir - discountRate;
  const moic = metrics.capexTotal > 0
    ? (metrics.van + metrics.capexTotal) / metrics.capexTotal
    : 0;

  const viable = metrics.tir >= discountRate && metrics.van > 0;
  const borderline = !viable && metrics.tir >= discountRate * 0.8;

  const bannerClasses = viable
    ? 'border-green-200 dark:border-green-800 bg-green-50/60 dark:bg-green-950/20'
    : borderline
    ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/60 dark:bg-yellow-950/20'
    : 'border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20';

  const StatusIcon = viable ? CheckCircle2 : borderline ? AlertTriangle : XCircle;
  const iconColor = viable ? 'text-green-600 dark:text-green-400' : borderline ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';

  const vanMillions = metrics.van / 1000000;

  return (
    <Card className={cn('border-2 animate-fade-in', bannerClasses)} style={{ animationDelay: '0.45s' }}>
      <CardContent className="py-4 px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* TIR vs WACC */}
          <div className="flex items-center gap-2">
            <StatusIcon className={cn('w-5 h-5', iconColor)} />
            <span className="text-sm font-medium">
              TIR {metrics.tir.toFixed(1)}% vs WACC {discountRate}%
            </span>
          </div>

          <TrendingUp className="w-4 h-4 text-muted-foreground hidden sm:block" />

          {/* Spread */}
          <Badge variant="outline" className={cn(
            "text-xs",
            spread >= 0 ? "text-green-700 dark:text-green-400 border-green-300 dark:border-green-700" 
                       : "text-red-700 dark:text-red-400 border-red-300 dark:border-red-700"
          )}>
            Spread {spread >= 0 ? "+" : ""}{spread.toFixed(1)}pp
          </Badge>

          <span className="text-muted-foreground hidden sm:block">|</span>

          {/* VAN */}
          <div className="flex items-center gap-1.5 text-sm">
            {metrics.van >= 0 && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />}
            <span className="font-medium">
              VAN {formatCurrency(metrics.van, currency)} {metrics.van >= 0 ? 'positivo' : 'negativo'}
            </span>
          </div>

          <span className="text-muted-foreground hidden sm:block">|</span>

          {/* Payback */}
          <span className="text-sm font-medium">
            Payback {metrics.paybackMesesReal}m ({(metrics.paybackMesesReal / 12).toFixed(1)} años)
          </span>

          <span className="text-muted-foreground hidden sm:block">|</span>

          {/* MOIC */}
          <span className="text-sm font-medium">
            MOIC {moic.toFixed(2)}x
          </span>

          {/* Link to cash flow */}
          {onNavigate && (
            <Button
              variant="link"
              size="sm"
              className="ml-auto h-auto p-0 text-xs"
              onClick={() => onNavigate('flujo-caja')}
            >
              Ver Flujo de Caja
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
