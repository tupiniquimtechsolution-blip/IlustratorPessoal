# Guia do usuário

## Primeiro início

Leia e aceite a declaração de direitos de uso. O aplicativo não envia telemetria. Projetos ficam na pasta local de dados do aplicativo.

## Criar e editar

1. Clique em **Novo projeto**.
2. No Estúdio, clique em **Importar** ou arraste PNG/JPEG/WebP ao canvas.
3. Use Selecionar/Mover para transformar a imagem; roda do mouse controla zoom.
4. Use Pincel/Borracha/Retângulo para a máscara e clique no ícone Salvar máscara. Ela vira um asset separado.
5. Em **Alterar**, descreva somente mudanças. Em **Preservar**, liste o que não pode mudar.
6. Revise o prompt final. Uma edição manual pode ser bloqueada contra recomposição automática.
7. Selecione provedor/modelo/saída e clique **Executar edição**. A confirmação mostra destino dos arquivos e possível cobrança.

## Edição local/offline

Na aba **Saída**, defina largura, altura e formato e escolha **Criar revisão redimensionada**. Isso usa Sharp localmente, preserva o original e não reconstrói detalhes por IA. “3840 × 2160” por interpolação não equivale a upscale/restauração por IA.

## Referências

Use **Adicionar referência**, abra a aba Referências e escolha função (rosto, pose, roupa, iluminação, paleta etc.) e preservação. Quando o provedor não tiver peso numérico, essa prioridade entra como instrução textual.

## OpenAI

Em **Configurações**, salve chave/endpoint/modelo e teste a conexão. A chave é criptografada pelo Windows. `gpt-image-2` não oferece fundo transparente; o controle fica indisponível para evitar promessa incorreta.

## ComfyUI

Habilite o endereço local, teste, selecione ComfyUI no editor e importe um workflow JSON. O aplicativo executa os nodes existentes; não cria checkpoint, LoRA ou node ausente.

## Atalhos

- `Ctrl+N`: novo projeto.
- `Ctrl+O`: importar/abrir pacote.
- `Ctrl+S`: salvar canvas.
- `Ctrl+Z` / `Ctrl+Shift+Z`: desfazer/refazer.
- `Ctrl+I`: importar imagem.
- `Ctrl+E`: exportar imagem ativa.
- `Ctrl+0`: ajustar à tela.
- `Esc`: voltar à seleção.

## Diagnóstico

A tela mostra versão, arquitetura, banco, espaço e caminhos. É possível abrir/limpar o log e copiar um relatório sanitizado. Ele não contém chave ou imagem integral.
