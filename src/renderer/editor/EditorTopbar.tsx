import { Download, FolderOpen, Redo2, Save, Undo2, Upload } from 'lucide-react';
import { useAppStore } from '../stores/app-store';

export function EditorTopbar() {
  const { currentProject, selectedAsset, settings, canvasActions, updateProject, importAssets, exportProject } = useAppStore();
  const save = () => void updateProject({ canvasState: canvasActions?.serialize() ?? '{}' });
  return <header className="editor-topbar">
    <div className="project-identity"><div className="project-glyph">IS</div><div><strong>{currentProject?.name ?? 'Sem projeto'}</strong><span><i />Salvo localmente</span></div></div>
    <div className="top-actions"><button onClick={() => void importAssets()} title="Importar (Ctrl+I)"><Upload size={16} />Importar</button><button onClick={() => selectedAsset && void window.illustrator.assets.export(selectedAsset.id)} disabled={!selectedAsset} title="Exportar imagem (Ctrl+E)"><Download size={16} />Exportar</button><button onClick={() => canvasActions?.undo()} title="Desfazer"><Undo2 size={16} /></button><button onClick={() => canvasActions?.redo()} title="Refazer"><Redo2 size={16} /></button><button onClick={save} className="primary-small" title="Salvar (Ctrl+S)"><Save size={16} />Salvar</button><button onClick={() => void exportProject()} title="Exportar projeto"><FolderOpen size={16} /></button></div>
    <div className="provider-pill"><span className={navigator.onLine ? 'online' : 'offline'} />{settings?.openai.enabled ? `OpenAI · ${settings.openai.defaultModel}` : 'Modo local'}</div>
  </header>;
}
