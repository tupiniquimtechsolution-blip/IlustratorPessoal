# Segurança

## Ameaças consideradas

- Renderer comprometido tentando acessar Node, arquivos ou credenciais.
- Payload IPC malformado ou grande demais.
- Arquivo disfarçado por extensão, imagem corrompida e decompression bomb.
- Path traversal em pacote de projeto.
- Exfiltração de chave por banco, log ou erro.
- Navegação/janela remota inesperada e pedidos de permissão.
- SSRF pelo endpoint “local” do ComfyUI.

## Controles

- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `webSecurity: true`.
- CSP com `object-src 'none'`, `frame-src 'none'`, `base-uri 'none'` e conteúdo remoto ausente.
- Navegação bloqueada; novas janelas sempre negadas. Somente links HTTPS explícitos podem abrir no navegador externo.
- Todas as permissões da sessão são negadas por padrão.
- Preload pequeno e tipado; sem `ipcRenderer`, `fs`, `shell`, `require` ou caminho arbitrário.
- Zod valida todos os canais, IDs, tamanhos, URLs, contagem e estruturas.
- MIME validado por magic bytes; Sharp limita pixels; importação limita 100 MB.
- Caminhos gerenciados são conferidos com `path.relative`; ZIP rejeita `/`, drive letter e segmento `..`.
- Manifests/segredos/máscaras usam escrita atômica.
- Chave OpenAI é cifrada com `safeStorage`; só o blob fica em `encrypted/`, fora do SQLite.
- Logger remove padrões de token, campos de autorização e data URLs; rotação em 5 MB.
- ComfyUI aceita apenas loopback ou rede privada.
- Telemetria é desativada e não existe pipeline de coleta.
- Electron Fuses desabilitam RunAsNode, NODE_OPTIONS e inspect, exigem ASAR e integridade.

## Atualizações e assinatura

Atualização automática está desativada até existir origem real assinada. A configuração de assinatura é externa; nenhum certificado ou senha acompanha o repositório. Builds locais sem assinatura são permitidos e exibem o aviso normal do Windows.
