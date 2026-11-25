import React, { useEffect, useRef, useState } from 'react';
import { Eraser, CheckCircle2 } from 'lucide-react';

interface LetterTracingCanvasProps {
  letter: string;
  onComplete?: () => void;
}

export const LetterTracingCanvas: React.FC<LetterTracingCanvasProps> = ({
  letter,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const strokeCountRef = useRef(0);
  const [strokePoints, setStrokePoints] = useState(0);
  const [completed, setCompleted] = useState(false);

  const drawGuide = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Subtle ruled baseline guides
    ctx.save();
    ctx.strokeStyle = '#E5E0D5';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(20, height * 0.22);
    ctx.lineTo(width - 20, height * 0.22);
    ctx.moveTo(20, height * 0.52);
    ctx.lineTo(width - 20, height * 0.52);
    ctx.moveTo(20, height * 0.80);
    ctx.lineTo(width - 20, height * 0.80);
    ctx.stroke();
    ctx.restore();

    // Dashed outline guide letter
    ctx.save();
    ctx.font = '800 175px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#F3EFE6';
    ctx.fillText(letter, width / 2, height * 0.53);
    ctx.strokeStyle = '#C4B5FD';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.strokeText(letter, width / 2, height * 0.53);
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    strokeCountRef.current = 0;
    setStrokePoints(0);
    setCompleted(false);
    drawGuide(ctx, canvas.width, canvas.height);
  }, [letter]);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getCoords(e);
    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#7557D9';
    ctx.lineWidth = 14;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    strokeCountRef.current += 1;
    if (strokeCountRef.current % 4 === 0) {
      setStrokePoints(strokeCountRef.current);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setStrokePoints(strokeCountRef.current);
    if (strokeCountRef.current >= 12 && !completed) {
      setCompleted(true);
      onComplete?.();
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    strokeCountRef.current = 0;
    setStrokePoints(0);
    setCompleted(false);
    drawGuide(ctx, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative rounded-3xl overflow-hidden border-2 border-[#7557D9]/25 bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          width={320}
          height={260}
          data-testid="letter-tracing-canvas"
          aria-label={`Tracing pad for letter ${letter}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="touch-none cursor-crosshair block w-[280px] sm:w-[320px] h-[228px] sm:h-[260px]"
        />
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl bg-white border border-[#302B45]/15 text-[#302B45] font-semibold text-sm hover:bg-[#FFF9EF] whitespace-nowrap shrink-0"
        >
          <Eraser className="w-4 h-4" aria-hidden="true" />
          <span>Clear Pad</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCompleted(true);
            onComplete?.();
          }}
          disabled={strokePoints < 4 && !completed}
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-2xl bg-[#56C88A] text-white font-bold text-sm hover:bg-[#49b67b] disabled:opacity-45 whitespace-nowrap shrink-0"
        >
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          <span>{completed ? 'Nicely Traced!' : 'Check My Letter'}</span>
        </button>
      </div>
    </div>
  );
};
