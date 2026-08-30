# Build para Windows

## Requisitos

- Windows 10/11 x64.
- Node.js 24 + npm.
- Conectividade para baixar Electron/dependências na primeira execução.
- Visual Studio Build Tools com “Desktop development with C++” somente se não houver prebuild compatível.

## Comandos

```powershell
npm.cmd install
npm.cmd run icons
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run package
npm.cmd run make
```

Saídas esperadas:

- Aplicativo: `out/Illustrator Studio AI-win32-x64/`
- Setup: `out/make/squirrel.windows/x64/IllustratorStudioAISetup.exe`
- ZIP: `out/make/zip/win32/x64/Illustrator Studio AI-win32-x64-0.1.0.zip`

O pacote usa ASAR com `.node`/DLL nativos desempacotados e aplica Electron Fuses após o package.

## Assinatura digital

O repositório não contém certificado nem senha. Configure assinatura no ambiente/CI e ajuste `packagerConfig`/maker seguindo o formato do certificado adquirido. Sem assinatura, build e instalação continuam possíveis, mas o SmartScreen pode alertar.

## Atualizações

Não há endpoint de atualização configurado e a atualização automática permanece desativada. Só habilite após disponibilizar releases assinados em origem HTTPS real.

## Solução de problemas

- PowerShell bloqueia `npm.ps1`: use `npm.cmd`.
- Falha de ABI em `sharp`: remova apenas `node_modules` de desenvolvimento, execute `npm.cmd install` e refaça o package; nunca remova `userData`.
- Ícone ausente: execute `npm.cmd run icons`.
- Setup travado por antivírus: verifique log do Forge e assine o binário antes de distribuição pública.
