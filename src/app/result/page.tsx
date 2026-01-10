'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Skull } from 'lucide-react';
import { Button } from '@/components/ui';
import { AdvantageBar } from '@/components/game';
import { useGameStore } from '@/stores';
import { ROUTES, UI_TEXTS } from '@/constants';

// ============================================
// RESULT PAGE
// ============================================

export default function ResultPage() {
  const router = useRouter();
  const { playerScore, opponentScore, hasWon, isGameOver } = useGameStore();

  // Redirect if game not finished
  useEffect(() => {
    if (!isGameOver) {
      router.push(ROUTES.HOME);
    }
  }, [isGameOver, router]);

  const handleContinue = () => {
    router.push(ROUTES.SCRATCH);
  };

  if (!isGameOver) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto text-center">
        {/* Result icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
            hasWon
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30'
              : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30'
          }`}
        >
          {hasWon ? (
            <Trophy className="w-12 h-12 text-white" />
          ) : (
            <Skull className="w-12 h-12 text-white" />
          )}
        </motion.div>

        {/* Result title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`text-3xl font-bold mb-2 ${
            hasWon ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {hasWon ? UI_TEXTS.RESULT.WIN : UI_TEXTS.RESULT.LOSS}
        </motion.h1>

        {/* Score display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center items-center gap-6 my-8"
        >
          <div className="text-center">
            <span className={`text-5xl font-bold ${hasWon ? 'text-green-400' : 'text-white'}`}>
              {playerScore}
            </span>
            <p className="text-xs text-zinc-500 mt-1">Voce</p>
          </div>
          <span className="text-zinc-600 text-2xl">-</span>
          <div className="text-center">
            <span className={`text-5xl font-bold ${!hasWon ? 'text-red-400' : 'text-white'}`}>
              {opponentScore}
            </span>
            <p className="text-xs text-zinc-500 mt-1">Cara Medio</p>
          </div>
        </motion.div>

        {/* Advantage bar final */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <AdvantageBar
            playerScore={playerScore}
            opponentScore={opponentScore}
          />
        </motion.div>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-zinc-400 mb-8"
        >
          {hasWon ? UI_TEXTS.RESULT.WIN_MESSAGE : UI_TEXTS.RESULT.LOSS_MESSAGE}
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={handleContinue}
            size="xl"
            fullWidth
            className="animate-pulse-glow"
          >
            {UI_TEXTS.BUTTONS.UNLOCK_REWARD}
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
