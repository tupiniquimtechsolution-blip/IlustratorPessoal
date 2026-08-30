import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { app } from 'electron';

export class DatabaseService {
  readonly connection: DatabaseSync;

  constructor(databasePath: string) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.connection = new DatabaseSync(databasePath, { timeout: 5000, enableForeignKeyConstraints: true });
    this.connection.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  }

  migrate(): void {
    this.connection.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
    const migrationDirectory = path.join(app.getAppPath(), 'migrations');
    const files = fs.readdirSync(migrationDirectory).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
    const apply = (file: string) => {
      const version = file.split('_')[0] ?? file;
      const exists = this.connection.prepare('SELECT 1 FROM schema_migrations WHERE version = ?').get(version);
      if (exists) return;
      this.connection.exec('BEGIN IMMEDIATE');
      try {
        this.connection.exec(fs.readFileSync(path.join(migrationDirectory, file), 'utf8'));
        this.connection.prepare('INSERT INTO schema_migrations(version, applied_at) VALUES (?, ?)').run(version, new Date().toISOString());
        this.connection.exec('COMMIT');
      } catch (error) { this.connection.exec('ROLLBACK'); throw error; }
    };
    files.forEach((file) => apply(file));
  }

  close(): void {
    if (this.connection.isOpen) this.connection.close();
  }
}
