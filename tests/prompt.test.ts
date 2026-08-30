import { describe, expect, it } from 'vitest';
import { buildStructuredPrompt, emptyPromptSections, referencesToPrompt } from '../src/shared/prompt';

describe('motor de prompts estruturados', () => {
  it('mantém Alterar e Preservar em seções separadas', () => {
    const prompt = buildStructuredPrompt({ ...emptyPromptSections, objective: 'Editar retrato', change: 'Trocar a roupa', preserve: 'Não alterar o rosto', restrictions: 'Sem texto' });
    expect(prompt).toContain('AÇÃO OU ALTERAÇÃO\nTrocar a roupa');
    expect(prompt).toContain('ELEMENTOS A PRESERVAR EXATAMENTE\nNão alterar o rosto');
    expect(prompt.indexOf('AÇÃO OU ALTERAÇÃO')).toBeLessThan(prompt.indexOf('ELEMENTOS A PRESERVAR'));
  });
  it('omite campos vazios e preserva a ordem definida', () => {
    const prompt = buildStructuredPrompt({ ...emptyPromptSections, style: 'Aquarela', output: 'PNG' });
    expect(prompt).toBe('ESTILO VISUAL\nAquarela\n\nFORMATO DE SAÍDA\nPNG');
  });
  it('converte função e prioridade de referências em texto', () => {
    const text = referencesToPrompt([{ id: crypto.randomUUID(), projectId: crypto.randomUUID(), assetId: crypto.randomUUID(), role: 'face', priority: 'maximum', notes: 'manter expressão', enabled: true, orderIndex: 0 }]);
    expect(text).toContain('função face'); expect(text).toContain('preservação máxima'); expect(text).toContain('manter expressão');
  });
});
