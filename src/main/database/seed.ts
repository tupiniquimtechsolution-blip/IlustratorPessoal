import type { DatabaseSync } from 'node:sqlite';

const styles: Array<[string, string, string]> = [
  ['Fotográfico natural', 'Fotografia', 'Luz natural, cores equilibradas, textura realista e acabamento sem exageros.'],
  ['Fotográfico publicitário', 'Fotografia', 'Iluminação controlada, produto bem definido, acabamento premium e composição comercial.'],
  ['Cinematográfico', 'Fotografia', 'Luz narrativa, profundidade atmosférica, enquadramento cinematográfico e gradação de cor.'],
  ['Semi-realista 3D', '3D', 'Volumes tridimensionais, materiais detalhados e proporções naturais estilizadas.'],
  ['Semi-realista 2.5D', '3D', 'Ilustração em camadas, volume suave e acabamento digital semi-realista.'],
  ['Cartoon moderno', 'Ilustração', 'Formas expressivas, contornos limpos e paleta contemporânea.'],
  ['Cartoon editorial', 'Ilustração', 'Síntese visual, gesto expressivo e composição adequada a publicação.'],
  ['Aquarela', 'Pintura', 'Pigmento translúcido, bordas orgânicas e textura de papel.'],
  ['Guache', 'Pintura', 'Pigmento opaco, formas gráficas e textura manual.'],
  ['Pintura a óleo', 'Pintura', 'Pinceladas visíveis, mistura rica de cor e profundidade pictórica.'],
  ['Desenho a lápis', 'Desenho', 'Grafite, hachuras, gradação tonal e textura de papel.'],
  ['Tinta e nanquim', 'Desenho', 'Traço de tinta, contraste alto e hachuras controladas.'],
  ['Vetor minimalista', 'Vetor', 'Poucas formas geométricas, hierarquia clara e cores sólidas.'],
  ['Flat design', 'Vetor', 'Formas planas, paleta coesa e leitura imediata.'],
  ['Low-poly', '3D', 'Geometria facetada, planos de cor e silhueta forte.'],
  ['Pixel art', 'Digital', 'Grade de pixels deliberada, paleta limitada e bordas nítidas.'],
  ['Concept art', 'Digital', 'Exploração visual narrativa, atmosfera e design funcional.'],
  ['Fantasia', 'Temático', 'Ambientação fantástica, detalhes imaginativos e atmosfera épica.'],
  ['Ficção científica', 'Temático', 'Tecnologia plausível, materiais avançados e design futurista.'],
  ['Ilustração infantil', 'Editorial', 'Formas acolhedoras, narrativa clara e cores amigáveis.'],
  ['Ilustração educacional', 'Editorial', 'Clareza didática, hierarquia visual e elementos legíveis.'],
  ['Ilustração técnica', 'Técnico', 'Precisão estrutural, vistas claras e detalhes funcionais.'],
  ['Blueprint', 'Técnico', 'Linhas técnicas claras sobre fundo azul, cotas e anotações organizadas.'],
  ['Excalidraw claro', 'Diagrama', 'Traço manual simples, fundo claro e diagrama legível.'],
  ['Excalidraw escuro', 'Diagrama', 'Traço manual claro, fundo escuro e diagrama legível.'],
  ['Ícone de aplicativo', 'Identidade', 'Símbolo compacto, silhueta memorável e leitura em tamanhos pequenos.'],
  ['Logo vetorial', 'Identidade', 'Marca simples, geometria reproduzível e contraste funcional.'],
  ['Render de produto', 'Produto', 'Geometria precisa, materiais realistas e iluminação de estúdio.'],
  ['Mockup publicitário', 'Produto', 'Aplicação contextual, composição comercial e foco na apresentação.'],
];

export function seedDefaults(db: DatabaseSync): void {
  const now = new Date().toISOString();
  const insertStyle = db.prepare('INSERT OR IGNORE INTO style_presets(id,name,category,content_json,created_at,updated_at) VALUES(?,?,?,?,?,?)');
  const seed = () => {
    db.exec('BEGIN IMMEDIATE');
    try {
    for (const [name, category, description] of styles) insertStyle.run(crypto.randomUUID(), name, category, JSON.stringify({ description }), now, now);
    const preset = db.prepare('INSERT OR IGNORE INTO export_presets(id,name,format,quality,width,height,resize_mode,preserve_alpha,strip_metadata,filename_pattern) VALUES(?,?,?,?,?,?,?,?,?,?)');
    const exportPresets: Array<[string, string, number, number | null, number | null, string, number, number]> = [
      ['Original', 'png', 100, null, null, 'inside', 1, 0], ['PNG transparente', 'png', 100, null, null, 'inside', 1, 1],
      ['JPEG alta qualidade', 'jpeg', 92, null, null, 'inside', 0, 1], ['Web otimizado', 'webp', 82, 1920, null, 'inside', 1, 1],
      ['Instagram quadrado', 'jpeg', 90, 1080, 1080, 'cover', 0, 1], ['Reels e Stories 9:16', 'jpeg', 90, 1080, 1920, 'cover', 0, 1],
      ['Full HD', 'jpeg', 92, 1920, 1080, 'contain', 0, 1], ['UHD 4K (redimensionamento)', 'jpeg', 92, 3840, 2160, 'contain', 0, 1],
    ];
    exportPresets.forEach(([name, format, quality, width, height, mode, alpha, strip]) => preset.run(crypto.randomUUID(), name, format, quality, width, height, mode, alpha, strip, '{project}_{operation}_{date}_{sequence}'));
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  };
  seed();
}
