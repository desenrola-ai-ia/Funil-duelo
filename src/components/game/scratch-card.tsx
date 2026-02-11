'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
// CONFIG
// ============================================

const REVEAL_THRESHOLD = 55; // % necessário para revelar
const BRUSH_RADIUS = 25; // Raio do pincel em px
const PROGRESS_UPDATE_INTERVAL = 150; // ms - throttle para cálculo de progresso
const GRID_COLS = 40; // Células horizontais para tracking
const GRID_ROWS = 25; // Células verticais para tracking
const SOUND_STOP_DELAY = 200; // ms de inatividade antes de parar som

// ============================================
// SOUND HOOK (Otimizado - sem pixel checking)
// ============================================

const SCRATCH_SOUND = '/sounds/scratch-once.mp3';

function useScratchSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const audio = new Audio(SCRATCH_SOUND);
    audio.loop = true;
    audio.volume = 0.6;
    audio.preload = 'auto';
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const startSound = useCallback(() => {
    if (isPlayingRef.current || !audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      isPlayingRef.current = true;
    } catch {}
  }, []);

  const stopSound = useCallback(() => {
    if (!isPlayingRef.current) return;
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      isPlayingRef.current = false;
    } catch {}
  }, []);

  // Velocity-based pitch/volume (performance: apenas cálculo matemático)
  const updateVelocity = useCallback((x: number, y: number) => {
    const now = Date.now();
    const last = lastPosRef.current;

    if (last && audioRef.current && isPlayingRef.current) {
      const dx = x - last.x;
      const dy = y - last.y;
      const dt = now - last.time;

      if (dt > 0) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        const velocity = Math.min(distance / dt / 3, 1); // normalize 0-1

        audioRef.current.volume = 0.5 + velocity * 0.25;
        audioRef.current.playbackRate = 0.7 + velocity * 0.6;
      }
    }

    lastPosRef.current = { x, y, time: now };
  }, []);

  return { startSound, stopSound, updateVelocity };
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ScratchCard({
  prize,
  description,
  onReveal,
  className,
}: ScratchCardProps) {
  // ============================================
  // STATE
  // ============================================
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // ============================================
  // REFS
  // ============================================
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const soundTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  // Grid tracking (PERFORMANCE: sem getImageData)
  const scratchGridRef = useRef<boolean[][]>([]);

  // ============================================
  // HOOKS
  // ============================================
  const { startSound, stopSound, updateVelocity } = useScratchSound();

  // ============================================
  // RESPONSIVE DIMENSIONS
  // ============================================
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;

      // Responsivo: min(92vw, 360px)
      const viewportWidth = window.innerWidth;
      const maxWidth = 360;
      const minWidth = 280;
      const cssWidth = Math.min(Math.max(viewportWidth * 0.92, minWidth), maxWidth);
      const cssHeight = cssWidth * 0.625; // Aspect ratio ~16:10

      setDimensions({ width: cssWidth, height: cssHeight });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // ============================================
  // CANVAS INITIALIZATION (DPR-aware)
  // ============================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = dimensions.width;
    const cssHeight = dimensions.height;

    // High-DPI canvas
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // Scale context para DPR
    ctx.scale(dpr, dpr);

    // ── Background: gradiente metálico dourado ──
    const bgGrad = ctx.createLinearGradient(0, 0, cssWidth, cssHeight);
    bgGrad.addColorStop(0, '#B8860B');
    bgGrad.addColorStop(0.25, '#DAA520');
    bgGrad.addColorStop(0.5, '#FFD700');
    bgGrad.addColorStop(0.75, '#DAA520');
    bgGrad.addColorStop(1, '#B8860B');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // ── Noise texture sutil (pontos aleatórios) ──
    const seed = 42;
    const seededRandom = (i: number) => {
      const x = Math.sin(seed + i * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 600; i++) {
      const px = seededRandom(i) * cssWidth;
      const py = seededRandom(i + 1000) * cssHeight;
      const alpha = 0.08 + seededRandom(i + 2000) * 0.12;
      ctx.fillStyle = seededRandom(i + 3000) > 0.5
        ? `rgba(255,255,255,${alpha})`
        : `rgba(0,0,0,${alpha})`;
      ctx.fillRect(px, py, 1, 1);
    }

    // ── Faixa de brilho diagonal (highlight metálico) ──
    const shineGrad = ctx.createLinearGradient(
      cssWidth * 0.2, 0, cssWidth * 0.5, cssHeight
    );
    shineGrad.addColorStop(0, 'rgba(255,255,255,0)');
    shineGrad.addColorStop(0.4, 'rgba(255,255,255,0.15)');
    shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.25)');
    shineGrad.addColorStop(0.6, 'rgba(255,255,255,0.15)');
    shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shineGrad;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // ── Sparkles (estrelinhas douradas espalhadas) ──
    const drawStar = (cx: number, cy: number, r: number, alpha: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = `rgba(255,248,220,${alpha})`;
      ctx.beginPath();
      // Estrela de 4 pontas
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 0.15, -r * 0.15, r, 0);
      ctx.quadraticCurveTo(r * 0.15, r * 0.15, 0, r);
      ctx.quadraticCurveTo(-r * 0.15, r * 0.15, -r, 0);
      ctx.quadraticCurveTo(-r * 0.15, -r * 0.15, 0, -r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    const starPositions = [
      [0.12, 0.2], [0.88, 0.15], [0.15, 0.78], [0.85, 0.82],
      [0.5, 0.12], [0.5, 0.88], [0.25, 0.5], [0.75, 0.5],
      [0.08, 0.5], [0.92, 0.5], [0.35, 0.25], [0.65, 0.75],
    ];
    starPositions.forEach(([sx, sy], i) => {
      const size = 4 + seededRandom(i + 5000) * 6;
      const alpha = 0.4 + seededRandom(i + 6000) * 0.5;
      drawStar(sx * cssWidth, sy * cssHeight, size, alpha);
    });

    // ── Borda interna decorativa ──
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 1.5;
    const inset = 8;
    const borderRadius = 10;
    ctx.beginPath();
    ctx.roundRect(inset, inset, cssWidth - inset * 2, cssHeight - inset * 2, borderRadius);
    ctx.stroke();

    // Borda tracejada interna
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,248,220,0.2)';
    ctx.lineWidth = 1;
    const inset2 = 14;
    ctx.beginPath();
    ctx.roundRect(inset2, inset2, cssWidth - inset2 * 2, cssHeight - inset2 * 2, borderRadius - 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Ícone de moeda/presente central (círculo dourado) ──
    const centerX = cssWidth / 2;
    const centerY = cssHeight / 2 - 10;
    const coinRadius = 22;

    // Sombra da moeda
    ctx.beginPath();
    ctx.arc(centerX, centerY + 2, coinRadius + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(139,90,0,0.4)';
    ctx.fill();

    // Moeda
    const coinGrad = ctx.createRadialGradient(
      centerX - 5, centerY - 5, 2,
      centerX, centerY, coinRadius
    );
    coinGrad.addColorStop(0, '#FFF8DC');
    coinGrad.addColorStop(0.3, '#FFD700');
    coinGrad.addColorStop(0.7, '#DAA520');
    coinGrad.addColorStop(1, '#B8860B');
    ctx.beginPath();
    ctx.arc(centerX, centerY, coinRadius, 0, Math.PI * 2);
    ctx.fillStyle = coinGrad;
    ctx.fill();

    // Borda da moeda
    ctx.strokeStyle = 'rgba(255,248,220,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // "?" dentro da moeda
    ctx.fillStyle = '#8B6914';
    ctx.font = `bold ${coinRadius}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', centerX, centerY + 1);

    // Brilho da moeda (highlight)
    ctx.beginPath();
    ctx.arc(centerX - 6, centerY - 8, coinRadius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();

    // ── Texto principal "RASPE AQUI" ──
    const textY = centerY + coinRadius + 22;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sombra do texto
    ctx.fillStyle = 'rgba(139,90,0,0.6)';
    ctx.font = `bold ${Math.round(cssWidth * 0.055)}px system-ui, sans-serif`;
    ctx.fillText('✨  RASPE AQUI  ✨', centerX, textY + 1);

    // Texto
    ctx.fillStyle = '#FFF8DC';
    ctx.fillText('✨  RASPE AQUI  ✨', centerX, textY);

    // Subtexto
    ctx.fillStyle = 'rgba(255,248,220,0.5)';
    ctx.font = `${Math.round(cssWidth * 0.033)}px system-ui, sans-serif`;
    ctx.fillText('seu prêmio está escondido aqui', centerX, textY + 18);

    // Inicializar grid de tracking (PERFORMANCE)
    scratchGridRef.current = Array(GRID_ROWS)
      .fill(null)
      .map(() => Array(GRID_COLS).fill(false));
  }, [dimensions, isRevealed]);

  // ============================================
  // GRID-BASED PROGRESS (sem getImageData!)
  // ============================================
  const markGridCells = useCallback(
    (x: number, y: number) => {
      if (dimensions.width === 0) return;

      const cellWidth = dimensions.width / GRID_COLS;
      const cellHeight = dimensions.height / GRID_ROWS;
      const radius = BRUSH_RADIUS;

      // Marcar células cobertas pelo brush circular
      const minCellX = Math.max(0, Math.floor((x - radius) / cellWidth));
      const maxCellX = Math.min(GRID_COLS - 1, Math.floor((x + radius) / cellWidth));
      const minCellY = Math.max(0, Math.floor((y - radius) / cellHeight));
      const maxCellY = Math.min(GRID_ROWS - 1, Math.floor((y + radius) / cellHeight));

      for (let row = minCellY; row <= maxCellY; row++) {
        for (let col = minCellX; col <= maxCellX; col++) {
          // Verificar se está dentro do círculo
          const cellCenterX = (col + 0.5) * cellWidth;
          const cellCenterY = (row + 0.5) * cellHeight;
          const dist = Math.sqrt((cellCenterX - x) ** 2 + (cellCenterY - y) ** 2);

          if (dist <= radius) {
            scratchGridRef.current[row][col] = true;
          }
        }
      }
    },
    [dimensions]
  );

  const calculateProgressFromGrid = useCallback(() => {
    const grid = scratchGridRef.current;
    if (grid.length === 0) return 0;

    let scratched = 0;
    const total = GRID_ROWS * GRID_COLS;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (grid[row][col]) scratched++;
      }
    }

    return (scratched / total) * 100;
  }, []);

  // Throttled progress update (rAF + interval)
  const scheduleProgressUpdate = useCallback(() => {
    if (progressTimeoutRef.current) return; // Já agendado

    progressTimeoutRef.current = setTimeout(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const progress = calculateProgressFromGrid();
        setScratchProgress(progress);

        // Reveal completo
        if (progress >= REVEAL_THRESHOLD && !isRevealed) {
          setIsRevealed(true);
          stopSound();
          onReveal();
        }

        progressTimeoutRef.current = null;
      });
    }, PROGRESS_UPDATE_INTERVAL);
  }, [calculateProgressFromGrid, isRevealed, stopSound, onReveal]);

  // ============================================
  // DRAWING (Interpolação + Pointer Events)
  // ============================================
  const drawLine = useCallback(
    (fromX: number, fromY: number, toX: number, toY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = BRUSH_RADIUS * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      // Marcar grid ao longo da linha (interpolação)
      const steps = Math.ceil(Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2) / 5);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = fromX + (toX - fromX) * t;
        const y = fromY + (toY - fromY) * t;
        markGridCells(x, y);
      }
    },
    [markGridCells]
  );

  const scratch = useCallback(
    (clientX: number, clientY: number) => {
      if (isRevealed || dimensions.width === 0) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Bounds check
      if (x < 0 || y < 0 || x > dimensions.width || y > dimensions.height) return;

      // Interpolação: desenhar linha desde último ponto
      if (lastPointRef.current) {
        drawLine(lastPointRef.current.x, lastPointRef.current.y, x, y);
      } else {
        // Primeiro ponto: desenhar círculo
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
          ctx.fill();
          markGridCells(x, y);
        }
      }

      lastPointRef.current = { x, y };
      updateVelocity(clientX, clientY);
      scheduleProgressUpdate();
    },
    [isRevealed, dimensions, drawLine, markGridCells, updateVelocity, scheduleProgressUpdate]
  );

  // ============================================
  // POINTER EVENT HANDLERS
  // ============================================
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Pointer capture para receber eventos mesmo fora do canvas
      canvas.setPointerCapture(e.pointerId);

      isDrawingRef.current = true;
      lastPointRef.current = null;

      // Iniciar som (sem pixel checking)
      startSound();

      // Primeiro scratch
      scratch(e.clientX, e.clientY);
    },
    [scratch, startSound]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      scratch(e.clientX, e.clientY);

      // Reset timeout do som
      if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
      soundTimeoutRef.current = setTimeout(stopSound, SOUND_STOP_DELAY);
    },
    [scratch, stopSound]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId);
      }

      isDrawingRef.current = false;
      lastPointRef.current = null;
      stopSound();

      if (soundTimeoutRef.current) {
        clearTimeout(soundTimeoutRef.current);
        soundTimeoutRef.current = null;
      }
    },
    [stopSound]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      handlePointerUp(e);
    },
    [handlePointerUp]
  );

  // ============================================
  // CLEANUP
  // ============================================
  useEffect(() => {
    return () => {
      if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
      if (progressTimeoutRef.current) clearTimeout(progressTimeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopSound();
    };
  }, [stopSound]);

  // ============================================
  // RENDER
  // ============================================
  const showAlmostThere = scratchProgress >= 45 && scratchProgress < REVEAL_THRESHOLD && !isRevealed;

  return (
    <div className={cn('relative w-full flex justify-center', className)}>
      <div
        ref={containerRef}
        className="relative"
        style={{
          width: dimensions.width || 320,
          height: dimensions.height || 200,
        }}
      >
        {/* Prize content (behind scratch layer) */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0.3 }}
            animate={isRevealed ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.3 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-center"
          >
            <Gift className="w-12 h-12 mx-auto mb-3 text-white" />
            <h3 className="text-2xl font-bold text-white mb-1">{prize}</h3>
            <p className="text-white/80 text-sm">{description}</p>
          </motion.div>
        </div>

        {/* Scratch canvas - DPR-aware, pointer events */}
        <AnimatePresence>
          {!isRevealed && dimensions.width > 0 && (
            <>
              <motion.canvas
                ref={canvasRef}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                className="absolute inset-0 rounded-2xl cursor-pointer"
                style={{
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
              />
              {/* Shimmer animado por cima */}
              <motion.div
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)',
                    backgroundSize: '200% 100%',
                    animation: 'scratchShimmer 3s ease-in-out infinite',
                  }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Microcopy "quase..." */}
        <AnimatePresence>
          {showAlmostThere && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 bg-purple-500/90 rounded-full px-3 py-1 pointer-events-none"
            >
              <span className="text-white text-xs font-medium">quase lá...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        {!isRevealed && scratchProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 rounded-full px-3 py-1 pointer-events-none"
          >
            <span className="text-white text-xs font-medium">
              {Math.round(scratchProgress)}% raspado
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
