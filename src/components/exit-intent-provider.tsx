'use client';

import { useEffect } from 'react';
import { setupExitIntent } from '@/lib/analytics';

export function ExitIntentProvider() {
  useEffect(() => {
    setupExitIntent();
  }, []);

  return null;
}
