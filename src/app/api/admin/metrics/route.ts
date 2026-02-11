// ============================================
// DESENROLA - Metrics API Route V2
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { calculateMetricsV2, type AnalyticsEvent, type SectionName } from '@/lib/metrics-calculator';

// ============================================
// STORAGE PATH
// ============================================

const EVENTS_FILE = path.join(process.cwd(), 'data', 'events.jsonl');

// ============================================
// LOAD EVENTS
// ============================================

async function loadEvents(): Promise<AnalyticsEvent[]> {
  if (!existsSync(EVENTS_FILE)) {
    return [];
  }

  const fileContent = await readFile(EVENTS_FILE, 'utf-8');
  return fileContent
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      try { return JSON.parse(line); }
      catch { return null; }
    })
    .filter(Boolean);
}

// ============================================
// GET - RETRIEVE METRICS V2
// ============================================

const VALID_SECTIONS: SectionName[] = [
  'overview', 'funnel_detailed', 'geo', 'traffic',
  'devices', 'engagement', 'users', 'timeline', 'gameplay',
];

export async function GET(request: NextRequest) {
  try {
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await loadEvents();

    const { searchParams } = new URL(request.url);

    // Time range
    const timeRange = searchParams.get('range');
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : undefined;

    // Sections filter
    const sectionsParam = searchParams.get('sections');
    let sections: SectionName[] | undefined;
    if (sectionsParam) {
      sections = sectionsParam
        .split(',')
        .map((s) => s.trim() as SectionName)
        .filter((s) => VALID_SECTIONS.includes(s));
      if (sections.length === 0) sections = undefined;
    }

    const metrics = calculateMetricsV2(events, sections, hours);

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    console.error('Metrics error:', error);
    return NextResponse.json({ error: 'Failed to calculate metrics' }, { status: 500 });
  }
}
