import path from 'node:path';
import { BrowserWindow, session, shell } from 'electron';

export function configureSessionSecurity(): void {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const development = Boolean(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    const policy = [
      "default-src 'self'", `script-src 'self'${development ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: illustrator:", "font-src 'self' data:",
      `connect-src 'self'${development ? ' http://localhost:* ws://localhost:*' : ''}`, "object-src 'none'", "frame-src 'none'", "base-uri 'none'", "form-action 'none'",
    ].join('; ');
    callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [policy] } });
  });
}

export function createMainWindow(reportLoadError?: (message: string) => void): BrowserWindow {
  const window = new BrowserWindow({
    width: 1500, height: 940, minWidth: 1080, minHeight: 700, show: false,
    backgroundColor: '#111318', title: 'Illustrator Studio AI',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true, sandbox: true,
      webSecurity: true, allowRunningInsecureContent: false, spellcheck: true,
    },
  });
  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    try { const target = new URL(url); if (target.protocol === 'https:') void shell.openExternal(target.toString()); } catch { /* denied */ }
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    const allowed = MAIN_WINDOW_VITE_DEV_SERVER_URL ? url.startsWith(MAIN_WINDOW_VITE_DEV_SERVER_URL) : url.startsWith('illustrator://app/');
    if (!allowed) event.preventDefault();
  });
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) void window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  else {
    const rendererUrl = 'illustrator://app/index.html';
    window.webContents.on('did-fail-load', (_event, code, description, url) => {
      reportLoadError?.(`Falha ao carregar o renderer (${code}: ${description}) em ${url}`);
    });
    void window.loadURL(rendererUrl).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      reportLoadError?.(`Falha ao abrir ${rendererUrl}: ${message}`);
    });
  }
  return window;
}
