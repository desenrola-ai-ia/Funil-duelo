// ============================================
// DESENROLA - Analytics Hook
// ============================================

'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  trackEvent,
  trackEventOnce,
  trackPageView,
  setupExitIntent,
  setupSessionEndTracking,
  markPageEnter,
  type EventName,
} from '@/lib/analytics';

export function useAnalytics() {
  const pathname = usePathname();

  // Track page view + mark page enter on route change
  useEffect(() => {
    markPageEnter();
    trackPageView(pathname);
  }, [pathname]);

  // Setup exit intent + session end tracking (once)
  useEffect(() => {
    setupExitIntent();
    setupSessionEndTracking();
  }, []);

  const track = useCallback((name: EventName, metadata?: Record<string, any>) => {
    trackEvent(name, metadata);
  }, []);

  const trackOnce = useCallback((name: EventName, metadata?: Record<string, any>) => {
    trackEventOnce(name, metadata);
  }, []);

  return { track, trackOnce };
}
