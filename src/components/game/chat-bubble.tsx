'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

// ============================================
// TYPES
// ============================================

interface ChatBubbleProps {
  message: ChatMessage;
  index: number;
}

// ============================================
// COMPONENT
// ============================================

export function ChatBubble({ message, index }: ChatBubbleProps) {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] px-4 py-2 rounded-2xl text-sm',
          isUser
            ? 'bg-purple-600 text-white rounded-br-md'
            : 'bg-zinc-800 text-zinc-100 rounded-bl-md',
          message.isLastMessage && !isUser && 'ring-2 ring-yellow-500/50 bg-zinc-700'
        )}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

// ============================================
// CHAT CONTAINER
// ============================================

interface ChatContainerProps {
  messages: ChatMessage[];
  className?: string;
}

export function ChatContainer({ messages, className }: ChatContainerProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4 bg-zinc-900/50 rounded-2xl max-h-[300px] overflow-y-auto',
        className
      )}
    >
      {messages.map((message, index) => (
        <ChatBubble key={message.id} message={message} index={index} />
      ))}
    </div>
  );
}
