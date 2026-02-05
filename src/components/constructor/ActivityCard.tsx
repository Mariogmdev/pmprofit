import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, MoreVertical, Trash2, Copy, Save, Loader2, Check } from 'lucide-react';
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
import { useProject } from '@/contexts/ProjectContext';
import { useActivityCalculations } from '@/hooks/useActivityCalculations';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { monthlyFinancialsWithOccupancy } from '@/lib/monthlyFinancials';
import ActivityBasicConfig from './ActivityBasicConfig';
import ActivityRevenueModelEditor from './ActivityRevenueModelEditor';
import ActivityScheduleEditor from './ActivityScheduleEditor';
import ActivityMonthlyOccupationEditor from './ActivityMonthlyOccupationEditor';
import ActivityRentalsEditor from './ActivityRentalsEditor';
import ActivityClassesEditor from './ActivityClassesEditor';
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
  onSave: () => Promise<void>;
  currency: string;
  totalClubUsers?: number;
}

export default function ActivityCard({
  activity,
  expanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onDuplicate,
  onSave,
  currency,
  totalClubUsers = 0,
}: ActivityCardProps) {
  const { currentProject } = useProject();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState(activity.name);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasChangesRef = useRef(false);
  
  const calculations = useActivityCalculations(activity.config, totalClubUsers);
  const daysPerMonth = currentProject?.days_per_month || 30;

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Debounced save with 3 second delay - only when no input is focused
  const triggerDebouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      // Don't save if an input is focused
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
        // Retry later
        saveTimeoutRef.current = setTimeout(() => triggerDebouncedSave(), 1000);
        return;
      }
      
      if (hasChangesRef.current) {
        setIsSaving(true);
        try {
          await onSave();
          setLastSaved(new Date());
          hasChangesRef.current = false;
        } catch (error) {
          console.error('Error saving:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 3000);
  }, [onSave]);

  const handleNameBlur = async () => {
    setEditingName(false);
    if (localName !== activity.name && localName.trim()) {
      onUpdate({ name: localName.trim() });
      hasChangesRef.current = true;
      // Save immediately on blur
      setIsSaving(true);
      try {
        await onSave();
        setLastSaved(new Date());
        hasChangesRef.current = false;
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleConfigUpdate = useCallback((updates: Partial<ActivityConfig>) => {
    onUpdate({
      config: { ...activity.config, ...updates },
    });
    hasChangesRef.current = true;
    triggerDebouncedSave();
  }, [activity.config, onUpdate, triggerDebouncedSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setLocalName(activity.name);
      setEditingName(false);
    }
  };

  // ============================================================
  // CENTRALIZED: Use monthlyFinancialsWithOccupancy for ALL income calculations
  // This ensures consistency with Dashboard and eliminates duplicate logic
  // ============================================================
  const calculateMonthlyIncome = useCallback((picoOcupacion: number, valleOcupacion: number): number => {
    const result = monthlyFinancialsWithOccupancy(
      activity.config,
      daysPerMonth,
      picoOcupacion,
      valleOcupacion,
      totalClubUsers
    );
    return result.ingresos.total;
  }, [activity.config, daysPerMonth, totalClubUsers]);

  // Show schedule/occupation for reservation and mixed models
  const showSchedules = ['reserva', 'mixto'].includes(activity.config.modeloIngreso);

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
                
                {/* Save Indicator */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {isSaving && (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  )}
                  {!isSaving && lastSaved && (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">Guardado</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>{activity.config.cantidad} {activity.config.tipoUnidad || 'unidades'}</span>
                {showSchedules && (
                  <>
                    <span>•</span>
                    <span>{activity.config.duracionReserva} hrs</span>
                  </>
                )}
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

            {/* 2. Revenue Model */}
            <ActivityRevenueModelEditor
              config={activity.config}
              onUpdate={handleConfigUpdate}
              currency={currency}
              daysPerMonth={daysPerMonth}
              totalClubUsers={totalClubUsers}
            />

            {/* 3. Schedules and Rates (only for reservation model) */}
            {showSchedules && (
              <ActivityScheduleEditor
                config={activity.config}
                onUpdate={handleConfigUpdate}
                currency={currency}
                calculations={calculations}
              />
            )}

            {/* 4. Occupation Projection (only for reservation model) */}
            {showSchedules && (
              <ActivityMonthlyOccupationEditor
                config={activity.config}
                onUpdate={handleConfigUpdate}
                currency={currency}
                monthlyIncome={calculateMonthlyIncome}
                calculatedOccupancy={calculations.ocupacionPromedio}
                calculatedPico={calculations.ocupacionPromedioPico}
                calculatedValle={calculations.ocupacionPromedioValle}
                horasPico={calculations.totalHorasPico}
                horasValle={calculations.totalHorasValle}
              />
            )}

            {/* 5. Equipment Rentals (only for reservation model) */}
            <ActivityRentalsEditor
              config={activity.config}
              onUpdate={handleConfigUpdate}
              currency={currency}
            />

            {/* 6. Classes/Training (only for reservation model) */}
            {showSchedules && (
              <ActivityClassesEditor
                config={activity.config}
                onUpdate={handleConfigUpdate}
                currency={currency}
                daysPerMonth={daysPerMonth}
              />
            )}

            {/* 5. CAPEX */}
            <ActivityCapexEditor
              config={activity.config}
              onUpdate={handleConfigUpdate}
              currency={currency}
              calculations={calculations}
              activityName={activity.name}
            />

            {/* 8. OPEX */}
            <ActivityOpexEditor
              config={activity.config}
              onUpdate={handleConfigUpdate}
              currency={currency}
              calculations={calculations}
            />

            {/* 9. Financial Summary */}
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
