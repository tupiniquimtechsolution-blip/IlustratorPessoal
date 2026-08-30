import type { GenerationJob, ProviderRunInput } from '../../shared/types';
import { AppError, publicError } from '../../shared/errors';
import { AssetRepository, JobRepository } from '../database/repositories';
import { AssetService } from '../storage/assets';
import type { ImageProvider } from '../providers/provider';
import { AppLogger } from '../app/logger';

export class JobQueue {
  private readonly controllers = new Map<string, AbortController>();
  private readonly providers: Map<string, ImageProvider>;
  constructor(
    private readonly jobs: JobRepository,
    private readonly assets: AssetRepository,
    private readonly assetService: AssetService,
    providers: ImageProvider[],
    private readonly logger: AppLogger,
    private readonly onChange: (job: GenerationJob) => void,
  ) {
    this.providers = new Map(providers.map((provider) => [provider.id, provider]));
    this.jobs.recoverInterrupted();
  }

  create(input: ProviderRunInput): GenerationJob {
    const job: GenerationJob = {
      id: crypto.randomUUID(), projectId: input.projectId, providerId: input.providerId,
      operation: input.operation, status: 'queued', progress: 0, modelId: input.model,
      errorCode: null, errorMessage: null, createdAt: new Date().toISOString(), startedAt: null, completedAt: null,
    };
    this.jobs.insert({ ...job, inputJson: JSON.stringify(input) });
    this.onChange(job);
    setTimeout(() => { void this.run(job.id, input); }, 0);
    return job;
  }

  private update(id: string, values: Parameters<JobRepository['update']>[1]): void {
    this.jobs.update(id, values);
    const current = this.jobs.getWithInput(id)?.job;
    if (current) this.onChange(current);
  }

  private async run(id: string, input: ProviderRunInput): Promise<void> {
    const provider = this.providers.get(input.providerId);
    if (!provider) throw new AppError('PROVIDER_NOT_CONFIGURED');
    const controller = new AbortController();
    this.controllers.set(id, controller);
    try {
      this.update(id, { status: 'validating', progress: 5, startedAt: new Date().toISOString() });
      const source = input.sourceAssetId ? this.assets.get(input.sourceAssetId) : null;
      if (input.operation === 'edit' && !source) throw new AppError('INVALID_INPUT');
      const references = input.referenceAssetIds.map((assetId) => this.assets.get(assetId)).filter((asset) => asset !== null);
      const mask = input.maskAssetId ? this.assets.get(input.maskAssetId) : null;
      this.update(id, { status: 'sending', progress: 20 });
      const result = await provider.execute(input, {
        sourcePaths: [...(source ? [source.managedPath] : []), ...references.map((reference) => reference.managedPath)],
        ...(mask ? { maskPath: mask.managedPath } : {}), signal: controller.signal,
      });
      this.update(id, { status: 'saving', progress: 85 });
      const outputIds: string[] = [];
      for (const [index, buffer] of result.images.entries()) {
        const asset = await this.assetService.registerBuffer({
          projectId: input.projectId, buffer, format: input.format,
          originalName: `${input.operation}_${new Date().toISOString().slice(0, 10)}_${index + 1}.${input.format === 'jpeg' ? 'jpg' : input.format}`,
          ...(source ? { sourceAssetId: source.id } : {}), operation: input.operation, prompt: input.prompt,
          preserve: input.preserve, providerId: input.providerId, modelId: input.model,
          ...(mask ? { maskAssetId: mask.id } : {}),
        });
        outputIds.push(asset.id);
      }
      this.update(id, { status: 'completed', progress: 100, outputJson: JSON.stringify({ assetIds: outputIds, revisedPrompt: result.revisedPrompt }), completedAt: new Date().toISOString() });
      this.logger.write('Fila', 'Trabalho concluído', { jobId: id, provider: input.providerId, outputs: outputIds.length });
    } catch (error) {
      const result = publicError(error);
      const cancelled = result.code === 'JOB_CANCELLED' || controller.signal.aborted;
      this.update(id, { status: cancelled ? 'cancelled' : 'failed', progress: 100, errorCode: result.code, errorMessage: result.message, completedAt: new Date().toISOString() });
      this.logger.write('Fila', cancelled ? 'Trabalho cancelado' : 'Trabalho falhou', { jobId: id, code: result.code });
    } finally { this.controllers.delete(id); }
  }

  async cancel(id: string): Promise<void> {
    const entry = this.jobs.getWithInput(id);
    if (!entry) throw new AppError('INVALID_INPUT');
    this.controllers.get(id)?.abort();
    const provider = this.providers.get(entry.job.providerId);
    if (provider?.cancel) await provider.cancel().catch(() => undefined);
    this.update(id, { status: 'cancelled', progress: 100, errorCode: 'JOB_CANCELLED', errorMessage: 'Trabalho cancelado pelo usuário.', completedAt: new Date().toISOString() });
  }

  retry(id: string): GenerationJob {
    const entry = this.jobs.getWithInput(id);
    if (!entry) throw new AppError('INVALID_INPUT');
    return this.create(JSON.parse(entry.input) as ProviderRunInput);
  }
}
