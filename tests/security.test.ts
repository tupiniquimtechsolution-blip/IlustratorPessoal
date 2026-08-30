// @vitest-environment node
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isPathInside, isSafeArchiveEntry, sanitizeFilename } from '../src/shared/filenames';
import { maskSaveSchema, providerRunSchema } from '../src/shared/schemas';

describe('limites de segurança', () => {
  it('sanitiza nomes inválidos no Windows', () => expect(sanitizeFilename('retrato:<final>?*.png')).toBe('retrato--final---.png'));
  it('rejeita path traversal em pacotes', () => {
    expect(isSafeArchiveEntry('../secret.txt')).toBe(false); expect(isSafeArchiveEntry('files/../../secret.txt')).toBe(false);
    expect(isSafeArchiveEntry('files/originals/image.png')).toBe(true); expect(isSafeArchiveEntry('C:\\secret.txt')).toBe(false);
  });
  it('só aceita caminhos descendentes', () => {
    const root = path.resolve('root'); expect(isPathInside(root, path.join(root, 'project', 'a.png'))).toBe(true); expect(isPathInside(root, path.resolve('outside.png'))).toBe(false);
  });
  it('limita máscaras a 50 MB', () => {
    const base = { projectId: crypto.randomUUID(), sourceAssetId: crypto.randomUUID() };
    expect(maskSaveSchema.safeParse({ ...base, bytes: new Uint8Array(5) }).success).toBe(true);
    expect(maskSaveSchema.safeParse({ ...base, bytes: new Uint8Array(50 * 1024 * 1024 + 1) }).success).toBe(false);
  });
  it('rejeita trabalhos sem prompt e quantidades excessivas', () => {
    const base = { projectId: crypto.randomUUID(), providerId: 'openai', operation: 'generate', prompt: '', preserve: '', model: 'gpt-image-2', size: '1024x1024', quality: 'auto', format: 'png', compression: 90, background: 'auto', count: 11, referenceAssetIds: [] };
    expect(providerRunSchema.safeParse(base).success).toBe(false);
  });
});
