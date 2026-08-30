import { Worker } from 'node:worker_threads';
import type { ProcessImageInput } from '../../shared/types';
import { AppError } from '../../shared/errors';

export class ImageProcessor {
  async process(source: string, destination: string, input: ProcessImageInput): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const worker = new Worker(`
        const { parentPort, workerData } = require('node:worker_threads');
        const sharp = require('sharp');
        async function processImage() {
          sharp.concurrency(1);
          const o = workerData.options;
          let p = sharp(workerData.source, { limitInputPixels: 268402689 }).rotate();
          if (o.width || o.height) p = p.resize({ width: o.width, height: o.height, fit: o.fit || 'inside', withoutEnlargement: false });
          if (o.brightness !== undefined || o.saturation !== undefined) p = p.modulate({ brightness: o.brightness || 1, saturation: o.saturation === undefined ? 1 : o.saturation });
          if (o.contrast !== undefined && o.contrast !== 1) p = p.linear(o.contrast, 128 * (1 - o.contrast));
          if (o.sharpen) p = p.sharpen();
          if (o.blur) p = p.blur(1.5);
          if (!o.stripMetadata) p = p.withMetadata();
          if (o.format === 'jpeg') p = p.jpeg({ quality: o.quality, mozjpeg: true });
          if (o.format === 'webp') p = p.webp({ quality: o.quality, effort: 4 });
          if (o.format === 'png') p = p.png({ compressionLevel: Math.round((100 - o.quality) / 11), adaptiveFiltering: true });
          await p.toFile(workerData.destination);
        }
        processImage().then(() => parentPort.postMessage({ ok: true })).catch((error) => parentPort.postMessage({ ok: false, error: error.message }));
      `, {
        eval: true,
        workerData: {
          source,
          destination,
          options: {
            width: input.width,
            height: input.height,
            fit: input.fit,
            format: input.format,
            quality: input.quality,
            stripMetadata: input.stripMetadata,
            sharpen: input.operation === 'sharpen',
            blur: input.operation === 'blur',
            brightness: input.brightness,
            saturation: input.saturation,
            contrast: input.contrast,
          },
        },
      });
      worker.once('message', (message: { ok: boolean; error?: string }) => message.ok ? resolve() : reject(new AppError('IMAGE_CORRUPTED', message.error)));
      worker.once('error', (error: Error) => reject(new AppError('IMAGE_CORRUPTED', error.message)));
      worker.once('exit', (code) => { if (code !== 0) reject(new AppError('IMAGE_CORRUPTED', `Worker finalizou com código ${code}`)); });
    });
  }
}
