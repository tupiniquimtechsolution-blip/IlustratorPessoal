import type { ProviderCapabilities, ProviderRunInput } from '../../shared/types';

export interface ProviderContext {
  sourcePaths: string[];
  maskPath?: string;
  signal: AbortSignal;
}

export interface ProviderResult {
  images: Buffer[];
  revisedPrompt?: string;
}

export interface ImageProvider {
  readonly id: 'openai' | 'comfyui';
  getCapabilities(model?: string): ProviderCapabilities;
  testConnection(): Promise<{ ok: true; detail: string }>;
  execute(input: ProviderRunInput, context: ProviderContext): Promise<ProviderResult>;
  cancel?(): Promise<void>;
}
