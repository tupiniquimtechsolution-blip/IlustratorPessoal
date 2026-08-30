import { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AppShell } from './components/AppShell';
import { Modal } from './components/Modal';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { EditorPage } from './pages/EditorPage';
import { HomePage } from './pages/HomePage';
import { JobsPage } from './pages/JobsPage';
import { LibraryPage } from './pages/LibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAppStore } from './stores/app-store';

export function App() {
  const { view, initialize, settings, saveSettings, setView, importProject, importAssets, selectedAsset, updateProject, canvasActions } = useAppStore();
  useEffect(() => { void initialize(); }, [initialize]);
  useEffect(() => {
    const theme = settings?.theme ?? 'dark';
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark); document.documentElement.classList.toggle('light', !dark);
  }, [settings?.theme]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      const ctrl = event.ctrlKey || event.metaKey;
      if (ctrl && event.key.toLowerCase() === 'n') { event.preventDefault(); const name = window.prompt('Nome do novo projeto:', 'Projeto sem título'); if (name) void useAppStore.getState().createProject(name); }
      if (ctrl && event.key.toLowerCase() === 'o') { event.preventDefault(); void importProject(); }
      if (ctrl && event.key.toLowerCase() === 's') { event.preventDefault(); void updateProject({ canvasState: canvasActions?.serialize() ?? '{}' }); }
      if (ctrl && event.key.toLowerCase() === 'i') { event.preventDefault(); void importAssets(); }
      if (ctrl && event.key.toLowerCase() === 'e' && selectedAsset) { event.preventDefault(); void window.illustrator.assets.export(selectedAsset.id); }
      if (ctrl && event.key.toLowerCase() === 'z' && !event.shiftKey) { event.preventDefault(); canvasActions?.undo(); }
      if (ctrl && event.key.toLowerCase() === 'z' && event.shiftKey) { event.preventDefault(); canvasActions?.redo(); }
      if (ctrl && event.key === '0') { event.preventDefault(); canvasActions?.fit(); }
      if (event.key === 'Escape') useAppStore.getState().setTool('select');
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [canvasActions, importAssets, importProject, selectedAsset, updateProject]);
  const page = view === 'home' ? <HomePage /> : view === 'editor' ? <EditorPage /> : view === 'jobs' ? <JobsPage /> : view === 'library' ? <LibraryPage /> : view === 'settings' ? <SettingsPage /> : <DiagnosticsPage />;
  return <AppShell>{page}{settings && !settings.rightsAcknowledged && <Modal title="Antes de começar" onClose={() => undefined}><div className="rights-modal"><span><ShieldCheck size={26} /></span><h3>Uso responsável das imagens</h3><p>Importe apenas imagens que você tenha direito de usar ou autorização para editar, especialmente fotografias de terceiros.</p><p>Arquivos só são enviados a um provedor quando você confirma uma execução; as ferramentas convencionais continuam locais.</p><button className="primary full" onClick={() => void saveSettings({ rightsAcknowledged: true }).then(() => setView('home'))}>Entendi e concordo</button></div></Modal>}</AppShell>;
}
