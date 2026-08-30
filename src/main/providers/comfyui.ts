import type { ProviderCapabilities, ProviderRunInput } from '../../shared/types';
import { AppError } from '../../shared/errors';
import { SettingsService } from '../app/settings';
import type { ImageProvider, ProviderContext, ProviderResult } from './provider';

function validatedEndpoint(raw: string): URL {
  const url = new URL(raw);
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const local = hostname === 'localhost' || hostname === '::1' || hostname.startsWith('127.') || hostname.startsWith('10.') || hostname.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
  if (!local || !['http:', 'https:'].includes(url.protocol)) throw new AppError('INVALID_INPUT', 'ComfyUI deve usar um endereço local ou de rede privada');
  return url;
}

async function checkedFetch(url: URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, init);
  if (!response.ok) throw new AppError('PROVIDER_UNAVAILABLE', `ComfyUI HTTP ${response.status}`);
  return response;
}

export class ComfyUIProvider implements ImageProvider {
  readonly id = 'comfyui' as const;
  constructor(private readonly settings: SettingsService) {}
  private base(): URL {
    const config = this.settings.get().comfyui;
    if (!config.enabled) throw new AppError('PROVIDER_NOT_CONFIGURED');
    return validatedEndpoint(config.endpoint);
  }

  getCapabilities(): ProviderCapabilities {
    return {
      textToImage: true, imageEditing: true, masks: true, multiReference: true, outpainting: true,
      transparency: true, variations: true, customDimensions: true, seed: true, negativePrompt: true,
      batch: true, progress: true, cancellation: true, upscale: true, backgroundRemoval: true,
    };
  }

  async testConnection(): Promise<{ ok: true; detail: string }> {
    const url = new URL('/system_stats', this.base());
    const response = await checkedFetch(url, { signal: AbortSignal.timeout(8_000) });
    const data = await response.json() as { system?: { comfyui_version?: string } };
    return { ok: true, detail: `ComfyUI disponível${data.system?.comfyui_version ? ` (${data.system.comfyui_version})` : ''}.` };
  }

  async execute(input: ProviderRunInput, context: ProviderContext): Promise<ProviderResult> {
    if (!input.workflow || Object.keys(input.workflow).length === 0) throw new AppError('PROVIDER_NOT_CONFIGURED', 'Importe e mapeie um workflow do ComfyUI');
    const base = this.base();
    const promptResponse = await checkedFetch(new URL('/prompt', base), {
      method: 'POST', headers: { 'content-type': 'application/json' }, signal: context.signal,
      body: JSON.stringify({ prompt: input.workflow, client_id: crypto.randomUUID() }),
    });
    const queued = await promptResponse.json() as { prompt_id?: string };
    if (!queued.prompt_id) throw new AppError('PROVIDER_BAD_RESPONSE');
    for (let attempt = 0; attempt < 720; attempt += 1) {
      if (context.signal.aborted) throw new AppError('JOB_CANCELLED');
      const historyResponse = await checkedFetch(new URL(`/history/${encodeURIComponent(queued.prompt_id)}`, base), { signal: context.signal });
      const history = await historyResponse.json() as Record<string, { outputs?: Record<string, { images?: Array<{ filename: string; subfolder?: string; type?: string }> }> }>;
      const record = history[queued.prompt_id];
      if (record?.outputs) {
        const descriptors = Object.values(record.outputs).flatMap((output) => output.images ?? []);
        const images = await Promise.all(descriptors.map(async (item) => {
          const url = new URL('/view', base);
          url.searchParams.set('filename', item.filename);
          if (item.subfolder) url.searchParams.set('subfolder', item.subfolder);
          if (item.type) url.searchParams.set('type', item.type);
          return Buffer.from(await (await checkedFetch(url, { signal: context.signal })).arrayBuffer());
        }));
        if (images.length === 0) throw new AppError('PROVIDER_BAD_RESPONSE');
        return { images };
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new AppError('PROVIDER_UNAVAILABLE', 'Tempo limite do workflow excedido');
  }

  async cancel(): Promise<void> {
    await checkedFetch(new URL('/interrupt', this.base()), { method: 'POST' });
  }
}
