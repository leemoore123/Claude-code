import { useRef, useState, useEffect } from 'react';
import { IconEraser, IconCheck } from '@tabler/icons-react';

/** Minimal canvas signature pad. Emits a PNG data URL on save. */
export function SignaturePad({
  label,
  onSave,
  saved,
}: {
  label: string;
  onSave: (dataUrl: string) => void;
  saved?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0d1b2e';
  }, []);

  function pos(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function down(e: React.PointerEvent) {
    drawing.current = true;
    const ctx = ref.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = ref.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setDirty(true);
  }
  function up() {
    drawing.current = false;
  }
  function clear() {
    const c = ref.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setDirty(false);
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</label>
        {saved && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-ok">
            <IconCheck size={12} /> Signed
          </span>
        )}
      </div>
      <canvas
        ref={ref}
        width={320}
        height={90}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="w-full touch-none rounded-md border border-line bg-white"
        style={{ cursor: 'crosshair' }}
      />
      <div className="mt-1 flex gap-2">
        <button className="btn btn-outline btn-sm" onClick={clear} type="button">
          <IconEraser size={13} /> Clear
        </button>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          disabled={!dirty}
          onClick={() => onSave(ref.current!.toDataURL('image/png'))}
        >
          <IconCheck size={13} /> Save signature
        </button>
      </div>
    </div>
  );
}
