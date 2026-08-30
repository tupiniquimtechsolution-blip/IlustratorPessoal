// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { AppLogger, sanitizeLogValue } from '../src/main/app/logger';

const folders: string[] = [];
afterEach(() => folders.splice(0).forEach((folder) => fs.rmSync(folder, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })));
describe('logs sanitizados', () => {
  it('remove chaves e imagens em base64', () => {
    const value = sanitizeLogValue('Authorization=sk-abcdefghijklmnop data:image/png;base64,aGVsbG8=');
    expect(value).not.toContain('abcdefghijklmnop'); expect(value).not.toContain('aGVsbG8');
  });
  it('não grava segredo no arquivo', () => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'illustrator-log-')); folders.push(folder); const logger = new AppLogger(folder);
    logger.write('Provedor', 'falha', { apiKey: 'sk-abcdefghijklmnop' }); const log = fs.readFileSync(logger.filePath, 'utf8');
    expect(log).toContain('[SEGREDO_REMOVIDO]'); expect(log).not.toContain('sk-abcdefghijklmnop');
  });
});
