import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProjectSpaces } from '@/hooks/useProjectSpaces';
import { ProjectSpace, SPACE_TEMPLATES, SpaceTemplate } from '@/types/infrastructure';
import { CurrencyCode } from '@/types/index';
import { SpaceCard } from './SpaceCard';
import { Building, Building2, Plus, Loader2 } from 'lucide-react';

interface SpacesManagerProps {
  projectId: string;
  currency: CurrencyCode;
}

export const SpacesManager = ({ projectId, currency }: SpacesManagerProps) => {
  const { spaces, loading, addSpace, updateSpace, deleteSpace } = useProjectSpaces(projectId);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleAddSpace = async (template: SpaceTemplate) => {
    const newSpace: Partial<ProjectSpace> = {
      project_id: projectId,
      type: template.type,
      name: template.name,
      area: template.defaultArea,
      capex_por_m2: 0,
      breakdown: [],
      genera_ingresos: false,
      order_index: spaces.length
    };
    await addSpace(newSpace);
    setShowTemplates(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building className="w-5 h-5" />
          Espacios Comunes
        </h3>
        <Button onClick={() => setShowTemplates(!showTemplates)}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Espacio
        </Button>
      </div>

      {/* Templates selector */}
      {showTemplates && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <p className="text-sm text-muted-foreground mb-3">Selecciona un espacio:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {SPACE_TEMPLATES.map((template) => (
              <Button
                key={template.type}
                variant="outline"
                onClick={() => handleAddSpace(template)}
                className="flex flex-col items-center gap-2 h-auto py-3"
              >
                <span className="text-2xl">{template.icon}</span>
                <span className="text-xs text-center">{template.name}</span>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Lista de espacios */}
      {spaces.length === 0 ? (
        <Card className="p-8 text-center bg-muted/30">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-2">No hay espacios agregados</p>
          <p className="text-sm text-muted-foreground">
            Agrega espacios comunes para tu proyecto
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {spaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              currency={currency}
              onUpdate={updateSpace}
              onDelete={deleteSpace}
            />
          ))}
        </div>
      )}
    </div>
  );
};
