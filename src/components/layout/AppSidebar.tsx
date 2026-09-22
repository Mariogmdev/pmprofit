import { useState } from 'react';
import {
  Home,
  Plus,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  FolderOpen,
  Copy,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '@/lib/time';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import CreateProjectModal from '@/components/modals/CreateProjectModal';

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  const { signOut } = useAuth();
  const { currentProject, projects, selectProject, refreshProjects } = useProject();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectToDuplicate, setProjectToDuplicate] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDuplicate = async () => {
    if (!projectToDuplicate) return;
    setIsDuplicating(true);
    try {
      const original = projects.find((p) => p.id === projectToDuplicate);
      const { data: newId, error } = await supabase.rpc('duplicate_project', {
        original_project_id: projectToDuplicate,
        new_project_name: `Copia de ${original?.name || 'Proyecto'}`,
      });

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo duplicar el proyecto',
          variant: 'destructive',
        });
        return;
      }

      await refreshProjects();
      if (newId) selectProject(newId);

      toast({
        title: 'Proyecto duplicado',
        description: 'La copia se creó correctamente',
      });
    } finally {
      setIsDuplicating(false);
      setProjectToDuplicate(null);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-sidebar border-r border-sidebar-border
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-screen lg:h-auto
        `}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-4">
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <nav className="p-4">
            <button className="sidebar-item sidebar-item-active w-full mb-4">
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
          </nav>

          {/* Projects section */}
          <div className="px-4 mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mis Proyectos
            </h3>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-1 pb-4">
              {projects.length === 0 ? (
                <div className="py-8 text-center">
                  <FolderOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No tienes proyectos aún
                  </p>
                </div>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="relative group">
                    <button
                      onClick={() => selectProject(project.id)}
                      className={`
                        w-full text-left p-3 rounded-lg transition-all
                        ${
                          currentProject?.id === project.id
                            ? 'bg-sidebar-accent border-l-4 border-primary'
                            : 'hover:bg-muted'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <p
                          className={`text-sm font-medium truncate flex-1 min-w-0 ${
                            currentProject?.id === project.id
                              ? 'text-primary'
                              : 'text-sidebar-foreground'
                          }`}
                        >
                          {project.name}
                        </p>
                        <span
                          role="button"
                          aria-label={`Duplicar ${project.name}`}
                          title="Duplicar proyecto"
                          className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-muted-foreground/20 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDuplicate(project.id);
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelativeTime(project.updated_at)}
                      </p>
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Create project button */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              className="w-full gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4" />
              Nuevo Proyecto
            </Button>
          </div>
        </div>

        {/* Bottom links */}
        <div className="p-4 border-t border-sidebar-border space-y-1">
          <button className="sidebar-item sidebar-item-inactive w-full">
            <Settings className="w-5 h-5" />
            <span>Configuración</span>
          </button>
          <button className="sidebar-item sidebar-item-inactive w-full">
            <HelpCircle className="w-5 h-5" />
            <span>Ayuda</span>
          </button>
          <button
            className="sidebar-item sidebar-item-inactive w-full text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 left-4 z-30 lg:hidden shadow-lg"
        onClick={onToggle}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Create project modal */}
      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </>
  );
}
