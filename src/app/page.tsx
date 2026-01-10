'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Swords, Brain, MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui';
import { UI_TEXTS, ROUTES, GAME_CONFIG } from '@/constants';
import { useGameStore } from '@/stores';

// ============================================
// LANDING PAGE (Intro)
// ============================================

export default function LandingPage() {
  const router = useRouter();
  const resetGame = useGameStore((state) => state.resetGame);

  const handleStart = () => {
    resetGame();
    router.push(ROUTES.DUEL);
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
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30"
          >
            <Swords className="w-10 h-10 text-white" />
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-2">
            {UI_TEXTS.GAME_TITLE}
          </h1>

          {/* Subtitle */}
          <p className="text-zinc-400 text-lg">
            {UI_TEXTS.GAME_SUBTITLE}
          </p>
        </motion.div>

        {/* Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900 rounded-2xl p-6 mb-6"
        >
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">
            Como funciona
          </h2>

          <ul className="space-y-3">
            {UI_TEXTS.RULES.map((rule, index) => {
              const icons = [Swords, MessageSquare, Brain];
              const Icon = icons[index];

              return (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-zinc-300">{rule}</span>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>

        {/* AI Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-8"
        >
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-400">
              A IA le o contexto e sugere respostas melhores que a media.
            </p>
          </div>
        </motion.div>

        {/* Score preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center items-center gap-6 mb-8"
        >
          <div className="text-center">
            <span className="text-4xl font-bold text-white">0</span>
            <p className="text-xs text-zinc-500 mt-1">Voce</p>
          </div>
          <span className="text-zinc-700 text-lg">VS</span>
          <div className="text-center">
            <span className="text-4xl font-bold text-white">0</span>
            <p className="text-xs text-zinc-500 mt-1">{GAME_CONFIG.OPPONENT_NAME}</p>
          </div>
        </motion.div>

        {/* Start button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={handleStart}
            size="xl"
            fullWidth
            className="animate-pulse-glow"
          >
            {UI_TEXTS.BUTTONS.START_GAME}
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
