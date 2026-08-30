import type { PromptSections, ReferenceItem } from './types';

const sectionOrder: Array<[keyof PromptSections, string]> = [
  ['objective', 'OBJETIVO'],
  ['subject', 'ASSUNTO PRINCIPAL'],
  ['change', 'AÇÃO OU ALTERAÇÃO'],
  ['preserve', 'ELEMENTOS A PRESERVAR EXATAMENTE'],
  ['style', 'ESTILO VISUAL'],
  ['realism', 'NÍVEL DE REALISMO'],
  ['composition', 'COMPOSIÇÃO'],
  ['framing', 'ENQUADRAMENTO'],
  ['camera', 'CÂMERA E LENTE'],
  ['lighting', 'ILUMINAÇÃO'],
  ['palette', 'PALETA DE CORES'],
  ['materials', 'TEXTURAS E MATERIAIS'],
  ['scene', 'CENÁRIO'],
  ['anatomy', 'REGRAS ANATÔMICAS'],
  ['references', 'REFERÊNCIAS E FUNÇÕES'],
  ['restrictions', 'RESTRIÇÕES'],
  ['output', 'FORMATO DE SAÍDA'],
];

const priorityText: Record<ReferenceItem['priority'], string> = {
  free: 'liberdade criativa',
  low: 'preservação baixa',
  medium: 'preservação média',
  high: 'preservação alta',
  maximum: 'preservação máxima',
};

export function referencesToPrompt(references: ReferenceItem[]): string {
  return references
    .filter((reference) => reference.enabled)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((reference, index) => `Referência ${index + 1}: função ${reference.role}, ${priorityText[reference.priority]}${reference.notes ? `; ${reference.notes}` : ''}.`)
    .join('\n');
}

export function buildStructuredPrompt(sections: PromptSections): string {
  return sectionOrder
    .filter(([key]) => sections[key].trim().length > 0)
    .map(([key, title]) => `${title}\n${sections[key].trim()}`)
    .join('\n\n');
}

export const emptyPromptSections: PromptSections = Object.fromEntries(
  sectionOrder.map(([key]) => [key, '']),
) as unknown as PromptSections;
