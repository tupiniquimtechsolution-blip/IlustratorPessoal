import type { DatabaseSync } from 'node:sqlite';
import type { AppSettings } from '../../shared/types';
import { SecretStore } from '../security/secrets';

const defaults: AppSettings = {
  theme: 'dark', language: 'pt-BR', telemetry: false, rightsAcknowledged: false, localConcurrency: 2, cloudConcurrency: 1,
  openai: { provider: 'openai', enabled: false, endpoint: 'https://api.openai.com/v1', defaultModel: 'gpt-image-2', hasSecret: false },
  comfyui: { provider: 'comfyui', enabled: false, endpoint: 'http://127.0.0.1:8188', defaultModel: '', hasSecret: false },
};

export class SettingsService {
  constructor(private readonly db: DatabaseSync, private readonly secrets: SecretStore) {}
  get(): AppSettings {
    const row = this.db.prepare("SELECT value_json FROM settings WHERE key='app'").get() as { value_json: string } | undefined;
    const saved = row ? JSON.parse(row.value_json) as Partial<AppSettings> : {};
    const result: AppSettings = {
      ...defaults, ...saved,
      openai: { ...defaults.openai, ...saved.openai, hasSecret: this.secrets.has() },
      comfyui: { ...defaults.comfyui, ...saved.comfyui, hasSecret: false },
      telemetry: false,
    };
    return result;
  }
  update(patch: Partial<AppSettings>): AppSettings {
    const current = this.get();
    const next: AppSettings = {
      ...current, ...patch,
      openai: { ...current.openai, ...patch.openai, hasSecret: this.secrets.has() },
      comfyui: { ...current.comfyui, ...patch.comfyui, hasSecret: false },
      telemetry: false, language: 'pt-BR',
    };
    this.db.prepare(`INSERT INTO settings(key,value_json,updated_at) VALUES('app',?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at`).run(JSON.stringify(next), new Date().toISOString());
    return next;
  }
}
