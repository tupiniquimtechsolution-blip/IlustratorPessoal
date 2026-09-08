# Security Policy

A política técnica detalhada deste projeto está em [docs/SECURITY.md](docs/SECURITY.md). As regras obrigatórias para agentes estão em `AGENTS.md`.

## Reporte responsável
Não publique credenciais, tokens, arquivos privados, imagens/base64 sensíveis ou detalhes exploráveis em issues públicas. Use canal privado com o proprietário.

## Testes autorizados
Pentest apenas em sistemas próprios/autorizados. Testes automatizados não devem realizar chamadas pagas nem expor segredos.

## Controles essenciais
Preservar isolamento Electron, IPC validado, safeStorage para credenciais, logs sanitizados, importação segura contra path traversal e processamento pesado fora do main thread.
