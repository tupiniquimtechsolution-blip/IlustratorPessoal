import fs from 'node:fs';
import path from 'node:path';

const MAX_LOG_BYTES = 5 * 1024 * 1024;

export function sanitizeLogValue(value: unknown): string {
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  return raw
    .replace(/sk-[a-zA-Z0-9_-]{8,}/g, '[SEGREDO_REMOVIDO]')
    .replace(/("?(?:api[_-]?key|authorization|token)"?\s*[:=]\s*)[^\s,}]+/gi, '$1[SEGREDO_REMOVIDO]')
    .replace(/data:image\/[a-zA-Z+]+;base64,[a-zA-Z0-9+/=]+/g, '[IMAGEM_BASE64_REMOVIDA]');
}

export class AppLogger {
  readonly filePath: string;
  constructor(logDirectory: string) {
    fs.mkdirSync(logDirectory, { recursive: true });
    this.filePath = path.join(logDirectory, 'illustrator-studio-ai.log');
  }
  private rotate(): void {
    try {
      if (fs.existsSync(this.filePath) && fs.statSync(this.filePath).size > MAX_LOG_BYTES) {
        const old = `${this.filePath}.1`;
        if (fs.existsSync(old)) fs.unlinkSync(old);
        fs.renameSync(this.filePath, old);
      }
    } catch { /* logging must never break the app */ }
  }
  write(category: string, message: string, detail?: unknown): void {
    this.rotate();
    const line = `${new Date().toISOString()} [${sanitizeLogValue(category)}] ${sanitizeLogValue(message)}${detail === undefined ? '' : ` ${sanitizeLogValue(detail)}`}\n`;
    fs.appendFileSync(this.filePath, line, { encoding: 'utf8' });
  }
  clear(): void { fs.writeFileSync(this.filePath, '', 'utf8'); }
}
