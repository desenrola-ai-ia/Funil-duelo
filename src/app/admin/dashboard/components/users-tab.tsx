'use client';

import { MetricCard, Card } from './metric-card';
import { DataTable } from './data-table';
import type { UsersMetrics } from '@/lib/metrics-calculator';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function UsersTab({ users }: { users?: UsersMetrics }) {
  if (!users) return <p className="text-gray-500 text-center py-12">Sem dados de usuarios</p>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total Unicos" value={users.totalUnique} />
        <MetricCard label="Novos Hoje" value={users.newToday} color="text-green-400" />
        <MetricCard label="Retornaram" value={users.returned} color="text-purple-400" />
      </div>

      {/* Users table */}
      <Card title={'TOP USUARIOS (' + users.topUsers.length + ')'}>
        <DataTable
          columns={[
            { key: 'userId', label: 'ID', render: (r: any) => <span className="text-xs text-gray-400">{r.userId}</span> },
            { key: 'firstSeen', label: 'Primeiro', render: (r: any) => <span className="text-xs">{formatDate(r.firstSeen)}</span> },
            { key: 'lastSeen', label: 'Ultimo', render: (r: any) => <span className="text-xs">{formatDate(r.lastSeen)}</span> },
            { key: 'sessions', label: 'Sessoes', align: 'right' },
            { key: 'eventsCount', label: 'Eventos', align: 'right' },
            {
              key: 'maxFunnelStep', label: 'Max Etapa', render: (r: any) => {
                const colors: Record<string, string> = {
                  'Conversao': 'text-green-400', 'Checkout': 'text-yellow-400', 'Raspadinha': 'text-purple-400',
                  'Recompensa': 'text-purple-400', 'Resultado': 'text-blue-400',
                };
                return <span className={'text-xs font-medium ' + (colors[r.maxFunnelStep] || 'text-gray-400')}>{r.maxFunnelStep}</span>;
              },
            },
            { key: 'channel', label: 'Canal', render: (r: any) => <span className="text-xs capitalize">{r.channel}</span> },
            { key: 'device', label: 'Device', render: (r: any) => <span className="text-xs capitalize">{r.device}</span> },
            { key: 'geo', label: 'Geo', render: (r: any) => <span className="text-xs">{r.geo}</span> },
          ]}
          data={users.topUsers}
        />
      </Card>
    </div>
  );
}
