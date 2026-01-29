import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Filter, X } from 'lucide-react';
import { ModuleData, ModuleCategory, MODULE_CATEGORIES } from '@/types';
import { useModules } from '@/hooks/useModules';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import ModuleCard from '@/components/modules/ModuleCard';
import ModuleDetailModal from '@/components/modules/ModuleDetailModal';
import CreateModuleWizard from '@/components/modules/CreateModuleWizard';
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

export default function ModuleCenterTab() {
  const { user } = useAuth();
  const {
    loading,
    error,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    originFilter,
    setOriginFilter,
    filteredModules,
    createModule,
    deleteModule,
    refreshModules,
  } = useModules();

  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createWizardOpen, setCreateWizardOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<ModuleData | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(debouncedQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [debouncedQuery, setSearchQuery]);

  const handleViewModule = (module: ModuleData) => {
    setSelectedModule(module);
    setDetailModalOpen(true);
  };

  const handleDeleteClick = (module: ModuleData) => {
    setModuleToDelete(module);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (moduleToDelete) {
      await deleteModule(moduleToDelete.id);
      setDeleteDialogOpen(false);
      setModuleToDelete(null);
    }
  };

  const handleCreateSuccess = async (moduleData: Partial<ModuleData>) => {
    const created = await createModule(moduleData);
    if (created) {
      setCreateWizardOpen(false);
    }
  };

  const clearFilters = () => {
    setDebouncedQuery('');
    setSearchQuery('');
    setCategoryFilter(null);
    setOriginFilter('all');
  };

  const hasActiveFilters = searchQuery || categoryFilter || originFilter !== 'all';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Central de Módulos</h1>
        <p className="text-muted-foreground">
          Administra plantillas de actividades, espacios y servicios
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar módulos..."
            value={debouncedQuery}
            onChange={(e) => setDebouncedQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={categoryFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(null)}
          >
            Todas
          </Button>
          {MODULE_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={categoryFilter === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Origin Filter */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Mostrar:</span>
          <RadioGroup
            value={originFilter}
            onValueChange={(value) => setOriginFilter(value as 'all' | 'system' | 'mine')}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="all" id="origin-all" />
              <Label htmlFor="origin-all" className="text-sm cursor-pointer">Todos</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="system" id="origin-system" />
              <Label htmlFor="origin-system" className="text-sm cursor-pointer">Sistema</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="mine" id="origin-mine" />
              <Label htmlFor="origin-mine" className="text-sm cursor-pointer">Mis Módulos</Label>
            </div>
          </RadioGroup>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
              <X className="h-4 w-4 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Create Button */}
      <div className="mb-6">
        <Button onClick={() => setCreateWizardOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Crear Nuevo Módulo
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refreshModules} variant="outline">
            Reintentar
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4">
              <Skeleton className="h-10 w-10 rounded mb-3" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3 mb-3" />
              <Skeleton className="h-px w-full mb-3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty States */}
      {!loading && !error && filteredModules.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          {searchQuery ? (
            <>
              <p className="text-lg text-muted-foreground mb-4">
                No se encontraron módulos con "{searchQuery}"
              </p>
              <Button onClick={clearFilters} variant="outline">
                Limpiar búsqueda
              </Button>
            </>
          ) : originFilter === 'mine' ? (
            <>
              <p className="text-lg text-muted-foreground mb-4">
                Aún no has creado módulos personalizados
              </p>
              <Button onClick={() => setCreateWizardOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear tu primer módulo
              </Button>
            </>
          ) : categoryFilter ? (
            <>
              <p className="text-lg text-muted-foreground mb-4">
                No hay módulos en esta categoría aún
              </p>
              <Button onClick={() => setCategoryFilter(null)} variant="outline">
                Ver todos
              </Button>
            </>
          ) : (
            <p className="text-lg text-muted-foreground">
              No hay módulos disponibles
            </p>
          )}
        </div>
      )}

      {/* Module Grid */}
      {!loading && !error && filteredModules.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              isOwner={module.created_by === user?.id}
              onView={handleViewModule}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!loading && !error && filteredModules.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Mostrando {filteredModules.length} módulo{filteredModules.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Module Detail Modal */}
      <ModuleDetailModal
        module={selectedModule}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />

      {/* Create Module Wizard */}
      <CreateModuleWizard
        open={createWizardOpen}
        onOpenChange={setCreateWizardOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar módulo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El módulo "{moduleToDelete?.name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
