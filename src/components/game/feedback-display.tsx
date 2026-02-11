'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TierFeedback, ResponseTier } from '@/types';

// ============================================
// TYPES
// ============================================

interface FeedbackDisplayProps {
  feedback: TierFeedback | null;
  isWin: boolean;
  tier?: ResponseTier | null;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function FeedbackDisplay({
  feedback,
  isWin,
  tier,
  className,
}: FeedbackDisplayProps) {
  if (!feedback) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={
          tier === 'D'
            ? { opacity: 1, scale: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
            : tier === 'C'
            ? { opacity: 1, scale: [0.8, 0.98, 1], y: 0 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={
          tier === 'D' || tier === 'C'
            ? { duration: tier === 'D' ? 0.5 : 0.4 }
            : { type: 'spring', stiffness: 200, damping: 15 }
        }
        className={cn(
          'rounded-2xl p-6 text-center',
          feedback.bgColor,
          className
        )}
      >
        {/* Result icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          className="text-5xl mb-3"
        >
          {isWin ? '🎯' : '💀'}
        </motion.div>

        {/* Feedback message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'text-xl font-bold uppercase tracking-wide',
            feedback.color
          )}
        >
          {feedback.message}
        </motion.p>

        {/* Win/Loss indicator */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={cn(
            'mt-2 text-sm font-medium',
            isWin ? 'text-green-400' : 'text-red-400'
          )}
        >
          {isWin ? 'Você venceu a rodada!' : 'Você perdeu a rodada'}
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}
