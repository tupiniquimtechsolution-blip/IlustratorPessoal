# Tupiniquim — Claude Code Project Baseline

Projeto: `IlustratorPessoal`

Estas instruções são persistentes e complementam requisitos específicos do projeto. Fonte central: `tupiniquimtechsolution-blip/Tupiniquim_AI_Dev_Studio` → `docs/AI_TOOLBOX/`.

## Fluxo
- Inspecione o estado real antes de editar; não invente arquivos, dependências, testes ou infraestrutura.
- Respeite planejamento, arquitetura e critérios de aceite existentes.
- Limite mudanças ao escopo. Peça aprovação antes de exclusões, migrações irreversíveis, mudanças de dados reais/schema, force-push, publicação externa ou dependência estrutural.
- Execute checks disponíveis e registre evidências.

## Segurança
- Nunca exponha/versione secrets, tokens, cookies, senhas ou chaves privilegiadas.
- Autenticação/autorização sensíveis no servidor; valide entradas e aplique rate limiting onde houver abuso/custo.
- Avalie XSS, CSRF, injection, SSRF, path traversal e riscos específicos da stack.
- Não vaze stack traces, secrets ou dados pessoais em produção/logs.
- Revise CORS, cookies, HTTPS, headers, firewall/WAF/CDN, portas e variáveis de produção.
- Mantenha rollback/backups verificáveis quando aplicável.
- Pentest somente em alvo próprio/autorizado.

## Toolbox
UI/UX → `nextlevelbuilder/ui-ux-pro-max-skill`
Prompts → `nidhinjs/prompt-master`
Pesquisa → `Panniantong/Agent-Reach`
Pentest → `usestrix/strix`
CLI → `HKUDS/CLI-Anything`
Agentes/RAG → `Shubhamsaboo/awesome-llm-apps`
Instagram → `diwenne/openreply`
TTS → `kyutai-labs/pocket-tts`
Mídia generativa → `Anil-matcha/Open-Generative-AI`
Kimi experimental → `FareedKhan-dev/kimi-k3-in-c`

Referências externas não são dependências automáticas; valide licença, compatibilidade, manutenção, risco e necessidade.

## Entrega
Finalize com arquivos alterados, checks, riscos, referências usadas e próximo passo. Converta achados em GitHub Issues verificáveis.
