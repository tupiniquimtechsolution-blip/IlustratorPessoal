import fs from 'node:fs/promises';
import path from 'node:path';
import { app, protocol } from 'electron';
import type { AssetRepository } from '../database/repositories';
import type { StorageManager } from '../storage/storage';

export function registerAssetProtocol(assets: AssetRepository, storage: StorageManager): void {
  protocol.handle('illustrator', async (request) => {
    try {
      const url = new URL(request.url);
      if (url.hostname === 'app') {
        const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '');
        if (!/^(index\.html|assets\/[a-zA-Z0-9._-]+\.(?:css|js|map))$/.test(relativePath)) {
          return new Response('Not found', { status: 404 });
        }
        const rendererRoot = path.join(app.getAppPath(), '.vite', 'renderer', MAIN_WINDOW_VITE_NAME);
        const rendererFile = path.resolve(rendererRoot, relativePath);
        if (!rendererFile.startsWith(`${path.resolve(rendererRoot)}${path.sep}`)) return new Response('Forbidden', { status: 403 });
        const contents = await fs.readFile(rendererFile);
        const contentType = relativePath.endsWith('.html') ? 'text/html; charset=utf-8'
          : relativePath.endsWith('.css') ? 'text/css; charset=utf-8'
            : relativePath.endsWith('.map') ? 'application/json; charset=utf-8'
              : 'text/javascript; charset=utf-8';
        return new Response(new Uint8Array(contents), { headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' } });
      }
      if (url.hostname === 'asset') {
        const asset = assets.get(url.pathname.replace(/^\//, ''));
        if (!asset) return new Response('Not found', { status: 404 });
        const filePath = storage.assertManaged(url.searchParams.get('thumbnail') === '1' ? asset.thumbnailPath : asset.managedPath);
        const contents = await fs.readFile(filePath);
        return new Response(new Uint8Array(contents), { headers: { 'Content-Type': asset.mimeType, 'Cache-Control': 'private, max-age=31536000, immutable' } });
      }
      return new Response('Not found', { status: 404 });
    } catch { return new Response('Forbidden', { status: 403 }); }
  });
}
