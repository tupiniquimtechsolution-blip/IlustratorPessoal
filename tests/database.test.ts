// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AssetRepository, LibraryRepository, ProjectRepository } from '../src/main/database/repositories';

let db: DatabaseSync; let projects: ProjectRepository; let library: LibraryRepository; let assets: AssetRepository;
beforeEach(() => { db = new DatabaseSync(':memory:', { enableForeignKeyConstraints: true }); db.exec(fs.readFileSync(path.resolve('migrations/001_initial.sql'), 'utf8')); projects = new ProjectRepository(db); library = new LibraryRepository(db); assets = new AssetRepository(db); });
afterEach(() => db.close());
describe('repositórios SQLite', () => {
  it('cria, abre, renomeia, salva e exclui projetos', () => {
    const project = projects.create({ id: crypto.randomUUID(), name: 'Teste', description: '' }); expect(projects.get(project.id)?.name).toBe('Teste');
    expect(projects.update({ id: project.id, name: 'Renomeado', canvasState: '{"zoom":1}' }).name).toBe('Renomeado');
    projects.delete(project.id); expect(projects.get(project.id)).toBeNull();
  });
  it('detecta asset duplicado sem substituir original', () => {
    const project = projects.create({ id: crypto.randomUUID(), name: 'Assets', description: '' });
    const asset = assets.insert({ id: crypto.randomUUID(), projectId: project.id, type: 'original', originalName: 'foto.png', managedPath: '/managed/original.png', thumbnailPath: '/managed/thumb.webp', mimeType: 'image/png', width: 10, height: 10, fileSize: 100, sha256: 'abc', hasAlpha: true, colorSpace: 'srgb', createdAt: new Date().toISOString() });
    expect(assets.findDuplicate(project.id, 'abc')?.id).toBe(asset.id); expect(asset.type).toBe('original');
  });
  it('versiona perfis e mantém modo estrito', () => {
    const first = library.saveProfile({ name: 'Personagem', description: 'Consistente', isStrict: true, content: { face: 'preservar' } });
    const second = library.saveProfile({ id: first.id, name: 'Personagem', description: 'Atualizado', isStrict: true, content: { face: 'máximo' } });
    expect(second.version).toBe(2); expect(second.isStrict).toBe(true);
  });
  it('cria e atualiza estilos livres', () => {
    const style = library.saveStyle({ name: 'Meu estilo', category: 'Livre', description: 'Textura própria' });
    expect(library.listStyles().find((item) => item.id === style.id)?.description).toBe('Textura própria');
  });
});
