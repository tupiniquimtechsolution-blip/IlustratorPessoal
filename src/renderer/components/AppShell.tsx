import { Activity, Brush, FolderKanban, Home, Library, Settings, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAppStore, type AppView } from '../stores/app-store';

const items: Array<[AppView, string, typeof Home]> = [
  ['home', 'Início', Home], ['editor', 'Estúdio', Brush], ['jobs', 'Trabalhos', Activity],
  ['library', 'Biblioteca', Library], ['settings', 'Configurações', Settings], ['diagnostics', 'Diagnóstico', FolderKanban],
];

export function AppShell({ children }: { children: ReactNode }) {
  const { view, setView, currentProject, notification, notify, loading } = useAppStore();
  return <div className="app-shell">
    <aside className="rail">
      <div className="brand-mark"><Sparkles size={22} /><span>IS</span></div>
      <nav aria-label="Navegação principal">{items.map(([id, label, Icon]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)} disabled={id === 'editor' && !currentProject} title={label}><Icon size={19} /><span>{label}</span></button>)}</nav>
      <div className="rail-status"><span className="status-dot" />Local</div>
    </aside>
    <main className="app-main">{children}</main>
    {loading && <div className="loading-bar" aria-label="Carregando" />}
    {notification && <button className={`toast ${notification.kind}`} onClick={() => notify(null)}>{notification.message}</button>}
  </div>;
}
