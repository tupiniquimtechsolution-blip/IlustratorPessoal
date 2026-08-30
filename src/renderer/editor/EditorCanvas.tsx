import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as KonvaImage, Layer, Line, Rect, Stage, Transformer } from 'react-konva';
import type Konva from 'konva';
import { useAppStore, type CanvasActions } from '../stores/app-store';

interface Stroke { tool: 'mask' | 'erase'; points: number[]; size: number }
interface Snapshot { strokes: Stroke[]; transform: { x: number; y: number; scaleX: number; scaleY: number; rotation: number } }

function useImage(url?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) { setImage(null); return; }
    const element = new Image(); element.onload = () => setImage(element); element.src = url;
    return () => { element.onload = null; };
  }, [url]);
  return image;
}

export function EditorCanvas() {
  const { selectedAsset, currentProject, tool, setCanvasActions, setMask, importDropped } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null); const stageRef = useRef<Konva.Stage>(null); const imageRef = useRef<Konva.Image>(null); const transformerRef = useRef<Konva.Transformer>(null);
  const [size, setSize] = useState({ width: 900, height: 700 }); const [grid, setGrid] = useState(true);
  const [strokes, setStrokes] = useState<Stroke[]>([]); const [history, setHistory] = useState<Snapshot[]>([]); const [future, setFuture] = useState<Snapshot[]>([]);
  const [transform, setTransform] = useState({ x: 100, y: 80, scaleX: 1, scaleY: 1, rotation: 0 }); const drawing = useRef(false);
  const image = useImage(selectedAsset?.url);

  const snapshot = useCallback((): Snapshot => ({ strokes: structuredClone(strokes), transform: { ...transform } }), [strokes, transform]);
  const pushHistory = useCallback(() => { setHistory((items) => [...items.slice(-49), snapshot()]); setFuture([]); }, [snapshot]);

  const fit = useCallback(() => {
    if (!selectedAsset) return;
    const scale = Math.min((size.width - 100) / selectedAsset.width, (size.height - 100) / selectedAsset.height, 1);
    setTransform({ x: (size.width - selectedAsset.width * scale) / 2, y: (size.height - selectedAsset.height * scale) / 2, scaleX: scale, scaleY: scale, rotation: 0 });
  }, [selectedAsset, size]);
  useEffect(() => { fit(); setStrokes([]); setHistory([]); setFuture([]); }, [selectedAsset?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setSize({ width: Math.floor(entry.contentRect.width), height: Math.floor(entry.contentRect.height) }); });
    observer.observe(containerRef.current); return () => observer.disconnect();
  }, []);
  useEffect(() => { if (tool === 'select' && imageRef.current && transformerRef.current) { transformerRef.current.nodes([imageRef.current]); transformerRef.current.getLayer()?.batchDraw(); } }, [tool, image]);

  const undo = useCallback(() => {
    const previous = history.at(-1); if (!previous) return;
    setFuture((items) => [snapshot(), ...items]); setHistory((items) => items.slice(0, -1)); setStrokes(previous.strokes); setTransform(previous.transform);
  }, [history, snapshot]);
  const redo = useCallback(() => {
    const next = future[0]; if (!next) return;
    setHistory((items) => [...items, snapshot()]); setFuture((items) => items.slice(1)); setStrokes(next.strokes); setTransform(next.transform);
  }, [future, snapshot]);
  const zoom = useCallback((delta: number) => setTransform((value) => ({ ...value, scaleX: Math.max(.05, Math.min(8, value.scaleX * (1 + delta))), scaleY: Math.max(.05, Math.min(8, value.scaleY * (1 + delta))) })), []);
  const saveMask = useCallback(async () => {
    if (!selectedAsset || !currentProject || strokes.length === 0) return;
    const canvas = document.createElement('canvas'); canvas.width = size.width; canvas.height = size.height;
    const context = canvas.getContext('2d'); if (!context) return;
    context.fillStyle = '#000'; context.fillRect(0, 0, canvas.width, canvas.height); context.lineCap = 'round'; context.lineJoin = 'round';
    for (const stroke of strokes) {
      context.globalCompositeOperation = stroke.tool === 'erase' ? 'source-over' : 'destination-out';
      context.strokeStyle = stroke.tool === 'erase' ? '#000' : '#fff'; context.lineWidth = stroke.size; context.beginPath();
      for (let index = 0; index < stroke.points.length; index += 2) { const x = stroke.points[index] ?? 0; const y = stroke.points[index + 1] ?? 0; if (index === 0) context.moveTo(x, y); else context.lineTo(x, y); }
      context.stroke();
    }
    const result = await window.illustrator.masks.save(currentProject.id, selectedAsset.id, canvas.toDataURL('image/png'));
    if (result.ok && result.data) { setMask(result.data); useAppStore.getState().notify({ kind: 'success', message: 'Máscara salva como asset separado.' }); }
    else useAppStore.getState().notify({ kind: 'error', message: result.error?.message ?? 'Falha ao salvar máscara.' });
  }, [currentProject, selectedAsset, setMask, size, strokes]);
  const actions = useMemo<CanvasActions>(() => ({ undo, redo, fit, zoom, clearMask: () => { pushHistory(); setStrokes([]); }, saveMask, serialize: () => JSON.stringify({ strokes, transform }) }), [fit, pushHistory, redo, saveMask, strokes, transform, undo, zoom]);
  useEffect(() => { setCanvasActions(actions); return () => setCanvasActions(null); }, [actions, setCanvasActions]);

  const pointer = () => stageRef.current?.getPointerPosition();
  const startDrawing = () => {
    if (tool !== 'mask' && tool !== 'erase' && tool !== 'rectangle') return;
    const point = pointer(); if (!point) return; pushHistory(); drawing.current = true;
    setStrokes((items) => [...items, { tool: tool === 'erase' ? 'erase' : 'mask', points: [point.x, point.y], size: tool === 'rectangle' ? 80 : 34 }]);
  };
  const draw = () => {
    if (!drawing.current || (tool !== 'mask' && tool !== 'erase' && tool !== 'rectangle')) return;
    const point = pointer(); if (!point) return;
    setStrokes((items) => { const next = [...items]; const current = next.at(-1); if (!current) return items; next[next.length - 1] = { ...current, points: [...current.points, point.x, point.y] }; return next; });
  };

  return <div ref={containerRef} className="canvas-wrap" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void importDropped(Array.from(event.dataTransfer.files)); }}>
    {!selectedAsset && <div className="canvas-empty"><div className="empty-orb" /><h3>Seu canvas está pronto</h3><p>Importe uma imagem ou gere um novo visual.</p><button className="primary" onClick={() => void useAppStore.getState().importAssets()}>Importar imagem</button></div>}
    <Stage ref={stageRef} width={size.width} height={size.height} onMouseDown={startDrawing} onMousemove={draw} onMouseup={() => { drawing.current = false; }} onWheel={(event) => { event.evt.preventDefault(); zoom(event.evt.deltaY > 0 ? -.08 : .08); }}>
      <Layer listening={false}>{grid && Array.from({ length: Math.ceil(size.width / 40) }).map((_, index) => <Line key={`v${index}`} points={[index * 40, 0, index * 40, size.height]} stroke="#252a34" strokeWidth={1} />)}{grid && Array.from({ length: Math.ceil(size.height / 40) }).map((_, index) => <Line key={`h${index}`} points={[0, index * 40, size.width, index * 40]} stroke="#252a34" strokeWidth={1} />)}</Layer>
      <Layer>{image && selectedAsset && <KonvaImage ref={imageRef} image={image} width={selectedAsset.width} height={selectedAsset.height} {...transform} draggable={tool === 'move' || tool === 'select'} onDragStart={pushHistory} onDragEnd={(event) => setTransform((value) => ({ ...value, x: event.target.x(), y: event.target.y() }))} onTransformStart={pushHistory} onTransformEnd={() => { const node = imageRef.current; if (node) setTransform({ x: node.x(), y: node.y(), scaleX: node.scaleX(), scaleY: node.scaleY(), rotation: node.rotation() }); }} />}{tool === 'select' && image && <Transformer ref={transformerRef} rotateEnabled keepRatio />}</Layer>
      <Layer listening={false} opacity={.62}>{strokes.map((stroke, index) => <Line key={index} points={stroke.points} stroke={stroke.tool === 'erase' ? '#ff6b85' : '#4ed5df'} strokeWidth={stroke.size} lineCap="round" lineJoin="round" globalCompositeOperation={stroke.tool === 'erase' ? 'destination-out' : 'source-over'} />)}</Layer>
      <Layer><Rect x={12} y={12} width={110} height={30} fill="#111318cc" cornerRadius={8} /><Line points={[26, 27, 42, 27]} stroke="#4ed5df" strokeWidth={3} /></Layer>
    </Stage>
    <button className="grid-toggle" onClick={() => setGrid((value) => !value)}>{grid ? 'Ocultar grade' : 'Mostrar grade'}</button>
  </div>;
}
