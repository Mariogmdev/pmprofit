import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, MoreVertical, Trash2, Copy, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProjectActivity, ActivityConfig } from '@/types/activity';
import { CurrencyCode } from '@/types';
import { useActivityCalculations } from '@/hooks/useActivityCalculations';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import ActivityBasicConfig from './ActivityBasicConfig';
import ActivityScheduleEditor from './ActivityScheduleEditor';
import ActivityOccupationEditor from './ActivityOccupationEditor';
import ActivityRentalsEditor from './ActivityRentalsEditor';
import ActivityCapexEditor from './ActivityCapexEditor';
import ActivityOpexEditor from './ActivityOpexEditor';
import ActivityFinancialSummary from './ActivityFinancialSummary';

interface ActivityCardProps {
  activity: ProjectActivity;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<ProjectActivity>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  currency: string;
}

export default function ActivityCard({
  activity,
  expanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onDuplicate,
  currency,
}: ActivityCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState(activity.name);
  
  const calculations = useActivityCalculations(activity.config);

  const handleNameBlur = () => {
    setEditingName(false);
    if (localName !== activity.name && localName.trim()) {
      onUpdate({ name: localName.trim() });
    }
  };

  const handleConfigUpdate = useCallback((updates: Partial<ActivityConfig>) => {
    onUpdate({
      config: { ...activity.config, ...updates },
    });
  }, [activity.config, onUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setLocalName(activity.name);
      setEditingName(false);
    }
  };

  return (
    <>
      <Card 
        id={`activity-${activity.id}`}
        className={cn(
          "transition-all",
          expanded && "ring-2 ring-primary/30"
        )}
      >
        {/* Header */}
        <CardHeader 
          className={cn(
            "cursor-pointer hover:bg-muted/50 transition-colors py-4",
            expanded && "border-b"
          )}
          onClick={(e) => {
            // Prevent toggle when clicking on inputs or buttons
            if ((e.target as HTMLElement).closest('input, button')) return;
            onToggleExpand();
          }}
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">{activity.icon}</div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {editingName ? (
                  <Input
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    onBlur={handleNameBlur}
                    onKeyDown={handleKeyDown}
                    className="h-8 text-lg font-semibold"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3 
                    className="text-lg font-semibold text-foreground truncate cursor-text hover:bg-muted px-1 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingName(true);
                    }}
                  >
                    {activity.name}
                  </h3>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>{activity.config.cantidad} {activity.config.tipoUnidad || 'unidades'}</span>
                <span>•</span>
                <span>{activity.config.duracionReserva} hrs</span>
                <span>•</span>
                <span>{formatCurrency(calculations.capexTotal, currency as CurrencyCode)} CAPEX</span>
                <span>•</span>
                <span className="text-primary font-medium">
                  {formatCurrency(calculations.ingresosMensualesAno1, currency as CurrencyCode)}/mes
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar como Módulo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
              >
                {expanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Expanded Content */}
        {expanded && (
          <CardContent className="pt-6 space-y-6">
            {/* 1. Basic Configuration */}
            <ActivityBasicConfig 
              config={activity.config}
              onUpdate={handleConfigUpdate}
            />

            {/* 2. Schedules and Rates */}
            <ActivityScheduleEditor
              config={activity.config}
              onUpdate={handleConfigUpdate}
              currency={currency}
              calculations={calculations}
            />

            {/* 3. Occupation Projection */}
            <ActivityOccupationEditor
              config={activity.config}
              onUpdate={handleConfigUpdate}
            />

            {/* 4. Complementary Income */}
            <ActivityRentalsEditor
              config={activity.config}
              onUpdate={handleConfigUpdate}
              currency={currency}
            />

            {/* 5. CAPEX */}
            <ActivityCapexEditor
              config={activity.config}
              onUpdate={handleConfigUpdate}
              currency={currency}
              calculations={calculations}
            />

            {/* 6. OPEX */}
            <ActivityOpexEditor
              config={activity.config}
              onUpdate={handleConfigUpdate}
              currency={currency}
              calculations={calculations}
            />

            {/* 7. Financial Summary */}
            <ActivityFinancialSummary
              calculations={calculations}
              currency={currency}
            />
          </CardContent>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{activity.name}"? 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
