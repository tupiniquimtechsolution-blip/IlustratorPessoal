import fs from 'node:fs';
import path from 'node:path';
import { dialog } from 'electron';
import { ZipArchive } from 'archiver';
import unzipper from 'unzipper';
import { z } from 'zod';
import { AppError } from '../../shared/errors';
import { isSafeArchiveEntry, sanitizeFilename } from '../../shared/filenames';
import { AssetRepository, ProjectRepository } from '../database/repositories';
import { AssetService } from './assets';
import { StorageManager } from './storage';

const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  project: z.object({ name: z.string().min(1).max(120), description: z.string().max(2000) }),
  assets: z.array(z.object({ relativePath: z.string(), type: z.enum(['original', 'reference']) })).max(5000),
});

export class ProjectPackageService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly assets: AssetRepository,
    private readonly assetService: AssetService,
    private readonly storage: StorageManager,
  ) {}

  async export(projectId: string): Promise<string | null> {
    const project = this.projects.get(projectId);
    if (!project) throw new AppError('INVALID_INPUT');
    const projectPath = this.storage.projectPath(projectId);
    const result = await dialog.showSaveDialog({
      title: 'Exportar projeto', defaultPath: `${sanitizeFilename(project.name)}.illustratorproject`,
      filters: [{ name: 'Projeto do Illustrator Studio AI', extensions: ['illustratorproject'] }],
    });
    if (result.canceled || !result.filePath) return null;
    const assetEntries = this.assets.list(projectId)
      .filter((asset) => asset.type === 'original' || asset.type === 'reference')
      .map((asset) => ({ relativePath: path.relative(projectPath, asset.managedPath).replace(/\\/g, '/'), type: asset.type as 'original' | 'reference' }));
    const manifest = JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), project: { name: project.name, description: project.description }, assets: assetEntries }, null, 2);
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(result.filePath!);
      const archive = new ZipArchive({ zlib: { level: 7 } });
      output.on('close', resolve); output.on('error', reject); archive.on('error', reject);
      archive.pipe(output); archive.append(manifest, { name: 'manifest.json' }); archive.directory(projectPath, 'files');
      void archive.finalize();
    });
    return result.filePath;
  }

  async chooseAndImport(): Promise<ReturnType<ProjectRepository['create']> | null> {
    const result = await dialog.showOpenDialog({ title: 'Importar projeto', properties: ['openFile'], filters: [{ name: 'Projeto', extensions: ['illustratorproject'] }] });
    if (result.canceled || !result.filePaths[0]) return null;
    return await this.import(result.filePaths[0]);
  }

  async import(filePath: string): Promise<ReturnType<ProjectRepository['create']>> {
    const archive = await unzipper.Open.file(filePath);
    if (archive.files.some((entry: unzipper.File) => !isSafeArchiveEntry(entry.path))) throw new AppError('INVALID_INPUT', 'Pacote contém caminho inseguro');
    const manifestEntry = archive.files.find((entry: unzipper.File) => entry.path === 'manifest.json');
    if (!manifestEntry) throw new AppError('INVALID_INPUT', 'Manifest ausente');
    const manifest = manifestSchema.parse(JSON.parse((await manifestEntry.buffer()).toString('utf8')));
    const project = this.projects.create({ id: crypto.randomUUID(), name: `${manifest.project.name} (importado)`, description: manifest.project.description });
    await this.storage.ensureProject(project.id);
    const tempDirectory = path.join(this.storage.root, 'cache', `import-${crypto.randomUUID()}`);
    await fs.promises.mkdir(tempDirectory, { recursive: true });
    try {
      for (const item of manifest.assets) {
        if (!isSafeArchiveEntry(item.relativePath)) throw new AppError('INVALID_INPUT');
        const entry = archive.files.find((candidate: unzipper.File) => candidate.path === `files/${item.relativePath}`);
        if (!entry || entry.type !== 'File') throw new AppError('INVALID_INPUT', `Arquivo ausente: ${item.relativePath}`);
        const temporary = path.join(tempDirectory, path.basename(item.relativePath));
        await this.storage.atomicWrite(temporary, await entry.buffer());
        await this.assetService.importPaths(project.id, [temporary], item.type);
      }
    } finally { await fs.promises.rm(tempDirectory, { recursive: true, force: true }); }
    return project;
  }
}
