import path from 'node:path';
import { BrowserWindow } from 'electron';
import { DatabaseService } from '../database/database';
import { AssetRepository, JobRepository, LibraryRepository, ProjectRepository } from '../database/repositories';
import { seedDefaults } from '../database/seed';
import { ImageProcessor } from '../image-processing/processor';
import { JobQueue } from '../jobs/queue';
import { ComfyUIProvider } from '../providers/comfyui';
import { OpenAIProvider } from '../providers/openai';
import { SecretStore } from '../security/secrets';
import { AssetService } from '../storage/assets';
import { ProjectPackageService } from '../storage/project-package';
import { StorageManager } from '../storage/storage';
import { AppLogger } from './logger';
import { SettingsService } from './settings';
import { channels } from '../../shared/channels';

export interface AppContext {
  db: DatabaseService;
  storage: StorageManager;
  logger: AppLogger;
  projects: ProjectRepository;
  assets: AssetRepository;
  jobs: JobRepository;
  library: LibraryRepository;
  assetService: AssetService;
  projectPackages: ProjectPackageService;
  secrets: SecretStore;
  settings: SettingsService;
  providers: { openai: OpenAIProvider; comfyui: ComfyUIProvider };
  queue: JobQueue;
}

export async function createAppContext(dataRoot: string): Promise<AppContext> {
  const storage = new StorageManager(dataRoot); await storage.initialize();
  const logger = new AppLogger(path.join(dataRoot, 'logs'));
  const db = new DatabaseService(path.join(dataRoot, 'database', 'illustrator-studio-ai.sqlite'));
  db.migrate(); seedDefaults(db.connection);
  const projects = new ProjectRepository(db.connection); const assets = new AssetRepository(db.connection);
  const jobs = new JobRepository(db.connection); const library = new LibraryRepository(db.connection);
  const secrets = new SecretStore(path.join(dataRoot, 'encrypted')); const settings = new SettingsService(db.connection, secrets);
  const assetService = new AssetService(assets, storage, new ImageProcessor(), logger);
  const openai = new OpenAIProvider(secrets, settings); const comfyui = new ComfyUIProvider(settings);
  const queue = new JobQueue(jobs, assets, assetService, [openai, comfyui], logger, (job) => {
    for (const window of BrowserWindow.getAllWindows()) window.webContents.send(channels.jobsChanged, job);
  });
  return {
    db, storage, logger, projects, assets, jobs, library, assetService,
    projectPackages: new ProjectPackageService(projects, assets, assetService, storage),
    secrets, settings, providers: { openai, comfyui }, queue,
  };
}
