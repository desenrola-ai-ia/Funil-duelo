// ============================================
// DESENROLA - Audio Manager (ROBUST SINGLETON)
// ============================================

'use client';

export type SoundName = 'ui-click' | 'whoosh' | 'win' | 'loss' | 'sparkle' | 'reward' | 'microsound1';

export interface PlayOptions {
  volumeOverride?: number;
  playbackRate?: number;
  cooldownMs?: number;
}

export interface PlayContext {
  event?: string; // 'click', 'submit', 'mount', 'timeout'
  route?: string; // current route
  component?: string; // component name
}

interface SoundInstance {
  audio: HTMLAudioElement;
  loaded: boolean;
  error: boolean;
}

interface SoundPool {
  instances: SoundInstance[];
  currentIndex: number;
  lastPlayTime: number;
}

// ============================================
// CONSTANTS
// ============================================

const SOUND_PATHS: Record<SoundName, string> = {
  'ui-click': '/sounds/ui-click.mp3',
  'whoosh': '/sounds/whoosh.mp3',
  'win': '/sounds/win.mp3',
  'loss': '/sounds/loss.mp3',
  'sparkle': '/sounds/sparkle.mp3',
  'reward': '/sounds/reward.mp3',
  'microsound1': '/sounds/microsound1.mp3',
};

const DEFAULT_COOLDOWNS: Record<SoundName, number> = {
  'ui-click': 80,
  'whoosh': 120,
  'win': 200,
  'loss': 200,
  'sparkle': 150,
  'reward': 500,
  'microsound1': 100,
};

const POOL_SIZE = 3;
const PRELOAD_TIMEOUT = 10000; // 10s timeout for preload

// ============================================
// AUDIO MANAGER SINGLETON
// ============================================

class AudioManager {
  private static instance: AudioManager | null = null;

  private audioContext: AudioContext | null = null;
  private pools: Map<SoundName, SoundPool> = new Map();
  private unlocked: boolean = false;
  private unlocking: boolean = false;
  private masterVolume: number = 0.7;
  private soundEnabled: boolean = true;

  private constructor() {
    if (typeof window === 'undefined') return;
    this.initializeAudioContext();
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializeAudioContext(): void {
    try {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      console.log('🎵 AudioContext created:', this.audioContext.state);
    } catch (e) {
      console.warn('⚠️ AudioContext not supported:', e);
    }
  }

  async preloadAll(): Promise<void> {
    console.log('🔊 [AudioManager] Preloading all sounds...', {
      existingPools: this.pools.size,
      unlocked: this.unlocked
    });

    // Clear existing pools first
    if (this.pools.size > 0) {
      console.log('🧹 Clearing existing pools before reload');
      this.pools.forEach((pool) => {
        pool.instances.forEach(({ audio }) => {
          audio.pause();
          audio.src = '';
        });
      });
      this.pools.clear();

      // CRITICAL: Reset unlock flag - new audio instances need to be unlocked
      this.unlocked = false;
      this.unlocking = false;
      console.log('🔒 Reset unlock flags (new audio instances need unlock)');

      // Reset AudioContext if suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        console.log('🔄 AudioContext suspended, will need resume on next unlock');
      }
    }

    const loadPromises: Promise<void>[] = [];

    Object.entries(SOUND_PATHS).forEach(([name, path]) => {
      const instances: SoundInstance[] = [];

      for (let i = 0; i < POOL_SIZE; i++) {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = this.masterVolume;

        const instance: SoundInstance = {
          audio,
          loaded: false,
          error: false,
        };

        // Promise para carregar - aceita readyState >= 2 (HAVE_CURRENT_DATA)
        const loadPromise = new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn(`⏱️ Timeout loading ${name}[${i}] (readyState: ${audio.readyState})`);
            // Even on timeout, if we have metadata, mark as "loaded enough"
            if (audio.readyState >= 2) {
              instance.loaded = true;
            }
            resolve();
          }, PRELOAD_TIMEOUT);

          // Accept HAVE_CURRENT_DATA (2) or better - enough to start playing
          const onLoadEnough = () => {
            clearTimeout(timeout);
            instance.loaded = true;
            console.log(`✅ Loaded: ${name}[${i}] (readyState: ${audio.readyState})`);
            resolve();
          };

          // Try multiple events for faster load detection
          audio.addEventListener('canplaythrough', onLoadEnough, { once: true });
          audio.addEventListener('canplay', onLoadEnough, { once: true });
          audio.addEventListener('loadeddata', onLoadEnough, { once: true });

          audio.addEventListener('error', (e) => {
            clearTimeout(timeout);
            instance.error = true;
            console.error(`❌ Failed to load ${name}[${i}]:`, e);
            resolve();
          }, { once: true });

          // Trigger load IMMEDIATELY
          audio.load();
        });

        instances.push(instance);
        loadPromises.push(loadPromise);
      }

      this.pools.set(name as SoundName, {
        instances,
        currentIndex: 0,
        lastPlayTime: 0,
      });
    });

    await Promise.all(loadPromises);
    console.log(`✅ [AudioManager] Preloaded ${this.pools.size} sounds (${loadPromises.length} instances)`);
  }

  // ============================================
  // UNLOCK (MOBILE)
  // ============================================

  unlock(): void {
    if (this.unlocked || this.unlocking) {
      console.log('🔓 Audio already unlocked or unlocking');
      return;
    }

    this.unlocking = true;
    console.log('🔓 [AudioManager] Unlocking audio (FAST mode - only first instances)...');

    try {
      // 1. Resume AudioContext
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
          .then(() => console.log('✅ AudioContext resumed'))
          .catch((e) => console.warn('❌ AudioContext resume failed:', e));
      }

      // 2. FAST UNLOCK: Only first instance of each sound (3x faster!)
      // Other instances will unlock lazily on first use
      this.pools.forEach((pool, soundName) => {
        const instance = pool.instances[0]; // Only first!
        const { audio } = instance;

        audio.volume = 0;
        audio.muted = true;

        audio.play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.muted = false;
            audio.volume = this.masterVolume;
            console.log(`✅ Unlocked: ${soundName}`);
          })
          .catch((e) => {
            audio.muted = false;
            console.warn(`❌ Failed to unlock ${soundName}:`, e.name);
          });
      });

      // CRITICAL: Mark as unlocked IMMEDIATELY
      this.unlocked = true;
      this.unlocking = false;
      console.log('✅ [AudioManager] Fast unlock complete (6 sounds unlocked)');

    } catch (error) {
      console.error('❌ [AudioManager] Unlock error:', error);
      this.unlocking = false;
    }
  }

  // ============================================
  // PLAY
  // ============================================

  play(name: SoundName, options: PlayOptions = {}, context: PlayContext = {}): void {
    const timestamp = new Date().toISOString();
    const route = context.route || (typeof window !== 'undefined' ? window.location.pathname : 'unknown');

    // Log entry
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎵 [AudioManager.play()] CALLED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Sound:        ${name}
  Event:        ${context.event || 'unknown'}
  Route:        ${route}
  Component:    ${context.component || 'unknown'}
  Timestamp:    ${timestamp}
  -------------------------------------------
  soundEnabled: ${this.soundEnabled}
  masterVolume: ${this.masterVolume}
  volumeOver:   ${options.volumeOverride ?? 'none'}
  cooldownMs:   ${options.cooldownMs ?? DEFAULT_COOLDOWNS[name]}
  -------------------------------------------
  User Gesture: ${typeof navigator !== 'undefined' && 'userActivation' in navigator ? (navigator as any).userActivation?.hasBeenActive : 'N/A'}
  Visibility:   ${typeof document !== 'undefined' ? document.visibilityState : 'N/A'}
  AudioContext: ${this.audioContext?.state || 'none'}
  Unlocked:     ${this.unlocked}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

    // Check if sound enabled
    if (!this.soundEnabled) {
      console.log('⛔ Sound disabled in settings');
      return;
    }

    // Get pool
    const pool = this.pools.get(name);
    if (!pool) {
      console.warn(`❌ Sound pool not found: ${name}`);
      return;
    }

    // Check cooldown
    const cooldown = options.cooldownMs ?? DEFAULT_COOLDOWNS[name];
    const now = Date.now();
    const timeSinceLastPlay = now - pool.lastPlayTime;

    if (timeSinceLastPlay < cooldown) {
      console.log(`⏱️ COOLDOWN BLOCKED: ${timeSinceLastPlay}ms < ${cooldown}ms`);
      return;
    }

    // Get next instance
    const instance = pool.instances[pool.currentIndex];
    pool.currentIndex = (pool.currentIndex + 1) % POOL_SIZE;
    pool.lastPlayTime = now;

    const { audio, loaded, error } = instance;

    // Check if loaded
    if (error) {
      console.error(`❌ Audio file error: ${name}`);
      return;
    }

    // CRITICAL: Check if loaded but DON'T WAIT (would lose user gesture)
    if (!loaded) {
      console.warn(`⚠️ Audio not fully loaded yet: ${name} (readyState: ${audio.readyState}), playing anyway to preserve user gesture`);

      // Set up listener to mark as loaded when ready (for next time)
      if (audio.readyState < 3) {
        const onCanPlay = () => {
          instance.loaded = true;
          console.log(`✅ Audio finished loading: ${name} (readyState: ${audio.readyState})`);
        };
        audio.addEventListener('canplaythrough', onCanPlay, { once: true });
      }
    }

    // ALWAYS play immediately to preserve user gesture context
    this.playAudioNow(name, audio, options);
  }

  private playAudioNow(
    name: SoundName,
    audio: HTMLAudioElement,
    options: PlayOptions
  ): void {
    // Set volume
    const finalVolume = options.volumeOverride !== undefined
      ? Math.max(0, Math.min(1, options.volumeOverride))
      : this.masterVolume;

    audio.volume = finalVolume;

    // Set playback rate
    audio.playbackRate = options.playbackRate ?? 1;

    // Reset and play
    audio.currentTime = 0;

    console.log(`
🔊🔊🔊 TOCANDO AGORA: ${name.toUpperCase()} 🔊🔊🔊
🎵 ATTEMPTING PLAY:
  sound:        ${name}
  volume:       ${audio.volume}
  readyState:   ${audio.readyState} (${this.getReadyStateLabel(audio.readyState)})
  networkState: ${audio.networkState} (${this.getNetworkStateLabel(audio.networkState)})
  paused:       ${audio.paused}
  currentTime:  ${audio.currentTime}
  src:          ${audio.src}
`);

    const playPromise = audio.play();

    if (playPromise) {
      playPromise
        .then(() => {
          console.log(`✅✅✅ SOM TOCANDO COM SUCESSO: ${name.toUpperCase()} ✅✅✅`);
        })
        .catch((error) => {
          console.error(`
❌ PLAY FAILED: ${name}
  Error Name:    ${error.name}
  Error Message: ${error.message}
  readyState:    ${audio.readyState}
  networkState:  ${audio.networkState}
  src:           ${audio.src}
  unlocked:      ${this.unlocked}
`);

          // Try unlock if not unlocked
          if (!this.unlocked && error.name === 'NotAllowedError') {
            console.log('🔄 Attempting auto-unlock...');
            this.unlock();
          }
        });
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private getReadyStateLabel(state: number): string {
    const labels = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'];
    return labels[state] || 'UNKNOWN';
  }

  private getNetworkStateLabel(state: number): string {
    const labels = ['NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_NO_SOURCE'];
    return labels[state] || 'UNKNOWN';
  }

  // ============================================
  // SETTERS
  // ============================================

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Master volume set to: ${this.masterVolume}`);

    // Update all paused instances
    this.pools.forEach((pool) => {
      pool.instances.forEach(({ audio }) => {
        if (audio.paused) {
          audio.volume = this.masterVolume;
        }
      });
    });
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    console.log(`🔊 Sound ${enabled ? 'enabled' : 'disabled'}`);
  }

  // ============================================
  // DEBUG
  // ============================================

  getState(): any {
    return {
      unlocked: this.unlocked,
      soundEnabled: this.soundEnabled,
      masterVolume: this.masterVolume,
      audioContextState: this.audioContext?.state,
      pools: Array.from(this.pools.entries()).map(([name, pool]) => ({
        name,
        instances: pool.instances.map(({ loaded, error, audio }) => ({
          loaded,
          error,
          readyState: audio.readyState,
          networkState: audio.networkState,
        })),
      })),
    };
  }

  // ============================================
  // CLEANUP
  // ============================================

  cleanup(): void {
    this.pools.forEach((pool) => {
      pool.instances.forEach(({ audio }) => {
        audio.pause();
        audio.src = '';
      });
    });
    this.pools.clear();
    console.log('🧹 AudioManager cleaned up');
  }
}

// ============================================
// EXPORTS
// ============================================

export const audioManager = AudioManager.getInstance();
