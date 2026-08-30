import fs from 'node:fs';
import path from 'node:path';
import { dialog } from 'electron';
import sharp, { type Metadata } from 'sharp';
import type { Asset, AssetType, ProcessImageInput } from '../../shared/types';
import { AppError } from '../../shared/errors';
import { sanitizeFilename } from '../../shared/filenames';
import { AssetRepository } from '../database/repositories';
import { StorageManager } from './storage';
import { ImageProcessor } from '../image-processing/processor';
import { AppLogger } from '../app/logger';

const MAX_IMPORT_BYTES = 100 * 1024 * 1024;
const mimeExtensions: Record<string, string> = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };

async function detectMime(filePath: string): Promise<string> {
  const handle = await fs.promises.open(filePath, 'r');
  const buffer = Buffer.alloc(16);
  try { await handle.read(buffer, 0, buffer.length, 0); } finally { await handle.close(); }
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  throw new AppError('FILE_UNSUPPORTED');
}

export class AssetService {
  constructor(
    private readonly repository: AssetRepository,
    private readonly storage: StorageManager,
    private readonly processor: ImageProcessor,
    private readonly logger: AppLogger,
  ) {}

  async chooseAndImport(projectId: string, type: Extract<AssetType, 'original' | 'reference'> = 'original'): Promise<Asset[]> {
    const result = await dialog.showOpenDialog({
      title: type === 'reference' ? 'Importar referências' : 'Importar imagens', properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    });
    return result.canceled ? [] : await this.importPaths(projectId, result.filePaths, type);
  }

  async importPaths(projectId: string, filePaths: string[], type: Extract<AssetType, 'original' | 'reference'>): Promise<Asset[]> {
    await this.storage.ensureProject(projectId);
    const assets: Asset[] = [];
    for (const source of filePaths) {
      const sourceStat = await fs.promises.stat(source).catch(() => null);
      if (!sourceStat?.isFile()) throw new AppError('FILE_UNSUPPORTED');
      if (sourceStat.size > MAX_IMPORT_BYTES) throw new AppError('FILE_TOO_LARGE');
      const mimeType = await detectMime(source);
      const sha256 = await this.storage.hashFile(source);
      const duplicate = this.repository.findDuplicate(projectId, sha256);
      if (duplicate) { assets.push(duplicate); continue; }
      let metadata: Metadata;
      try { metadata = await sharp(source, { limitInputPixels: 268_402_689 }).metadata(); } catch (error) {
        throw new AppError('IMAGE_CORRUPTED', error instanceof Error ? error.message : undefined);
      }
      if (!metadata.width || !metadata.height) throw new AppError('IMAGE_CORRUPTED');
      const folder = type === 'reference' ? 'references' : 'originals';
      const destination = this.storage.managedDestination(projectId, folder, path.basename(source), mimeExtensions[mimeType]);
      const thumbnail = this.storage.managedDestination(projectId, 'thumbnails', path.basename(source), '.webp');
      await this.storage.atomicCopy(source, destination);
      await sharp(source).rotate().resize({ width: 420, height: 420, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(thumbnail);
      const asset = this.repository.insert({
        id: crypto.randomUUID(), projectId, type, originalName: path.basename(source), managedPath: destination, thumbnailPath: thumbnail,
        mimeType, width: metadata.autoOrient?.width ?? metadata.width, height: metadata.autoOrient?.height ?? metadata.height,
        fileSize: sourceStat.size, sha256, hasAlpha: metadata.hasAlpha ?? false, colorSpace: metadata.space ?? 'srgb', createdAt: new Date().toISOString(),
      });
      assets.push(asset);
      this.logger.write('Arquivos', 'Imagem importada', { projectId, assetId: asset.id, mimeType, width: asset.width, height: asset.height });
    }
    return assets;
  }

  async process(input: ProcessImageInput): Promise<Asset> {
    const source = this.repository.get(input.assetId);
    if (!source || source.projectId !== input.projectId) throw new AppError('INVALID_INPUT');
    await this.storage.ensureProject(input.projectId);
    const extension = input.format === 'jpeg' ? '.jpg' : `.${input.format}`;
    const destination = this.storage.managedDestination(input.projectId, 'revisions', source.originalName, extension);
    await this.processor.process(source.managedPath, destination, input);
    return await this.registerFile({
      projectId: input.projectId, filePath: destination, type: 'revision', originalName: `${path.parse(source.originalName).name}_${input.operation}${extension}`,
      sourceAssetId: source.id, operation: input.operation, parameters: input,
    });
  }

  async registerBuffer(input: {
    projectId: string; buffer: Buffer; format: 'png' | 'jpeg' | 'webp'; originalName: string;
    sourceAssetId?: string; operation: string; prompt: string; preserve: string; providerId: string; modelId: string; maskAssetId?: string;
  }): Promise<Asset> {
    const extension = input.format === 'jpeg' ? '.jpg' : `.${input.format}`;
    const folder = input.sourceAssetId ? 'revisions' : 'assets';
    const destination = this.storage.managedDestination(input.projectId, folder, input.originalName, extension);
    await this.storage.atomicWrite(destination, input.buffer);
    return await this.registerFile({
      projectId: input.projectId, filePath: destination, type: 'revision', originalName: input.originalName,
      sourceAssetId: input.sourceAssetId, operation: input.operation, parameters: {}, prompt: input.prompt, preserve: input.preserve,
      providerId: input.providerId, modelId: input.modelId, maskAssetId: input.maskAssetId,
    });
  }

  private async registerFile(input: {
    projectId: string; filePath: string; type: AssetType; originalName: string; sourceAssetId?: string;
    operation: string; parameters: unknown; prompt?: string; preserve?: string; providerId?: string; modelId?: string; maskAssetId?: string;
  }): Promise<Asset> {
    const metadata = await sharp(input.filePath).metadata();
    if (!metadata.width || !metadata.height || !metadata.format) throw new AppError('IMAGE_CORRUPTED');
    const mimeType = metadata.format === 'jpeg' ? 'image/jpeg' : `image/${metadata.format}`;
    const thumbnail = this.storage.managedDestination(input.projectId, 'thumbnails', input.originalName, '.webp');
    await sharp(input.filePath).resize({ width: 420, height: 420, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(thumbnail);
    const asset = this.repository.insert({
      id: crypto.randomUUID(), projectId: input.projectId, type: input.type, originalName: input.originalName,
      managedPath: input.filePath, thumbnailPath: thumbnail, mimeType, width: metadata.width, height: metadata.height,
      fileSize: await this.storage.fileSize(input.filePath), sha256: await this.storage.hashFile(input.filePath),
      hasAlpha: metadata.hasAlpha ?? false, colorSpace: metadata.space ?? 'srgb', createdAt: new Date().toISOString(),
    });
    if (input.sourceAssetId) {
      this.repository.insertRevision({
        id: crypto.randomUUID(), assetId: input.sourceAssetId, parentRevisionId: null, operation: input.operation,
        prompt: input.prompt ?? '', preserveInstructions: input.preserve ?? '', parametersJson: JSON.stringify(input.parameters),
        providerId: input.providerId ?? null, modelId: input.modelId ?? null, maskAssetId: input.maskAssetId ?? null,
        outputAssetId: asset.id, createdAt: new Date().toISOString(),
      });
    }
    return asset;
  }

  async saveMask(projectId: string, sourceAssetId: string, bytes: Uint8Array): Promise<Asset> {
    const source = this.repository.get(sourceAssetId);
    if (!source || source.projectId !== projectId) throw new AppError('INVALID_INPUT');
    const destination = this.storage.managedDestination(projectId, 'masks', 'mascara', '.png');
    try {
      await sharp(bytes).resize(source.width, source.height, { fit: 'fill' }).ensureAlpha().png().toFile(destination);
    } catch (error) { throw new AppError('MASK_INVALID', error instanceof Error ? error.message : undefined); }
    return await this.registerFile({ projectId, filePath: destination, type: 'mask', originalName: 'mascara.png', operation: 'mask', parameters: {} });
  }

  async export(assetId: string): Promise<string | null> {
    const asset = this.repository.get(assetId);
    if (!asset) throw new AppError('INVALID_INPUT');
    const parsed = path.parse(sanitizeFilename(asset.originalName));
    const result = await dialog.showSaveDialog({
      title: 'Exportar imagem', defaultPath: `${parsed.name || 'imagem'}${path.extname(asset.managedPath)}`,
      filters: [{ name: 'Imagem', extensions: [path.extname(asset.managedPath).slice(1)] }],
    });
    if (result.canceled || !result.filePath) return null;
    let destination = result.filePath;
    if (fs.existsSync(destination)) {
      const ext = path.extname(destination); const base = destination.slice(0, -ext.length); let index = 2;
      while (fs.existsSync(`${base}_${index}${ext}`)) index += 1;
      destination = `${base}_${index}${ext}`;
    }
    await this.storage.atomicCopy(asset.managedPath, destination);
    this.logger.write('Exportação', 'Imagem exportada', { assetId, extension: path.extname(destination) });
    return destination;
  }
}
