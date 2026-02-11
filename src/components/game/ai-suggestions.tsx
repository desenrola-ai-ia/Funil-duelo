'use client';

import { useState } from 'react';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (suggestion: AISuggestion) => {
    setSelectedId(suggestion.id);
    setTimeout(() => setSelectedId(null), 400);
    onSelect(suggestion);
  };

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
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
            </motion.div>
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
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  scale: selectedId === suggestion.id ? [1, 1.03, 1] : 1,
                  boxShadow: selectedId === suggestion.id 
                    ? ['0 0 0px rgba(168, 85, 247, 0)', '0 0 20px rgba(168, 85, 247, 0.6)', '0 0 0px rgba(168, 85, 247, 0)']
                    : '0 0 0px rgba(168, 85, 247, 0)'
                }}
                transition={{ 
                  delay: index * 0.1,
                  scale: { duration: 0.3 },
                  boxShadow: { duration: 0.4 }
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '0 0 12px rgba(168, 85, 247, 0.3)'
                }}
                onClick={() => handleSelect(suggestion)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-all relative',
                  'bg-zinc-800/50 border-zinc-700 hover:border-purple-500 hover:bg-purple-500/10',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500',
                  'shadow-[0_0_8px_rgba(168,85,247,0.15)] hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                )}
                style={{
                  backgroundImage: 'linear-gradient(135deg, rgba(168, 85, 247, 0.02) 0%, rgba(168, 85, 247, 0.08) 100%)'
                }}
              >
                {/* Breathing glow overlay */}
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  animate={{
                    boxShadow: [
                      '0 0 5px rgba(168, 85, 247, 0.1)',
                      '0 0 12px rgba(168, 85, 247, 0.2)',
                      '0 0 5px rgba(168, 85, 247, 0.1)'
                    ]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
                <p className="text-white text-sm relative z-10">{suggestion.content}</p>
              </motion.button>
            ))}
          </div>

          {/* Note */}
          <p className="text-zinc-600 text-xs mt-3 text-center">
            A IA le o contexto é sugere respostas melhores que a media
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
