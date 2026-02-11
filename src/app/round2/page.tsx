'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { CardPicker } from '@/components/game';
import { UI_TEXTS, ROUTES, getRoundConfig, MEDIUM_PERSONAS } from '@/constants';
import { useGameStore } from '@/stores';
import type { PersonaData } from '@/types';

// ============================================
// ROUND 2 PAGE - Cartas (Dificuldade Media)
// ============================================

export default function Round2Page() {
  const router = useRouter();
  const { selectPersonaForRound, setRoundPlaying, rounds } = useGameStore();

  const roundConfig = getRoundConfig(2);

  // Se o round 2 já foi respondido, redireciona para o round 3
  useEffect(() => {
    if (rounds[1]?.status === 'completed') {
      router.replace(ROUTES.ROUND_3);
    }
  }, [rounds, router]);

  const handleSelect = (personaData: PersonaData) => {
    selectPersonaForRound(2, personaData);
    setRoundPlaying(2);
    router.push(ROUTES.DUELO_ROUND);
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
            className="inline-flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2 mb-4"
          >
            <span className="text-lg">{roundConfig.emoji}</span>
            <span className="text-sm font-medium text-zinc-300">{roundConfig.label}</span>
          </motion.div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/40"
          >
            <Layers className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-2"
          >
            {UI_TEXTS.ROUND_2.TITLE}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-400 mb-2"
          >
            {UI_TEXTS.ROUND_2.SUBTITLE}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-zinc-500 text-sm"
          >
            {roundConfig.description}
          </motion.p>
        </motion.div>

        {/* Card Picker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <CardPicker personas={MEDIUM_PERSONAS} onSelect={handleSelect} />
        </motion.div>
      </div>
    </main>
  );
}
