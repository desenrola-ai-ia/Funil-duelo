'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface ScratchCardProps {
  prize: string;
  description: string;
  onReveal: () => void;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function ScratchCard({
  prize,
  description,
  onReveal,
  className,
}: ScratchCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const REVEAL_THRESHOLD = 50; // Porcentagem necessaria para revelar

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw scratch layer
    ctx.fillStyle = '#3f3f46'; // zinc-700
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add scratch pattern
    ctx.fillStyle = '#52525b'; // zinc-600
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';

    for (let y = 30; y < canvas.height; y += 40) {
      for (let x = 30; x < canvas.width; x += 80) {
        ctx.fillText('RASPE', x, y);
      }
    }
  }, []);

  const calculateProgress = () => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;

    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentPixels++;
    }

    return (transparentPixels / (pixels.length / 4)) * 100;
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 25, 0, Math.PI * 2);
    ctx.fill();

    const progress = calculateProgress();
    setScratchProgress(progress);

    if (progress >= REVEAL_THRESHOLD && !isRevealed) {
      setIsRevealed(true);
      onReveal();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    scratch(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing.current) return;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Prize content (behind scratch layer) */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={isRevealed ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.3 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Gift className="w-16 h-16 mx-auto mb-4 text-white" />
          <h3 className="text-3xl font-bold text-white mb-2">{prize}</h3>
          <p className="text-white/80 text-sm">{description}</p>
        </motion.div>
      </div>

      {/* Scratch canvas */}
      <AnimatePresence>
        {!isRevealed && (
          <motion.canvas
            ref={canvasRef}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl cursor-pointer touch-none"
            onMouseDown={() => (isDrawing.current = true)}
            onMouseUp={() => (isDrawing.current = false)}
            onMouseLeave={() => (isDrawing.current = false)}
            onMouseMove={handleMouseMove}
            onTouchStart={() => (isDrawing.current = true)}
            onTouchEnd={() => (isDrawing.current = false)}
            onTouchMove={handleTouchMove}
          />
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      {!isRevealed && scratchProgress > 0 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 rounded-full px-3 py-1">
          <span className="text-white text-xs">
            {Math.round(scratchProgress)}%
          </span>
        </div>
      )}
    </div>
  );
}
