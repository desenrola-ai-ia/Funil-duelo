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
    if (this.unlocked || this.unlocking) return;

    this.unlocking = true;

    try {
      // 1. Resume AudioContext
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      // 2. Unlock each audio element — keep muted, DON'T restore volume in callback
      // Volume is only restored when play() is actually called by game code
      this.pools.forEach((pool) => {
        const { audio } = pool.instances[0];
        audio.volume = 0;
        audio.muted = true;

        audio.play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            // DON'T unmute or change volume here — prevents audio leak on Safari
          })
          .catch(() => {});
      });

      this.unlocked = true;
      this.unlocking = false;
    } catch {
      this.unlocking = false;
    }
  }

  // ============================================
  // PLAY
  // ============================================

  play(name: SoundName, options: PlayOptions = {}, _context: PlayContext = {}): void {
    if (!this.soundEnabled) return;

    // Get pool
    const pool = this.pools.get(name);
    if (!pool) return;

    // Check cooldown
    const cooldown = options.cooldownMs ?? DEFAULT_COOLDOWNS[name];
    const now = Date.now();
    if (now - pool.lastPlayTime < cooldown) return;

    // Get next instance
    const instance = pool.instances[pool.currentIndex];
    pool.currentIndex = (pool.currentIndex + 1) % POOL_SIZE;
    pool.lastPlayTime = now;

    const { audio, loaded, error } = instance;
    if (error) return;

    if (!loaded && audio.readyState < 3) {
      audio.addEventListener('canplaythrough', () => { instance.loaded = true; }, { once: true });
    }

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

    // CRITICAL: Ensure unmuted (unlock leaves them muted)
    audio.muted = false;
    audio.volume = finalVolume;
    audio.playbackRate = options.playbackRate ?? 1;
    audio.currentTime = 0;

    audio.play()?.catch((error) => {
      if (!this.unlocked && error.name === 'NotAllowedError') {
        this.unlock();
      }
    });
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
