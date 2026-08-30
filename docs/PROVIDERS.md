# Provedores

## Contrato

`src/main/providers/provider.ts` define capacidades, teste e execução. O adapter recebe caminhos somente no main e devolve buffers somente ao serviço de assets. O renderer recebe IDs/URLs internas.

## OpenAI

- SDK oficial `openai`.
- Padrão inicial configurável: `gpt-image-2`.
- `images.generate` para texto → imagem.
- `images.edit` para edição, referências e máscara.
- `AbortController` para cancelamento local; `maxRetries: 0` impede nova cobrança automática.
- Resultado base64 é decodificado imediatamente no main e nunca registrado/exposto.
- `gpt-image-2` aceita dimensões customizadas dentro dos limites documentados, mas não aceita fundo transparente. O capability adapter desabilita esse controle.
- Máscara PNG é orientação para o modelo e pode não ser seguida com precisão geométrica perfeita.

Fontes oficiais consultadas: [guia de geração de imagens](https://developers.openai.com/api/docs/guides/image-generation) e [modelo GPT Image 2](https://developers.openai.com/api/docs/models/gpt-image-2).

## ComfyUI

- Endpoint padrão sugerido: `http://127.0.0.1:8188`.
- Teste real em `/system_stats`.
- Envio de workflow em `/prompt`, polling em `/history/{prompt_id}`, download em `/view` e interrupção em `/interrupt`.
- O workflow JSON define nodes, checkpoint, VAE, LoRA, sampler, scheduler, steps, CFG, seed, upscale e remoção de fundo. A aplicação não inventa nodes ausentes.
- Endereços públicos são rejeitados; use loopback ou rede privada.

## Novo adapter

1. Implemente `ImageProvider` no main.
2. Declare somente capacidades comprovadas.
3. Normalize erros como `AppError`.
4. Não faça retry automático de operação cobrada.
5. Registre no `AppContext` e no schema apenas após existir integração real.
6. Adicione mock/testes de capacidades, cancelamento e erros permanentes/transitórios.
7. Atualize esta documentação e a UI configurável.
