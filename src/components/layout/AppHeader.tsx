import { useState } from 'react';
import {
  Calculator,
  ChevronDown,
  Download,
  FileText,
  User,
  Settings,
  LogOut,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SaveStatus } from '@/types';

interface AppHeaderProps {
  saveStatus: SaveStatus;
  onExportExcel?: () => void;
  isExporting?: boolean;
}

export default function AppHeader({ saveStatus, onExportExcel, isExporting }: AppHeaderProps) {
  const { profile, signOut } = useAuth();
  const { currentProject, projects, selectProject } = useProject();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return <span className="status-saving">Guardando...</span>;
      case 'saved':
        return (
          <span className="status-saved flex items-center gap-1">
            <Check className="w-3 h-3" />
            Guardado
          </span>
        );
      case 'error':
        return <span className="text-xs text-destructive">Error al guardar</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Logo y título */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground leading-tight">
              Padel Mundial
            </h1>
            <p className="text-xs text-muted-foreground">Modelador Universal</p>
          </div>
        </div>

        {/* Selector de proyecto */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between text-left font-normal"
              >
                <span className="truncate">
                  {currentProject?.name || 'Seleccionar proyecto'}
                </span>
                <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="center">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => selectProject(project.id)}
                  className={
                    currentProject?.id === project.id
                      ? 'bg-primary/10 text-primary'
                      : ''
                  }
                >
                  <span className="truncate">{project.name}</span>
                  {currentProject?.id === project.id && (
                    <Check className="w-4 h-4 ml-auto" />
                  )}
                </DropdownMenuItem>
              ))}
              {projects.length === 0 && (
                <DropdownMenuItem disabled>
                  No hay proyectos
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Acciones y usuario */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Estado de guardado */}
          <div className="hidden sm:block">{renderSaveStatus()}</div>

          {/* Botones de exportación */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onExportExcel}
              disabled={isExporting || !onExportExcel}
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exportando...' : 'Excel'}
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              PDF
            </Button>
          </div>

          {/* Menu de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 hidden sm:block opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.full_name || 'Usuario'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <User className="w-4 h-4" />
                Ver Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Settings className="w-4 h-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
