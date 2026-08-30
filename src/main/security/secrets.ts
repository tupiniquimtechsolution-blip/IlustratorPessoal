import fs from 'node:fs';
import path from 'node:path';
import { safeStorage } from 'electron';
import { AppError } from '../../shared/errors';

export class SecretStore {
  private readonly filePath: string;
  constructor(encryptedDirectory: string) { this.filePath = path.join(encryptedDirectory, 'openai.key.bin'); }

  save(value: string): void {
    if (!safeStorage.isEncryptionAvailable()) throw new AppError('PROVIDER_NOT_CONFIGURED', 'Criptografia do sistema indisponível');
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, safeStorage.encryptString(value), { mode: 0o600 });
  }

  read(): string | null {
    if (!fs.existsSync(this.filePath) || !safeStorage.isEncryptionAvailable()) return null;
    try { return safeStorage.decryptString(fs.readFileSync(this.filePath)); } catch { return null; }
  }

  remove(): void { if (fs.existsSync(this.filePath)) fs.rmSync(this.filePath, { force: true }); }
  has(): boolean { return fs.existsSync(this.filePath); }
}
