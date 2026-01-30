import { useState } from 'react';
import { ChevronDown, ChevronRight, Package, Receipt } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import ActivitiesSection from '@/components/constructor/ActivitiesSection';
import { InfrastructureSection } from '@/components/constructor/InfrastructureSection';
import { useProject } from '@/contexts/ProjectContext';
import { CurrencyCode } from '@/types/index';

export default function ConstructorTab() {
  const { currentProject } = useProject();
  const [sectionAOpen, setSectionAOpen] = useState(true);
  const [sectionCOpen, setSectionCOpen] = useState(false);

  if (!currentProject) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Selecciona un proyecto para continuar</p>
      </div>
    );
  }

  const projectConfig = {
    opening_hour: currentProject.opening_hour || 6,
    closing_hour: currentProject.closing_hour || 22,
    days_per_month: currentProject.days_per_month || 30,
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Constructor del Proyecto</h1>
        <p className="text-muted-foreground mt-1">
          Configura las actividades, espacios y costos operativos de tu proyecto
        </p>
      </div>

      {/* Section A: Activities and Income */}
      <Collapsible open={sectionAOpen} onOpenChange={setSectionAOpen}>
        <Card className={cn(
          "transition-all",
          sectionAOpen && "ring-2 ring-primary/20"
        )}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-3">
                {sectionAOpen ? (
                  <ChevronDown className="h-5 w-5 text-primary" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <Package className="h-5 w-5 text-primary" />
                <span className="flex-1">Sección A: Actividades e Ingresos</span>
                {sectionAOpen && (
                  <span className="text-sm font-normal text-muted-foreground">
                    Configura las actividades que generarán ingresos
                  </span>
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <ActivitiesSection />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section B: Spaces and Infrastructure */}
      <InfrastructureSection 
        projectId={currentProject.id}
        currency={currentProject.currency as CurrencyCode}
      />

      {/* Section C: Detailed OPEX (Placeholder) */}
      <Collapsible open={sectionCOpen} onOpenChange={setSectionCOpen}>
        <Card className="opacity-60">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-3">
                {sectionCOpen ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1">Sección C: OPEX Detallado</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                  Fase 4C
                </span>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    En Construcción
                  </h3>
                  <p className="text-muted-foreground">
                    Esta sección estará disponible en la Fase 4C
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
