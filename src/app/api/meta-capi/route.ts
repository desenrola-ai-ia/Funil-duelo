// ============================================
// META CAPI — Client-to-Server Bridge
// Receives events from the browser, enriches with IP/UA, forwards to CAPI
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { sendEvent } from '@/lib/metaCapi';

interface MetaCapiRequestBody {
  event_name: string;
  event_id: string;
  event_source_url?: string;
  custom_data?: Record<string, any>;
  user_data?: {
    em?: string;
    fbp?: string;
    fbc?: string;
    external_id?: string;
  };
}

function extractIP(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    undefined
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: MetaCapiRequestBody = await request.json();

    if (!body.event_name || !body.event_id) {
      return NextResponse.json({ error: 'event_name and event_id are required' }, { status: 400 });
    }

    const ip = extractIP(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Fire and forget — don't block the response
    sendEvent({
      eventName: body.event_name,
      eventId: body.event_id,
      eventSourceUrl: body.event_source_url,
      customData: body.custom_data,
      userData: {
        email: body.user_data?.em,
        ip,
        userAgent,
        fbp: body.user_data?.fbp,
        fbc: body.user_data?.fbc,
        externalId: body.user_data?.external_id,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
