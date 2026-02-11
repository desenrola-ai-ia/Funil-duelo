// ============================================
// DESENROLA - Particles System
// ============================================

'use client';

import confetti from 'canvas-confetti';

// ============================================
// HELPERS
// ============================================

function shouldAnimate(): boolean {
  if (typeof window === 'undefined') return false;
  return true;
}

// ============================================
// CONFETTI BIG
// ============================================

export function confettiBig(): void {
  if (!shouldAnimate()) return;

  try {
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  } catch (error) {
    // Silently fail
  }
}

// ============================================
// SPARKLES SMALL
// ============================================

export function sparklesSmall(): void {
  if (!shouldAnimate()) return;

  try {
    confetti({
      particleCount: 30,
      spread: 50,
      startVelocity: 25,
      decay: 0.92,
      scalar: 0.8,
      ticks: 40,
      origin: { y: 0.5 },
      colors: ['#a855f7', '#c084fc', '#e9d5ff', '#fbbf24', '#fde047'],
      zIndex: 9999,
    });
  } catch (error) {
    // Silently fail
  }
}

// ============================================
// EMBERS BOSS
// ============================================

export function embersBoss(): void {
  if (!shouldAnimate()) return;

  try {
    confetti({
      particleCount: 40,
      spread: 30,
      startVelocity: 20,
      decay: 0.88,
      scalar: 0.6,
      ticks: 50,
      origin: { x: 0.5, y: 0.45 },
      colors: ['#ef4444', '#f97316', '#f59e0b', '#fbbf24'],
      gravity: 0.8,
      drift: 0,
      zIndex: 9999,
    });
  } catch (error) {
    // Silently fail
  }
}
