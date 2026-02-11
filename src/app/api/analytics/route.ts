// ============================================
// DESENROLA - Analytics API Route (Enriched)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { UAParser } from 'ua-parser-js';
import { extractIP, maskIP, resolveTimezoneGeo, lookupIP } from '@/lib/geo-utils';

// ============================================
// STORAGE PATH
// ============================================

const STORAGE_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(STORAGE_DIR, 'events.jsonl');

// ============================================
// ENSURE STORAGE EXISTS
// ============================================

async function ensureStorage() {
  if (!existsSync(STORAGE_DIR)) {
    await mkdir(STORAGE_DIR, { recursive: true });
  }
  if (!existsSync(EVENTS_FILE)) {
    await writeFile(EVENTS_FILE, '', 'utf-8');
  }
}

// ============================================
// MOBILE DETECTION FALLBACK
// ============================================

function isMobileUA(ua: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

// ============================================
// POST - SAVE EVENT (with server-side enrichment)
// ============================================

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    if (!event.name || !event.userId || !event.timestamp) {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
    }

    // === SERVER-SIDE ENRICHMENT ===

    // 1. Extract IP
    const rawIP = extractIP(request.headers);

    // 2. Parse User-Agent
    const ua = request.headers.get('user-agent') || '';
    const parser = new UAParser(ua);
    const parsedDevice = parser.getDevice();
    const parsedBrowser = parser.getBrowser();
    const parsedOS = parser.getOS();

    const device = {
      type: parsedDevice.type || (isMobileUA(ua) ? 'mobile' : 'desktop'),
      browser: [parsedBrowser.name, parsedBrowser.major].filter(Boolean).join(' ') || 'Unknown',
      os: [parsedOS.name, parsedOS.version].filter(Boolean).join(' ') || 'Unknown',
      ...(parsedDevice.vendor && { brand: parsedDevice.vendor }),
      ...(parsedDevice.model && { model: parsedDevice.model }),
    };

    // 3. Geolocation (timezone-first, then IP fallback)
    let geo = resolveTimezoneGeo(event.context?.timezone);

    if (!geo && rawIP !== 'unknown') {
      geo = await lookupIP(rawIP);
    }

    // 4. Attach server enrichment
    event.server = {
      ip: maskIP(rawIP),
      ...(geo && { geo }),
      device,
    };

    // Save enriched event
    await ensureStorage();
    const eventLine = JSON.stringify(event) + '\n';
    await writeFile(EVENTS_FILE, eventLine, { flag: 'a', encoding: 'utf-8' });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 });
  }
}

// ============================================
// GET - RETRIEVE EVENTS (ADMIN ONLY)
// ============================================

export async function GET(request: NextRequest) {
  try {
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureStorage();

    const fileContent = await readFile(EVENTS_FILE, 'utf-8');
    const events = fileContent
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to retrieve events' }, { status: 500 });
  }
}
