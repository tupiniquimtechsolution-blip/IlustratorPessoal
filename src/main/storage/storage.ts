import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { mkdir, open, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { AppError } from '../../shared/errors';
import { isPathInside, sanitizeFilename } from '../../shared/filenames';

const projectFolders = ['originals', 'assets', 'revisions', 'references', 'masks', 'thumbnails', 'manifests'] as const;

export class StorageManager {
  constructor(readonly root: string) {}

  async initialize(): Promise<void> {
    await Promise.all(['database', 'projects', 'presets', 'logs', 'cache', 'encrypted'].map((folder) => mkdir(path.join(this.root, folder), { recursive: true })));
  }

  async ensureProject(id: string): Promise<string> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new AppError('INVALID_INPUT');
    const base = path.join(this.root, 'projects', id);
    await Promise.all(projectFolders.map((folder) => mkdir(path.join(base, folder), { recursive: true })));
    return base;
  }

  projectPath(id: string): string { return path.join(this.root, 'projects', id); }

  async hashFile(filePath: string): Promise<string> {
    return await new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async atomicCopy(source: string, destination: string): Promise<void> {
    const temp = `${destination}.${crypto.randomUUID()}.tmp`;
    await mkdir(path.dirname(destination), { recursive: true });
    await fs.promises.copyFile(source, temp, fs.constants.COPYFILE_EXCL);
    await rename(temp, destination);
  }

  async atomicWrite(destination: string, data: Uint8Array | string): Promise<void> {
    const temp = `${destination}.${crypto.randomUUID()}.tmp`;
    await mkdir(path.dirname(destination), { recursive: true });
    const handle = await open(temp, 'wx');
    try { await handle.writeFile(data); await handle.sync(); } finally { await handle.close(); }
    await rename(temp, destination);
  }

  managedDestination(projectId: string, folder: typeof projectFolders[number], originalName: string, extension?: string): string {
    const ext = extension ?? path.extname(originalName).toLowerCase();
    return path.join(this.projectPath(projectId), folder, `${crypto.randomUUID()}-${sanitizeFilename(path.basename(originalName, path.extname(originalName)))}${ext}`);
  }

  assertManaged(candidate: string): string {
    const projects = path.join(this.root, 'projects');
    if (!isPathInside(projects, candidate)) throw new AppError('INVALID_INPUT');
    return candidate;
  }

  async removeProject(id: string): Promise<void> {
    const project = this.assertManaged(this.projectPath(id));
    await rm(project, { recursive: true, force: true });
  }

  async fileSize(filePath: string): Promise<number> { return (await stat(filePath)).size; }
}
