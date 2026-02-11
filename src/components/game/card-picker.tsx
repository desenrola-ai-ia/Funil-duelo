'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSoundKit } from '@/hooks/useSoundKit';
import { useHaptics } from '@/hooks/useHaptics';
import type { PersonaData } from '@/types';

// ============================================
// CARD PICKER - Mecanica de selecao por cartas
// Round 2: Usuario escolhe 1 de 3 cartas viradas
// ============================================

interface CardPickerProps {
  personas: PersonaData[];
  onSelect: (persona: PersonaData) => void;
  disabled?: boolean;
  className?: string;
}

export function CardPicker({ personas, onSelect, disabled, className }: CardPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { play } = useSoundKit();
  const { tap } = useHaptics();

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }, []);

  const playButtonClickSound = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.08);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now);
      osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.06);
      gain2.gain.setValueAtTime(0.15, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.08);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(110, now);
      gain3.gain.setValueAtTime(0.2, now);
      gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now);
      osc3.stop(now + 0.12);
    } catch (e) {
      // Ignora erros de áudio
    }
  }, []);

  const shuffledPersonas = useMemo(() => {
    return [...personas].sort(() => Math.random() - 0.5);
  }, [personas]);

  const selectedPersona = selectedIndex !== null ? shuffledPersonas[selectedIndex] : null;

  const handleCardClick = (index: number) => {
    if (disabled || isFlipping || selectedIndex !== null) return;

    // Efeitos do click
    console.log('🎴 CARD CLICK: Playing microsound1');
    play('microsound1');
    tap();
    
    initAudioContext();
    setSelectedIndex(index);
    setIsFlipping(true);

    // Som + confetti no meio do flip (quando o verso fica visível)
    setTimeout(() => {
      play('win', { volumeOverride: 0.35 });
      tap();
    }, 280);

    // Estado de revealed ao terminar o flip
    setTimeout(() => {
      setIsFlipping(false);
      setIsRevealed(true);
    }, 600);
  };

  const handleContinue = () => {
    if (selectedPersona) {
      playButtonClickSound();
      onSelect(selectedPersona);
    }
  };

  const cardGradients = [
    'from-purple-600 to-pink-600',
    'from-blue-600 to-purple-600',
    'from-pink-600 to-rose-600',
  ];

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* 3 cartas lado a lado */}
      <div className="flex gap-4 mb-8">
        {[0, 1, 2].map((index) => {
          const isSelected = selectedIndex === index;
          const isOther = selectedIndex !== null && selectedIndex !== index;
          const persona = shuffledPersonas[index];

          return (
            <motion.div
              key={index}
              className="relative cursor-pointer"
              style={{ perspective: 1000 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: isOther ? 0.3 : 1,
                y: 0,
                scale: isOther ? 0.9 : 1,
              }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              onClick={() => handleCardClick(index)}
              whileHover={selectedIndex === null ? { scale: 1.05, y: -5 } : {}}
              whileTap={selectedIndex === null ? { scale: 0.95 } : {}}
            >
              <motion.div
                className="relative w-24 h-36 sm:w-28 sm:h-40"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{
                  rotateY: isSelected ? 180 : 0,
                }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              >
                {/* Frente da carta (virada - mostra ?) */}
                <div
                  className={cn(
                    'absolute inset-0 rounded-2xl flex flex-col items-center justify-center',
                    'bg-gradient-to-br shadow-xl border-2 border-white/20',
                    cardGradients[index],
                  )}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-5xl font-bold text-white/90">?</span>
                  <span className="text-xs text-white/60 mt-2">Carta {index + 1}</span>
                </div>

                {/* Verso da carta (persona com foto) */}
                <div
                  className={cn(
                    'absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-3',
                    'bg-zinc-800 border-2 border-zinc-700 shadow-xl overflow-hidden',
                  )}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {/* Shine effect no reveal */}
                  {isSelected && isRevealed && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-2xl"
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      style={{ pointerEvents: "none", zIndex: 10 }}
                    />
                  )}
                  {persona && (
                    <>
                      {/* Avatar com foto */}
                      <div className="w-14 h-14 rounded-full overflow-hidden mb-2 border-2 border-white/20">
                        {persona.persona.image ? (
                          <img
                            src={persona.persona.image}
                            alt={persona.persona.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={cn(
                            'w-full h-full flex items-center justify-center',
                            'bg-gradient-to-br',
                            cardGradients[index],
                          )}>
                            <User className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Nome */}
                      <span className="text-white text-sm font-semibold text-center">
                        {persona.persona.name}
                      </span>

                      {/* Idade */}
                      <span className="text-zinc-400 text-xs">
                        {persona.persona.age} anos
                      </span>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Indicador de selecao */}
              {isSelected && isRevealed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 z-10"
                >
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Info da persona revelada */}
      <AnimatePresence>
        {isRevealed && selectedPersona && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-xs"
          >
            {/* Card com detalhes */}
            <div className="bg-zinc-900 rounded-2xl p-4 mb-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/50">
                  {selectedPersona.persona.image ? (
                    <img
                      src={selectedPersona.persona.image}
                      alt={selectedPersona.persona.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {selectedPersona.persona.name}, {selectedPersona.persona.age}
                  </h3>
                  <p className="text-zinc-400 text-sm truncate max-w-[180px]">
                    {selectedPersona.persona.bio}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
                  Contexto
                </p>
                <p className="text-sm text-zinc-300">
                  {selectedPersona.persona.context}
                </p>
              </div>
            </div>

            {/* Botao continuar */}
            <Button
              onClick={handleContinue}
              size="xl"
              fullWidth
              className="font-bold text-lg bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 hover:from-purple-500 hover:via-pink-400 hover:to-purple-500 shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 border border-purple-400/30 hover:border-purple-300/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(236, 72, 153, 0.2), 0 4px 15px rgba(0, 0, 0, 0.3)',
              }}
            >
              Conversar com {selectedPersona.persona.name}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint antes de selecionar */}
      {selectedIndex === null && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-zinc-500 text-sm text-center"
        >
          Toque em uma carta para revelar
        </motion.p>
      )}
    </div>
  );
}
