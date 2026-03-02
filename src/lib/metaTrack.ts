// ============================================
// META PIXEL + CAPI TRACKING HELPERS
// Dual-fire: sends events to both Pixel (client) and CAPI (server)
// ============================================

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    __metaPageViewId?: string;
  }
}

// ============================================
// Helpers
// ============================================

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function getFbp(): string | undefined {
  return getCookie('_fbp');
}

function getFbc(): string | undefined {
  return getCookie('_fbc');
}

function getStoredEmail(): string | undefined {
  try {
    return localStorage.getItem('desenrola-checkout-email') || undefined;
  } catch {
    return undefined;
  }
}

// ============================================
// CAPI Bridge (client → server)
// ============================================

function sendToCapi(eventName: string, eventId: string, customData?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  const payload = {
    event_name: eventName,
    event_id: eventId,
    event_source_url: window.location.href,
    custom_data: customData,
    user_data: {
      em: getStoredEmail(),
      fbp: getFbp(),
      fbc: getFbc(),
    },
  };

  fetch('/api/meta-capi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

// ============================================
// Public API
// ============================================

/** Dispara evento standard do Meta Pixel + CAPI (ViewContent, Lead, Purchase, etc.) */
export function metaTrack(event: string, params?: Record<string, any>, eventId?: string) {
  const id = eventId || generateEventId();

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params, { eventID: id });
  }

  sendToCapi(event, id, params);
}

/** Dispara evento custom do Meta Pixel + CAPI (RewardRevealed, ScrollDepth, etc.) */
export function metaTrackCustom(event: string, params?: Record<string, any>, eventId?: string) {
  const id = eventId || generateEventId();

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', event, params, { eventID: id });
  }

  sendToCapi(event, id, params);
}
