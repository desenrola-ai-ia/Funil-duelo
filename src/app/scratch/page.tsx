'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { ScratchCard } from '@/components/game';
import { ROUTES, UI_TEXTS, GAME_CONFIG } from '@/constants';

// ============================================
// SCRATCH PAGE (Raspadinha)
// ============================================

export default function ScratchPage() {
  const router = useRouter();
  const [isRevealed, setIsRevealed] = useState(false);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleActivate = () => {
    router.push(ROUTES.CHECKOUT);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>

          <h1 className="text-2xl font-bold text-white mb-2">
            {UI_TEXTS.SCRATCH.TITLE}
          </h1>
        </motion.div>

        {/* Scratch card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <ScratchCard
            prize={UI_TEXTS.SCRATCH.PRIZE}
            description={UI_TEXTS.SCRATCH.PRIZE_DESCRIPTION}
            onReveal={handleReveal}
          />
        </motion.div>

        {/* CTA Button (appears after reveal) */}
        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Button
                onClick={handleActivate}
                size="xl"
                fullWidth
                className="animate-pulse-glow"
              >
                {UI_TEXTS.BUTTONS.ACTIVATE_TRIAL}
              </Button>

              <p className="text-center text-zinc-500 text-sm mt-4">
                {GAME_CONFIG.FREE_TRIAL_DAYS} dias gratis - sem cobranca hoje
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint (before reveal) */}
        {!isRevealed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-zinc-500 text-sm"
          >
            Use o dedo para raspar e revelar seu premio
          </motion.p>
        )}
      </div>
    </main>
  );
}
