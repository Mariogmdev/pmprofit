import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CalculationStep } from './CalculationStep';
import { CalculationType, explainCalculation, CalculationExplanation, ExplainerContext } from '@/lib/calculationExplainer';
import { DashboardMetrics } from '@/types/dashboard';
import { CurrencyCode } from '@/types';
import { Calculator, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculationType: CalculationType;
  metrics: DashboardMetrics;
  currency: CurrencyCode;
}

export const CalculationModal = ({
  isOpen,
  onClose,
  calculationType,
  metrics,
  currency,
}: CalculationModalProps) => {
  const context: ExplainerContext = { metrics, currency };
  const explanation = explainCalculation(calculationType, context);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {explanation.title}
                <Badge variant="outline" className="ml-2 font-mono">
                  {explanation.formattedResult}
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                {explanation.subtitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-6">
            {/* Steps */}
            <div className="space-y-0">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Pasos del Cálculo
              </h3>
              {explanation.steps.map((step, idx) => (
                <CalculationStep
                  key={idx}
                  step={step}
                  index={idx}
                  isLast={idx === explanation.steps.length - 1}
                />
              ))}
            </div>
            
            {/* Final Result Highlight */}
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resultado Final</p>
                  <p className="text-2xl font-bold text-primary">
                    {explanation.formattedResult}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Calculator className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>
            
            {/* Notes */}
            {explanation.notes && explanation.notes.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-300">
                    Notas Importantes
                  </h4>
                </div>
                <ul className="space-y-1">
                  {explanation.notes.map((note, idx) => (
                    <li key={idx} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Fixed Footer */}
        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button onClick={onClose} className="w-full sm:w-auto">
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
