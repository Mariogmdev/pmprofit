import { CalculationStep as StepType } from '@/lib/calculationExplainer';
import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';

interface CalculationStepProps {
  step: StepType;
  index: number;
  isLast?: boolean;
}

export const CalculationStep = ({ step, index, isLast }: CalculationStepProps) => {
  return (
    <div className={cn(
      "relative pl-8 pb-4",
      !isLast && "border-l-2 border-muted-foreground/20 ml-3"
    )}>
      {/* Step number indicator */}
      <div className="absolute -left-0.5 top-0 w-7 h-7 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
        <span className="text-xs font-bold text-primary">{index + 1}</span>
      </div>
      
      <div className="bg-muted/30 rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors">
        {/* Label */}
        <h4 className="font-semibold text-sm text-foreground">
          {step.label}
        </h4>
        
        {/* Formula */}
        <div className="bg-background rounded-md px-3 py-2 border">
          <code className="text-sm font-mono text-primary">
            {step.formula}
          </code>
        </div>
        
        {/* Result */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Resultado:</span>
          <span className="text-lg font-bold text-foreground">
            {step.formattedValue}
          </span>
        </div>
        
        {/* Explanation */}
        <div className="flex items-start gap-2 pt-2 border-t border-border/50">
          <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {step.explanation}
          </p>
        </div>
      </div>
    </div>
  );
};
