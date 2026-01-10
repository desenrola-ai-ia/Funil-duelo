'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { AISuggestions } from './ai-suggestions';
import type { AISuggestion, ResponseType } from '@/types';

// ============================================
// TYPES
// ============================================

interface ResponseInputProps {
  aiSuggestions: AISuggestion[];
  onSubmit: (response: string, type: ResponseType, suggestion?: AISuggestion) => void;
  disabled?: boolean;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function ResponseInput({
  aiSuggestions,
  onSubmit,
  disabled = false,
  className,
}: ResponseInputProps) {
  const [response, setResponse] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleTypedSubmit = () => {
    if (!response.trim()) return;
    onSubmit(response.trim(), 'typed');
    setResponse('');
  };

  const handleAISelect = (suggestion: AISuggestion) => {
    onSubmit(suggestion.content, 'ai_suggestion', suggestion);
    setShowSuggestions(false);
    setResponse('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTypedSubmit();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* AI Suggestions toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSuggestions(!showSuggestions)}
        disabled={disabled}
        className="w-full justify-center gap-2 border border-purple-500/30 hover:border-purple-500"
      >
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-purple-400">
          {showSuggestions ? 'Esconder sugestoes' : 'Ver sugestoes do Teclado IA'}
        </span>
      </Button>

      {/* AI Suggestions list */}
      <AISuggestions
        suggestions={aiSuggestions}
        onSelect={handleAISelect}
        isVisible={showSuggestions}
      />

      {/* Divider */}
      {!showSuggestions && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-xs">ou digite sua resposta</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>
      )}

      {/* Text input */}
      {!showSuggestions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua resposta..."
            disabled={disabled}
            className={cn(
              'flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
          <Button
            onClick={handleTypedSubmit}
            disabled={disabled || !response.trim()}
            size="lg"
            className="px-4"
          >
            <Send className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
