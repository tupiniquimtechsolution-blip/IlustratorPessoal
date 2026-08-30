import { app, BrowserWindow, protocol } from 'electron';
import started from 'electron-squirrel-startup';
import { createAppContext, type AppContext } from './app/context';
import { registerAssetProtocol } from './app/protocol';
import { registerIpc } from './ipc/register';
import { configureSessionSecurity, createMainWindow } from './windows/main-window';

protocol.registerSchemesAsPrivileged([{ scheme: 'illustrator', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: false } }]);

if (started) app.quit();
const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();

let context: AppContext | null = null;
let mainWindow: BrowserWindow | null = null;

function openMainWindow(): BrowserWindow {
  return createMainWindow((message) => context?.logger.write('Aplicação', message));
}

app.whenReady().then(async () => {
  context = await createAppContext(app.getPath('userData'));
  registerAssetProtocol(context.assets, context.storage);
  registerIpc(context);
  configureSessionSecurity();
  mainWindow = openMainWindow();
  context.logger.write('Aplicação', 'Aplicativo iniciado', { version: app.getVersion(), platform: process.platform, architecture: process.arch });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) mainWindow = openMainWindow(); });
}).catch((error: unknown) => {
  console.error('Falha fatal ao iniciar o aplicativo', error instanceof Error ? error.message : 'Erro desconhecido');
  app.quit();
});

app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { context?.db.close(); });
