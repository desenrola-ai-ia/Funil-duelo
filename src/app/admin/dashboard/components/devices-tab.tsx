'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from './metric-card';
import { DataTable } from './data-table';
import type { DevicesMetrics } from '@/lib/metrics-calculator';

const DEVICE_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'];

export function DevicesTab({ devices }: { devices?: DevicesMetrics }) {
  if (!devices) return <p className="text-gray-500 text-center py-12">Sem dados de dispositivos</p>;

  const pieData = devices.types.map((t, i) => ({
    name: t.type,
    value: t.users,
    fill: DEVICE_COLORS[i % DEVICE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device type pie */}
        <Card title="TIPO DE DISPOSITIVO">
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
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {devices.types.map((t, i) => (
              <div key={t.type} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                <span className="text-sm text-gray-400 capitalize">{t.type}</span>
                <span className="text-sm font-mono text-white">{t.pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Screen sizes */}
        <Card title="TAMANHOS DE TELA">
          <DataTable
            columns={[
              { key: 'size', label: 'Faixa' },
              { key: 'users', label: 'Usuarios', align: 'right' },
            ]}
            data={devices.screens}
            emptyMessage="Sem dados de tela"
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Browsers */}
        <Card title="NAVEGADORES">
          <DataTable
            columns={[
              { key: 'browser', label: 'Navegador' },
              { key: 'users', label: 'Usuarios', align: 'right' },
            ]}
            data={devices.browsers}
          />
        </Card>

        {/* OS */}
        <Card title="SISTEMAS OPERACIONAIS">
          <DataTable
            columns={[
              { key: 'os', label: 'OS' },
              { key: 'users', label: 'Usuarios', align: 'right' },
            ]}
            data={devices.os}
          />
        </Card>
      </div>
    </div>
  );
}
