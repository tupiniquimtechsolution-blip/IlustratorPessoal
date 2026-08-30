import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Copy, ImageIcon, Play, ShieldCheck, SlidersHorizontal, Sparkles, WandSparkles } from 'lucide-react';
import { buildStructuredPrompt, emptyPromptSections, referencesToPrompt } from '../../shared/prompt';
import type { ProcessImageInput, PromptSections, ProviderCapabilities, ProviderRunInput } from '../../shared/types';
import { useAppStore } from '../stores/app-store';

type Tab = 'criar' | 'alterar' | 'preservar' | 'estilo' | 'referencias' | 'saida' | 'provedor';

export function PromptPanel() {
  const { currentProject, selectedAsset, selectedMask, settings, styles, references, assets, reloadAssets, reloadJobs, notify } = useAppStore();
  const [tab, setTab] = useState<Tab>('criar'); const [sections, setSections] = useState<PromptSections>({ ...emptyPromptSections });
  const [manualPrompt, setManualPrompt] = useState(''); const [manual, setManual] = useState(false);
  const [provider, setProvider] = useState<'openai' | 'comfyui'>('openai'); const [model, setModel] = useState(settings?.openai.defaultModel ?? 'gpt-image-2');
  const [size, setSize] = useState('1024x1024'); const [quality, setQuality] = useState<'auto' | 'low' | 'medium' | 'high'>('auto');
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png'); const [count, setCount] = useState(1); const [background, setBackground] = useState<'auto' | 'opaque' | 'transparent'>('auto');
  const [capabilities, setCapabilities] = useState<ProviderCapabilities | null>(null); const [processing, setProcessing] = useState(false);
  const [localWidth, setLocalWidth] = useState(selectedAsset?.width ?? 1920); const [localHeight, setLocalHeight] = useState(selectedAsset?.height ?? 1080);
  const [workflow, setWorkflow] = useState<Record<string, unknown> | undefined>();
  const referenceText = useMemo(() => referencesToPrompt(references), [references]);
  const finalPrompt = manual ? manualPrompt : buildStructuredPrompt({ ...sections, references: referenceText || sections.references });
  useEffect(() => { void window.illustrator.providers.capabilities(provider, model).then((result) => { if (result.ok && result.data) setCapabilities(result.data); }); }, [model, provider]);
  useEffect(() => { if (capabilities && !capabilities.transparency && background === 'transparent') setBackground('auto'); }, [background, capabilities]);
  useEffect(() => { if (!manual) setManualPrompt(finalPrompt); }, [finalPrompt, manual]);

  const patch = (key: keyof PromptSections, value: string) => setSections((current) => ({ ...current, [key]: value }));
  const run = async () => {
    if (!currentProject || !finalPrompt.trim()) { notify({ kind: 'error', message: 'Descreva o resultado desejado.' }); return; }
    const operation = selectedAsset ? 'edit' : 'generate';
    if (operation === 'edit' && capabilities && !capabilities.imageEditing) { notify({ kind: 'error', message: 'O provedor selecionado não suporta edição.' }); return; }
    const providerName = provider === 'openai' ? 'OpenAI' : 'ComfyUI local';
    const accepted = window.confirm(`Revisão antes do envio\n\nProvedor: ${providerName}\nModelo: ${model || 'definido no workflow'}\nOperação: ${operation === 'edit' ? 'editar imagem' : 'gerar imagem'}\nResultados: ${count}\n\n${provider === 'openai' ? 'Esta ação pode gerar cobrança na sua conta da API.' : 'Os arquivos serão enviados apenas ao servidor local configurado.'}\n\nContinuar?`);
    if (!accepted) return;
    setProcessing(true);
    const input: ProviderRunInput = {
      projectId: currentProject.id, providerId: provider, operation, prompt: finalPrompt, preserve: sections.preserve,
      model: model || 'workflow-local', size, quality, format, compression: 90, background, count,
      ...(selectedAsset ? { sourceAssetId: selectedAsset.id } : {}), ...(selectedMask ? { maskAssetId: selectedMask.id } : {}),
      referenceAssetIds: references.filter((item) => item.enabled).map((item) => item.assetId), ...(workflow ? { workflow } : {}),
    };
    const result = await window.illustrator.jobs.create(input);
    setProcessing(false);
    if (result.ok) { await reloadJobs(); notify({ kind: 'success', message: 'Trabalho adicionado à fila.' }); }
    else notify({ kind: 'error', message: result.error?.message ?? 'Falha ao criar o trabalho.' });
  };
  const localProcess = async () => {
    if (!currentProject || !selectedAsset) return; setProcessing(true);
    const input: ProcessImageInput = { projectId: currentProject.id, assetId: selectedAsset.id, operation: 'resize', width: localWidth, height: localHeight, fit: 'contain', format, quality: 90, stripMetadata: true };
    const result = await window.illustrator.assets.process(input); setProcessing(false);
    if (result.ok) { await reloadAssets(); if (result.data) useAppStore.getState().selectAsset(result.data); notify({ kind: 'success', message: 'Nova revisão local criada; o original permanece intacto.' }); }
    else notify({ kind: 'error', message: result.error?.message ?? 'Falha no processamento.' });
  };
  const importWorkflow = async () => {
    const picker = document.createElement('input'); picker.type = 'file'; picker.accept = '.json,application/json';
    picker.onchange = async () => { const file = picker.files?.[0]; if (!file) return; try { setWorkflow(JSON.parse(await file.text()) as Record<string, unknown>); notify({ kind: 'success', message: 'Workflow carregado para esta execução.' }); } catch { notify({ kind: 'error', message: 'Workflow JSON inválido.' }); } };
    picker.click();
  };

  return <aside className="prompt-panel">
    <div className="prompt-heading"><div><span>CONTROLES CRIATIVOS</span><h3>Direção visual</h3></div><SlidersHorizontal size={18} /></div>
    <div className="tabs">{(['criar', 'alterar', 'preservar', 'estilo', 'referencias', 'saida', 'provedor'] as Tab[]).map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    <div className="prompt-scroll">
      {tab === 'criar' && <><Field label="Objetivo" value={sections.objective} onChange={(value) => patch('objective', value)} placeholder="Ex.: criar uma cena publicitária elegante" /><Field label="Assunto principal" value={sections.subject} onChange={(value) => patch('subject', value)} placeholder="Descreva pessoas, objetos e ações" /><Field label="Composição" value={sections.composition} onChange={(value) => patch('composition', value)} placeholder="Plano, equilíbrio e hierarquia" /><Field label="Cenário" value={sections.scene} onChange={(value) => patch('scene', value)} placeholder="Ambiente e contexto" /></>}
      {tab === 'alterar' && <><div className="section-callout change"><WandSparkles size={18} /><div><strong>Alterar</strong><p>Somente o que deve mudar.</p></div></div><Field label="Ação ou alteração" value={sections.change} onChange={(value) => patch('change', value)} placeholder="Trocar a camisa preta por uma branca…" /><Field label="Iluminação" value={sections.lighting} onChange={(value) => patch('lighting', value)} placeholder="Direção, suavidade e temperatura" /><Field label="Cores" value={sections.palette} onChange={(value) => patch('palette', value)} placeholder="Paleta e relações de cor" /></>}
      {tab === 'preservar' && <><div className="section-callout preserve"><ShieldCheck size={18} /><div><strong>Preservar exatamente</strong><p>Regras separadas das alterações.</p></div></div><Field label="Elementos protegidos" value={sections.preserve} onChange={(value) => patch('preserve', value)} placeholder="Não alterar o rosto, a pose ou o enquadramento…" /><Field label="Restrições" value={sections.restrictions} onChange={(value) => patch('restrictions', value)} placeholder="Sem texto ilegível, sem pessoas adicionais…" /><Field label="Regras anatômicas" value={sections.anatomy} onChange={(value) => patch('anatomy', value)} placeholder="Proporções naturais e mãos coerentes" /></>}
      {tab === 'estilo' && <><label className="field"><span>Preset editável</span><select value={sections.style} onChange={(event) => patch('style', event.target.value)}><option value="">Escolher estilo</option>{styles.map((style) => <option key={style.id} value={style.description}>{style.name}</option>)}</select><ChevronDown size={14} /></label><Field label="Estilo livre" value={sections.style} onChange={(value) => patch('style', value)} placeholder="Descreva qualquer linguagem visual" /><Field label="Realismo" value={sections.realism} onChange={(value) => patch('realism', value)} placeholder="Natural, estilizado, abstrato…" /><Field label="Materiais e texturas" value={sections.materials} onChange={(value) => patch('materials', value)} placeholder="Madeira, tecido, metal, papel…" /><Field label="Câmera e lente" value={sections.camera} onChange={(value) => patch('camera', value)} placeholder="Perspectiva, lente e profundidade" /></>}
      {tab === 'referencias' && <><div className="section-callout"><ImageIcon size={18} /><div><strong>{references.length} referências ativas</strong><p>Cada imagem recebe função e prioridade.</p></div></div>{assets.filter((asset) => asset.type === 'reference').map((asset, index) => <ReferenceEditor key={asset.id} assetId={asset.id} name={asset.originalName} index={index} />)}{assets.every((asset) => asset.type !== 'reference') && <p className="muted">Adicione referências no painel esquerdo.</p>}</>}
      {tab === 'saida' && <><div className="two-fields"><label className="field"><span>Largura local</span><input type="number" value={localWidth} onChange={(event) => setLocalWidth(Number(event.target.value))} /></label><label className="field"><span>Altura local</span><input type="number" value={localHeight} onChange={(event) => setLocalHeight(Number(event.target.value))} /></label></div><label className="field"><span>Formato</span><select value={format} onChange={(event) => setFormat(event.target.value as typeof format)}><option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WebP</option></select></label><button className="secondary full" disabled={!selectedAsset || processing} onClick={() => void localProcess()}>Criar revisão redimensionada</button><small className="field-help">Redimensionamento local não reconstrói detalhes por IA.</small><hr /><label className="field"><span>Dimensões da IA</span><select value={size} onChange={(event) => setSize(event.target.value)}><option>1024x1024</option><option>1536x1024</option><option>1024x1536</option>{model.startsWith('gpt-image-2') && <><option>2048x2048</option><option>3840x2160</option></>}</select></label><label className="field"><span>Qualidade</span><select value={quality} onChange={(event) => setQuality(event.target.value as typeof quality)}><option value="auto">Automática</option><option value="low">Rascunho</option><option value="medium">Média</option><option value="high">Alta</option></select></label><label className="field"><span>Variações individuais</span><input type="number" min={1} max={10} value={count} onChange={(event) => setCount(Number(event.target.value))} /></label></>}
      {tab === 'provedor' && <><label className="field"><span>Provedor</span><select value={provider} onChange={(event) => { const value = event.target.value as typeof provider; setProvider(value); setModel(value === 'openai' ? settings?.openai.defaultModel ?? 'gpt-image-2' : 'workflow-local'); }}><option value="openai">OpenAI</option><option value="comfyui">ComfyUI local</option></select></label><label className="field"><span>Modelo</span><input value={model} onChange={(event) => setModel(event.target.value)} /></label>{provider === 'comfyui' && <button className="secondary full" onClick={() => void importWorkflow()}>{workflow ? 'Workflow carregado ✓' : 'Importar workflow JSON'}</button>}<label className="field"><span>Fundo</span><select value={background} onChange={(event) => setBackground(event.target.value as typeof background)}><option value="auto">Automático</option><option value="opaque">Opaco</option><option value="transparent" disabled={!capabilities?.transparency}>Transparente {!capabilities?.transparency ? '(indisponível)' : ''}</option></select></label><div className="capability-grid">{capabilities && Object.entries({ 'Texto → imagem': capabilities.textToImage, 'Edição': capabilities.imageEditing, 'Máscara': capabilities.masks, 'Múltiplas refs.': capabilities.multiReference, 'Dimensões livres': capabilities.customDimensions, 'Cancelamento': capabilities.cancellation }).map(([label, enabled]) => <span key={label} className={enabled ? 'yes' : 'no'}>{label}</span>)}</div></>}
      <hr />
      <div className="prompt-review"><div><strong>Prompt final</strong><button onClick={() => { void navigator.clipboard.writeText(finalPrompt); notify({ kind: 'success', message: 'Prompt copiado.' }); }}><Copy size={14} />Copiar</button></div><textarea value={manual ? manualPrompt : finalPrompt} onChange={(event) => { setManual(true); setManualPrompt(event.target.value); }} placeholder="O prompt estruturado aparecerá aqui." /><label className="inline-check"><input type="checkbox" checked={manual} onChange={(event) => setManual(event.target.checked)} />Edição manual bloqueada contra atualizações automáticas</label></div>
    </div>
    <button className="run-button" disabled={processing || !finalPrompt.trim()} onClick={() => void run()}><Play size={17} fill="currentColor" />{processing ? 'Preparando…' : selectedAsset ? 'Executar edição' : 'Gerar imagem'}<Sparkles size={15} /></button>
  </aside>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="field"><span>{label}</span><textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>; }

function ReferenceEditor({ assetId, name, index }: { assetId: string; name: string; index: number }) {
  const { currentProject, references, reloadReferences, notify } = useAppStore();
  const existing = references.find((item) => item.assetId === assetId); const [role, setRole] = useState(existing?.role ?? 'general'); const [priority, setPriority] = useState(existing?.priority ?? 'medium');
  const save = async () => {
    if (!currentProject) return;
    const result = await window.illustrator.references.upsert({ projectId: currentProject.id, assetId, role, priority, notes: '', enabled: true, orderIndex: index });
    if (result.ok) { await reloadReferences(); notify({ kind: 'success', message: 'Função da referência atualizada.' }); }
  };
  return <div className="reference-editor"><strong>{name}</strong><select value={role} onChange={(event) => setRole(event.target.value as typeof role)}><option value="general">Referência geral</option><option value="identity">Personagem/identidade</option><option value="face">Rosto</option><option value="pose">Pose</option><option value="clothing">Roupa</option><option value="composition">Composição</option><option value="lighting">Iluminação</option><option value="palette">Paleta</option><option value="style">Estilo</option><option value="texture">Textura</option><option value="logo">Logo/símbolo</option></select><select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}><option value="free">Livre</option><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="maximum">Máxima</option></select><button onClick={() => void save()}>Aplicar</button></div>;
}
