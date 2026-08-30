import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({ title, children, onClose, width = 'max-w-lg' }: { title: string; children: ReactNode; onClose: () => void; width?: string }) {
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
    <div className={`modal-card ${width}`}>
      <header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={18} /></button></header>
      <div className="modal-body">{children}</div>
    </div>
  </div>;
}
