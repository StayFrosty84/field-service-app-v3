import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const RED = '#ef4444';
const MAX = 1600; // cap longest side for memory

export default function PhotoMarkup({ blob, onSave, onClose }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const shapesRef = useRef([]);
  const draftRef = useRef(null);
  const drawingRef = useRef(false);
  const [tool, setTool] = useState('box'); // box | circle | arrow
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const c = canvasRef.current;
      if (!c) return;
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      imgRef.current = img;
      setReady(true);
      redraw();
      URL.revokeObjectURL(url);
    };
    img.src = url;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  function strokeW() {
    const c = canvasRef.current;
    return Math.max(3, Math.max(c.width, c.height) / 250);
  }

  function drawShape(ctx, s) {
    ctx.strokeStyle = RED;
    ctx.lineWidth = strokeW();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const { tool: t, x0, y0, x1, y1 } = s;
    if (t === 'box') {
      ctx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
    } else if (t === 'circle') {
      ctx.beginPath();
      ctx.ellipse((x0 + x1) / 2, (y0 + y1) / 2, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (t === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      const a = Math.atan2(y1 - y0, x1 - x0);
      const head = strokeW() * 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - head * Math.cos(a - Math.PI / 6), y1 - head * Math.sin(a - Math.PI / 6));
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - head * Math.cos(a + Math.PI / 6), y1 - head * Math.sin(a + Math.PI / 6));
      ctx.stroke();
    }
  }

  function redraw() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    if (imgRef.current) ctx.drawImage(imgRef.current, 0, 0, c.width, c.height);
    for (const s of shapesRef.current) drawShape(ctx, s);
    if (draftRef.current) drawShape(ctx, draftRef.current);
  }

  function toCanvas(e) {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  }

  function down(e) {
    e.preventDefault();
    drawingRef.current = true;
    const p = toCanvas(e);
    draftRef.current = { tool, x0: p.x, y0: p.y, x1: p.x, y1: p.y };
  }
  function move(e) {
    if (!drawingRef.current) return;
    const p = toCanvas(e);
    draftRef.current = { ...draftRef.current, x1: p.x, y1: p.y };
    redraw();
  }
  function up() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (draftRef.current) shapesRef.current = [...shapesRef.current, draftRef.current];
    draftRef.current = null;
    redraw();
  }

  function undo() {
    shapesRef.current = shapesRef.current.slice(0, -1);
    redraw();
  }
  function clearAll() {
    shapesRef.current = [];
    redraw();
  }
  function save() {
    canvasRef.current.toBlob((b) => b && onSave(b), 'image/jpeg', 0.9);
  }

  return (
    <div className="markup">
      <div className="markup__bar">
        {[
          ['box', 'square'],
          ['circle', 'circle'],
          ['arrow', 'arrow-up-right'],
        ].map(([t, ico]) => (
          <button key={t} className={`btn btn--sm ${tool === t ? '' : 'btn--ghost'}`} onClick={() => setTool(t)} aria-label={t}>
            <Icon name={ico} />
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button className="btn btn--ghost btn--sm" onClick={undo} aria-label="Undo"><Icon name="rotate-ccw" /></button>
        <button className="btn btn--ghost btn--sm" onClick={clearAll} aria-label="Clear"><Icon name="trash-2" /></button>
      </div>
      <div className="markup__stage">
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          style={{ touchAction: 'none', maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>
      <div className="markup__bar">
        <button className="btn btn--ghost" onClick={onClose}><Icon name="x" /> Cancel</button>
        <span style={{ flex: 1 }} />
        <button className="btn" onClick={save} disabled={!ready}><Icon name="check" /> Save</button>
      </div>
    </div>
  );
}
