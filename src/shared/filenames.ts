import path from 'node:path';

export function sanitizeFilename(value: string): string {
  const safe = value
    .normalize('NFKD')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/[. ]+$/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 120);
  return safe || 'imagem';
}

export function isPathInside(parent: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

export function isSafeArchiveEntry(entry: string): boolean {
  const normalized = entry.replace(/\\/g, '/');
  return !normalized.startsWith('/') && !normalized.split('/').includes('..') && !/^[a-zA-Z]:/.test(normalized);
}
