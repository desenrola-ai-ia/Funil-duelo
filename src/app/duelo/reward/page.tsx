'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { useSoundKit } from '@/hooks/useSoundKit';
import { useHaptics } from '@/hooks/useHaptics';
import { useAnalytics } from '@/hooks/useAnalytics';
import { confettiBig, sparklesSmall } from '@/lib/particles';
import { ScratchCard } from '@/components/game';
import { ROUTES, UI_TEXTS, GAME_CONFIG } from '@/constants';

// ============================================
// REWARD PAGE - /duelo/reward (Raspadinha)
// Funcao: recompensa gamificada
// Sempre revela: 7 dias grátis
// ============================================

export default function DueloRewardPage() {
  const router = useRouter();
  const [isRevealed, setIsRevealed] = useState(false);
  const startTimeRef = useRef<number>(0);
  const { play } = useSoundKit();
  const { heavy } = useHaptics();
  const { track } = useAnalytics();

  useEffect(() => {
    startTimeRef.current = Date.now();
    track('reward_view');
  }, [track]);

  const handleReveal = () => {
    setIsRevealed(true);

    // Track reveal
    const timeToRevealMs = Date.now() - startTimeRef.current;
    track('reward_reveal', { timeToRevealMs });

    // Efeitos do reveal completo
    play('reward');
    confettiBig();
    heavy();

    // Segundo burst de confetti
    setTimeout(() => {
      sparklesSmall();
    }, 600);
  };

  const handleActivate = () => {
    router.push(ROUTES.CHECKOUT);
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
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-yellow-500/40"
          >
            <Gift className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Raspe para revelar
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-400 text-sm"
          >
            Você desbloqueou um bônus especial
          </motion.p>
        </motion.div>

        {/* Scratch card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <ScratchCard
            prize={`${GAME_CONFIG.FREE_TRIAL_DAYS} dias grátis`}
            description="Acesso completo ao Desenrola AI"
            onReveal={handleReveal}
          />
        </motion.div>

        {/* CTA after reveal */}
        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-4"
            >
              {/* Success checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="flex items-center justify-center gap-2 text-green-400 mb-4"
              >
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span className="font-medium">{GAME_CONFIG.FREE_TRIAL_DAYS} dias grátis desbloqueados!</span>
              </motion.div>

              {/* Activate button */}
              <Button
                onClick={handleActivate}
                size="xl"
                fullWidth
                className="animate-pulse-glow font-bold"
              >
                {UI_TEXTS.BUTTONS.ACTIVATE_TRIAL}
              </Button>

              {/* Info text */}
              <div className="text-center space-y-1">
                <p className="text-zinc-400 text-sm">
                  Cartao necessario para ativar
                </p>
                <p className="text-zinc-500 text-xs">
                  Sem cobranca hoje - cancele quando quiser
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint before reveal */}
        {!isRevealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Use o dedo para raspar</span>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
