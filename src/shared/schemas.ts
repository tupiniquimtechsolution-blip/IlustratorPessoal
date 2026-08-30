import { z } from 'zod';

export const idSchema = z.string().uuid();

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(''),
});

export const projectUpdateSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  canvasState: z.string().max(5_000_000).optional(),
  profileId: idSchema.nullable().optional(),
});

export const assetImportSchema = z.object({
  projectId: idSchema,
  filePaths: z.array(z.string().min(1).max(32_768)).min(1).max(100),
  type: z.enum(['original', 'reference']).default('original'),
});

export const imageProcessSchema = z.object({
  projectId: idSchema,
  assetId: idSchema,
  operation: z.enum(['resize', 'optimize', 'convert', 'sharpen', 'blur']),
  width: z.number().int().min(1).max(16_384).optional(),
  height: z.number().int().min(1).max(16_384).optional(),
  fit: z.enum(['contain', 'cover', 'fill', 'inside', 'outside']).optional(),
  format: z.enum(['png', 'jpeg', 'webp']),
  quality: z.number().int().min(1).max(100),
  stripMetadata: z.boolean(),
  brightness: z.number().min(0.1).max(3).optional(),
  saturation: z.number().min(0).max(3).optional(),
  contrast: z.number().min(0.1).max(3).optional(),
});

export const maskSaveSchema = z.object({
  projectId: idSchema,
  sourceAssetId: idSchema,
  bytes: z.instanceof(Uint8Array).refine((value) => value.byteLength <= 50 * 1024 * 1024),
});

export const providerRunSchema = z.object({
  projectId: idSchema,
  providerId: z.enum(['openai', 'comfyui']),
  operation: z.enum(['generate', 'edit']),
  prompt: z.string().trim().min(1).max(32_000),
  preserve: z.string().max(16_000),
  model: z.string().trim().min(1).max(200),
  size: z.string().regex(/^(auto|\d{2,4}x\d{2,4})$/),
  quality: z.enum(['auto', 'low', 'medium', 'high']),
  format: z.enum(['png', 'jpeg', 'webp']),
  compression: z.number().int().min(0).max(100),
  background: z.enum(['auto', 'opaque', 'transparent']),
  count: z.number().int().min(1).max(10),
  sourceAssetId: idSchema.optional(),
  maskAssetId: idSchema.optional(),
  referenceAssetIds: z.array(idSchema).max(16),
  workflow: z.record(z.string(), z.unknown()).optional(),
});

export const settingsUpdateSchema = z.object({
  theme: z.enum(['system', 'dark', 'light']).optional(),
  rightsAcknowledged: z.boolean().optional(),
  localConcurrency: z.number().int().min(1).max(8).optional(),
  cloudConcurrency: z.number().int().min(1).max(3).optional(),
  openai: z.object({
    enabled: z.boolean(),
    endpoint: z.string().url().refine((url) => url.startsWith('https://')),
    defaultModel: z.string().trim().min(1).max(200),
  }).optional(),
  comfyui: z.object({
    enabled: z.boolean(),
    endpoint: z.string().url(),
    defaultModel: z.string().max(200),
  }).optional(),
});

export const secretSaveSchema = z.object({
  provider: z.literal('openai'),
  value: z.string().trim().min(8).max(1000),
});

export const profileInputSchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000),
  isStrict: z.boolean(),
  content: z.record(z.string(), z.unknown()),
});

export const styleInputSchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(4000),
});

export const referenceInputSchema = z.object({
  projectId: idSchema,
  assetId: idSchema,
  role: z.enum(['identity', 'face', 'body', 'pose', 'anatomy', 'clothing', 'object', 'scene', 'composition', 'framing', 'lighting', 'palette', 'style', 'texture', 'material', 'perspective', 'logo', 'general']),
  priority: z.enum(['free', 'low', 'medium', 'high', 'maximum']),
  notes: z.string().max(2000),
  enabled: z.boolean(),
  orderIndex: z.number().int().min(0),
});

export const projectPackageImportSchema = z.object({ filePath: z.string().min(1).max(32_768) });
