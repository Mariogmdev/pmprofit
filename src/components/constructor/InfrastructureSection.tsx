import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpacesManager } from './SpacesManager';
import { ObraCivilEditor } from './ObraCivilEditor';
import { InfrastructureSummary } from './InfrastructureSummary';
import { CurrencyCode } from '@/types/index';
import { Building2, ChevronUp, ChevronDown } from 'lucide-react';

interface InfrastructureSectionProps {
  projectId: string;
  currency: CurrencyCode;
}

export const InfrastructureSection = ({ projectId, currency }: InfrastructureSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="border-2">
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <div>
              <CardTitle>Sección B: Espacios e Infraestructura General</CardTitle>
              <CardDescription>
                Define espacios comunes, obra civil y CAPEX de infraestructura
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
        <CardContent className="space-y-8 pt-6">
          {/* Espacios Comunes */}
          <SpacesManager projectId={projectId} currency={currency} />

          {/* Obra Civil */}
          <ObraCivilEditor projectId={projectId} currency={currency} />

          {/* Resumen CAPEX Infraestructura */}
          <InfrastructureSummary 
            projectId={projectId} 
            currency={currency}
          />
        </CardContent>
      )}
    </Card>
  );
};
