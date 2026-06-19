/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Undo2, 
  Trash2, 
  Download, 
  Brush, 
  PaintBucket, 
  Eraser, 
  Volume2, 
  VolumeX, 
  Check, 
  Upload,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sfx } from './utils/audio';
import { performFloodFill } from './utils/floodFill';

// 16 child-friendly, super expressive color palette with child-oriented Arabic names
interface ColorItem {
  hex: string;
  nameAr: string;
}

const colorPalette: ColorItem[] = [
  { hex: '#C0392B', nameAr: 'أحمر الكرز اللطيف 🍒' },
  { hex: '#E67E22', nameAr: 'برتقالي مشرق لذيذ 🍊' },
  { hex: '#F1C40F', nameAr: 'أصفر مشمس متألق ☀️' },
  { hex: '#2ECC71', nameAr: 'أخضر فستقي نضر 🌳' },
  { hex: '#1ABC9C', nameAr: 'فيروزي بحري رائع 🌊' },
  { hex: '#3498DB', nameAr: 'أزرق سماوي لطيف ☁️' },
  { hex: '#9B59B6', nameAr: 'بنفسجي السكر الحلو 🔮' },
  { hex: '#E91E63', nameAr: 'وردي الفراولة الزاهية 🍓' },
  { hex: '#1C2833', nameAr: 'أسود فحمي كحلي 🌌' },
  { hex: '#5D6D7E', nameAr: 'فضي السحاب الأنيق ☁️' },
  { hex: '#935116', nameAr: 'بني الشوكولاتة الدافئة 🍫' },
  { hex: '#F5CBA7', nameAr: 'خوخي البسكويت الناعم 🍪' },
  { hex: '#A2D9CE', nameAr: 'نعناعي منعش وهادئ 🍃' },
  { hex: '#FADBD8', nameAr: 'وردي الخوخ الخجول 🌸' },
  { hex: '#F7DC6F', nameAr: 'أصفر الموز الحلو 🍌' },
  { hex: '#FFFFFF', nameAr: 'أبيض الورق الصافي 📄' }
];

export default function App() {
  const [activeTool, setActiveTool] = useState<'fill' | 'brush' | 'eraser'>('brush');
  const [activeColor, setActiveColor] = useState<string>('#C0392B'); // Default child-friendly active red-crimson for drawing!
  const [brushSize, setBrushSize] = useState<number>(14);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Local state for tracking uploaded image src to allow re-transformations
  const [loadedImageSrc, setLoadedImageSrc] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef<boolean>(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Synchronize sound settings with synthesizer
  useEffect(() => {
    sfx.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Push active canvas state into undo stack (up to 15 entries)
  const pushState = (currentCanvas: HTMLCanvasElement) => {
    const ctx = currentCanvas.getContext('2d');
    if (!ctx) return;
    const state = ctx.getImageData(0, 0, currentCanvas.width, currentCanvas.height);
    setUndoStack(prev => {
      const updated = [...prev, state];
      if (updated.length > 15) {
        updated.shift(); // Remove oldest to preserve memory
      }
      return updated;
    });
  };

  // Resets the canvas and initializes/restores background
  const resetCanvas = useCallback((keepUndo = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Fill canvas clean white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (!keepUndo) {
      setUndoStack([initialState]);
      setLoadedImageSrc(null);
    } else {
      pushState(canvas);
    }
  }, []);

  // Set up the board on mount
  useEffect(() => {
    resetCanvas(false);
  }, [resetCanvas]);

  // Translate click coordinates correctly matching A4 Canvas scale DPI
  const getCoordinates = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Brush and fill drawing routines
  const startDrawing = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCoordinates(clientX, clientY);
    if (!coords) return;

    if (activeTool === 'fill') {
      // Flood fill event
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 192, g: 57, b: 43 };
      };

      const rgb = hexToRgb(activeColor);
      pushState(canvas); // Save undo anchor
      performFloodFill(canvas, coords.x, coords.y, rgb.r, rgb.g, rgb.b);
      sfx.playPop();
    } else {
      // Stroke freestyle drawing
      pushState(canvas);
      isDrawing.current = true;
      lastPoint.current = coords;
      sfx.playBrush();
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = activeTool === 'eraser' ? '#FFFFFF' : activeColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = activeTool === 'eraser' ? '#FFFFFF' : activeColor;
        ctx.fill();
        ctx.stroke();
      }
    }
  };

  const drawStroke = (clientX: number, clientY: number) => {
    if (!isDrawing.current || activeTool === 'fill') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(clientX, clientY);
    if (!coords) return;

    ctx.strokeStyle = activeTool === 'eraser' ? '#FFFFFF' : activeColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (lastPoint.current) {
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    } else {
      ctx.moveTo(coords.x, coords.y);
    }
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPoint.current = coords;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    lastPoint.current = null;
  };

  // Undo standard canvas modifications
  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || undoStack.length <= 1) return;

    sfx.playChime();
    const stackCopy = [...undoStack];
    stackCopy.pop(); // Remove active canvas state
    const previousState = stackCopy[stackCopy.length - 1];
    
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
      setUndoStack(stackCopy);
    }
  };

  // Safe client-side save PNG trigger (No printing options)
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    sfx.playSuccess();
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'لوحتي_الفنية_اللطيفة.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to handle custom image upload and scale inside A4 sheet ratio
  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sfx.playChime();
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Save current state for Undo
        pushState(canvas);

        // Fill background white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate aspect ratios for perfect child-friendly fit
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > canvasRatio) {
          drawHeight = canvas.width / imgRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * imgRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Save base64 string for instant offline transformations if needed
        setLoadedImageSrc(event.target?.result as string);
        
        // Push state for tracking updates
        const loadedState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack(prev => {
          const updated = [...prev, loadedState];
          if (updated.length > 15) updated.shift();
          return updated;
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // High-fidelity instant client-side Black & White conversion for coloring custom templates offline!
  const makeLineArtOffline = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    sfx.playPop();
    pushState(canvas);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Fast image thresholding to generate clear clean lines for coloring!
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      // If already transparent or highly bright, clear it to white
      if (alpha < 50) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
        continue;
      }

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      // Convert to strict high-contrast line drawings
      const resultValue = brightness > 155 ? 255 : 0;

      data[i] = resultValue;
      data[i + 1] = resultValue;
      data[i + 2] = resultValue;
      data[i + 3] = 255; // Keep lines opaque
    }

    ctx.putImageData(imgData, 0, 0);
    sfx.playSuccess();
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#FFF9E6] to-[#E0F7FA] text-slate-800 flex flex-col antialiased select-none font-sans relative pb-12 overflow-x-hidden">
      
      {/* Playful Floating Kids Elements */}
      <div className="absolute top-24 left-10 text-5xl opacity-35 select-none animate-bounce duration-[8000ms] pointer-events-none">☁️</div>
      <div className="absolute top-48 right-12 text-5xl opacity-35 select-none animate-bounce duration-[5000ms] pointer-events-none">🎈</div>
      <div className="absolute bottom-20 left-16 text-6xl opacity-30 select-none animate-pulse duration-[6000ms] pointer-events-none">🧸</div>
      <div className="absolute bottom-32 right-16 text-5xl opacity-30 select-none animate-spin duration-[20000ms] pointer-events-none">⭐</div>

      {/* 1. Playful, Child-Friendly Header Banner */}
      <header className="w-full bg-white/90 backdrop-blur-md text-slate-800 shadow-md border-b-4 border-[#FF8A80] py-4 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="text-4xl bg-[#FFF0F5] p-2.5 rounded-full shadow-md border-2 border-pink-200 flex items-center justify-center animate-bounce duration-[3000ms]">
            🌸
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-pink-600 drop-shadow-sm flex items-center gap-2">
              <span>مَرْسَم رُقَيّة الإلكتروني الجميل</span>
              <span className="text-xl">🎨🧸</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-600 mt-1 font-bold">
              كراسة رسم ذكية وألوان مبهجة مخصصة للبطلة الصغيرة رقية وصديقاتها المبدعات! ✨
            </p>
          </div>
        </div>

        {/* Playful Control Buttons */}
        <div className="flex items-center gap-3">
          <a
            href="https://heyzine.com/flip-book/6cd664ee54.html"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sfx.playChime()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all duration-300 shadow-md transform hover:scale-105 active:scale-95 bg-[#E0F7FA] hover:bg-[#B2EBF2] text-[#006064] border-2 border-[#00ACC1]"
          >
            <BookOpen className="w-4 h-4 animate-bounce text-[#00838F]" />
            <span>الرجوع إلى المجلة 📖</span>
          </a>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              sfx.playChime();
            }}
            id="sound-toggler-btn"
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 shadow-md transform hover:scale-105 active:scale-95 ${
              soundEnabled 
                ? 'bg-[#FF8A80] hover:bg-[#FF5252] text-white border border-[#FF8A80]' 
                : 'bg-stone-200 hover:bg-stone-300 text-stone-600 border border-stone-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-white animate-pulse" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
            <span>{soundEnabled ? 'صوت التلوين: مفعّل 🔔' : 'صوت التلوين: صامت 🔕'}</span>
          </button>

        </div>
      </header>

      {/* Primary Game Interactive Layout */}
      <main id="interactive-game-layout" className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 mt-6 flex flex-col gap-6 relative z-10">

        {/* E-Book Interactive Multi-Page Card Layout (Double-Sided Book View) */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 md:border-8 border-[#F8BBD0] p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-stretch relative transition-all">
          
          {/* Space slot */}

          {/* PAGE 1: The Interactive Drawing A4 book sheet (A4 portrait ebook ratio) */}
          <section className="flex-1 lg:w-2/3 flex flex-col items-center justify-center relative bg-stone-50/40 p-2 md:p-4 rounded-3xl border-2 border-dashed border-[#F8BBD0]/50 order-1 lg:order-2">
            
            <div className="w-full flex justify-between items-center mb-3 px-1">
              <span className="text-xs font-bold text-pink-600 flex items-center gap-1.5 bg-pink-50 px-3.5 py-1.5 rounded-full border border-pink-100">
                ⭐ كراسة ورقية بيضاء بحجم كتاب إلكتروني للأطفال
              </span>

              <span className="text-[11px] font-bold text-pink-700 bg-pink-50 shadow-sm px-3 py-1.5 rounded-full border border-pink-100">
                الخطوات الإبداعية المحفوظة: {undoStack.length > 0 ? undoStack.length - 1 : 0}
              </span>
            </div>

            {/* E-book Page Sheet Wrapper with layers */}
            <div className="relative w-full flex justify-center py-1">
              
              {/* Stacked sheets visual indicator representing a thick cartoon book */}
              <div className="absolute inset-x-2 -bottom-2 h-full bg-white border border-stone-100 rounded-2xl shadow-sm transform translate-y-2 z-0"></div>
              <div className="absolute inset-x-4 -bottom-4 h-full bg-stone-50 border border-stone-100 rounded-2xl shadow-sm transform translate-y-4 z-0"></div>
              
              {/* Primary Active Book Page Frame with Canvas */}
              <div className="relative bg-[#FFF9F9] p-2 md:p-3.5 rounded-2xl shadow-md w-full max-w-[560px] md:max-w-[590px] lg:max-w-[620px] border-2 border-[#F8BBD0]/60 z-10 transition-transform overflow-hidden">
                <div className="relative bg-stone-50/20 p-1 rounded-xl shadow-inner border border-stone-200/20">
                  <canvas
                    id="coloring-book-canvas"
                    ref={canvasRef}
                    width={794}
                    height={1123}
                    onMouseDown={e => startDrawing(e.clientX, e.clientY)}
                    onMouseMove={e => drawStroke(e.clientX, e.clientY)}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={e => {
                      e.preventDefault();
                      const touch = e.touches[0];
                      startDrawing(touch.clientX, touch.clientY);
                    }}
                    onTouchMove={e => {
                      e.preventDefault();
                      const touch = e.touches[0];
                      drawStroke(touch.clientX, touch.clientY);
                    }}
                    onTouchEnd={e => {
                      e.preventDefault();
                      stopDrawing();
                    }}
                    className="w-full h-auto aspect-[794/1123] rounded-lg bg-white cursor-crosshair shadow-md select-none touch-none border border-stone-100"
                    style={{ imageRendering: 'auto' }}
                  />

                  {/* AI features removed */}
                </div>
              </div>

            </div>

            <div className="text-[11px] text-slate-500 font-bold mt-6 mb-2 text-center select-none bg-stone-50 px-4 py-1.5 rounded-full border border-stone-100">
              💡 مرر إصبعك اللطيف على الورقة لتلوين السحاب والزهور!
            </div>
          </section>

          {/* PAGE 2: Coloring sidebar, tools and Image Uploader */}
          <aside className="w-full lg:w-1/3 flex flex-col gap-4 order-2 lg:order-1 select-none pr-0 lg:pr-2">
            

            {/* Super Adorable Upload Card */}
            <div className="bg-gradient-to-br from-[#FFF0F5] to-[#FFD54F]/20 p-4 rounded-[2rem] border-3 border-pink-300 shadow-sm flex flex-col items-center text-center gap-2">
              <span className="text-xl">🌸📷</span>
              <h3 className="text-xs font-black text-pink-700">تلوين صورة خارجية من جهازك</h3>
              <p className="text-[10px] text-slate-600 leading-normal max-w-[210px] font-bold">
                ارفع أي صورة رسم أو خطوط جاهزة على جهازك، لتظهر مباشرة في كراستك السحرية لتلوينها فوراً!
              </p>
              
              <label className="w-full bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs py-2.5 px-3 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95">
                <Upload className="w-4 h-4" />
                <span>تحميل رسمة لتلوينها 🌸</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomImageUpload}
                  className="hidden"
                />
              </label>

              {loadedImageSrc && (
                <button
                  onClick={makeLineArtOffline}
                  className="w-full mt-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-[11px] py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all border border-amber-300 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-900 animate-spin" />
                  <span>تحويل الصورة لخطوط للتلوين 🪄</span>
                </button>
              )}
            </div>

            {/* Paint tools card */}
            <div className="bg-[#E8F8F5] p-5 rounded-[2rem] border-3 border-[#A2D9CE] shadow-sm flex flex-col gap-3">
              <h3 className="text-teal-700 font-extrabold text-[14px] flex items-center gap-1.5 pb-2 border-b border-[#A2D9CE]/40">
                🖌️ أدوات الرسم والتلوين السحرية:
              </h3>

              <div className="flex flex-col gap-2">
                {/* Paint brush tool */}
                <button
                  onClick={() => {
                    setActiveTool('brush');
                    sfx.playChime();
                  }}
                  className={`w-full rounded-2xl py-3 px-4 flex items-center justify-between text-right font-black text-xs transition-all duration-300 border-2 transform ${
                    activeTool === 'brush'
                      ? 'bg-emerald-400 border-emerald-400 text-white shadow-md scale-[1.02] border-b-4 border-emerald-500'
                      : 'bg-white hover:bg-[#F0FDF4] border-[#A2D9CE]/60 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Brush className="w-4 h-4" />
                    <span>فرشاة الرسم السحرية</span>
                  </div>
                  {activeTool === 'brush' && <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">نشط 🌟</span>}
                </button>

                {/* Flood Fill Bucket tool */}
                <button
                  onClick={() => {
                    setActiveTool('fill');
                    sfx.playChime();
                  }}
                  className={`w-full rounded-2xl py-3 px-4 flex items-center justify-between text-right font-black text-xs transition-all duration-300 border-2 transform ${
                    activeTool === 'fill'
                      ? 'bg-[#FFB74D] border-[#FFB74D] text-white shadow-md scale-[1.02] border-b-4 border-[#F57C00]'
                      : 'bg-white hover:bg-orange-50 border-[#A2D9CE]/60 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PaintBucket className="w-4 h-4" />
                    <span>سطل تعبئة الفراغات</span>
                  </div>
                  {activeTool === 'fill' && <span className="bg-orange-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">نشط 🎨</span>}
                </button>

                {/* Eraser tool */}
                <button
                  onClick={() => {
                    setActiveTool('eraser');
                    sfx.playChime();
                  }}
                  className={`w-full rounded-2xl py-3 px-4 flex items-center justify-between text-right font-black text-xs transition-all duration-300 border-2 transform ${
                    activeTool === 'eraser'
                      ? 'bg-[#AED6F1] border-[#AED6F1] text-[#1B4F72] shadow-md scale-[1.02] border-b-4 border-[#5DADE2]'
                      : 'bg-white hover:bg-sky-50 border-[#A2D9CE]/60 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Eraser className="w-4 h-4" />
                    <span>ممحاة الألوان السحرية</span>
                  </div>
                  {activeTool === 'eraser' && <span className="bg-sky-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">نشط 🧺</span>}
                </button>
              </div>

              {/* Slider Size Option */}
              {activeTool !== 'fill' && (
                <div className="mt-1 bg-white p-3 rounded-xl border border-[#A2D9CE]/50">
                  <div className="flex justify-between items-center mb-1 font-bold text-xs text-slate-700">
                    <span>حجم خط السحر: {brushSize} بكسل</span>
                    <div 
                      className="rounded-full bg-rose-400" 
                      style={{ 
                        width: Math.min(20, Math.max(6, brushSize / 1.3)), 
                        height: Math.min(20, Math.max(6, brushSize / 1.3)) 
                      }} 
                    />
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="36"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-rose-400"
                  />
                </div>
              )}
            </div>

            {/* 2. Operations & Controls card */}
            <div className="bg-[#FDEDEC] p-5 rounded-[2rem] border-3 border-[#FADBD8] shadow-sm flex flex-col gap-2.5">
              <h3 className="text-pink-600 font-extrabold text-[14px] pb-1.5 border-b border-[#FADBD8]/60">
                🎀 خيارات لوحتي اللطيفة:
              </h3>

              {/* Undo action */}
              <button
                onClick={handleUndo}
                disabled={undoStack.length <= 1}
                className={`w-full rounded-2xl py-2.5 px-4 flex items-center justify-center gap-2 font-bold transition-all border-2 text-xs transform active:scale-95 duration-200 ${
                  undoStack.length > 1
                    ? 'bg-white hover:bg-slate-50 border-[#FADBD8] text-[#900C3F] shadow-sm'
                    : 'bg-stone-50 border-stone-200 text-stone-300 cursor-not-allowed'
                }`}
              >
                <Undo2 className="w-4 h-4" />
                <span>تراجع خطوة للخلف ⏮️</span>
              </button>

              {/* Reset layout */}
              <button
                onClick={() => {
                  sfx.playChime();
                  resetCanvas(true);
                }}
                className="w-full rounded-2xl py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-rose-700 font-bold transition-all text-xs flex items-center justify-center gap-2 active:scale-95 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>تفريغ وتنظيف الصفحة 🧹</span>
              </button>

              {/* Download PNG layout (Clean, NO Print tool option) */}
              <button
                onClick={handleSave}
                className="w-full rounded-2xl py-3 px-4 bg-[#FF8A80] hover:bg-[#FF5252] border-2 border-[#FF8A80] text-white font-extrabold transition-all text-xs flex items-center justify-center gap-2 active:scale-95 shadow-lg border-b-6 border-[#D50000] mt-1"
              >
                <Download className="w-4.5 h-4.5 text-white" />
                <span>حفظ لوحتي كصورة في جهازي 💾🧸</span>
              </button>
            </div>

          </aside>

        </div>

        {/* 3. Footer color candy-block */}
        <footer className="bg-white rounded-[2.5rem] p-5 shadow-xl border-3 border-amber-200 mt-2 mb-6 relative overflow-hidden">
          
          <div className="absolute inset-0 bg-[radial-gradient(#F7DC6F_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl animate-bounce duration-[2000ms]">🍭</span>
              <div>
                <h3 className="font-extrabold text-[#D35400] text-base">كيس الألوان والحلوى الفنية السحرية 🍡</h3>
                <p className="text-xs text-slate-600 font-bold">اضغط على أي حبة حلوى ملونة لتمسح لون فرشاتك بها وتباشر الرسم والتسلية!</p>
              </div>
            </div>

            {/* Selected feedback bubble */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-amber-50 border-2 border-amber-200 px-4 py-1.5 rounded-full shadow-inner animate-pulse">
              <span>اللون المختار حالياً:</span>
              <span className="inline-block w-4 h-4 rounded-full shadow-inner border border-stone-300" style={{ backgroundColor: activeColor }}></span>
              <span className="text-pink-600 font-extrabold">
                {colorPalette.find(c => c.hex === activeColor)?.nameAr || activeColor}
              </span>
            </div>
          </div>

          {/* Color items bubble palette */}
          <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-3 mt-5 relative z-10">
            {colorPalette.map((color) => {
              const isSelected = activeColor === color.hex;
              return (
                <button
                  key={color.hex}
                  onClick={() => {
                    setActiveColor(color.hex);
                    sfx.playPop();
                    // Automatically toggle brush mode if selecting colors
                    if (activeTool === 'eraser') {
                      setActiveTool('brush');
                    }
                  }}
                  className={`relative aspect-square rounded-full transition-all duration-300 transform active:scale-90 focus:outline-none flex items-center justify-center shadow-lg border-3 ${
                    isSelected 
                      ? 'border-pink-500 ring-4 ring-pink-400/40 scale-115 shadow-xl rotate-12' 
                      : 'border-white hover:scale-108 hover:shadow-xl hover:-translate-y-1'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.nameAr}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="bg-white/95 rounded-full p-1 flex items-center justify-center shadow-inner"
                      >
                        <Check 
                          className="w-3.5 h-3.5 font-black" 
                          style={{ color: color.hex === '#FFFFFF' ? '#C0392B' : color.hex }} 
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </footer>

      </main>

    </div>
  );
}
