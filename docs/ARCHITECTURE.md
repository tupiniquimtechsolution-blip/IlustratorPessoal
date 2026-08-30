# Arquitetura

## Visão geral

```text
React + Konva (sandbox)
        │ API tipada por domínio
        ▼
Preload + contextBridge
        │ IPC validado com Zod
        ▼
Electron main
  ├── repositórios node:sqlite / migrations
  ├── armazenamento gerenciado / protocolo illustrator://
  ├── fila persistente / AbortController
  ├── safeStorage / logs sanitizados
  ├── OpenAI SDK / ComfyUI HTTP local
  └── worker_threads ── Sharp
```

## Processos

O renderer só cuida de interface, canvas, formulários e previews. Ele não recebe caminhos gerenciados nem conteúdo base64 de resultados. Imagens são exibidas por URLs `illustrator://asset/{id}`, resolvidas no main após consulta ao banco e validação de confinamento.

O preload expõe `window.illustrator` dividido em projetos, assets, máscaras, referências, jobs, providers, settings, secrets, profiles, styles e diagnostics. Ele não expõe primitivas Node.

O main cria a janela segura, registra CSP/navegação/protocolo, valida IPC, administra arquivos e banco, executa provedores e coordena a fila. Sharp roda em worker dedicado para não bloquear eventos da janela.

## Fluxo de importação

1. Usuário seleciona ou arrasta arquivo.
2. Main valida tamanho e assinatura MIME real.
3. Calcula SHA-256 e consulta duplicatas no projeto.
4. Copia bytes originais de forma atômica para `originals/` ou `references/`.
5. Sharp lê metadados e cria thumbnail WebP separada.
6. Repositório insere o asset e o renderer recebe apenas metadados/URL interna.

## Fluxo de edição

1. Canvas cria máscara visual e a envia apenas na ação “Salvar máscara”.
2. Main normaliza máscara PNG para as dimensões do asset e salva como asset separado.
3. Prompt estruturado mantém “Alterar” e “Preservar” em seções distintas.
4. Confirmação informa provedor, modelo, quantidade e possível cobrança.
5. Fila persiste input antes de executar.
6. Resultado vira arquivo gerenciado, asset e revisão; o original não muda.

## Fila

Estados persistidos: `queued`, `validating`, `preparing`, `sending`, `processing`, `receiving`, `saving`, `completed`, `cancelled` e `failed`. Um trabalho que estava ativo no encerramento é marcado como falha recuperável no próximo início. Repetição é sempre ação explícita.

## Extensibilidade

Adapters implementam `ImageProvider`. A interface consulta `ProviderCapabilities`, por isso novos provedores podem ser adicionados sem espalhar parâmetros específicos pela UI.
