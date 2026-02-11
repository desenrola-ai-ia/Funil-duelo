// ============================================
// DESENROLA - Audio Unlocker (HOTFIX)
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { unlockAudio } from '@/hooks/useSoundKit';

export function AudioUnlocker() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    let interactionHappened = false;
    let promptTimeout: NodeJS.Timeout;

    const handleFirstInteraction = () => {
      // CRITICAL: Only execute once
      if (interactionHappened) return;
      interactionHappened = true;

      console.log('🎵 First interaction detected, unlocking audio...');
      
      // Unlock audio
      unlockAudio();
      setUnlocked(true);
      setShowPrompt(false);
    };

    // HOTFIX: Use { once: true } to prevent multiple calls
    document.addEventListener('pointerdown', handleFirstInteraction, { 
      capture: true, 
      once: true, 
      passive: true 
    });
    
    document.addEventListener('touchstart', handleFirstInteraction, { 
      capture: true, 
      once: true, 
      passive: true 
    });
    
    document.addEventListener('click', handleFirstInteraction, { 
      capture: true, 
      once: true, 
      passive: true 
    });

    // Show prompt after 2s if no interaction yet
    promptTimeout = setTimeout(() => {
      if (!interactionHappened) {
        setShowPrompt(true);
        console.log('💡 Showing audio unlock prompt');
      }
    }, 2000);

    return () => {
      if (promptTimeout) clearTimeout(promptTimeout);
      // Listeners auto-removed with { once: true }
    };
  }, []);

  return (
    <>
      {/* Optional: Visual prompt for mobile users */}
      <AnimatePresence>
        {showPrompt && !unlocked && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm">
              <Volume2 className="w-4 h-4" />
              <span>Toque na tela para ativar som</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
