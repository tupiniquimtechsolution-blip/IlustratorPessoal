import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { channels } from '../shared/channels';
import type { IllustratorAPI } from './api';

const invoke = <T>(channel: string, payload?: unknown): Promise<T> => ipcRenderer.invoke(channel, payload) as Promise<T>;

const api: IllustratorAPI = {
  projects: {
    list: () => invoke(channels.projectsList), create: (input) => invoke(channels.projectsCreate, input),
    update: (input) => invoke(channels.projectsUpdate, input), remove: (id) => invoke(channels.projectsDelete, id),
    export: (id) => invoke(channels.projectsExport, id), import: () => invoke(channels.projectsImport),
  },
  assets: {
    list: (projectId) => invoke(channels.assetsList, projectId),
    import: (projectId, type = 'original') => invoke(channels.assetsImportDialog, { projectId, type }),
    importDropped: (projectId, files, type = 'original') => invoke(channels.assetsImportPaths, { projectId, type, filePaths: files.map((file) => webUtils.getPathForFile(file)) }),
    process: (input) => invoke(channels.assetsProcess, input), export: (assetId) => invoke(channels.assetsExport, assetId),
  },
  masks: {
    save: async (projectId, sourceAssetId, dataUrl) => {
      const bytes = new Uint8Array(await (await fetch(dataUrl)).arrayBuffer());
      return await invoke(channels.masksSave, { projectId, sourceAssetId, bytes });
    },
  },
  references: {
    list: (projectId) => invoke(channels.referencesList, projectId), upsert: (input) => invoke(channels.referencesUpsert, input),
  },
  jobs: {
    list: (projectId) => invoke(channels.jobsList, projectId), create: (input) => invoke(channels.jobsCreate, input),
    cancel: (id) => invoke(channels.jobsCancel, id), retry: (id) => invoke(channels.jobsRetry, id),
    subscribe: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, job: Parameters<typeof callback>[0]) => callback(job);
      ipcRenderer.on(channels.jobsChanged, listener);
      return () => ipcRenderer.removeListener(channels.jobsChanged, listener);
    },
  },
  providers: {
    capabilities: (provider, model) => invoke(channels.providersCapabilities, { provider, model }),
    test: (provider) => invoke(channels.providersTest, provider),
  },
  settings: { get: () => invoke(channels.settingsGet), update: (input) => invoke(channels.settingsUpdate, input) },
  secrets: { save: (provider, value) => invoke(channels.secretsSave, { provider, value }), remove: (provider) => invoke(channels.secretsRemove, provider) },
  profiles: {
    list: () => invoke(channels.profilesList), save: (input) => invoke(channels.profilesSave, input), archive: (id) => invoke(channels.profilesArchive, id),
  },
  styles: { list: () => invoke(channels.stylesList), save: (input) => invoke(channels.stylesSave, input) },
  diagnostics: { get: () => invoke(channels.diagnosticsGet), openLogs: () => invoke(channels.diagnosticsOpenLogs), clearLogs: () => invoke(channels.diagnosticsClearLogs) },
};

contextBridge.exposeInMainWorld('illustrator', api);
