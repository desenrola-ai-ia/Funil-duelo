// ============================================
// META PIXEL TRACKING HELPERS
// ============================================

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

/** Dispara evento standard do Meta Pixel (ViewContent, Lead, Purchase, etc.) */
export function metaTrack(event: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params);
  }
}

/** Dispara evento custom do Meta Pixel (RewardRevealed, ScrollDepth, etc.) */
export function metaTrackCustom(event: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', event, params);
  }
}
