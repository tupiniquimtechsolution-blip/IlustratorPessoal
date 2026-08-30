import { Brush, Eraser, Frame, Hand, Maximize, MousePointer2, Redo2, Save, Search, Trash2, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import { useAppStore, type EditorTool } from '../stores/app-store';

const tools: Array<[EditorTool, string, typeof Brush]> = [
  ['select', 'Selecionar', MousePointer2], ['move', 'Mover imagem', Hand], ['mask', 'Pincel de máscara', Brush], ['erase', 'Borracha de máscara', Eraser], ['rectangle', 'Seleção retangular', Frame],
];

export function ToolRail() {
  const { tool, setTool, canvasActions } = useAppStore();
  return <aside className="tool-rail" aria-label="Ferramentas do canvas">
    {tools.map(([id, label, Icon]) => <button key={id} className={tool === id ? 'active' : ''} onClick={() => setTool(id)} title={label}><Icon size={18} /></button>)}
    <span className="tool-separator" />
    <button onClick={() => canvasActions?.undo()} title="Desfazer"><Undo2 size={18} /></button><button onClick={() => canvasActions?.redo()} title="Refazer"><Redo2 size={18} /></button>
    <button onClick={() => canvasActions?.zoom(.15)} title="Aumentar zoom"><ZoomIn size={18} /></button><button onClick={() => canvasActions?.zoom(-.15)} title="Reduzir zoom"><ZoomOut size={18} /></button>
    <button onClick={() => canvasActions?.fit()} title="Ajustar à tela"><Maximize size={18} /></button><button onClick={() => void canvasActions?.saveMask()} title="Salvar máscara"><Save size={18} /></button>
    <button onClick={() => canvasActions?.clearMask()} title="Limpar máscara"><Trash2 size={18} /></button><button onClick={() => useAppStore.getState().notify({ kind: 'info', message: 'Use a roda do mouse para zoom fluido.' })} title="Ajuda do zoom"><Search size={18} /></button>
  </aside>;
}
