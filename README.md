# Illustrator Studio AI

Aplicativo desktop independente para Windows que reúne organização de projetos visuais, canvas não destrutivo, máscaras, processamento local e provedores opcionais de geração/edição por IA. A interface principal está em português do Brasil e funciona sem chave de API para importação, máscaras, redimensionamento, conversão, compressão e exportação.

## Recursos implementados

- Electron Forge, React, TypeScript estrito, Tailwind CSS, Zustand, Konva e Sharp.
- Janela isolada: `nodeIntegration: false`, `contextIsolation: true`, sandbox, CSP e preload tipado mínimo.
- Projetos SQLite com migrations, assets gerenciados, SHA-256, miniaturas e revisões não destrutivas.
- Canvas com seleção, transformação, pan, zoom, grade, pincel/borracha de máscara, undo/redo e persistência.
- Motor de prompt com campos separados “Alterar” e “Preservar exatamente”, revisão manual e referências por função/prioridade.
- Perfis de Ilustrador versionados, modo estrito e biblioteca inicial de estilos descritivos.
- Processamento local em `worker_threads`: orientação EXIF, resize, conversão PNG/JPEG/WebP, compressão, nitidez, desfoque e ajustes básicos.
- Fila persistente, progresso, cancelamento, repetição explícita e recuperação de execução interrompida.
- Adapter OpenAI pelo SDK oficial, usando `gpt-image-2` como padrão configurável, e adapter ComfyUI por workflow JSON.
- Chaves protegidas por `safeStorage`; logs sanitizados e telemetria permanentemente desativada.
- Exportação de projetos `.illustratorproject`, com validação contra path traversal na importação.
- Empacotamento ASAR, Electron Fuses, Squirrel.Windows e ZIP portátil.

## Desenvolvimento

Requisitos no computador de desenvolvimento:

- Windows 10/11 x64.
- Node.js 24 e npm.
- Ferramentas de compilação C++ do Visual Studio quando um módulo nativo não tiver binário pré-compilado.

```powershell
npm.cmd install
npm.cmd start
```

O usuário final não precisa instalar Node.js, npm ou Python.

## Validação

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run package
npm.cmd run make
npm.cmd run audit:production
```

Os artefatos são gravados em `out/`. Consulte [BUILD_WINDOWS.md](docs/BUILD_WINDOWS.md) para detalhes.

## Provedores

Abra **Configurações** no aplicativo.

- OpenAI: informe a chave, confirme o endpoint HTTPS e o modelo. A chave é criptografada pelo Windows e nunca entra no SQLite.
- ComfyUI: habilite o endereço local/rede privada, teste o servidor e carregue o workflow JSON no painel do provedor antes da execução.

Nenhum teste automatizado faz chamada paga. Testes ao vivo devem ser executados manualmente e apenas com consentimento explícito.

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Modelo de dados](docs/DATA_MODEL.md)
- [Segurança](docs/SECURITY.md)
- [Provedores](docs/PROVIDERS.md)
- [Testes](docs/TESTING.md)
- [Build Windows](docs/BUILD_WINDOWS.md)
- [Manual do usuário](docs/USER_GUIDE_PT_BR.md)

## Limitações conhecidas da versão 0.1

- O editor cobre o núcleo de transformação e máscara; laço poligonal, feather morfológico, outpainting visual e comparação lado a lado ainda não possuem ferramentas dedicadas.
- O pacote de projeto reimporta originais e referências; histórico/revisões ainda não são reconstituídos no banco importado.
- O ComfyUI executa workflows prontos, mas o mapeamento visual de nós/checkpoints/LoRA ainda depende do próprio JSON.
- Builds sem certificado exibem o aviso padrão do Windows SmartScreen.
- Upscale por IA, remoção de fundo e vetorização só aparecem quando um workflow/provedor real oferecer essas capacidades; não há implementações fictícias.

## Licença

MIT para o código deste repositório. Modelos e serviços externos possuem termos próprios.
