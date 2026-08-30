import { Clipboard, Database, FolderOpen, HardDrive, RefreshCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Diagnostics } from '../../shared/types';
import { useAppStore } from '../stores/app-store';
import { PageTitle } from './JobsPage';

export function DiagnosticsPage() {
  const [data, setData] = useState<Diagnostics | null>(null); const { notify } = useAppStore();
  const load = async () => { const result = await window.illustrator.diagnostics.get(); if (result.ok && result.data) setData(result.data); };
  useEffect(() => { void load(); }, []);
  return <div className="content-page"><PageTitle eyebrow="SUPORTE LOCAL" title="Diagnóstico" text="O relatório não inclui chaves, imagens completas ou conteúdo em base64." />{data && <div className="diagnostic-grid"><Diag icon={Database} label="Banco de dados" value={data.database === 'ok' ? 'Saudável' : 'Erro'} /><Diag icon={HardDrive} label="Espaço livre" value={data.freeBytes === null ? 'Indisponível' : `${(data.freeBytes / 1024 ** 3).toFixed(1)} GB`} /><Diag icon={RefreshCcw} label="Aplicativo" value={`v${data.version} · ${data.architecture}`} /></div>}<section className="diagnostic-card"><h2>Diretórios</h2><dl><dt>Dados do aplicativo</dt><dd>{data?.dataPath}</dd><dt>Log sanitizado</dt><dd>{data?.logPath}</dd><dt>Sistema</dt><dd>{data?.platform}</dd></dl><div className="setting-actions"><button className="secondary" onClick={() => void window.illustrator.diagnostics.openLogs()}><FolderOpen size={15} />Abrir log</button><button className="secondary" onClick={() => { if (data) void navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => notify({ kind: 'success', message: 'Relatório sanitizado copiado.' })); }}><Clipboard size={15} />Copiar relatório</button><button className="danger" onClick={() => { if (window.confirm('Limpar os logs locais?')) void window.illustrator.diagnostics.clearLogs().then(() => notify({ kind: 'success', message: 'Logs limpos.' })); }}><Trash2 size={15} />Limpar logs</button></div></section></div>;
}
function Diag({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) { return <div><Icon size={20} /><span>{label}</span><strong>{value}</strong></div>; }
