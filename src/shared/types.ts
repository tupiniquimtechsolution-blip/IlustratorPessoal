export type ThemeMode = 'system' | 'dark' | 'light';
export type AssetType = 'original' | 'revision' | 'reference' | 'mask';
export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type JobStatus =
  | 'queued'
  | 'validating'
  | 'preparing'
  | 'sending'
  | 'processing'
  | 'receiving'
  | 'saving'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface Project {
  id: string;
  name: string;
  description: string;
  profileId: string | null;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  canvasState: string;
  defaultExportPresetId: string | null;
}

export interface Asset {
  id: string;
  projectId: string;
  type: AssetType;
  originalName: string;
  url: string;
  thumbnailUrl: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
  sha256: string;
  hasAlpha: boolean;
  colorSpace: string;
  createdAt: string;
}

export interface Revision {
  id: string;
  assetId: string;
  parentRevisionId: string | null;
  operation: string;
  prompt: string;
  preserveInstructions: string;
  providerId: string | null;
  modelId: string | null;
  maskAssetId: string | null;
  outputAssetId: string;
  createdAt: string;
}

export interface ReferenceItem {
  id: string;
  projectId: string;
  assetId: string;
  role: ReferenceRole;
  priority: PreservationLevel;
  notes: string;
  enabled: boolean;
  orderIndex: number;
}

export type ReferenceRole =
  | 'identity'
  | 'face'
  | 'body'
  | 'pose'
  | 'anatomy'
  | 'clothing'
  | 'object'
  | 'scene'
  | 'composition'
  | 'framing'
  | 'lighting'
  | 'palette'
  | 'style'
  | 'texture'
  | 'material'
  | 'perspective'
  | 'logo'
  | 'general';

export type PreservationLevel = 'free' | 'low' | 'medium' | 'high' | 'maximum';

export interface GenerationJob {
  id: string;
  projectId: string;
  providerId: 'openai' | 'comfyui' | 'local';
  operation: 'generate' | 'edit' | 'local-process' | 'batch';
  status: JobStatus;
  progress: number;
  modelId: string;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ProviderCapabilities {
  textToImage: boolean;
  imageEditing: boolean;
  masks: boolean;
  multiReference: boolean;
  outpainting: boolean;
  transparency: boolean;
  variations: boolean;
  customDimensions: boolean;
  seed: boolean;
  negativePrompt: boolean;
  batch: boolean;
  progress: boolean;
  cancellation: boolean;
  upscale: boolean;
  backgroundRemoval: boolean;
}

export interface ProviderConfiguration {
  provider: 'openai' | 'comfyui';
  enabled: boolean;
  endpoint: string;
  defaultModel: string;
  hasSecret: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  language: 'pt-BR';
  telemetry: false;
  rightsAcknowledged: boolean;
  localConcurrency: number;
  cloudConcurrency: number;
  openai: ProviderConfiguration;
  comfyui: ProviderConfiguration;
}

export interface PromptSections {
  objective: string;
  subject: string;
  change: string;
  preserve: string;
  style: string;
  realism: string;
  composition: string;
  framing: string;
  camera: string;
  lighting: string;
  palette: string;
  materials: string;
  scene: string;
  anatomy: string;
  references: string;
  restrictions: string;
  output: string;
}

export interface IllustratorProfile {
  id: string;
  name: string;
  description: string;
  version: number;
  schemaVersion: number;
  content: Partial<PromptSections> & { mainInstruction?: string; forbidden?: string };
  isStrict: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StylePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessImageInput {
  projectId: string;
  assetId: string;
  operation: 'resize' | 'optimize' | 'convert' | 'sharpen' | 'blur';
  width?: number;
  height?: number;
  fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
  format: ImageFormat;
  quality: number;
  stripMetadata: boolean;
  brightness?: number;
  saturation?: number;
  contrast?: number;
}

export interface ProviderRunInput {
  projectId: string;
  providerId: 'openai' | 'comfyui';
  operation: 'generate' | 'edit';
  prompt: string;
  preserve: string;
  model: string;
  size: string;
  quality: 'auto' | 'low' | 'medium' | 'high';
  format: ImageFormat;
  compression: number;
  background: 'auto' | 'opaque' | 'transparent';
  count: number;
  sourceAssetId?: string;
  maskAssetId?: string;
  referenceAssetIds: string[];
  workflow?: Record<string, unknown>;
}

export interface Diagnostics {
  version: string;
  dataPath: string;
  platform: string;
  architecture: string;
  database: 'ok' | 'error';
  freeBytes: number | null;
  logPath: string;
}

export interface OperationResult<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string; solution: string; retryable: boolean; mayCharge: boolean };
}
