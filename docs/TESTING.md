# Testes

## Comandos

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
```

Vitest usa JSDOM por padrão; testes de banco, arquivos, Sharp e provedores selecionam ambiente Node. A suíte atual cobre:

- CRUD e persistência de projetos.
- Inserção/detecção de duplicata de asset.
- Perfis versionados/modo estrito e estilos livres.
- Resize, conversão, compressão e preservação de alpha com Sharp.
- Montagem e separação de prompt, restrições e referências.
- Rejeição de path traversal, payload inválido e máscara excessiva.
- Sanitização de chave/base64 nos logs.
- Capacidades reais do `gpt-image-2`.
- Semântica básica de componente acessível.

Chamadas reais de API nunca fazem parte de `npm test`. O teste de conexão do aplicativo só roda após clique do usuário. Um teste ao vivo futuro deve exigir `ILLUSTRATOR_LIVE_API_TESTS=true` e confirmação explícita, sem entrar no pipeline padrão.

## Smoke test desktop

1. Execute `npm.cmd run package`.
2. Abra `out/Illustrator Studio AI-win32-x64/IllustratorStudioAI.exe`.
3. Confirme a janela, aceite a declaração de direitos, crie projeto e importe PNG/JPEG/WebP.
4. Desenhe/salve máscara, redimensione e exporte.
5. Feche/reabra e confirme persistência.
