import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, SaveStatus, CurrencyCode } from '@/types';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  saveStatus: SaveStatus;
  createProject: (data: Partial<Project>) => Promise<Project | null>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (id: string) => void;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Fetch all projects for the user
  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los proyectos',
          variant: 'destructive',
        });
        return;
      }

      const projectsData = (data || []) as Project[];
      setProjects(projectsData);

      // Select the first project if none is selected
      if (!currentProject && projectsData.length > 0) {
        setCurrentProject(projectsData[0]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentProject, toast]);

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const refreshProjects = async () => {
    await fetchProjects();
  };

  const createProject = async (data: Partial<Project>): Promise<Project | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para crear un proyecto',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const newProject = {
        user_id: user.id,
        name: data.name || 'Nuevo Proyecto',
        location: data.location || null,
        currency: (data.currency || 'COP') as CurrencyCode,
        currency_symbol: data.currency_symbol || '$',
        ...data,
      };

      const { data: created, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        toast({
          title: 'Error',
          description: 'No se pudo crear el proyecto',
          variant: 'destructive',
        });
        return null;
      }

      const projectData = created as Project;
      setProjects((prev) => [projectData, ...prev]);
      setCurrentProject(projectData);

      toast({
        title: 'Proyecto creado',
        description: `"${projectData.name}" se creó correctamente`,
      });

      return projectData;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    setSaveStatus('saving');

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          ...data,
          last_saved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating project:', error);
        setSaveStatus('error');
        toast({
          title: 'Error',
          description: 'No se pudieron guardar los cambios',
          variant: 'destructive',
        });
        return;
      }

      // Update local state
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...data, last_saved_at: new Date().toISOString() }
            : p
        )
      );

      if (currentProject?.id === id) {
        setCurrentProject((prev) =>
          prev ? { ...prev, ...data, last_saved_at: new Date().toISOString() } : prev
        );
      }

      setSaveStatus('saved');

      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error updating project:', error);
      setSaveStatus('error');
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);

      if (error) {
        console.error('Error deleting project:', error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el proyecto',
          variant: 'destructive',
        });
        return;
      }

      setProjects((prev) => prev.filter((p) => p.id !== id));

      // If the deleted project was the current one, select another
      if (currentProject?.id === id) {
        const remaining = projects.filter((p) => p.id !== id);
        setCurrentProject(remaining.length > 0 ? remaining[0] : null);
      }

      toast({
        title: 'Proyecto eliminado',
        description: 'El proyecto se eliminó correctamente',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const selectProject = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      setCurrentProject(project);
    }
  };

  const value = {
    currentProject,
    projects,
    loading,
    saveStatus,
    createProject,
    updateProject,
    deleteProject,
    selectProject,
    refreshProjects,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
