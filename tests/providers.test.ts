// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { OpenAIProvider } from '../src/main/providers/openai';

describe('capacidades reais do provedor OpenAI', () => {
  const provider = new OpenAIProvider({} as never, { get: () => ({ openai: { defaultModel: 'gpt-image-2' } }) } as never);
  it('não anuncia transparência nem seed no gpt-image-2', () => { const capabilities = provider.getCapabilities('gpt-image-2'); expect(capabilities.transparency).toBe(false); expect(capabilities.seed).toBe(false); });
  it('anuncia edição, máscara e múltiplas referências', () => { const capabilities = provider.getCapabilities('gpt-image-2'); expect(capabilities.imageEditing).toBe(true); expect(capabilities.masks).toBe(true); expect(capabilities.multiReference).toBe(true); });
});
