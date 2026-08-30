import fs from 'node:fs';
import path from 'node:path';
import OpenAI, { APIError, toFile } from 'openai';
import type { ImagesResponse, ImageEditParamsNonStreaming, ImageGenerateParamsNonStreaming } from 'openai/resources/images';
import type { ProviderCapabilities, ProviderRunInput } from '../../shared/types';
import { AppError } from '../../shared/errors';
import { SecretStore } from '../security/secrets';
import { SettingsService } from '../app/settings';
import type { ImageProvider, ProviderContext, ProviderResult } from './provider';

function mapOpenAIError(error: unknown): AppError {
  if (error instanceof APIError) {
    const code = typeof error.code === 'string' ? error.code : '';
    if (error.status === 401 || error.status === 403) return new AppError('PROVIDER_AUTH_FAILED');
    if (error.status === 429) return new AppError('PROVIDER_RATE_LIMITED');
    if (code.includes('moderation') || code.includes('safety')) return new AppError('PROVIDER_SAFETY_REJECTED');
    if (error.status >= 500) return new AppError('PROVIDER_UNAVAILABLE');
    return new AppError('PROVIDER_BAD_RESPONSE', `${error.status}:${code}`);
  }
  if (error instanceof Error && error.name === 'AbortError') return new AppError('JOB_CANCELLED');
  return new AppError('PROVIDER_UNAVAILABLE', error instanceof Error ? error.message : undefined);
}

function decodeImages(result: ImagesResponse): Buffer[] {
  const images: Buffer[] = [];
  for (const item of result.data ?? []) if (item.b64_json) images.push(Buffer.from(item.b64_json, 'base64'));
  if (images.length === 0) throw new AppError('PROVIDER_BAD_RESPONSE');
  return images;
}

function validateSize(size: string, model: string): void {
  if (size === 'auto') return;
  const [width, height] = size.split('x').map(Number);
  if (!width || !height) throw new AppError('INVALID_INPUT');
  if (model.startsWith('gpt-image-2')) {
    const pixels = width * height;
    const ratio = Math.max(width / height, height / width);
    if (width > 3840 || height > 3840 || width % 16 !== 0 || height % 16 !== 0 || ratio > 3 || pixels < 655_360 || pixels > 8_294_400) {
      throw new AppError('INVALID_INPUT', 'Dimensões incompatíveis com gpt-image-2');
    }
  }
}

export class OpenAIProvider implements ImageProvider {
  readonly id = 'openai' as const;
  constructor(private readonly secrets: SecretStore, private readonly settings: SettingsService) {}

  private client(): OpenAI {
    const key = this.secrets.read();
    const config = this.settings.get().openai;
    if (!key || !config.enabled) throw new AppError('PROVIDER_NOT_CONFIGURED');
    return new OpenAI({ apiKey: key, baseURL: config.endpoint, maxRetries: 0, timeout: 10 * 60 * 1000 });
  }

  getCapabilities(model = this.settings.get().openai.defaultModel): ProviderCapabilities {
    const isGptImage = model.startsWith('gpt-image');
    const isImage2 = model.startsWith('gpt-image-2');
    return {
      textToImage: true, imageEditing: isGptImage, masks: isGptImage, multiReference: isGptImage,
      outpainting: isGptImage, transparency: isGptImage && !isImage2, variations: false,
      customDimensions: isImage2, seed: false, negativePrompt: false, batch: true,
      progress: false, cancellation: true, upscale: false, backgroundRemoval: false,
    };
  }

  async testConnection(): Promise<{ ok: true; detail: string }> {
    try {
      const model = this.settings.get().openai.defaultModel;
      await this.client().models.retrieve(model);
      return { ok: true, detail: `Modelo ${model} acessível.` };
    } catch (error) { throw mapOpenAIError(error); }
  }

  async execute(input: ProviderRunInput, context: ProviderContext): Promise<ProviderResult> {
    const capabilities = this.getCapabilities(input.model);
    if (input.background === 'transparent' && !capabilities.transparency) throw new AppError('INVALID_INPUT', 'Transparência não suportada pelo modelo');
    validateSize(input.size, input.model);
    const prompt = input.preserve.trim() ? `${input.prompt}\n\nELEMENTOS A PRESERVAR EXATAMENTE\n${input.preserve.trim()}` : input.prompt;
    const common = {
      model: input.model,
      prompt,
      n: input.count,
      size: input.size,
      quality: input.quality,
      output_format: input.format,
      ...(input.format === 'png' ? {} : { output_compression: input.compression }),
      background: input.background,
    } satisfies Omit<ImageGenerateParamsNonStreaming, 'stream'>;
    try {
      let result: ImagesResponse;
      if (input.operation === 'generate') {
        result = await this.client().images.generate({ ...common, stream: false }, { signal: context.signal });
      } else {
        if (context.sourcePaths.length === 0) throw new AppError('INVALID_INPUT');
        const uploads = await Promise.all(context.sourcePaths.map(async (filePath) => await toFile(fs.createReadStream(filePath), path.basename(filePath))));
        const edit: ImageEditParamsNonStreaming = {
          ...common,
          image: uploads,
          stream: false,
          ...(context.maskPath ? { mask: await toFile(fs.createReadStream(context.maskPath), 'mask.png', { type: 'image/png' }) } : {}),
          ...(input.model.startsWith('gpt-image-2') ? {} : { input_fidelity: 'high' as const }),
        };
        result = await this.client().images.edit(edit, { signal: context.signal });
      }
      return { images: decodeImages(result) };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapOpenAIError(error);
    }
  }
}
