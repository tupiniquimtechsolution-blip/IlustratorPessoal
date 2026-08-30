import type {
  AppSettings,
  Asset,
  Diagnostics,
  GenerationJob,
  IllustratorProfile,
  OperationResult,
  ProcessImageInput,
  Project,
  ProviderCapabilities,
  ProviderRunInput,
  ReferenceItem,
  StylePreset,
} from '../shared/types';

export interface IllustratorAPI {
  projects: {
    list(): Promise<OperationResult<Project[]>>;
    create(input: { name: string; description: string }): Promise<OperationResult<Project>>;
    update(input: { id: string; name?: string; description?: string; canvasState?: string; profileId?: string | null }): Promise<OperationResult<Project>>;
    remove(id: string): Promise<OperationResult<null>>;
    export(id: string): Promise<OperationResult<string | null>>;
    import(): Promise<OperationResult<Project | null>>;
  };
  assets: {
    list(projectId: string): Promise<OperationResult<Asset[]>>;
    import(projectId: string, type?: 'original' | 'reference'): Promise<OperationResult<Asset[]>>;
    importDropped(projectId: string, files: File[], type?: 'original' | 'reference'): Promise<OperationResult<Asset[]>>;
    process(input: ProcessImageInput): Promise<OperationResult<Asset>>;
    export(assetId: string): Promise<OperationResult<string | null>>;
  };
  masks: { save(projectId: string, sourceAssetId: string, dataUrl: string): Promise<OperationResult<Asset>> };
  references: {
    list(projectId: string): Promise<OperationResult<ReferenceItem[]>>;
    upsert(input: Omit<ReferenceItem, 'id'>): Promise<OperationResult<ReferenceItem>>;
  };
  jobs: {
    list(projectId?: string): Promise<OperationResult<GenerationJob[]>>;
    create(input: ProviderRunInput): Promise<OperationResult<GenerationJob>>;
    cancel(id: string): Promise<OperationResult<null>>;
    retry(id: string): Promise<OperationResult<GenerationJob>>;
    subscribe(callback: (job: GenerationJob) => void): () => void;
  };
  providers: {
    capabilities(provider: 'openai' | 'comfyui', model?: string): Promise<OperationResult<ProviderCapabilities>>;
    test(provider: 'openai' | 'comfyui'): Promise<OperationResult<{ ok: true; detail: string }>>;
  };
  settings: {
    get(): Promise<OperationResult<AppSettings>>;
    update(input: Partial<AppSettings>): Promise<OperationResult<AppSettings>>;
  };
  secrets: {
    save(provider: 'openai', value: string): Promise<OperationResult<null>>;
    remove(provider: 'openai'): Promise<OperationResult<null>>;
  };
  profiles: {
    list(): Promise<OperationResult<IllustratorProfile[]>>;
    save(input: { id?: string; name: string; description: string; isStrict: boolean; content: Record<string, unknown> }): Promise<OperationResult<IllustratorProfile>>;
    archive(id: string): Promise<OperationResult<null>>;
  };
  styles: {
    list(): Promise<OperationResult<StylePreset[]>>;
    save(input: { id?: string; name: string; category: string; description: string }): Promise<OperationResult<StylePreset>>;
  };
  diagnostics: {
    get(): Promise<OperationResult<Diagnostics>>;
    openLogs(): Promise<OperationResult<null>>;
    clearLogs(): Promise<OperationResult<null>>;
  };
}
