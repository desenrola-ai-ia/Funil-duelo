// ============================================
// META CONVERSIONS API (CAPI) — Server-Side
// ============================================

import { createHash } from 'crypto';

const GRAPH_API_VERSION = 'v21.0';

// ============================================
// Types
// ============================================

interface MetaUserData {
  em?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
  external_id?: string[];
}

interface MetaEventPayload {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url?: string;
  action_source: 'website';
  user_data: MetaUserData;
  custom_data?: Record<string, any>;
}

interface SendEventOptions {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  customData?: Record<string, any>;
  userData?: {
    email?: string;
    ip?: string;
    userAgent?: string;
    fbp?: string;
    fbc?: string;
    externalId?: string;
  };
}

// ============================================
// Hashing
// ============================================

export function hashSHA256(value: string): string {
  return createHash('sha256')
    .update(value.trim().toLowerCase())
    .digest('hex');
}

// ============================================
// Build user_data
// ============================================

function buildUserData(opts: SendEventOptions['userData']): MetaUserData {
  if (!opts) return {};

  const userData: MetaUserData = {};

  if (opts.email) {
    userData.em = [hashSHA256(opts.email)];
  }
  if (opts.ip) {
    userData.client_ip_address = opts.ip;
  }
  if (opts.userAgent) {
    userData.client_user_agent = opts.userAgent;
  }
  if (opts.fbp) {
    userData.fbp = opts.fbp;
  }
  if (opts.fbc) {
    userData.fbc = opts.fbc;
  }
  if (opts.externalId) {
    userData.external_id = [hashSHA256(opts.externalId)];
  }

  return userData;
}

// ============================================
// Send Event to Meta CAPI
// ============================================

export async function sendEvent(options: SendEventOptions): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('[CAPI] META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not configured, skipping.');
    return;
  }

  const payload: MetaEventPayload = {
    event_name: options.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: options.eventId,
    action_source: 'website',
    user_data: buildUserData(options.userData),
  };

  if (options.eventSourceUrl) {
    payload.event_source_url = options.eventSourceUrl;
  }

  if (options.customData && Object.keys(options.customData).length > 0) {
    payload.custom_data = options.customData;
  }

  const body: Record<string, any> = {
    data: [payload],
    access_token: accessToken,
  };

  // Test mode (optional — for Events Manager > Test Events)
  const testCode = process.env.META_CAPI_TEST_CODE;
  if (testCode) {
    body.test_event_code = testCode;
  }

  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`[CAPI] Error ${res.status}: ${errorBody}`);
    }
  } catch (err) {
    console.error('[CAPI] Failed to send event:', err);
  }
}
