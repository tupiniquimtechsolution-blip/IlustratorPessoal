import sharp from 'sharp';

export interface SharpOperationInput {
  source: string;
  destination: string;
  options: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
    format: 'png' | 'jpeg' | 'webp';
    quality: number;
    stripMetadata: boolean;
    sharpen?: boolean;
    blur?: boolean;
    brightness?: number;
    saturation?: number;
    contrast?: number;
  };
}

export async function processImageFile(input: SharpOperationInput): Promise<void> {
  sharp.concurrency(1);
  let pipeline = sharp(input.source, { limitInputPixels: 268_402_689 }).rotate();
  const { options } = input;
  if (options.width || options.height) pipeline = pipeline.resize({ width: options.width, height: options.height, fit: options.fit ?? 'inside', withoutEnlargement: false });
  if (options.brightness !== undefined || options.saturation !== undefined) pipeline = pipeline.modulate({ brightness: options.brightness ?? 1, saturation: options.saturation ?? 1 });
  if (options.contrast !== undefined && options.contrast !== 1) pipeline = pipeline.linear(options.contrast, 128 * (1 - options.contrast));
  if (options.sharpen) pipeline = pipeline.sharpen();
  if (options.blur) pipeline = pipeline.blur(1.5);
  if (!options.stripMetadata) pipeline = pipeline.withMetadata();
  if (options.format === 'jpeg') pipeline = pipeline.jpeg({ quality: options.quality, mozjpeg: true });
  if (options.format === 'webp') pipeline = pipeline.webp({ quality: options.quality, effort: 4 });
  if (options.format === 'png') pipeline = pipeline.png({ compressionLevel: Math.round((100 - options.quality) / 11), adaptiveFiltering: true });
  await pipeline.toFile(input.destination);
}
