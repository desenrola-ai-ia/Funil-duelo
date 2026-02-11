'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';
import { Button } from '@/components/ui';
import { useSoundKit } from '@/hooks/useSoundKit';
import { useHaptics } from '@/hooks/useHaptics';
import { embersBoss } from '@/lib/particles';
import { UI_TEXTS, ROUTES, getRoundConfig, getPersonaById } from '@/constants';
import { useGameStore } from '@/stores';
import type { PersonaData } from '@/types';

// ============================================
// ROUND 3 PAGE - Desafio Final (Dificuldade Difícil)
// ============================================

export default function Round3Page() {
  const router = useRouter();
  const { selectPersonaForRound, setRoundPlaying, rounds, isGameOver } = useGameStore();
  const { play } = useSoundKit();
  const { heavy } = useHaptics();

  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const roundConfig = getRoundConfig(3);

  // Se o round 3 já foi respondido, redireciona para o resultado
  useEffect(() => {
    if (rounds[2]?.status === 'completed') {
      router.replace(ROUTES.DUELO_RESULT);
    }
  }, [rounds, router]);

  // Seleciona persona aleatoria HARD no mount
  useEffect(() => {
    const randomPersona = getPersonaById('valentina');
    if (!randomPersona) return;
    setPersona(randomPersona);

    // Som inicial (whoosh leve)
    play('whoosh', { volumeOverride: 0.3 });

    // Revela apos pequeno delay para efeito dramatico
    const timer = setTimeout(() => {
      // Efeitos do boss reveal
      play('sparkle', { volumeOverride: 0.4 }); // Boss reveal dramático
      embersBoss();
      heavy();
      setIsRevealed(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [play, heavy]);

  const handleContinue = () => {
    if (persona) {
      selectPersonaForRound(3, persona);
      setRoundPlaying(3);
      router.push(ROUTES.DUELO_ROUND);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-950">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* Round indicator */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-full px-4 py-2 mb-4"
          >
            <span className="text-lg">{roundConfig.emoji}</span>
            <span className="text-sm font-medium text-red-300">{roundConfig.label}</span>
          </motion.div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-2xl shadow-red-500/40"
          >
            <Flame className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-2"
          >
            {UI_TEXTS.ROUND_3.TITLE}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-400 mb-2"
          >
            {UI_TEXTS.ROUND_3.SUBTITLE}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-red-400 text-sm font-medium"
          >
            {roundConfig.description}
          </motion.p>
        </motion.div>

        {/* Persona Card */}
        {persona && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isRevealed ? 1 : 0.5, scale: isRevealed ? 1 : 0.95 }}
            transition={{ duration: 0.5 }}
            className={`
              bg-zinc-900 rounded-3xl p-6 mb-8 border-2
              ${isRevealed ? 'border-red-500/50 shadow-2xl shadow-red-500/20' : 'border-zinc-800'}
              transition-all duration-500
            `}
          >
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: isRevealed ? 1 : 0.8, opacity: isRevealed ? 1 : 0.5 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mb-4 shadow-lg shadow-red-500/30 overflow-hidden"
              >
                {persona.persona.image ? (
                  <img
                    src={persona.persona.image}
                    alt={persona.persona.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">{persona.persona.name[0]}</span>
                )}
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isRevealed ? 1 : 0, y: isRevealed ? 0 : 10 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="text-center"
              >
                <h2 className="text-2xl font-bold text-white mb-1">
                  {persona.persona.name}, {persona.persona.age}
                </h2>
                <p className="text-zinc-400 text-sm mb-4">{persona.persona.bio}</p>

                {/* Context */}
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Contexto</p>
                  <p className="text-sm text-zinc-300">{persona.persona.context}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isRevealed ? 1 : 0, y: isRevealed ? 0 : 20 }}
          transition={{ delay: 0.7 }}
          className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4"
        >
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-purple-200">
              Essa rodada é a mais difícil. O{' '}
              <span className="font-semibold">Teclado IA</span> pode fazer a
              diferenca.
            </p>
          </div>
        </motion.div>

        {/* Hint do plot twist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isRevealed ? 1 : 0, y: isRevealed ? 0 : 20 }}
          transition={{ delay: 1.0 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 mb-6 text-center"
        >
          <p className="text-xs text-zinc-500">
            🤫 Tem gente que guarda a IA pra hora do boss…
          </p>
        </motion.div>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isRevealed ? 1 : 0, y: isRevealed ? 0 : 20 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={handleContinue}
            size="xl"
            fullWidth
            className="font-bold text-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
            disabled={!isRevealed}
          >
            {UI_TEXTS.ROUND_3.BUTTON_CONTINUE}
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
