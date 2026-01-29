import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { ModuleData, MODULE_CATEGORIES } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface ModuleCardProps {
  module: ModuleData;
  isOwner: boolean;
  onView: (module: ModuleData) => void;
  onEdit?: (module: ModuleData) => void;
  onDelete?: (module: ModuleData) => void;
}

export default function ModuleCard({
  module,
  isOwner,
  onView,
  onEdit,
  onDelete,
}: ModuleCardProps) {
  const categoryLabel = MODULE_CATEGORIES.find(c => c.id === module.category)?.label || module.category;
  const config = module.default_config;
  
  const getCapexDisplay = () => {
    if (config.capexCubierta) {
      return formatCurrency(config.capexCubierta, 'COP');
    }
    return null;
  };

  const getQuickSpecs = () => {
    const specs: string[] = [];
    if (config.cantidad) {
      specs.push(`${config.cantidad} unid.`);
    }
    if (config.duracionReserva) {
      specs.push(`${config.duracionReserva} hrs`);
    }
    return specs.join(' • ');
  };

  return (
    <Card 
      className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => onView(module)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{module.icon}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(module); }}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalle
              </DropdownMenuItem>
              {isOwner && onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(module); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {isOwner && onDelete && (
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDelete(module); }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
          {module.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]">
          {module.description}
        </p>

        {/* Quick Specs */}
        {(getQuickSpecs() || getCapexDisplay()) && (
          <>
            <div className="border-t border-border my-3" />
            <div className="text-xs text-muted-foreground space-y-1">
              {getQuickSpecs() && <p>{getQuickSpecs()}</p>}
              {getCapexDisplay() && <p>CAPEX: {getCapexDisplay()} c/u</p>}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-border my-3" />
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">📊 {module.usage_count} usos</span>
          </div>
          <Badge variant={module.is_system ? 'secondary' : 'outline'} className="text-xs">
            {module.is_system ? 'Sistema' : 'Personal'}
          </Badge>
        </div>

        {/* Category Badge */}
        <div className="mt-2">
          <Badge variant="outline" className="text-xs">
            {categoryLabel}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
