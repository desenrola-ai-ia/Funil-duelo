'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AISuggestion } from '@/types';

// ============================================
// TYPES
// ============================================

interface AISuggestionsProps {
  suggestions: AISuggestion[];
  onSelect: (suggestion: AISuggestion) => void;
  isVisible: boolean;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function AISuggestions({
  suggestions,
  onSelect,
  isVisible,
  className,
}: AISuggestionsProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={cn('overflow-hidden', className)}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">
              Sugestoes do Teclado IA
            </span>
          </div>

          {/* Suggestions list */}
          <div className="flex flex-col gap-2">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onSelect(suggestion)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-all',
                  'bg-zinc-800/50 border-zinc-700 hover:border-purple-500 hover:bg-purple-500/10',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500'
                )}
              >
                <p className="text-white text-sm">{suggestion.content}</p>
              </motion.button>
            ))}
          </div>

          {/* Note */}
          <p className="text-zinc-600 text-xs mt-3 text-center">
            A IA le o contexto e sugere respostas melhores que a media
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
