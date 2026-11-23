/**
 * DOODL Daily Doodle Solo 60-Second Challenge Page
 */

import React, { useState, useRef, useEffect } from 'react';
import { CanvasEngine } from '../drawing/renderer';
import { DrawingToolbar } from '../components/DrawingToolbar';
import type { DrawingTool } from '@shared/game-types';

export const Daily: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);

  const [activeTool, setActiveTool] = useState<DrawingTool>('pencil');
  const [activeColor, setActiveColor] = useState<string>('#202638');
  const [activeSize, setActiveSize] = useState<number>(7);
  const [activeSticker, setActiveSticker] = useState<string>('⭐');

  const [promptWord] = useState('Sunflower');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new CanvasEngine(canvasRef.current);
    engine.setInteractive(true);
    engineRef.current = engine;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCompleted(true);
          engine.setInteractive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleDownload = () => {
    if (!engineRef.current) return;
    const pngUrl = engineRef.current.exportPNG();
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `doodl-daily-${promptWord.toLowerCase()}.png`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#e8e5de] pb-4">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="text-xs font-bold text-[#707687] hover:text-[#1f2330] mb-1"
          >
            ← Back to Home
          </button>
          <h1 className="font-head font-extrabold text-3xl text-[#1f2330]">
            Daily Doodle Challenge
          </h1>
          <p className="text-xs text-[#707687]">
            Today's UTC Prompt: <strong className="text-[#fd7259]">{promptWord}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#e5e3de] flex items-center justify-center font-head font-black text-xl text-[#fd7259] shadow-sm">
            {timeLeft}s
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e9e7e2] rounded-t-2xl overflow-hidden aspect-[16/10] relative">
        <canvas ref={canvasRef} className="w-full h-full block touch-none" />

        {isCompleted && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 text-center max-w-sm space-y-3 shadow-2xl">
              <span className="text-4xl block">🎉</span>
              <h3 className="font-head font-extrabold text-2xl text-[#1f2330]">Time's Up!</h3>
              <p className="text-xs text-[#707687]">
                You completed today's Daily Doodle challenge! +100 XP awarded to your local streak.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 bg-[#fd7259] text-white py-2.5 rounded-xl font-bold text-xs"
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="px-4 bg-[#f4f2ee] text-[#1f2330] py-2.5 rounded-xl font-bold text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <DrawingToolbar
        activeTool={activeTool}
        activeColor={activeColor}
        activeSize={activeSize}
        activeSticker={activeSticker}
        canUndo={true}
        canRedo={true}
        onSelectTool={setActiveTool}
        onSelectColor={setActiveColor}
        onSelectSize={setActiveSize}
        onSelectSticker={setActiveSticker}
        onUndo={() => {}}
        onRedo={() => {}}
        onClear={() => engineRef.current?.clear()}
        disabled={isCompleted}
      />
    </div>
  );
};
