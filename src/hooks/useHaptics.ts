// ============================================
// DESENROLA - Haptics Hook
// ============================================

'use client';

import { useCallback } from 'react';
import { useSettingsStore } from '@/stores/settings-store';

// ============================================
// TYPES
// ============================================

type VibratePattern = number | number[];

// ============================================
// HELPER
// ============================================

function vibrate(pattern: VibratePattern): void {
  if (typeof window === 'undefined') return;
  if (!('vibrate' in navigator)) return;
  
  try {
    navigator.vibrate(pattern);
  } catch (error) {
    // Silently fail
  }
}

// ============================================
// HOOK
// ============================================

export function useHaptics() {
  const { hapticsEnabled } = useSettingsStore();

  const tap = useCallback(() => {
    if (!hapticsEnabled) return;
    vibrate(10);
  }, [hapticsEnabled]);

  const success = useCallback(() => {
    if (!hapticsEnabled) return;
    vibrate([30, 20, 30]);
  }, [hapticsEnabled]);

  const error = useCallback(() => {
    if (!hapticsEnabled) return;
    vibrate([60, 30, 60]);
  }, [hapticsEnabled]);

  const heavy = useCallback(() => {
    if (!hapticsEnabled) return;
    vibrate(90);
  }, [hapticsEnabled]);

  return { tap, success, error, heavy };
}
