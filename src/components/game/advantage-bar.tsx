'use client';

import { motion } from 'framer-motion';
import { cn, calculateAdvantagePercentage } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface AdvantageBarProps {
  playerScore: number;
  opponentScore: number;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function AdvantageBar({
  playerScore,
  opponentScore,
  className,
}: AdvantageBarProps) {
  const playerPercentage = calculateAdvantagePercentage(playerScore, opponentScore);

  return (
    <div className={cn('w-full', className)}>
      {/* Labels */}
      <div className="flex justify-between text-xs text-zinc-500 mb-1">
        <span>Voce</span>
        <span>Cara Medio</span>
      </div>

      {/* Bar container */}
      <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-zinc-700 z-10" />

        {/* Player advantage (left side - purple) */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-600 to-purple-500"
          initial={{ width: '50%' }}
          animate={{ width: `${playerPercentage}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />

        {/* Opponent advantage (right side - red) */}
        <motion.div
          className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-red-600 to-red-500"
          initial={{ width: '50%' }}
          animate={{ width: `${100 - playerPercentage}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />

        {/* Glowing center point */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg shadow-white/50 z-20"
          initial={{ left: '50%', x: '-50%' }}
          animate={{ left: `${playerPercentage}%`, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />
      </div>
    </div>
  );
}
