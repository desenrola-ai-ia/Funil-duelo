'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MetricsV2, SectionName } from '@/lib/metrics-calculator';
import { AuthScreen } from './components/auth-screen';
import { TabNav, type TabId } from './components/tab-nav';
import { OverviewTab } from './components/overview-tab';
import { TrafficTab } from './components/traffic-tab';
import { DevicesTab } from './components/devices-tab';
import { GeoTab } from './components/geo-tab';
import { EngagementTab } from './components/engagement-tab';
import { UsersTab } from './components/users-tab';
import { GameplayTab } from './components/gameplay-tab';

// Map tabs → sections needed from API
const TAB_SECTIONS: Record<TabId, SectionName[]> = {
  overview: ['overview', 'funnel_detailed', 'timeline', 'api_costs'],
  traffic: ['traffic'],
  devices: ['devices'],
  geo: ['geo'],
  engagement: ['engagement'],
  users: ['users'],
  gameplay: ['gameplay'],
};

type TimeRange = '24h' | '7d' | '30d' | 'all';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [metrics, setMetrics] = useState<MetricsV2>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const fetchSections = useCallback(async (secret: string, sections: SectionName[], range: TimeRange) => {
    const params = new URLSearchParams();
    params.set('sections', sections.join(','));
    if (range !== 'all') params.set('range', range);

    const res = await fetch('/api/admin/metrics?' + params.toString(), {
      headers: { 'x-admin-secret': secret },
    });
    if (res.status === 401) throw new Error('unauthorized');
    return res.json() as Promise<MetricsV2>;
  }, []);

  const loadTab = useCallback(async (tab: TabId, secret: string, range: TimeRange) => {
    setLoading(true);
    try {
      const sections = TAB_SECTIONS[tab];
      const data = await fetchSections(secret, sections, range);
      setMetrics((prev) => ({ ...prev, ...data }));
    } catch (e: any) {
      if (e.message === 'unauthorized') {
        setIsAuthenticated(false);
        setAdminSecret('');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchSections]);

  // Auth handler
  const handleAuth = async (secret: string) => {
    setAdminSecret(secret);
    setLoading(true);
    try {
      const data = await fetchSections(secret, TAB_SECTIONS.overview, timeRange);
      setMetrics(data);
      setIsAuthenticated(true);
    } catch {
      // Invalid secret
    } finally {
      setLoading(false);
    }
  };

  // Reload when tab or time range changes
  useEffect(() => {
    if (!isAuthenticated || !adminSecret) return;
    loadTab(activeTab, adminSecret, timeRange);
  }, [activeTab, timeRange, isAuthenticated, adminSecret, loadTab]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
  };

  if (!isAuthenticated) return <AuthScreen onAuth={handleAuth} />;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Dashboard Desenrola</h1>
              <p className="text-gray-500 text-xs mt-0.5">Analytics & Metricas</p>
            </div>
            <div className="flex items-center gap-2">
              {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' +
                    (timeRange === range
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700')
                  }
                >
                  {range === 'all' ? 'Tudo' : range}
                </button>
              ))}
            </div>
          </div>
          <TabNav active={activeTab} onChange={handleTabChange} />
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="fixed top-4 right-4 z-20 bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-lg">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Carregando...
        </div>
      )}

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            overview={metrics.overview}
            funnel={metrics.funnel_detailed}
            timeline={metrics.timeline}
            apiCosts={metrics.api_costs}
          />
        )}
        {activeTab === 'traffic' && <TrafficTab traffic={metrics.traffic} />}
        {activeTab === 'devices' && <DevicesTab devices={metrics.devices} />}
        {activeTab === 'geo' && <GeoTab geo={metrics.geo} />}
        {activeTab === 'engagement' && <EngagementTab engagement={metrics.engagement} />}
        {activeTab === 'users' && <UsersTab users={metrics.users} />}
        {activeTab === 'gameplay' && <GameplayTab gameplay={metrics.gameplay} />}
      </div>

      {/* Footer */}
      <div className="text-center text-gray-700 text-xs py-6">Desenrola AI Dashboard v2</div>
    </div>
  );
}
