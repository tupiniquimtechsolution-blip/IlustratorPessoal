import type { DatabaseSync } from 'node:sqlite';
import type {
  Asset,
  GenerationJob,
  IllustratorProfile,
  Project,
  ReferenceItem,
  StylePreset,
} from '../../shared/types';

type Row = Record<string, unknown>;

export interface ManagedAsset extends Asset {
  managedPath: string;
  thumbnailPath: string;
}

function projectFromRow(row: Row): Project {
  return {
    id: String(row.id), name: String(row.name), description: String(row.description),
    profileId: row.profile_id ? String(row.profile_id) : null,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at), lastOpenedAt: String(row.last_opened_at),
    canvasState: String(row.canvas_state), defaultExportPresetId: row.default_export_preset_id ? String(row.default_export_preset_id) : null,
  };
}

function assetFromRow(row: Row): ManagedAsset {
  const id = String(row.id);
  return {
    id, projectId: String(row.project_id), type: row.type as ManagedAsset['type'], originalName: String(row.original_name),
    managedPath: String(row.managed_path), thumbnailPath: String(row.thumbnail_path),
    url: `illustrator://asset/${id}`, thumbnailUrl: `illustrator://asset/${id}?thumbnail=1`,
    mimeType: String(row.mime_type), width: Number(row.width), height: Number(row.height), fileSize: Number(row.file_size),
    sha256: String(row.sha256), hasAlpha: Boolean(row.has_alpha), colorSpace: String(row.color_space), createdAt: String(row.created_at),
  };
}

export class ProjectRepository {
  constructor(private readonly db: DatabaseSync) {}

  list(): Project[] {
    return (this.db.prepare('SELECT * FROM projects ORDER BY last_opened_at DESC').all() as Row[]).map(projectFromRow);
  }

  get(id: string): Project | null {
    const row = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Row | undefined;
    return row ? projectFromRow(row) : null;
  }

  create(input: { id: string; name: string; description: string }): Project {
    const now = new Date().toISOString();
    this.db.prepare(`INSERT INTO projects(id,name,description,created_at,updated_at,last_opened_at,canvas_state)
      VALUES(@id,@name,@description,@now,@now,@now,'{}')`).run({ ...input, now });
    return this.get(input.id)!;
  }

  update(input: { id: string; name?: string; description?: string; canvasState?: string; profileId?: string | null }): Project {
    const current = this.get(input.id);
    if (!current) throw new Error('PROJECT_NOT_FOUND');
    const now = new Date().toISOString();
    this.db.prepare(`UPDATE projects SET name=?,description=?,canvas_state=?,profile_id=?,updated_at=?,last_opened_at=? WHERE id=?`).run(
      input.name ?? current.name, input.description ?? current.description, input.canvasState ?? current.canvasState,
      input.profileId === undefined ? current.profileId : input.profileId, now, now, input.id,
    );
    return this.get(input.id)!;
  }

  delete(id: string): void { this.db.prepare('DELETE FROM projects WHERE id = ?').run(id); }
}

export class AssetRepository {
  constructor(private readonly db: DatabaseSync) {}

  list(projectId: string): ManagedAsset[] {
    return (this.db.prepare('SELECT * FROM assets WHERE project_id = ? ORDER BY created_at DESC').all(projectId) as Row[]).map(assetFromRow);
  }

  get(id: string): ManagedAsset | null {
    const row = this.db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as Row | undefined;
    return row ? assetFromRow(row) : null;
  }

  findDuplicate(projectId: string, sha256: string): ManagedAsset | null {
    const row = this.db.prepare('SELECT * FROM assets WHERE project_id = ? AND sha256 = ? LIMIT 1').get(projectId, sha256) as Row | undefined;
    return row ? assetFromRow(row) : null;
  }

  insert(asset: Omit<ManagedAsset, 'url' | 'thumbnailUrl'>): ManagedAsset {
    this.db.prepare(`INSERT INTO assets(id,project_id,type,original_name,managed_path,thumbnail_path,mime_type,width,height,file_size,sha256,has_alpha,color_space,created_at)
      VALUES(@id,@projectId,@type,@originalName,@managedPath,@thumbnailPath,@mimeType,@width,@height,@fileSize,@sha256,@hasAlpha,@colorSpace,@createdAt)`).run({ ...asset, hasAlpha: Number(asset.hasAlpha) });
    return this.get(asset.id)!;
  }

  insertRevision(input: {
    id: string; assetId: string; parentRevisionId: string | null; operation: string; prompt: string;
    preserveInstructions: string; parametersJson: string; providerId: string | null; modelId: string | null;
    maskAssetId: string | null; outputAssetId: string; createdAt: string;
  }): void {
    this.db.prepare(`INSERT INTO revisions(id,asset_id,parent_revision_id,operation,prompt,preserve_instructions,parameters_json,provider_id,model_id,mask_asset_id,output_asset_id,created_at)
      VALUES(@id,@assetId,@parentRevisionId,@operation,@prompt,@preserveInstructions,@parametersJson,@providerId,@modelId,@maskAssetId,@outputAssetId,@createdAt)`).run(input);
  }
}

function jobFromRow(row: Row): GenerationJob {
  return {
    id: String(row.id), projectId: String(row.project_id), providerId: row.provider_id as GenerationJob['providerId'],
    operation: row.operation as GenerationJob['operation'], status: row.status as GenerationJob['status'], progress: Number(row.progress),
    modelId: String(row.model_id), errorCode: row.error_code ? String(row.error_code) : null,
    errorMessage: row.error_message ? String(row.error_message) : null, createdAt: String(row.created_at),
    startedAt: row.started_at ? String(row.started_at) : null, completedAt: row.completed_at ? String(row.completed_at) : null,
  };
}

export class JobRepository {
  constructor(private readonly db: DatabaseSync) {}
  list(projectId?: string): GenerationJob[] {
    const rows = projectId
      ? this.db.prepare('SELECT * FROM generation_jobs WHERE project_id = ? ORDER BY created_at DESC LIMIT 200').all(projectId)
      : this.db.prepare('SELECT * FROM generation_jobs ORDER BY created_at DESC LIMIT 200').all();
    return (rows as Row[]).map(jobFromRow);
  }
  getWithInput(id: string): { job: GenerationJob; input: string } | null {
    const row = this.db.prepare('SELECT * FROM generation_jobs WHERE id = ?').get(id) as Row | undefined;
    return row ? { job: jobFromRow(row), input: String(row.input_json) } : null;
  }
  insert(input: GenerationJob & { inputJson: string }): void {
    this.db.prepare(`INSERT INTO generation_jobs(id,project_id,provider_id,operation,status,progress,input_json,model_id,created_at,started_at,completed_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(input.id, input.projectId, input.providerId, input.operation, input.status, input.progress, input.inputJson, input.modelId, input.createdAt, input.startedAt, input.completedAt);
  }
  update(id: string, values: { status: GenerationJob['status']; progress: number; errorCode?: string | null; errorMessage?: string | null; outputJson?: string; startedAt?: string | null; completedAt?: string | null }): void {
    const current = this.getWithInput(id);
    if (!current) return;
    this.db.prepare(`UPDATE generation_jobs SET status=?,progress=?,error_code=?,error_message=?,output_json=COALESCE(?,output_json),started_at=COALESCE(?,started_at),completed_at=COALESCE(?,completed_at) WHERE id=?`).run(
      values.status, values.progress, values.errorCode ?? null, values.errorMessage ?? null, values.outputJson ?? null,
      values.startedAt ?? null, values.completedAt ?? null, id,
    );
  }
  recoverInterrupted(): void {
    this.db.prepare(`UPDATE generation_jobs SET status='failed',error_code='PROVIDER_UNAVAILABLE',error_message='Execução interrompida pelo encerramento do aplicativo',completed_at=? WHERE status NOT IN ('completed','cancelled','failed')`).run(new Date().toISOString());
  }
}

export class LibraryRepository {
  constructor(private readonly db: DatabaseSync) {}

  listProfiles(): IllustratorProfile[] {
    return (this.db.prepare('SELECT * FROM illustrator_profiles ORDER BY is_archived, updated_at DESC').all() as Row[]).map((row) => ({
      id: String(row.id), name: String(row.name), description: String(row.description), version: Number(row.version), schemaVersion: Number(row.schema_version),
      content: JSON.parse(String(row.content_json)) as IllustratorProfile['content'], isStrict: Boolean(row.is_strict), isArchived: Boolean(row.is_archived),
      createdAt: String(row.created_at), updatedAt: String(row.updated_at),
    }));
  }

  saveProfile(input: { id?: string; name: string; description: string; isStrict: boolean; content: Record<string, unknown> }): IllustratorProfile {
    const now = new Date().toISOString();
    const id = input.id ?? crypto.randomUUID();
    const existing = this.db.prepare('SELECT version,created_at FROM illustrator_profiles WHERE id=?').get(id) as Row | undefined;
    this.db.prepare(`INSERT INTO illustrator_profiles(id,name,description,version,schema_version,content_json,is_strict,is_archived,created_at,updated_at)
      VALUES(?,?,?,?,1,?,?,0,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,version=illustrator_profiles.version+1,content_json=excluded.content_json,is_strict=excluded.is_strict,updated_at=excluded.updated_at`).run(
      id, input.name, input.description, existing ? Number(existing.version) + 1 : 1, JSON.stringify(input.content), Number(input.isStrict), existing ? String(existing.created_at) : now, now,
    );
    return this.listProfiles().find((profile) => profile.id === id)!;
  }

  archiveProfile(id: string): void { this.db.prepare('UPDATE illustrator_profiles SET is_archived=1,updated_at=? WHERE id=?').run(new Date().toISOString(), id); }

  listStyles(): StylePreset[] {
    return (this.db.prepare('SELECT * FROM style_presets ORDER BY category,name').all() as Row[]).map((row) => ({
      id: String(row.id), name: String(row.name), category: String(row.category), description: String(JSON.parse(String(row.content_json)).description ?? ''),
      createdAt: String(row.created_at), updatedAt: String(row.updated_at),
    }));
  }

  saveStyle(input: { id?: string; name: string; category: string; description: string }): StylePreset {
    const now = new Date().toISOString();
    const id = input.id ?? crypto.randomUUID();
    this.db.prepare(`INSERT INTO style_presets(id,name,category,content_json,created_at,updated_at) VALUES(?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name,category=excluded.category,content_json=excluded.content_json,updated_at=excluded.updated_at`).run(id, input.name, input.category, JSON.stringify({ description: input.description }), now, now);
    return this.listStyles().find((style) => style.id === id)!;
  }

  listReferences(projectId: string): ReferenceItem[] {
    return (this.db.prepare('SELECT * FROM project_references WHERE project_id=? ORDER BY order_index').all(projectId) as Row[]).map((row) => ({
      id: String(row.id), projectId: String(row.project_id), assetId: String(row.asset_id), role: row.role as ReferenceItem['role'],
      priority: row.priority as ReferenceItem['priority'], notes: String(row.notes), enabled: Boolean(row.enabled), orderIndex: Number(row.order_index),
    }));
  }

  upsertReference(input: Omit<ReferenceItem, 'id'>): ReferenceItem {
    const id = crypto.randomUUID();
    this.db.prepare(`INSERT INTO project_references(id,project_id,asset_id,role,priority,notes,enabled,order_index) VALUES(?,?,?,?,?,?,?,?)
      ON CONFLICT(project_id,asset_id) DO UPDATE SET role=excluded.role,priority=excluded.priority,notes=excluded.notes,enabled=excluded.enabled,order_index=excluded.order_index`).run(
      id, input.projectId, input.assetId, input.role, input.priority, input.notes, Number(input.enabled), input.orderIndex,
    );
    return this.listReferences(input.projectId).find((reference) => reference.assetId === input.assetId)!;
  }
}
