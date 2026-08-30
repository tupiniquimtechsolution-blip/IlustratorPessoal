import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '../src/renderer/components/Modal';

describe('componentes acessíveis', () => {
  it('modal possui semântica e fecha pelo botão', () => {
    const close = vi.fn(); render(<Modal title="Teste" onClose={close}><p>Conteúdo</p></Modal>);
    expect(screen.getByRole('dialog', { name: 'Teste' })).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Fechar' })); expect(close).toHaveBeenCalledOnce();
  });
});
