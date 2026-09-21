import React, { useState, useEffect } from 'react';
import type { Project } from './types';
import { ProjectCatalog } from './components/catalog/ProjectCatalog';
import { DesktopViewer } from './components/desktop/DesktopViewer';
import { LocalFileModal } from './components/catalog/LocalFileModal';
import { xrStore } from './components/xr/xrStore';
import { DEFAULT_PROJECTS } from './data/defaultProjects';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(true);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [catalogKey, setCatalogKey] = useState(0);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const jsonUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}projects.json`;

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data: Project[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
        }
      })
      .catch((err) => {
        console.warn('Using default projects fallback:', err);
      });
  }, []);

  // Open in 3D desktop view
  const handleSelectProject = (project: Project, file?: File) => {
    setActiveProject(project);
    setLocalFile(file || null);
    setIsCatalogOpen(false);
  };

  // Direct 1-click WebXR trigger for Meta Quest VR
  const handleEnterVRProject = async (project: Project) => {
    setActiveProject(project);
    setLocalFile(null);
    setIsCatalogOpen(false);
    try {
      await xrStore.enterVR();
    } catch (err) {
      console.warn('Error launching WebXR VR session:', err);
    }
  };

  // Direct 1-click WebXR AR trigger (Passthrough cameras) for Meta Quest
  const handleEnterARProject = async (project: Project) => {
    setActiveProject(project);
    setLocalFile(null);
    setIsCatalogOpen(false);
    try {
      await xrStore.enterAR();
    } catch (err) {
      console.warn('Error launching WebXR AR session:', err);
    }
  };

  const handleBackToCatalog = () => {
    setIsCatalogOpen(true);
    setActiveProject(null);
    setLocalFile(null);
  };

  const handleLocalFileSelect = (project: Project, file: File) => {
    setActiveProject(project);
    setLocalFile(file);
    setIsCatalogOpen(false);
  };

  const handleUpdateThumbnail = () => {
    setCatalogKey((k) => k + 1);
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* Catalog View - Lightweight, fast, full scrolling with zero 3D overhead */}
      {isCatalogOpen ? (
        <div key={catalogKey} className="w-full min-h-screen overflow-y-auto">
          <ProjectCatalog
            onSelectProject={handleSelectProject}
            onEnterVRProject={handleEnterVRProject}
            onEnterARProject={handleEnterARProject}
            onOpenLocalFileModal={() => setIsLocalModalOpen(true)}
          />
        </div>
      ) : activeProject ? (
        /* 3D Viewport - Only loads model and runs WebGL when project is chosen */
        <div className="fixed inset-0 overflow-hidden bg-slate-950 z-10">
          <DesktopViewer
            project={activeProject}
            projects={projects}
            onSelectProject={(p) => {
              setActiveProject(p);
              setLocalFile(null);
            }}
            localFile={localFile}
            onBackToCatalog={handleBackToCatalog}
            onOpenLocalFileModal={() => setIsLocalModalOpen(true)}
            onUpdateThumbnail={handleUpdateThumbnail}
          />
        </div>
      ) : null}

      {/* Independent Local File Selector Modal */}
      <LocalFileModal
        isOpen={isLocalModalOpen}
        onClose={() => setIsLocalModalOpen(false)}
        onFileSelect={handleLocalFileSelect}
      />
    </div>
  );
};

export default App;
