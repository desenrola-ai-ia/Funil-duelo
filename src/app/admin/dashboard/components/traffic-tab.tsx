'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from './metric-card';
import { DataTable } from './data-table';
import type { TrafficMetrics } from '@/lib/metrics-calculator';

const CHANNEL_COLORS: Record<string, string> = {
  direct: '#8B5CF6',
  organic: '#10B981',
  social: '#3B82F6',
  paid: '#F59E0B',
  referral: '#EC4899',
  unknown: '#6B7280',
};

export function TrafficTab({ traffic }: { traffic?: TrafficMetrics }) {
  if (!traffic) return <p className="text-gray-500 text-center py-12">Sem dados de trafego</p>;

  const pieData = traffic.channels.map((ch) => ({
    name: ch.channel,
    value: ch.users,
    fill: CHANNEL_COLORS[ch.channel] || '#6B7280',
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel distribution */}
        <Card title="CANAIS DE TRAFEGO">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-xs text-gray-400 capitalize">{d.name}</span>
                <span className="text-xs font-mono text-gray-500">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Channel conversions */}
        <Card title="CONVERSAO POR CANAL">
          <DataTable
            columns={[
              { key: 'channel', label: 'Canal', render: (r: any) => <span className="capitalize">{r.channel}</span> },
              { key: 'users', label: 'Usuarios', align: 'right' },
              { key: 'sessions', label: 'Sessoes', align: 'right' },
              { key: 'conversionPct', label: 'Conversao', align: 'right', render: (r: any) => <span className="text-purple-400">{r.conversionPct.toFixed(1)}%</span> },
            ]}
            data={traffic.channels}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sources */}
        <Card title="FONTES (UTM_SOURCE)">
          {traffic.sources.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Nenhum utm_source registrado</p>
          ) : (
            <DataTable
              columns={[
                { key: 'source', label: 'Fonte' },
                { key: 'users', label: 'Users', align: 'right' },
              ]}
              data={traffic.sources}
            />
          )}
        </Card>

        {/* Campaigns */}
        <Card title="CAMPANHAS">
          {traffic.campaigns.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Nenhuma campanha registrada</p>
          ) : (
            <DataTable
              columns={[
                { key: 'campaign', label: 'Campanha' },
                { key: 'users', label: 'Users', align: 'right' },
              ]}
              data={traffic.campaigns}
            />
          )}
        </Card>

        {/* Referrers */}
        <Card title="REFERRERS">
          {traffic.referrers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Nenhum referrer registrado</p>
          ) : (
            <DataTable
              columns={[
                { key: 'referrer', label: 'Referrer' },
                { key: 'users', label: 'Users', align: 'right' },
              ]}
              data={traffic.referrers}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
