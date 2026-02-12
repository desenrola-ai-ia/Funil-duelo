// ============================================
// DESENROLA - Metrics Calculator Engine
// ============================================

// ============================================
// TYPES
// ============================================

export interface AnalyticsEvent {
  name: string;
  userId: string;
  sessionId: string;
  timestamp: number;
  page: string;
  metadata?: Record<string, any>;
  context?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    referrer?: string;
    traffic_channel?: string;
    language?: string;
    timezone?: string;
    screen_width?: number;
    screen_height?: number;
    viewport_width?: number;
    viewport_height?: number;
    session_start?: number;
    time_on_page_ms?: number;
  };
  server?: {
    ip?: string;
    geo?: {
      country?: string;
      country_name?: string;
      state?: string;
      region?: string;
      city?: string;
    };
    device?: {
      type?: string;
      browser?: string;
      os?: string;
      brand?: string;
      model?: string;
    };
  };
}

// ============================================
// SECTION TYPES
// ============================================

export interface OverviewMetrics {
  uniqueUsers24h: number;
  uniqueUsers7d: number;
  uniqueUsersTotal: number;
  gamesStarted: number;
  gamesFinished: number;
  checkoutsViewed: number;
  checkoutsCompleted: number;
  conversionRate: number;
  avgSessionMs: number;
}

export interface FunnelStep {
  name: string;
  label: string;
  users: number;
  pctOfTotal: number;
  dropOffPct: number;
  avgTimeToNextMs: number;
}

export interface FunnelDetailedMetrics {
  steps: FunnelStep[];
  byChannel: Record<string, { landing: number; checkout: number; conversionPct: number }>;
  byDevice: Record<string, { landing: number; checkout: number; conversionPct: number }>;
}

export interface GeoMetrics {
  countries: { name: string; code: string; users: number }[];
  brStates: { state: string; region: string; users: number }[];
  brRegions: { region: string; users: number }[];
}

export interface TrafficMetrics {
  channels: { channel: string; users: number; sessions: number; conversionPct: number }[];
  sources: { source: string; users: number }[];
  campaigns: { campaign: string; users: number }[];
  referrers: { referrer: string; users: number }[];
}

export interface DevicesMetrics {
  types: { type: string; users: number; pct: number }[];
  browsers: { browser: string; users: number }[];
  os: { os: string; users: number }[];
  screens: { size: string; users: number }[];
}

export interface EngagementMetrics {
  avgSessionMs: number;
  medianSessionMs: number;
  bounceRate: number;
  avgPagesPerSession: number;
  returnRate: number;
  sessionDurationBuckets: { bucket: string; count: number }[];
}

export interface UserRow {
  userId: string;
  firstSeen: number;
  lastSeen: number;
  sessions: number;
  eventsCount: number;
  maxFunnelStep: string;
  channel: string;
  device: string;
  geo: string;
}

export interface UsersMetrics {
  totalUnique: number;
  newToday: number;
  returned: number;
  topUsers: UserRow[];
}

export interface TimelineDay {
  date: string;
  users: number;
  sessions: number;
  conversions: number;
}

export interface TimelineMetrics {
  daily: TimelineDay[];
  hourly: { hour: number; events: number }[];
}

export interface GameplayMetrics {
  tierDistribution: { A: number; B: number; C: number; D: number };
  winRate: number;
  plotTwistRate: number;
  aiUsageRate: number;
  scratchCompletionRate: number;
  avgTimeToRevealSec: number;
}

export interface ApiCostsMetrics {
  totalCalls: number;
  totalTokens: number;
  totalCostUSD: number;
  analyzeCalls: number;
  analyzeCostUSD: number;
  suggestCalls: number;
  suggestCostUSD: number;
  costToday: number;
  cost7d: number;
  cost30d: number;
  avgCostPerUser: number;
  daily: { date: string; calls: number; costUSD: number }[];
}

export interface MetricsV2 {
  overview?: OverviewMetrics;
  funnel_detailed?: FunnelDetailedMetrics;
  geo?: GeoMetrics;
  traffic?: TrafficMetrics;
  devices?: DevicesMetrics;
  engagement?: EngagementMetrics;
  users?: UsersMetrics;
  timeline?: TimelineMetrics;
  gameplay?: GameplayMetrics;
  api_costs?: ApiCostsMetrics;
}

export type SectionName = keyof MetricsV2;

// ============================================
// HELPERS
// ============================================

function uniqueUserSet(events: AnalyticsEvent[], filterFn: (e: AnalyticsEvent) => boolean): Set<string> {
  const set = new Set<string>();
  for (const e of events) {
    if (filterFn(e)) set.add(e.userId);
  }
  return set;
}

function uniqueUsers(events: AnalyticsEvent[], filterFn: (e: AnalyticsEvent) => boolean): number {
  return uniqueUserSet(events, filterFn).size;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function topN<T extends Record<string, any>>(arr: T[], key: keyof T, n: number): T[] {
  return [...arr].sort((a, b) => (b[key] as number) - (a[key] as number)).slice(0, n);
}

function dateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function screenBucket(w: number, h: number): string {
  if (w <= 0 || h <= 0) return 'unknown';
  if (w <= 375) return '<=375 (small mobile)';
  if (w <= 414) return '376-414 (mobile)';
  if (w <= 768) return '415-768 (tablet)';
  if (w <= 1024) return '769-1024 (small desktop)';
  if (w <= 1440) return '1025-1440 (desktop)';
  return '1441+ (large)';
}

function sessionDurationBucket(ms: number): string {
  const sec = ms / 1000;
  if (sec < 10) return '0-10s';
  if (sec < 30) return '10-30s';
  if (sec < 60) return '30-60s';
  if (sec < 180) return '1-3min';
  if (sec < 300) return '3-5min';
  if (sec < 600) return '5-10min';
  return '10min+';
}

// ============================================
// FUNNEL STEPS DEFINITION
// ============================================

const FUNNEL_STEPS = [
  { name: 'landing_view', label: 'Landing' },
  { name: 'game_start', label: 'Game Start' },
  { name: 'round1_complete', label: 'Round 1' },
  { name: 'round2_complete', label: 'Round 2' },
  { name: 'round3_complete', label: 'Round 3' },
  { name: 'result_view', label: 'Resultado' },
  { name: 'reward_view', label: 'Recompensa' },
  { name: 'reward_reveal', label: 'Raspadinha' },
  { name: 'checkout_view', label: 'Checkout' },
  { name: 'checkout_complete', label: 'Conversão' },
] as const;

// ============================================
// SECTION CALCULATORS
// ============================================

function calcOverview(events: AnalyticsEvent[]): OverviewMetrics {
  const now = Date.now();
  const h24 = now - 24 * 60 * 60 * 1000;
  const d7 = now - 7 * 24 * 60 * 60 * 1000;

  const uniqueUsers24h = uniqueUsers(events, (e) => e.timestamp >= h24);
  const uniqueUsers7d = uniqueUsers(events, (e) => e.timestamp >= d7);
  const uniqueUsersTotal = new Set(events.map((e) => e.userId)).size;

  const gamesStarted = uniqueUsers(events, (e) => e.name === 'game_start');
  const gamesFinished = uniqueUsers(events, (e) => e.name === 'result_view');
  const checkoutsViewed = uniqueUsers(events, (e) => e.name === 'checkout_view');
  const checkoutsCompleted = uniqueUsers(events, (e) => e.name === 'checkout_complete');
  const landingUsers = uniqueUsers(events, (e) => e.name === 'landing_view');
  const conversionRate = landingUsers > 0 ? (checkoutsCompleted / landingUsers) * 100 : 0;

  // Avg session duration from session_end events
  const sessionEnds = events.filter((e) => e.name === 'session_end' && e.metadata?.session_duration_ms);
  const avgSessionMs = sessionEnds.length > 0
    ? sessionEnds.reduce((sum, e) => sum + (e.metadata!.session_duration_ms as number), 0) / sessionEnds.length
    : 0;

  return { uniqueUsers24h, uniqueUsers7d, uniqueUsersTotal, gamesStarted, gamesFinished, checkoutsViewed, checkoutsCompleted, conversionRate, avgSessionMs };
}

function calcFunnelDetailed(events: AnalyticsEvent[]): FunnelDetailedMetrics {
  // Users per step
  const stepUsers: Map<string, Set<string>> = new Map();
  for (const step of FUNNEL_STEPS) {
    stepUsers.set(step.name, uniqueUserSet(events, (e) => e.name === step.name));
  }

  // First timestamp per user per event name (for time-between-steps)
  const firstTimestamp: Map<string, Map<string, number>> = new Map();
  for (const e of events) {
    if (!firstTimestamp.has(e.userId)) firstTimestamp.set(e.userId, new Map());
    const userMap = firstTimestamp.get(e.userId)!;
    const existing = userMap.get(e.name);
    if (!existing || e.timestamp < existing) {
      userMap.set(e.name, e.timestamp);
    }
  }

  const totalLanding = stepUsers.get('landing_view')?.size || 1;

  const steps: FunnelStep[] = FUNNEL_STEPS.map((step, i) => {
    const users = stepUsers.get(step.name)?.size || 0;
    const prevUsers = i > 0 ? (stepUsers.get(FUNNEL_STEPS[i - 1].name)?.size || 0) : users;
    const dropOffPct = prevUsers > 0 && i > 0 ? ((prevUsers - users) / prevUsers) * 100 : 0;
    const pctOfTotal = totalLanding > 0 ? (users / totalLanding) * 100 : 0;

    // Avg time from this step to next step
    let avgTimeToNextMs = 0;
    if (i < FUNNEL_STEPS.length - 1) {
      const nextStepName = FUNNEL_STEPS[i + 1].name;
      const times: number[] = [];
      const currentSet = stepUsers.get(step.name)!;
      for (const uid of currentSet) {
        const userTs = firstTimestamp.get(uid);
        if (userTs) {
          const thisTs = userTs.get(step.name);
          const nextTs = userTs.get(nextStepName);
          if (thisTs && nextTs && nextTs > thisTs) {
            times.push(nextTs - thisTs);
          }
        }
      }
      avgTimeToNextMs = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    }

    return { name: step.name, label: step.label, users, pctOfTotal, dropOffPct, avgTimeToNextMs };
  });

  // Funnel by channel
  const byChannel: Record<string, { landing: number; checkout: number; conversionPct: number }> = {};
  const channelMap = new Map<string, string>(); // userId → channel (first seen)
  for (const e of events) {
    if (!channelMap.has(e.userId)) {
      channelMap.set(e.userId, e.context?.traffic_channel || 'unknown');
    }
  }

  const channels = new Set(channelMap.values());
  for (const ch of channels) {
    const chUsers = new Set<string>();
    for (const [uid, c] of channelMap) { if (c === ch) chUsers.add(uid); }
    const landSet = stepUsers.get('landing_view')!;
    const checkSet = stepUsers.get('checkout_complete') || new Set();
    const landing = [...chUsers].filter((u) => landSet.has(u)).length;
    const checkout = [...chUsers].filter((u) => checkSet.has(u)).length;
    byChannel[ch] = { landing, checkout, conversionPct: landing > 0 ? (checkout / landing) * 100 : 0 };
  }

  // Funnel by device
  const byDevice: Record<string, { landing: number; checkout: number; conversionPct: number }> = {};
  const deviceMap = new Map<string, string>();
  for (const e of events) {
    if (!deviceMap.has(e.userId)) {
      deviceMap.set(e.userId, e.server?.device?.type || 'unknown');
    }
  }

  const devices = new Set(deviceMap.values());
  for (const dev of devices) {
    const devUsers = new Set<string>();
    for (const [uid, d] of deviceMap) { if (d === dev) devUsers.add(uid); }
    const landSet = stepUsers.get('landing_view')!;
    const checkSet = stepUsers.get('checkout_complete') || new Set();
    const landing = [...devUsers].filter((u) => landSet.has(u)).length;
    const checkout = [...devUsers].filter((u) => checkSet.has(u)).length;
    byDevice[dev] = { landing, checkout, conversionPct: landing > 0 ? (checkout / landing) * 100 : 0 };
  }

  return { steps, byChannel, byDevice };
}

function calcGeo(events: AnalyticsEvent[]): GeoMetrics {
  // Determine geo per user (first event with geo data)
  const userGeo = new Map<string, { country: string; country_name: string; state?: string; region?: string }>();
  for (const e of events) {
    if (!userGeo.has(e.userId) && e.server?.geo?.country) {
      userGeo.set(e.userId, e.server.geo as any);
    }
  }

  // Countries
  const countryCount = new Map<string, { name: string; count: number }>();
  for (const geo of userGeo.values()) {
    const key = geo.country;
    const existing = countryCount.get(key);
    if (existing) {
      existing.count++;
    } else {
      countryCount.set(key, { name: geo.country_name, count: 1 });
    }
  }
  const countries = topN(
    [...countryCount.entries()].map(([code, v]) => ({ code, name: v.name, users: v.count })),
    'users',
    10
  );

  // BR states
  const stateCount = new Map<string, { region: string; count: number }>();
  for (const geo of userGeo.values()) {
    if (geo.country === 'BR' && geo.state) {
      const existing = stateCount.get(geo.state);
      if (existing) {
        existing.count++;
      } else {
        stateCount.set(geo.state, { region: geo.region || 'unknown', count: 1 });
      }
    }
  }
  const brStates = topN(
    [...stateCount.entries()].map(([state, v]) => ({ state, region: v.region, users: v.count })),
    'users',
    27
  );

  // BR regions
  const regionCount = new Map<string, number>();
  for (const geo of userGeo.values()) {
    if (geo.country === 'BR' && geo.region) {
      regionCount.set(geo.region, (regionCount.get(geo.region) || 0) + 1);
    }
  }
  const brRegions = topN(
    [...regionCount.entries()].map(([region, users]) => ({ region, users })),
    'users',
    10
  );

  return { countries, brStates, brRegions };
}

function calcTraffic(events: AnalyticsEvent[]): TrafficMetrics {
  // Per-user first context
  const userCtx = new Map<string, { channel: string; source?: string; campaign?: string; referrer?: string }>();
  for (const e of events) {
    if (!userCtx.has(e.userId) && e.context) {
      userCtx.set(e.userId, {
        channel: e.context.traffic_channel || 'unknown',
        source: e.context.utm_source,
        campaign: e.context.utm_campaign,
        referrer: e.context.referrer,
      });
    }
  }

  // Check which users converted
  const convertedUsers = uniqueUserSet(events, (e) => e.name === 'checkout_complete');

  // Channels
  const channelAgg = new Map<string, { users: Set<string>; sessions: Set<string> }>();
  for (const e of events) {
    const ch = e.context?.traffic_channel || 'unknown';
    if (!channelAgg.has(ch)) channelAgg.set(ch, { users: new Set(), sessions: new Set() });
    const agg = channelAgg.get(ch)!;
    agg.users.add(e.userId);
    agg.sessions.add(e.sessionId);
  }
  const channels = topN(
    [...channelAgg.entries()].map(([channel, agg]) => {
      const converted = [...agg.users].filter((u) => convertedUsers.has(u)).length;
      return {
        channel,
        users: agg.users.size,
        sessions: agg.sessions.size,
        conversionPct: agg.users.size > 0 ? (converted / agg.users.size) * 100 : 0,
      };
    }),
    'users',
    10
  );

  // Sources
  const sourceCount = new Map<string, Set<string>>();
  for (const [uid, ctx] of userCtx) {
    if (ctx.source) {
      if (!sourceCount.has(ctx.source)) sourceCount.set(ctx.source, new Set());
      sourceCount.get(ctx.source)!.add(uid);
    }
  }
  const sources = topN(
    [...sourceCount.entries()].map(([source, set]) => ({ source, users: set.size })),
    'users',
    10
  );

  // Campaigns
  const campaignCount = new Map<string, Set<string>>();
  for (const [uid, ctx] of userCtx) {
    if (ctx.campaign) {
      if (!campaignCount.has(ctx.campaign)) campaignCount.set(ctx.campaign, new Set());
      campaignCount.get(ctx.campaign)!.add(uid);
    }
  }
  const campaigns = topN(
    [...campaignCount.entries()].map(([campaign, set]) => ({ campaign, users: set.size })),
    'users',
    10
  );

  // Referrers
  const refCount = new Map<string, Set<string>>();
  for (const [uid, ctx] of userCtx) {
    if (ctx.referrer) {
      // Simplify to hostname
      let hostname = ctx.referrer;
      try { hostname = new URL(ctx.referrer).hostname; } catch {}
      if (!refCount.has(hostname)) refCount.set(hostname, new Set());
      refCount.get(hostname)!.add(uid);
    }
  }
  const referrers = topN(
    [...refCount.entries()].map(([referrer, set]) => ({ referrer, users: set.size })),
    'users',
    10
  );

  return { channels, sources, campaigns, referrers };
}

function calcDevices(events: AnalyticsEvent[]): DevicesMetrics {
  const userDevice = new Map<string, { type: string; browser: string; os: string; screenW: number; screenH: number }>();
  for (const e of events) {
    if (!userDevice.has(e.userId)) {
      userDevice.set(e.userId, {
        type: e.server?.device?.type || 'unknown',
        browser: e.server?.device?.browser || 'unknown',
        os: e.server?.device?.os || 'unknown',
        screenW: e.context?.screen_width || 0,
        screenH: e.context?.screen_height || 0,
      });
    }
  }

  const totalUsers = userDevice.size || 1;

  // Types
  const typeCount = new Map<string, number>();
  for (const d of userDevice.values()) {
    typeCount.set(d.type, (typeCount.get(d.type) || 0) + 1);
  }
  const types = topN(
    [...typeCount.entries()].map(([type, users]) => ({ type, users, pct: (users / totalUsers) * 100 })),
    'users',
    5
  );

  // Browsers
  const browserCount = new Map<string, number>();
  for (const d of userDevice.values()) {
    browserCount.set(d.browser, (browserCount.get(d.browser) || 0) + 1);
  }
  const browsers = topN(
    [...browserCount.entries()].map(([browser, users]) => ({ browser, users })),
    'users',
    10
  );

  // OS
  const osCount = new Map<string, number>();
  for (const d of userDevice.values()) {
    osCount.set(d.os, (osCount.get(d.os) || 0) + 1);
  }
  const os = topN(
    [...osCount.entries()].map(([osName, users]) => ({ os: osName, users })),
    'users',
    10
  );

  // Screens
  const screenCount = new Map<string, number>();
  for (const d of userDevice.values()) {
    const bucket = screenBucket(d.screenW, d.screenH);
    screenCount.set(bucket, (screenCount.get(bucket) || 0) + 1);
  }
  const screens = topN(
    [...screenCount.entries()].map(([size, users]) => ({ size, users })),
    'users',
    10
  );

  return { types, browsers, os, screens };
}

function calcEngagement(events: AnalyticsEvent[]): EngagementMetrics {
  // Session durations from session_end events
  const sessionDurations: number[] = events
    .filter((e) => e.name === 'session_end' && e.metadata?.session_duration_ms)
    .map((e) => e.metadata!.session_duration_ms as number);

  const avgSessionMs = sessionDurations.length > 0
    ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
    : 0;
  const medianSessionMs = median(sessionDurations);

  // Bounce rate: sessions with only 1 event type (only landing_view, no other meaningful events)
  const sessionEvents = new Map<string, Set<string>>();
  for (const e of events) {
    if (!sessionEvents.has(e.sessionId)) sessionEvents.set(e.sessionId, new Set());
    sessionEvents.get(e.sessionId)!.add(e.name);
  }
  const totalSessions = sessionEvents.size || 1;
  let bounced = 0;
  for (const names of sessionEvents.values()) {
    if (names.size <= 1) bounced++;
  }
  const bounceRate = (bounced / totalSessions) * 100;

  // Pages per session
  const sessionPages = new Map<string, Set<string>>();
  for (const e of events) {
    if (!sessionPages.has(e.sessionId)) sessionPages.set(e.sessionId, new Set());
    sessionPages.get(e.sessionId)!.add(e.page);
  }
  let totalPages = 0;
  for (const pages of sessionPages.values()) totalPages += pages.size;
  const avgPagesPerSession = sessionPages.size > 0 ? totalPages / sessionPages.size : 0;

  // Return rate: users with more than 1 session
  const userSessions = new Map<string, Set<string>>();
  for (const e of events) {
    if (!userSessions.has(e.userId)) userSessions.set(e.userId, new Set());
    userSessions.get(e.userId)!.add(e.sessionId);
  }
  let returnedUsers = 0;
  for (const sessions of userSessions.values()) {
    if (sessions.size > 1) returnedUsers++;
  }
  const returnRate = userSessions.size > 0 ? (returnedUsers / userSessions.size) * 100 : 0;

  // Duration buckets
  const bucketCount = new Map<string, number>();
  for (const dur of sessionDurations) {
    const bucket = sessionDurationBucket(dur);
    bucketCount.set(bucket, (bucketCount.get(bucket) || 0) + 1);
  }
  const bucketOrder = ['0-10s', '10-30s', '30-60s', '1-3min', '3-5min', '5-10min', '10min+'];
  const sessionDurationBuckets = bucketOrder.map((bucket) => ({
    bucket,
    count: bucketCount.get(bucket) || 0,
  }));

  return { avgSessionMs, medianSessionMs, bounceRate, avgPagesPerSession, returnRate, sessionDurationBuckets };
}

function calcUsers(events: AnalyticsEvent[]): UsersMetrics {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Build per-user profile
  const userProfiles = new Map<string, {
    firstSeen: number;
    lastSeen: number;
    sessions: Set<string>;
    eventsCount: number;
    maxFunnelIdx: number;
    channel: string;
    device: string;
    geo: string;
  }>();

  for (const e of events) {
    if (!userProfiles.has(e.userId)) {
      userProfiles.set(e.userId, {
        firstSeen: e.timestamp,
        lastSeen: e.timestamp,
        sessions: new Set(),
        eventsCount: 0,
        maxFunnelIdx: -1,
        channel: e.context?.traffic_channel || 'unknown',
        device: e.server?.device?.type || 'unknown',
        geo: e.server?.geo?.state || e.server?.geo?.country || 'unknown',
      });
    }

    const profile = userProfiles.get(e.userId)!;
    if (e.timestamp < profile.firstSeen) profile.firstSeen = e.timestamp;
    if (e.timestamp > profile.lastSeen) profile.lastSeen = e.timestamp;
    profile.sessions.add(e.sessionId);
    profile.eventsCount++;

    const funnelIdx = FUNNEL_STEPS.findIndex((s) => s.name === e.name);
    if (funnelIdx > profile.maxFunnelIdx) profile.maxFunnelIdx = funnelIdx;
  }

  const totalUnique = userProfiles.size;
  let newToday = 0;
  let returned = 0;

  for (const profile of userProfiles.values()) {
    if (profile.firstSeen >= todayStart.getTime()) newToday++;
    if (profile.sessions.size > 1) returned++;
  }

  // Top 50 users by events count
  const topUsers: UserRow[] = topN(
    [...userProfiles.entries()].map(([userId, p]) => ({
      userId: userId.substring(0, 20) + '...',
      firstSeen: p.firstSeen,
      lastSeen: p.lastSeen,
      sessions: p.sessions.size,
      eventsCount: p.eventsCount,
      maxFunnelStep: p.maxFunnelIdx >= 0 ? FUNNEL_STEPS[p.maxFunnelIdx].label : 'Nenhum',
      channel: p.channel,
      device: p.device,
      geo: p.geo,
    })),
    'eventsCount',
    50
  );

  return { totalUnique, newToday, returned, topUsers };
}

function calcTimeline(events: AnalyticsEvent[]): TimelineMetrics {
  const now = Date.now();
  const d30 = now - 30 * 24 * 60 * 60 * 1000;

  // Daily (last 30 days)
  const recentEvents = events.filter((e) => e.timestamp >= d30);
  const dayMap = new Map<string, { users: Set<string>; sessions: Set<string>; conversions: Set<string> }>();

  // Pre-fill last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = dateKey(d.getTime());
    dayMap.set(key, { users: new Set(), sessions: new Set(), conversions: new Set() });
  }

  for (const e of recentEvents) {
    const key = dateKey(e.timestamp);
    if (!dayMap.has(key)) continue;
    const day = dayMap.get(key)!;
    day.users.add(e.userId);
    day.sessions.add(e.sessionId);
    if (e.name === 'checkout_complete') day.conversions.add(e.userId);
  }

  const daily: TimelineDay[] = [...dayMap.entries()].map(([date, d]) => ({
    date,
    users: d.users.size,
    sessions: d.sessions.size,
    conversions: d.conversions.size,
  }));

  // Hourly distribution (all time)
  const hourCounts = new Array(24).fill(0);
  for (const e of events) {
    const hour = new Date(e.timestamp).getHours();
    hourCounts[hour]++;
  }
  const hourly = hourCounts.map((events, hour) => ({ hour, events }));

  return { daily, hourly };
}

function calcGameplay(events: AnalyticsEvent[]): GameplayMetrics {
  // Tier distribution
  const tierCounts = { A: 0, B: 0, C: 0, D: 0 };
  events
    .filter((e) => e.name === 'tier_result')
    .forEach((e) => {
      const tier = e.metadata?.tier as 'A' | 'B' | 'C' | 'D';
      if (tier && tier in tierCounts) tierCounts[tier]++;
    });

  // Win rate
  const finalVictories = events.filter((e) => e.name === 'final_victory');
  const wins = finalVictories.filter((e) => e.metadata?.win === true).length;
  const winRate = finalVictories.length > 0 ? (wins / finalVictories.length) * 100 : 0;

  // Plot twist
  const round3Users = uniqueUsers(events, (e) => e.name === 'round3_complete');
  const plotTwistUsers = uniqueUsers(events, (e) => e.name === 'plot_twist_triggered');
  const plotTwistRate = round3Users > 0 ? (plotTwistUsers / round3Users) * 100 : 0;

  // AI usage
  const gameStartUsers = uniqueUsers(events, (e) => e.name === 'game_start');
  const aiUsers = uniqueUsers(events, (e) => e.name === 'ai_used');
  const aiUsageRate = gameStartUsers > 0 ? (aiUsers / gameStartUsers) * 100 : 0;

  // Scratch
  const rewardViews = uniqueUsers(events, (e) => e.name === 'reward_view');
  const rewardReveals = uniqueUsers(events, (e) => e.name === 'reward_reveal');
  const scratchCompletionRate = rewardViews > 0 ? (rewardReveals / rewardViews) * 100 : 0;

  const revealEvents = events.filter((e) => e.name === 'reward_reveal' && e.metadata?.timeToRevealMs);
  const avgTimeMs = revealEvents.length > 0
    ? revealEvents.reduce((sum, e) => sum + (e.metadata!.timeToRevealMs as number), 0) / revealEvents.length
    : 0;
  const avgTimeToRevealSec = avgTimeMs > 0 ? Math.round(avgTimeMs / 1000) : 0;

  return { tierDistribution: tierCounts, winRate, plotTwistRate, aiUsageRate, scratchCompletionRate, avgTimeToRevealSec };
}

// ============================================
// MAIN CALCULATOR
// ============================================

// ============================================
// API COSTS CALCULATOR (uses separate data source)
// ============================================

import type { ApiCostEntry } from './api-cost-logger';

export function calcApiCosts(entries: ApiCostEntry[], uniqueUsersTotal: number): ApiCostsMetrics {
  const now = Date.now();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const d7 = now - 7 * 24 * 60 * 60 * 1000;
  const d30 = now - 30 * 24 * 60 * 60 * 1000;

  let totalCalls = 0, totalTokens = 0, totalCostUSD = 0;
  let analyzeCalls = 0, analyzeCostUSD = 0;
  let suggestCalls = 0, suggestCostUSD = 0;
  let costToday = 0, cost7d = 0, cost30d = 0;

  const dailyMap = new Map<string, { calls: number; costUSD: number }>();

  // Pre-fill last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = dateKey(d.getTime());
    dailyMap.set(key, { calls: 0, costUSD: 0 });
  }

  for (const e of entries) {
    totalCalls++;
    totalTokens += e.totalTokens;
    totalCostUSD += e.costUSD;

    if (e.endpoint === 'analyze') { analyzeCalls++; analyzeCostUSD += e.costUSD; }
    if (e.endpoint === 'suggest') { suggestCalls++; suggestCostUSD += e.costUSD; }

    if (e.timestamp >= todayStart.getTime()) costToday += e.costUSD;
    if (e.timestamp >= d7) cost7d += e.costUSD;
    if (e.timestamp >= d30) cost30d += e.costUSD;

    const key = dateKey(e.timestamp);
    if (dailyMap.has(key)) {
      const day = dailyMap.get(key)!;
      day.calls++;
      day.costUSD += e.costUSD;
    }
  }

  const avgCostPerUser = uniqueUsersTotal > 0 ? totalCostUSD / uniqueUsersTotal : 0;

  const daily = [...dailyMap.entries()].map(([date, d]) => ({
    date,
    calls: d.calls,
    costUSD: Math.round(d.costUSD * 10000) / 10000,
  }));

  return {
    totalCalls, totalTokens,
    totalCostUSD: Math.round(totalCostUSD * 10000) / 10000,
    analyzeCalls, analyzeCostUSD: Math.round(analyzeCostUSD * 10000) / 10000,
    suggestCalls, suggestCostUSD: Math.round(suggestCostUSD * 10000) / 10000,
    costToday: Math.round(costToday * 10000) / 10000,
    cost7d: Math.round(cost7d * 10000) / 10000,
    cost30d: Math.round(cost30d * 10000) / 10000,
    avgCostPerUser: Math.round(avgCostPerUser * 10000) / 10000,
    daily,
  };
}

const SECTION_CALCULATORS: Partial<Record<SectionName, (events: AnalyticsEvent[]) => any>> = {
  overview: calcOverview,
  funnel_detailed: calcFunnelDetailed,
  geo: calcGeo,
  traffic: calcTraffic,
  devices: calcDevices,
  engagement: calcEngagement,
  users: calcUsers,
  timeline: calcTimeline,
  gameplay: calcGameplay,
};

export function calculateMetricsV2(
  events: AnalyticsEvent[],
  sections?: SectionName[],
  timeRangeHours?: number
): MetricsV2 {
  // Filter by time range
  const filtered = timeRangeHours
    ? events.filter((e) => e.timestamp >= Date.now() - timeRangeHours * 60 * 60 * 1000)
    : events;

  const requestedSections = sections || (Object.keys(SECTION_CALCULATORS) as SectionName[]);

  const result: MetricsV2 = {};
  for (const section of requestedSections) {
    const calc = SECTION_CALCULATORS[section];
    if (calc) {
      (result as any)[section] = calc(filtered);
    }
  }

  return result;
}
