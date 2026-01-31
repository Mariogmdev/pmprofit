import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, ChevronUp, ChevronDown } from 'lucide-react';
import { OpexCategories } from './OpexCategories';
import { OpexSummaryCard } from './OpexSummaryCard';
import { CurrencyCode } from '@/types/index';

interface OpexSectionProps {
  projectId: string;
  currency: CurrencyCode;
}

export const OpexSection = ({ projectId, currency }: OpexSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="border-2 border-red-200 dark:border-red-800">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Sección C: OPEX Detallado del Proyecto</CardTitle>
              <CardDescription>
                Define los gastos operativos mensuales en 10 categorías
              </CardDescription>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6 pt-6">
          {/* 10 Categories in Accordions */}
          <OpexCategories projectId={projectId} currency={currency} />
          
          {/* OPEX Total Summary */}
          <OpexSummaryCard projectId={projectId} currency={currency} />
        </CardContent>
      )}
    </Card>
  );
};
