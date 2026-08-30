// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { processImageFile } from '../src/main/image-processing/operations';

const folders: string[] = [];
afterEach(async () => {
  sharp.cache(false);
  await new Promise((resolve) => setTimeout(resolve, 150));
  for (const folder of folders.splice(0)) await fs.promises.rm(folder, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
});
describe('processamento local com Sharp', () => {
  it('redimensiona, converte e preserva alpha em PNG', async () => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'illustrator-image-')); folders.push(folder); const source = path.join(folder, 'source.png'); const output = path.join(folder, 'output.png');
    await sharp({ create: { width: 200, height: 100, channels: 4, background: { r: 40, g: 80, b: 120, alpha: .5 } } }).png().toFile(source);
    await processImageFile({ source, destination: output, options: { width: 50, height: 50, fit: 'contain', format: 'png', quality: 90, stripMetadata: true, sharpen: true } });
    const metadata = await sharp(output).metadata(); expect(metadata.width).toBe(50); expect(metadata.height).toBe(50); expect(metadata.hasAlpha).toBe(true);
  });
  it('gera WebP comprimido como arquivo separado', async () => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'illustrator-webp-')); folders.push(folder); const source = path.join(folder, 'source.png'); const output = path.join(folder, 'revision.webp');
    await sharp({ create: { width: 100, height: 100, channels: 3, background: 'red' } }).png().toFile(source);
    await processImageFile({ source, destination: output, options: { format: 'webp', quality: 60, stripMetadata: true } });
    expect((await sharp(output).metadata()).format).toBe('webp'); expect(fs.existsSync(source)).toBe(true);
  });
});
