import { create } from 'zustand';
import type {
  AppSettings,
  Asset,
  GenerationJob,
  IllustratorProfile,
  OperationResult,
  Project,
  ReferenceItem,
  StylePreset,
} from '../../shared/types';

export type AppView = 'home' | 'editor' | 'jobs' | 'library' | 'settings' | 'diagnostics';
export type EditorTool = 'select' | 'move' | 'mask' | 'erase' | 'rectangle';

export interface CanvasActions {
  undo(): void;
  redo(): void;
  fit(): void;
  zoom(delta: number): void;
  clearMask(): void;
  saveMask(): Promise<void>;
  serialize(): string;
}

interface Notification { kind: 'success' | 'error' | 'info'; message: string }

interface AppState {
  view: AppView;
  projects: Project[];
  currentProject: Project | null;
  assets: Asset[];
  selectedAsset: Asset | null;
  selectedMask: Asset | null;
  jobs: GenerationJob[];
  profiles: IllustratorProfile[];
  styles: StylePreset[];
  references: ReferenceItem[];
  settings: AppSettings | null;
  loading: boolean;
  notification: Notification | null;
  tool: EditorTool;
  canvasActions: CanvasActions | null;
  initialize(): Promise<void>;
  setView(view: AppView): void;
  notify(notification: Notification | null): void;
  createProject(name: string, description?: string): Promise<void>;
  openProject(project: Project): Promise<void>;
  updateProject(input: { name?: string; description?: string; canvasState?: string; profileId?: string | null }): Promise<void>;
  removeProject(project: Project): Promise<void>;
  importProject(): Promise<void>;
  exportProject(): Promise<void>;
  reloadAssets(): Promise<void>;
  importAssets(type?: 'original' | 'reference'): Promise<void>;
  importDropped(files: File[], type?: 'original' | 'reference'): Promise<void>;
  selectAsset(asset: Asset | null): void;
  setMask(asset: Asset | null): void;
  setTool(tool: EditorTool): void;
  setCanvasActions(actions: CanvasActions | null): void;
  reloadJobs(): Promise<void>;
  reloadLibrary(): Promise<void>;
  reloadReferences(): Promise<void>;
  saveSettings(input: Partial<AppSettings>): Promise<void>;
}

function unwrap<T>(result: OperationResult<T>): T {
  if (!result.ok || result.data === undefined) throw new Error(result.error?.message ?? 'Falha inesperada');
  return result.data;
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'home', projects: [], currentProject: null, assets: [], selectedAsset: null, selectedMask: null,
  jobs: [], profiles: [], styles: [], references: [], settings: null, loading: false, notification: null,
  tool: 'select', canvasActions: null,
  initialize: async () => {
    set({ loading: true });
    try {
      const [projects, settings, profiles, styles, jobs] = await Promise.all([
        window.illustrator.projects.list(), window.illustrator.settings.get(), window.illustrator.profiles.list(),
        window.illustrator.styles.list(), window.illustrator.jobs.list(),
      ]);
      set({ projects: unwrap(projects), settings: unwrap(settings), profiles: unwrap(profiles), styles: unwrap(styles), jobs: unwrap(jobs) });
    } catch (error) { set({ notification: { kind: 'error', message: error instanceof Error ? error.message : 'Falha ao iniciar.' } }); }
    finally { set({ loading: false }); }
  },
  setView: (view) => set({ view }),
  notify: (notification) => set({ notification }),
  createProject: async (name, description = '') => {
    set({ loading: true });
    try { const project = unwrap(await window.illustrator.projects.create({ name, description })); await get().openProject(project); set({ notification: { kind: 'success', message: 'Projeto criado.' } }); }
    catch (error) { set({ notification: { kind: 'error', message: error instanceof Error ? error.message : 'Não foi possível criar o projeto.' } }); }
    finally { set({ loading: false }); }
  },
  openProject: async (project) => {
    const assets = unwrap(await window.illustrator.assets.list(project.id));
    const references = unwrap(await window.illustrator.references.list(project.id));
    set({ currentProject: project, assets, references, selectedAsset: assets[0] ?? null, selectedMask: null, view: 'editor' });
  },
  updateProject: async (input) => {
    const project = get().currentProject; if (!project) return;
    const updated = unwrap(await window.illustrator.projects.update({ id: project.id, ...input }));
    set({ currentProject: updated, projects: get().projects.map((item) => item.id === updated.id ? updated : item), notification: { kind: 'success', message: 'Projeto salvo.' } });
  },
  removeProject: async (project) => {
    const result = await window.illustrator.projects.remove(project.id); if (!result.ok) throw new Error(result.error?.message);
    set({ projects: get().projects.filter((item) => item.id !== project.id), notification: { kind: 'success', message: 'Projeto removido.' } });
  },
  importProject: async () => {
    const result = unwrap(await window.illustrator.projects.import()); if (!result) return;
    set({ projects: [result, ...get().projects], notification: { kind: 'success', message: 'Projeto importado com segurança.' } });
  },
  exportProject: async () => {
    const project = get().currentProject; if (!project) return;
    const file = unwrap(await window.illustrator.projects.export(project.id)); if (file) set({ notification: { kind: 'success', message: 'Pacote do projeto exportado.' } });
  },
  reloadAssets: async () => {
    const project = get().currentProject; if (!project) return;
    const assets = unwrap(await window.illustrator.assets.list(project.id)); set({ assets });
  },
  importAssets: async (type = 'original') => {
    const project = get().currentProject; if (!project) return;
    try {
      const imported = unwrap(await window.illustrator.assets.import(project.id, type));
      await get().reloadAssets(); if (imported[0]) set({ selectedAsset: imported[0] });
      if (imported.length) set({ notification: { kind: 'success', message: `${imported.length} imagem(ns) importada(s).` } });
    } catch (error) { set({ notification: { kind: 'error', message: error instanceof Error ? error.message : 'Falha na importação.' } }); }
  },
  importDropped: async (files, type = 'original') => {
    const project = get().currentProject; if (!project || files.length === 0) return;
    try { const imported = unwrap(await window.illustrator.assets.importDropped(project.id, files, type)); await get().reloadAssets(); if (imported[0]) set({ selectedAsset: imported[0] }); }
    catch (error) { set({ notification: { kind: 'error', message: error instanceof Error ? error.message : 'Falha na importação.' } }); }
  },
  selectAsset: (selectedAsset) => set({ selectedAsset, selectedMask: null }),
  setMask: (selectedMask) => set({ selectedMask }),
  setTool: (tool) => set({ tool }),
  setCanvasActions: (canvasActions) => set({ canvasActions }),
  reloadJobs: async () => set({ jobs: unwrap(await window.illustrator.jobs.list(get().currentProject?.id)) }),
  reloadLibrary: async () => {
    const [profiles, styles] = await Promise.all([window.illustrator.profiles.list(), window.illustrator.styles.list()]);
    set({ profiles: unwrap(profiles), styles: unwrap(styles) });
  },
  reloadReferences: async () => {
    const project = get().currentProject; if (project) set({ references: unwrap(await window.illustrator.references.list(project.id)) });
  },
  saveSettings: async (input) => {
    const settings = unwrap(await window.illustrator.settings.update(input)); set({ settings, notification: { kind: 'success', message: 'Configurações salvas.' } });
  },
}));

export { unwrap };
