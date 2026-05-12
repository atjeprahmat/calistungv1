
import React, { useRef, useEffect, useState } from 'react';
import { speak, playSound } from '../utils/audio';

interface CanvasTracingProps {
  character: string;
  onFinish: (score: number) => void;
  color?: string;
  size?: number;
}

export default function CanvasTracing({ character, onFinish, color = '#4F46E5', size = 400 }: CanvasTracingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{x: number, y: number}[]>([]);

  const [currentColor, setCurrentColor] = useState(color);

  const colors = [
    { name: 'pink', value: '#F472B6' },
    { name: 'blue', value: '#60A5FA' },
    { name: 'green', value: '#34D399' },
    { name: 'orange', value: '#FB923C' },
    { name: 'purple', value: '#A78BFA' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // We only reset the template when the character changes
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, size, size);
    
    ctx.font = `bold ${size * 0.7}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Solid light background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillText(character, size / 2, size / 2);
    
    // Dashed outline template
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d1d5db';
    ctx.strokeText(character, size / 2, size / 2);
    
    // Reset for drawing
    ctx.setLineDash([]);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = size * 0.06;
    ctx.strokeStyle = currentColor;
  }, [character, size]);

  // Update strokeStyle when currentColor changes without clearing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = currentColor;
  }, [currentColor]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    setPoints([pos]);
    draw(pos.x, pos.y);
    playSound('brush');
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleFinish = () => {
    if (points.length < 10) {
      speak("Ayo gambar dulu ya!");
      return;
    }
    onFinish(100);
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.beginPath();
    const lastPoint = points[points.length - 1];
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Play brush sound periodically
    if (points.length % 3 === 0) {
      playSound('brush');
    }
    
    setPoints(prev => [...prev, { x, y }]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDrawing) {
      const pos = getPos(e);
      draw(pos.x, pos.y);
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-[40px] cursor-crosshair shadow-2xl touch-none bg-white border-8 border-blue-50"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={handleMove}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={handleMove}
        />
        
        {/* Color Palette */}
        <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 md:gap-3 bg-white/90 backdrop-blur p-2 md:p-3 rounded-full shadow-xl border-2 border-blue-50">
          {colors.map(c => (
            <button
              key={c.name}
              onClick={() => {
                setCurrentColor(c.value);
                playSound('pop');
              }}
              className={`w-6 h-6 md:w-8 md:h-8 rounded-full transition-all ${currentColor === c.value ? 'ring-2 md:ring-4 ring-blue-200 scale-110 md:scale-125' : 'hover:scale-110'}`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button 
            onClick={() => {
              const ctx = canvasRef.current?.getContext('2d');
              if (ctx) {
                ctx.clearRect(0,0, size, size);
                ctx.fillStyle = '#f3f4f6';
                ctx.fillRect(0, 0, size, size);
                ctx.font = `bold ${size * 0.7}px "Inter", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Solid light background
                ctx.fillStyle = '#f3f4f6';
                ctx.fillText(character, size / 2, size / 2);

                // Dashed outline template
                ctx.setLineDash([10, 10]);
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#d1d5db';
                ctx.strokeText(character, size / 2, size / 2);

                // Reset for drawing
                ctx.setLineDash([]);
              }
              setPoints([]);
            }}
            className="p-2 md:p-3 bg-white/90 backdrop-blur rounded-xl md:rounded-2xl shadow-lg text-red-500 hover:bg-red-50 transition-colors border-2 border-red-100"
            title="Hapus"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2 md:w-6 md:h-6"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 w-full">
        <button 
          onClick={handleFinish}
          className="w-full max-w-sm bg-green-500 hover:bg-green-400 text-white font-black py-5 rounded-[28px] shadow-2xl border-b-8 border-green-700 transition-all active:border-b-0 active:translate-y-2 text-xl tracking-tighter italic flex items-center justify-center gap-4 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-125 transition-transform"><polyline points="20 6 9 17 4 12"/></svg>
          KOREKSI & LANJUT
        </button>
        
        <div className="flex items-center gap-3 text-blue-900/40 font-black italic uppercase tracking-widest text-[10px]">
          <span className="w-6 h-[1px] bg-blue-100"></span>
          Sudah selesai menggambar?
          <span className="w-6 h-[1px] bg-blue-100"></span>
        </div>
      </div>
    </div>
  );
}
