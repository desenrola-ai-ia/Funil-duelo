// ============================================
// DESENROLA - Metrics API Route V2
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { calculateMetricsV2, calcApiCosts, type AnalyticsEvent, type SectionName } from '@/lib/metrics-calculator';
import type { ApiCostEntry } from '@/lib/api-cost-logger';

// ============================================
// STORAGE PATHS
// ============================================

const EVENTS_FILE = path.join(process.cwd(), 'data', 'events.jsonl');
const API_COSTS_FILE = path.join(process.cwd(), 'data', 'api-costs.jsonl');

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

async function loadApiCosts(): Promise<ApiCostEntry[]> {
  if (!existsSync(API_COSTS_FILE)) {
    return [];
  }

  const fileContent = await readFile(API_COSTS_FILE, 'utf-8');
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
  'devices', 'engagement', 'users', 'timeline', 'gameplay', 'api_costs',
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

    // api_costs uses a separate data source (api-costs.jsonl)
    if (sections?.includes('api_costs') || !sections) {
      const costEntries = await loadApiCosts();
      const uniqueUsersTotal = new Set(events.map((e) => e.userId)).size;
      metrics.api_costs = calcApiCosts(costEntries, uniqueUsersTotal);
    }

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    console.error('Metrics error:', error);
    return NextResponse.json({ error: 'Failed to calculate metrics' }, { status: 500 });
  }
}
