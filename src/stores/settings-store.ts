// ============================================
// DESENROLA - Settings Store (Zustand)
// ============================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  masterVolume: number;
  toggleSound: () => void;
  toggleHaptics: () => void;
  setVolume: (volume: number) => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  soundEnabled: true,
  hapticsEnabled: true,
  masterVolume: 0.6,
};

// ============================================
// STORE
// ============================================

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // Toggle sound on/off
        toggleSound: () =>
          set((state) => ({ soundEnabled: !state.soundEnabled }), false, 'toggleSound'),

        // Toggle haptics on/off
        toggleHaptics: () =>
          set((state) => ({ hapticsEnabled: !state.hapticsEnabled }), false, 'toggleHaptics'),

        // Set master volume (0.0 to 1.0)
        setVolume: (volume: number) =>
          set(
            { masterVolume: Math.max(0, Math.min(1, volume)) },
            false,
            'setVolume'
          ),
      }),
      {
        name: 'desenrola-settings-storage',
        version: 1,
      }
    ),
    { name: 'Settings Store' }
  )
);
