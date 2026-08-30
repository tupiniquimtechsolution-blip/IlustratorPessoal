import { Eye, ImagePlus, Layers3, Link2, Lock, Plus } from 'lucide-react';
import { useAppStore } from '../stores/app-store';

export function AssetPanel() {
  const { assets, selectedAsset, selectAsset, importAssets } = useAppStore();
  return <aside className="asset-panel">
    <div className="panel-title"><div><span>PROJETO</span><h3>Assets e camadas</h3></div><button className="icon-button" onClick={() => void importAssets()} title="Importar"><Plus size={17} /></button></div>
    <div className="layer-card"><div className="layer-icon"><Layers3 size={17} /></div><div><strong>Imagem ativa</strong><small>{selectedAsset ? `${selectedAsset.width} × ${selectedAsset.height}` : 'Nenhuma imagem'}</small></div><Eye size={15} /><Lock size={14} /></div>
    <div className="asset-list">{assets.map((asset) => <button key={asset.id} className={`asset-item ${selectedAsset?.id === asset.id ? 'active' : ''}`} onClick={() => selectAsset(asset)}><img src={asset.thumbnailUrl} alt="" /><span><strong>{asset.originalName}</strong><small>{asset.type === 'original' ? 'Original protegido' : asset.type === 'mask' ? 'Máscara' : 'Revisão'}</small></span></button>)}</div>
    {assets.length === 0 && <div className="mini-empty"><ImagePlus size={24} /><p>Importe sua primeira imagem.</p><button onClick={() => void importAssets()}>Escolher arquivo</button></div>}
    <button className="reference-button" onClick={() => void importAssets('reference')}><Link2 size={16} />Adicionar referência</button>
  </aside>;
}
