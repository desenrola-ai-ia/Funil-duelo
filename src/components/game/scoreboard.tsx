'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GAME_CONFIG } from '@/constants';

// ============================================
// TYPES
// ============================================

interface ScoreboardProps {
  playerScore: number;
  opponentScore: number;
  currentRound: number;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function Scoreboard({
  playerScore,
  opponentScore,
  currentRound,
  className,
}: ScoreboardProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Round indicator */}
      <div className="text-zinc-500 text-sm font-medium">
        Rodada {currentRound} / {GAME_CONFIG.TOTAL_ROUNDS}
      </div>

      {/* Score display */}
      <div className="flex items-center gap-6">
        {/* Player */}
        <div className="flex flex-col items-center">
          <motion.span
            key={playerScore}
            initial={{ scale: 1.5, color: '#a855f7' }}
            animate={{ scale: 1, color: '#ffffff' }}
            className="text-4xl font-bold text-white"
          >
            {playerScore}
          </motion.span>
          <span className="text-xs text-zinc-400 mt-1">Voce</span>
        </div>

        {/* VS */}
        <span className="text-zinc-600 text-lg font-bold">VS</span>

        {/* Opponent */}
        <div className="flex flex-col items-center">
          <motion.span
            key={opponentScore}
            initial={{ scale: 1.5, color: '#ef4444' }}
            animate={{ scale: 1, color: '#ffffff' }}
            className="text-4xl font-bold text-white"
          >
            {opponentScore}
          </motion.span>
          <span className="text-xs text-zinc-400 mt-1">{GAME_CONFIG.OPPONENT_NAME}</span>
        </div>
      </div>
    </div>
  );
}
