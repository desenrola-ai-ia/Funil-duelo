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

const REVEAL_THRESHOLD = 50;
const BRUSH_RADIUS = 25;
const GRID_COLS = 16;
const GRID_ROWS = 10;
const REVEAL_CHECK_INTERVAL = 8; // Check reveal every N touchmove events
const GRAIN_INTERVAL_MS = 50; // Min ms between grain plays

// ============================================
// SOUND HOOK — Web Audio API grain-based scratch
// ============================================

const SCRATCH_SAMPLES = ['/sounds/scratch-once.mp3', '/sounds/scratch-twice.mp3'];

function useScratchSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<AudioBuffer[]>([]);
  const lastGrainRef = useRef(0);
  const loadedRef = useRef(false);

  // Init AudioContext on first user gesture (lazy)
  const ensureCtx = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      return ctx;
    } catch { return null; }
  }, []);

  // Preload samples
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const load = async () => {
      const ctx = ensureCtx();
      if (!ctx) return;
      const results = await Promise.allSettled(
        SCRATCH_SAMPLES.map(async (url) => {
          const res = await fetch(url);
          const buf = await res.arrayBuffer();
          return ctx.decodeAudioData(buf);
        })
      );
      buffersRef.current = results
        .filter((r): r is PromiseFulfilledResult<AudioBuffer> => r.status === 'fulfilled')
        .map((r) => r.value);
    };
    load().catch(() => {});
  }, [ensureCtx]);

  // Play a single grain — velocity controls pitch + volume
  const scratchGrain = useCallback((velocity: number) => {
    const now = performance.now();
    if (now - lastGrainRef.current < GRAIN_INTERVAL_MS) return;
    lastGrainRef.current = now;

    const ctx = ensureCtx();
    const buffers = buffersRef.current;
    if (!ctx || buffers.length === 0) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    try {
      // Pick random sample
      const buffer = buffers[Math.floor(Math.random() * buffers.length)];

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Velocity: 0 (still) to ~30+ (fast scratch)
      const clampedVel = Math.min(Math.max(velocity, 1), 30);
      const normalizedVel = clampedVel / 30; // 0..1

      // Pitch: faster scratch = slightly higher pitch (0.85 to 1.3)
      source.playbackRate.value = 0.85 + normalizedVel * 0.45 + (Math.random() - 0.5) * 0.15;

      // Volume: faster = louder (0.15 to 0.55)
      const gain = ctx.createGain();
      gain.gain.value = 0.15 + normalizedVel * 0.4;

      source.connect(gain);
      gain.connect(ctx.destination);

      // Play a random slice of the sample (grain)
      const duration = 0.06 + Math.random() * 0.06; // 60-120ms grain
      const maxOffset = Math.max(0, buffer.duration - duration);
      const offset = Math.random() * maxOffset;

      source.start(0, offset, duration);
    } catch {}
  }, [ensureCtx]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return { scratchGrain };
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
  const [isRevealed, setIsRevealed] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const revealedRef = useRef(false); // Non-reactive flag to avoid stale closures
  const gridRef = useRef<Uint8Array | null>(null);
  const moveCountRef = useRef(0);

  const { scratchGrain } = useScratchSound();

  // ============================================
  // DIMENSIONS
  // ============================================
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const w = Math.min(Math.max(vw * 0.92, 280), 360);
      const h = w * 0.625;
      setDimensions({ width: w, height: h });
      rectRef.current = null;
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ============================================
  // CANVAS INIT — opaque scratch layer (NO alpha compositing issues)
  // ============================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealedRef.current || dimensions.width === 0) return;

    // Alpha canvas needed for destination-out to create transparent holes
    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
    if (!ctx) return;
    ctxRef.current = ctx;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = dimensions.width;
    const h = dimensions.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    // ── Gold metallic background ──
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#B8860B');
    bgGrad.addColorStop(0.25, '#DAA520');
    bgGrad.addColorStop(0.5, '#FFD700');
    bgGrad.addColorStop(0.75, '#DAA520');
    bgGrad.addColorStop(1, '#B8860B');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Noise texture ──
    const sr = (i: number) => {
      const x = Math.sin(42 + i * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = sr(i + 3000) > 0.5
        ? `rgba(255,255,255,${0.08 + sr(i + 2000) * 0.12})`
        : `rgba(0,0,0,${0.08 + sr(i + 2000) * 0.12})`;
      ctx.fillRect(sr(i) * w, sr(i + 1000) * h, 1, 1);
    }

    // ── Diagonal shine (static, baked into canvas — no overlay needed) ──
    const shine = ctx.createLinearGradient(w * 0.2, 0, w * 0.5, h);
    shine.addColorStop(0, 'rgba(255,255,255,0)');
    shine.addColorStop(0.4, 'rgba(255,255,255,0.15)');
    shine.addColorStop(0.5, 'rgba(255,255,255,0.25)');
    shine.addColorStop(0.6, 'rgba(255,255,255,0.15)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, w, h);

    // ── Stars ──
    const stars = [
      [0.12,0.2],[0.88,0.15],[0.15,0.78],[0.85,0.82],
      [0.5,0.12],[0.5,0.88],[0.25,0.5],[0.75,0.5],
    ];
    stars.forEach(([sx, sy], i) => {
      const size = 4 + sr(i + 5000) * 5;
      const a = 0.4 + sr(i + 6000) * 0.4;
      ctx.save();
      ctx.translate(sx * w, sy * h);
      ctx.fillStyle = `rgba(255,248,220,${a})`;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(size * 0.15, -size * 0.15, size, 0);
      ctx.quadraticCurveTo(size * 0.15, size * 0.15, 0, size);
      ctx.quadraticCurveTo(-size * 0.15, size * 0.15, -size, 0);
      ctx.quadraticCurveTo(-size * 0.15, -size * 0.15, 0, -size);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // ── Border ──
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, 10);
    ctx.stroke();

    // ── Coin ──
    const cx = w / 2, cy = h / 2 - 10, cr = 22;
    ctx.beginPath();
    ctx.arc(cx, cy + 2, cr + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(139,90,0,0.4)';
    ctx.fill();

    const coinGrad = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, cr);
    coinGrad.addColorStop(0, '#FFF8DC');
    coinGrad.addColorStop(0.3, '#FFD700');
    coinGrad.addColorStop(0.7, '#DAA520');
    coinGrad.addColorStop(1, '#B8860B');
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = coinGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,248,220,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#8B6914';
    ctx.font = `bold ${cr}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', cx, cy + 1);

    ctx.beginPath();
    ctx.arc(cx - 6, cy - 8, cr * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();

    // ── Text ──
    const ty = cy + cr + 22;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(139,90,0,0.6)';
    ctx.font = `bold ${Math.round(w * 0.055)}px system-ui, sans-serif`;
    ctx.fillText('✨  RASPE AQUI  ✨', cx, ty + 1);
    ctx.fillStyle = '#FFF8DC';
    ctx.fillText('✨  RASPE AQUI  ✨', cx, ty);
    ctx.fillStyle = 'rgba(255,248,220,0.5)';
    ctx.font = `${Math.round(w * 0.033)}px system-ui, sans-serif`;
    ctx.fillText('seu prêmio está escondido aqui', cx, ty + 18);

    // ── SCRATCHING: Use "source-out" to paint TRANSPARENT pixels ──
    // On opaque canvas, scratched areas become BLACK (rgb 0,0,0)
    // We track this via the grid, not pixel color
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = BRUSH_RADIUS * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Grid init
    gridRef.current = new Uint8Array(GRID_ROWS * GRID_COLS);
  }, [dimensions]);

  // ============================================
  // IMMEDIATE DRAW (no RAF, no batching, no state updates during touch)
  // ============================================
  const drawImmediate = useCallback((x: number, y: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const prev = lastPointRef.current;
    let velocity = 5; // default
    if (prev) {
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      const dx = x - prev.x;
      const dy = y - prev.y;
      velocity = Math.sqrt(dx * dx + dy * dy);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPointRef.current = { x, y };

    // Play scratch grain based on movement speed
    scratchGrain(velocity);

    // Grid mark (lightweight — only mark, no progress calc)
    const grid = gridRef.current;
    if (!grid || dimensions.width === 0) return;
    const cw = dimensions.width / GRID_COLS;
    const ch = dimensions.height / GRID_ROWS;
    const rSq = BRUSH_RADIUS * BRUSH_RADIUS;
    const c0 = Math.max(0, ((x - BRUSH_RADIUS) / cw) | 0);
    const c1 = Math.min(GRID_COLS - 1, ((x + BRUSH_RADIUS) / cw) | 0);
    const r0 = Math.max(0, ((y - BRUSH_RADIUS) / ch) | 0);
    const r1 = Math.min(GRID_ROWS - 1, ((y + BRUSH_RADIUS) / ch) | 0);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const idx = r * GRID_COLS + c;
        if (grid[idx]) continue;
        const dx = (c + 0.5) * cw - x;
        const dy = (r + 0.5) * ch - y;
        if (dx * dx + dy * dy <= rSq) grid[idx] = 1;
      }
    }
  }, [dimensions, scratchGrain]);

  // Check progress — only called on touchend
  const checkReveal = useCallback(() => {
    const grid = gridRef.current;
    if (!grid || revealedRef.current) return;
    let s = 0;
    for (let i = 0; i < grid.length; i++) s += grid[i];
    const pct = (s / grid.length) * 100;
    if (pct >= REVEAL_THRESHOLD) {
      revealedRef.current = true;
      setIsRevealed(true);
      onReveal();
    }
  }, [onReveal]);

  // ============================================
  // TOUCH HANDLERS — direct native events, zero React overhead
  // ============================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealedRef.current) return;

    let rect: DOMRect | null = null;

    const getXY = (clientX: number, clientY: number) => {
      if (!rect) rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = true;
      lastPointRef.current = null;
      moveCountRef.current = 0;
      rect = null;
      const t = e.touches[0];
      const { x, y } = getXY(t.clientX, t.clientY);
      if (x >= 0 && y >= 0 && x <= dimensions.width && y <= dimensions.height) {
        drawImmediate(x, y);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDrawingRef.current || revealedRef.current) return;
      e.preventDefault();
      const t = e.touches[0];
      const { x, y } = getXY(t.clientX, t.clientY);
      if (x >= 0 && y >= 0 && x <= dimensions.width && y <= dimensions.height) {
        drawImmediate(x, y);
      }
      if (++moveCountRef.current % REVEAL_CHECK_INTERVAL === 0) {
        checkReveal();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = false;
      lastPointRef.current = null;
      moveCountRef.current = 0;
      checkReveal();
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [dimensions, drawImmediate, checkReveal]);

  // ============================================
  // MOUSE (desktop)
  // ============================================
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDrawingRef.current = true;
      lastPointRef.current = null;
      rectRef.current = null;
      moveCountRef.current = 0;
      if (!rectRef.current) rectRef.current = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rectRef.current.left;
      const y = e.clientY - rectRef.current.top;
      drawImmediate(x, y);
    },
    [drawImmediate]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (revealedRef.current) return;
      // Auto-resume if mouse re-enters with button held (after mouseLeave)
      if (e.buttons === 1 && !isDrawingRef.current) {
        isDrawingRef.current = true;
        lastPointRef.current = null;
        if (!rectRef.current) rectRef.current = canvasRef.current!.getBoundingClientRect();
      }
      if (!isDrawingRef.current || !rectRef.current) return;
      const x = e.clientX - rectRef.current.left;
      const y = e.clientY - rectRef.current.top;
      if (x >= 0 && y >= 0 && x <= dimensions.width && y <= dimensions.height) {
        drawImmediate(x, y);
      }
      // Throttled reveal check
      if (++moveCountRef.current % REVEAL_CHECK_INTERVAL === 0) {
        checkReveal();
      }
    },
    [dimensions, drawImmediate, checkReveal]
  );

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    checkReveal();
  }, [checkReveal]);

  const handleMouseLeave = useCallback(() => {
    // Don't kill isDrawingRef — user might come back with button still held
    lastPointRef.current = null; // Break the line for continuity
  }, []);


  // ============================================
  // RENDER — Minimal layers, no overlays, no progress indicator during scratch
  // ============================================
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
        {/* Prize (behind) — static, no Framer Motion animation until revealed */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex flex-col items-center justify-center p-6">
          {isRevealed ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-center"
            >
              <Gift className="w-12 h-12 mx-auto mb-3 text-white" />
              <h3 className="text-2xl font-bold text-white mb-1">{prize}</h3>
              <p className="text-white/80 text-sm">{description}</p>
            </motion.div>
          ) : (
            <div className="text-center opacity-30">
              <Gift className="w-12 h-12 mx-auto mb-3 text-white" />
              <h3 className="text-2xl font-bold text-white mb-1">{prize}</h3>
              <p className="text-white/80 text-sm">{description}</p>
            </div>
          )}
        </div>

        {/* Canvas — NO overlays on top, NO shimmer, NO progress badge */}
        {!isRevealed && dimensions.width > 0 && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 rounded-2xl cursor-pointer"
            style={{
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        )}
      </div>
    </div>
  );
}
