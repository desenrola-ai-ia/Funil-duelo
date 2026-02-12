// ============================================
// DESENROLA - Analytics System (Enriched)
// ============================================

'use client';

// ============================================
// TYPES
// ============================================

export type EventName =
  // Core Funnel
  | 'landing_view'
  | 'game_start'
  | 'round1_complete'
  | 'round2_complete'
  | 'round3_complete'
  | 'result_view'
  | 'reward_view'
  | 'reward_reveal'
  | 'reward_benefits_visible'
  | 'checkout_view'
  | 'checkout_email_entered'
  | 'checkout_started'
  | 'checkout_complete'
  | 'onboarding_complete'
  // Gameplay
  | 'tier_result'
  | 'ai_used'
  | 'plot_twist_triggered'
  | 'final_victory'
  // UX
  | 'exit_attempt'
  | 'sound_disabled'
  | 'haptic_disabled'
  // Session
  | 'session_end';

export interface EventContext {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  traffic_channel: string;
  language: string;
  timezone: string;
  screen_width: number;
  screen_height: number;
  viewport_width: number;
  viewport_height: number;
  session_start: number;
  time_on_page_ms: number;
}

export interface AnalyticsEvent {
  name: EventName;
  userId: string;
  sessionId: string;
  timestamp: number;
  page: string;
  metadata?: Record<string, any>;
  context?: EventContext;
}

// ============================================
// USER & SESSION ID
// ============================================

function getUserId(): string {
  if (typeof window === 'undefined') return 'server';

  let userId = localStorage.getItem('desenrola_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('desenrola_user_id', userId);
  }
  return userId;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  let sessionId = sessionStorage.getItem('desenrola_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('desenrola_session_id', sessionId);
  }
  return sessionId;
}

// ============================================
// UTM & TRAFFIC SOURCE
// ============================================

function classifyTrafficChannel(utm: Record<string, string>): string {
  if (utm.utm_medium === 'cpc' || utm.utm_medium === 'ppc' || utm.utm_medium === 'paid') return 'paid';
  if (utm.utm_source) {
    const social = ['facebook', 'instagram', 'tiktok', 'twitter', 'linkedin', 'whatsapp', 'youtube'];
    if (social.some((s) => utm.utm_source!.toLowerCase().includes(s))) return 'social';
    return 'referral';
  }
  if (utm.referrer) {
    const ref = utm.referrer.toLowerCase();
    const searchEngines = ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'baidu.com'];
    if (searchEngines.some((se) => ref.includes(se))) return 'organic';
    const socialDomains = ['facebook.com', 'instagram.com', 'tiktok.com', 't.co', 'twitter.com', 'linkedin.com', 'youtube.com'];
    if (socialDomains.some((s) => ref.includes(s))) return 'social';
    return 'referral';
  }
  return 'direct';
}

function captureUTMParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const cached = sessionStorage.getItem('desenrola_utm');
  if (cached) return JSON.parse(cached);

  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};

  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
    const val = params.get(key);
    if (val) utm[key] = val;
  });

  if (document.referrer && !document.referrer.includes(window.location.hostname)) {
    utm.referrer = document.referrer;
  }

  utm.traffic_channel = classifyTrafficChannel(utm);

  sessionStorage.setItem('desenrola_utm', JSON.stringify(utm));
  return utm;
}

// ============================================
// SESSION TIMING
// ============================================

function getSessionStart(): number {
  if (typeof window === 'undefined') return 0;

  let start = sessionStorage.getItem('desenrola_session_start');
  if (!start) {
    start = String(Date.now());
    sessionStorage.setItem('desenrola_session_start', start);
  }
  return parseInt(start, 10);
}

let _pageEnterTime = Date.now();

export function markPageEnter(): void {
  _pageEnterTime = Date.now();
}

// ============================================
// EVENT CONTEXT (cached per session)
// ============================================

let _cachedContext: Omit<EventContext, 'time_on_page_ms'> | null = null;

function getEventContext(): EventContext {
  if (!_cachedContext) {
    const utm = captureUTMParams();

    _cachedContext = {
      ...(utm.utm_source && { utm_source: utm.utm_source }),
      ...(utm.utm_medium && { utm_medium: utm.utm_medium }),
      ...(utm.utm_campaign && { utm_campaign: utm.utm_campaign }),
      ...(utm.utm_content && { utm_content: utm.utm_content }),
      ...(utm.utm_term && { utm_term: utm.utm_term }),
      ...(utm.referrer && { referrer: utm.referrer }),
      traffic_channel: utm.traffic_channel || 'direct',
      language: typeof navigator !== 'undefined' ? navigator.language || 'unknown' : 'unknown',
      timezone: typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown'
        : 'unknown',
      screen_width: typeof screen !== 'undefined' ? screen.width : 0,
      screen_height: typeof screen !== 'undefined' ? screen.height : 0,
      viewport_width: typeof window !== 'undefined' ? window.innerWidth : 0,
      viewport_height: typeof window !== 'undefined' ? window.innerHeight : 0,
      session_start: getSessionStart(),
    };
  }

  return {
    ..._cachedContext,
    time_on_page_ms: Date.now() - _pageEnterTime,
  };
}

// ============================================
// TRACK EVENT (FIRE-AND-FORGET)
// ============================================

export async function trackEvent(
  name: EventName,
  metadata?: Record<string, any>
): Promise<void> {
  if (typeof window === 'undefined') return;

  const event: AnalyticsEvent = {
    name,
    userId: getUserId(),
    sessionId: getSessionId(),
    timestamp: Date.now(),
    page: window.location.pathname,
    metadata,
    context: getEventContext(),
  };

  try {
    if (navigator.sendBeacon && (name === 'exit_attempt' || name === 'session_end' || name.includes('complete'))) {
      const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics', blob);
    } else {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Silently fail
  }
}

// ============================================
// DEBOUNCE (EVITA DUPLICAÇÃO)
// ============================================

const eventDebounce = new Map<string, number>();
const DEBOUNCE_MS = 2000;

export function trackEventOnce(
  name: EventName,
  metadata?: Record<string, any>
): void {
  const key = `${name}_${JSON.stringify(metadata || {})}`;
  const lastTime = eventDebounce.get(key) || 0;
  const now = Date.now();

  if (now - lastTime < DEBOUNCE_MS) return;

  eventDebounce.set(key, now);
  trackEvent(name, metadata);
}

// ============================================
// PAGE VIEW TRACKING
// ============================================

export function trackPageView(page: string): void {
  const pageEvents: Record<string, EventName> = {
    '/landing': 'landing_view',
    '/checkout': 'checkout_view',
    '/duelo/result': 'result_view',
    '/duelo/reward': 'reward_view',
  };

  const eventName = pageEvents[page];
  if (eventName) {
    trackEventOnce(eventName);
  }
}

// ============================================
// EXIT INTENT DETECTION
// ============================================

export function setupExitIntent(): void {
  if (typeof window === 'undefined') return;

  let exitTracked = false;

  const handleExit = (e: MouseEvent) => {
    if (exitTracked) return;
    if (e.clientY <= 0) {
      exitTracked = true;
      trackEvent('exit_attempt');
    }
  };

  document.addEventListener('mouseleave', handleExit);
}

// ============================================
// SESSION END TRACKING
// ============================================

export function setupSessionEndTracking(): void {
  if (typeof window === 'undefined') return;

  let tracked = false;

  window.addEventListener('beforeunload', () => {
    if (tracked) return;
    tracked = true;

    const sessionDurationMs = Date.now() - getSessionStart();
    const event: AnalyticsEvent = {
      name: 'session_end',
      userId: getUserId(),
      sessionId: getSessionId(),
      timestamp: Date.now(),
      page: window.location.pathname,
      metadata: { session_duration_ms: sessionDurationMs },
      context: getEventContext(),
    };

    const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
    navigator.sendBeacon('/api/analytics', blob);
  });
}
