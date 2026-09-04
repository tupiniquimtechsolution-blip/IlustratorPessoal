# Regras para agentes Codex

Estas regras valem para todo o repositório.

1. Preserve a separação `main` / `preload` / `renderer`. Nunca exponha Node, `ipcRenderer`, `fs`, `shell`, caminhos arbitrários ou execução de comandos ao renderer.
2. Toda entrada IPC deve ter schema Zod em `src/shared/schemas.ts`; o handler deve retornar erro público sanitizado.
3. Nunca inclua chaves, tokens, certificados, imagens base64 ou endpoints fictícios. Credenciais devem passar por `SecretStore`/`safeStorage`.
4. Não altere migrations já usadas. Crie a próxima migration numerada em `migrations/` e mantenha compatibilidade.
5. Mantenha a interface principal em português do Brasil, com labels, foco visível, contraste e navegação por teclado.
6. Toda edição de imagem deve criar um asset/revisão novo. Nunca sobrescreva o original em `originals/`.
7. Provedores são orientados a capacidades. Não mostre como disponível algo que o adapter/modelo não suporta.
8. Não faça chamada de API paga em teste automatizado. Teste ao vivo exige variável e ação manual explícitas.
9. Não registre segredos, base64 ou imagens integrais. Use `AppLogger`, que sanitiza e rotaciona o arquivo.
10. Operações de imagem pesadas devem permanecer fora do main thread, usando `ImageProcessor`/worker.
11. Preserve arquivos e mudanças do usuário. Não apague dados de projeto em update, cache clean ou desinstalação.
12. Antes de entregar, execute `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run package` e, no Windows, `npm.cmd run make`.
13. Atualize a documentação relevante quando mudar contratos, migrations, provedores, build ou limitações.
14. Use apenas assets próprios/simples e estilos descritivos; não instale presets com nomes de artistas vivos.


## Tupiniquim Multi-LLM Toolbox

As regras específicas acima permanecem prioritárias. Este `AGENTS.md` também é o contrato canônico para qualquer agente/LLM usado neste repositório.

- Skill universal: `.agents/skills/tupiniquim-toolbox/SKILL.md`.
- Fonte corporativa: `tupiniquimtechsolution-blip/Tupiniquim_AI_Dev_Studio` → `docs/AI_TOOLBOX/`.
- Adaptadores `.claude/CLAUDE.md`, `QWEN.md` e `GEMINI.md` não podem contradizer este arquivo.
- Claude, Qwen, Kimi, DeepSeek, Gemini, GPT, Grok e outros modelos recebem estas regras por meio do harness/agente.
