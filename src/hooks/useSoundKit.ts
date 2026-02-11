// ============================================
// DESENROLA - Sound Kit Hook v2 (Using AudioManager)
// ============================================

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { audioManager, type SoundName, type PlayOptions, type PlayContext } from './AudioManager';

export type { SoundName, PlayOptions, PlayContext };

// ============================================
// HOOK
// ============================================

export function useSoundKit() {
  const initialized = useRef(false);
  const { soundEnabled, masterVolume } = useSettingsStore();

  // Initialize ONCE (per mount)
  useEffect(() => {
    // CRITICAL: Check if pools are empty (after cleanup or reload)
    const state = audioManager.getState();
    const needsInit = state.pools.length === 0;

    if (initialized.current && !needsInit) {
      console.log('🔄 [useSoundKit] Already initialized, skipping');
      return;
    }

    initialized.current = true;
    console.log('🎵 [useSoundKit] Initializing...', { needsInit, poolCount: state.pools.length });

    // Preload all sounds
    audioManager.preloadAll().then(() => {
      console.log('✅ [useSoundKit] All sounds preloaded');
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 [useSoundKit] Cleanup called (component unmounting)');
      // Don't cleanup on StrictMode double-mount, only on real unmount
      const isRealUnmount = !document.body.contains(document.querySelector('[data-desenrola-app]'));
      if (isRealUnmount) {
        audioManager.cleanup();
        initialized.current = false;
      }
    };
  }, []);

  // Sync settings
  useEffect(() => {
    audioManager.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    audioManager.setMasterVolume(masterVolume);
  }, [masterVolume]);

  // Play function (stable reference)
  const play = useCallback(
    (name: SoundName, options?: PlayOptions, context?: PlayContext) => {
      audioManager.play(name, options, context);
    },
    [] // Stable - no deps
  );

  // Unlock function
  const unlockAudio = useCallback(() => {
    audioManager.unlock();
  }, []);

  // Debug function
  const getAudioState = useCallback(() => {
    return audioManager.getState();
  }, []);

  return {
    play,
    unlockAudio,
    getAudioState,
  };
}

// ============================================
// DIRECT ACCESS (for non-React contexts)
// ============================================

export const playSound = (name: SoundName, options?: PlayOptions, context?: PlayContext) => {
  audioManager.play(name, options, context);
};

export const unlockAudio = () => {
  audioManager.unlock();
};

export const getAudioState = () => {
  return audioManager.getState();
};
