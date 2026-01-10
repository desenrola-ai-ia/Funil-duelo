'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Persona } from '@/types';

// ============================================
// TYPES
// ============================================

interface PersonaCardProps {
  persona: Persona;
  context: string;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function PersonaCard({ persona, context, className }: PersonaCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-zinc-900 rounded-2xl p-4 border border-zinc-800',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar placeholder */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          {persona.image ? (
            <img
              src={persona.image}
              alt={persona.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-7 h-7 text-white" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-lg">
              {persona.name}
            </h3>
            <span className="text-zinc-500 text-sm">
              {persona.age}
            </span>
          </div>

          <p className="text-zinc-400 text-sm mt-0.5 truncate">
            {persona.bio}
          </p>
        </div>
      </div>

      {/* Context */}
      <div className="mt-3 pt-3 border-t border-zinc-800">
        <p className="text-zinc-500 text-xs leading-relaxed">
          {context}
        </p>
      </div>
    </motion.div>
  );
}
