# Modelo de dados

O arquivo SQLite usa `node:sqlite` e fica em `userData/database/illustrator-studio-ai.sqlite`, com WAL, foreign keys e busy timeout.

- `projects`: metadados, perfil, datas e canvas serializado.
- `assets`: arquivo gerenciado, thumbnail, MIME, dimensões, hash, alpha e espaço de cor.
- `revisions`: origem, operação, prompt, preservar, parâmetros, provedor, modelo, máscara e saída.
- `project_references`: função, prioridade, observações, ordem e estado ativo.
- `illustrator_profiles`: conteúdo JSON, versão, schema, modo estrito e arquivo lógico.
- `style_presets`: nome/categoria e conteúdo JSON editável.
- `prompt_templates`: seções estruturadas e versão.
- `generation_jobs`: input/output JSON, estados, progresso, erros e tempos.
- `provider_configurations`: configuração não secreta; nunca contém a chave.
- `export_presets`: formato, qualidade, resize, alpha, metadados e padrão de nome.
- `settings`: preferências locais; telemetria é forçada para `false`.

Índices cobrem projetos recentes, assets por projeto/hash, revisões por asset/saída, referências por ordem e trabalhos por projeto/status.

## Arquivos

```text
userData/
├── database/
├── projects/{uuid}/
│   ├── originals/
│   ├── assets/
│   ├── revisions/
│   ├── references/
│   ├── masks/
│   ├── thumbnails/
│   └── manifests/
├── presets/
├── logs/
├── cache/
└── encrypted/
```

O nome original é metadado, nunca identificador. Nomes internos usam UUID e versão sanitizada do nome para diagnóstico humano.
