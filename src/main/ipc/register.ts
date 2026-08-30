import fs from 'node:fs';
import { app, ipcMain, shell } from 'electron';
import { z } from 'zod';
import { channels } from '../../shared/channels';
import { publicError } from '../../shared/errors';
import {
  assetImportSchema,
  idSchema,
  imageProcessSchema,
  maskSaveSchema,
  profileInputSchema,
  projectCreateSchema,
  projectUpdateSchema,
  providerRunSchema,
  referenceInputSchema,
  secretSaveSchema,
  settingsUpdateSchema,
  styleInputSchema,
} from '../../shared/schemas';
import type { Diagnostics, OperationResult } from '../../shared/types';
import type { AppContext } from '../app/context';

function register<T>(channel: string, action: (payload: unknown) => Promise<T> | T, context: AppContext): void {
  ipcMain.handle(channel, async (_event, payload: unknown): Promise<OperationResult<T>> => {
    try { return { ok: true, data: await action(payload) }; }
    catch (error) {
      const publicResult = publicError(error);
      context.logger.write('Aplicação', 'Falha em chamada IPC', { channel, code: publicResult.code });
      return { ok: false, error: publicResult };
    }
  });
}

export function registerIpc(context: AppContext): void {
  register(channels.projectsList, () => context.projects.list(), context);
  register(channels.projectsCreate, async (payload) => {
    const input = projectCreateSchema.parse(payload); const project = context.projects.create({ id: crypto.randomUUID(), ...input });
    await context.storage.ensureProject(project.id); return project;
  }, context);
  register(channels.projectsUpdate, (payload) => context.projects.update(projectUpdateSchema.parse(payload)), context);
  register(channels.projectsDelete, async (payload) => { const id = idSchema.parse(payload); context.projects.delete(id); await context.storage.removeProject(id); return null; }, context);
  register(channels.projectsExport, (payload) => context.projectPackages.export(idSchema.parse(payload)), context);
  register(channels.projectsImport, () => context.projectPackages.chooseAndImport(), context);

  register(channels.assetsList, (payload) => context.assets.list(idSchema.parse(payload)), context);
  register(channels.assetsImportDialog, async (payload) => {
    const value = z.object({ projectId: idSchema, type: z.enum(['original', 'reference']) }).parse(payload);
    return await context.assetService.chooseAndImport(value.projectId, value.type);
  }, context);
  register(channels.assetsImportPaths, async (payload) => {
    const value = assetImportSchema.parse(payload); return await context.assetService.importPaths(value.projectId, value.filePaths, value.type);
  }, context);
  register(channels.assetsProcess, (payload) => context.assetService.process(imageProcessSchema.parse(payload)), context);
  register(channels.assetsExport, (payload) => context.assetService.export(idSchema.parse(payload)), context);
  register(channels.masksSave, async (payload) => { const value = maskSaveSchema.parse(payload); return await context.assetService.saveMask(value.projectId, value.sourceAssetId, value.bytes); }, context);

  register(channels.referencesList, (payload) => context.library.listReferences(idSchema.parse(payload)), context);
  register(channels.referencesUpsert, (payload) => { const value = referenceInputSchema.parse(payload); return context.library.upsertReference({ ...value }); }, context);
  register(channels.jobsList, (payload) => context.jobs.list(payload === undefined ? undefined : idSchema.parse(payload)), context);
  register(channels.jobsCreate, (payload) => context.queue.create(providerRunSchema.parse(payload)), context);
  register(channels.jobsCancel, async (payload) => { await context.queue.cancel(idSchema.parse(payload)); return null; }, context);
  register(channels.jobsRetry, (payload) => context.queue.retry(idSchema.parse(payload)), context);

  register(channels.providersCapabilities, (payload) => {
    const value = z.object({ provider: z.enum(['openai', 'comfyui']), model: z.string().optional() }).parse(payload);
    return context.providers[value.provider].getCapabilities(value.model);
  }, context);
  register(channels.providersTest, (payload) => context.providers[z.enum(['openai', 'comfyui']).parse(payload)].testConnection(), context);
  register(channels.settingsGet, () => context.settings.get(), context);
  register(channels.settingsUpdate, (payload) => {
    const value = settingsUpdateSchema.parse(payload);
    const current = context.settings.get();
    const { openai, comfyui, ...rest } = value;
    return context.settings.update({
      ...rest,
      ...(openai ? { openai: { ...current.openai, ...openai } } : {}),
      ...(comfyui ? { comfyui: { ...current.comfyui, ...comfyui } } : {}),
    });
  }, context);
  register(channels.secretsSave, (payload) => { const value = secretSaveSchema.parse(payload); context.secrets.save(value.value); return null; }, context);
  register(channels.secretsRemove, (payload) => { z.literal('openai').parse(payload); context.secrets.remove(); return null; }, context);

  register(channels.profilesList, () => context.library.listProfiles(), context);
  register(channels.profilesSave, (payload) => context.library.saveProfile(profileInputSchema.parse(payload)), context);
  register(channels.profilesArchive, (payload) => { context.library.archiveProfile(idSchema.parse(payload)); return null; }, context);
  register(channels.stylesList, () => context.library.listStyles(), context);
  register(channels.stylesSave, (payload) => context.library.saveStyle(styleInputSchema.parse(payload)), context);

  register(channels.diagnosticsGet, (): Diagnostics => {
    let freeBytes: number | null = null;
    try { freeBytes = Number(fs.statfsSync(context.storage.root).bavail) * Number(fs.statfsSync(context.storage.root).bsize); } catch { /* unavailable */ }
    return { version: app.getVersion(), dataPath: context.storage.root, platform: process.platform, architecture: process.arch, database: context.db.connection.isOpen ? 'ok' : 'error', freeBytes, logPath: context.logger.filePath };
  }, context);
  register(channels.diagnosticsOpenLogs, async () => { await shell.openPath(context.logger.filePath); return null; }, context);
  register(channels.diagnosticsClearLogs, () => { context.logger.clear(); return null; }, context);
}
