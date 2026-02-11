'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricCard, Card } from './metric-card';
import type { GameplayMetrics } from '@/lib/metrics-calculator';

const TIER_COLORS = { A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#EF4444' };
const TIER_LABELS = { A: 'Insano', B: 'Boa', C: 'Fraca', D: 'Ruim' };

export function GameplayTab({ gameplay }: { gameplay?: GameplayMetrics }) {
  if (!gameplay) return <p className="text-gray-500 text-center py-12">Sem dados de gameplay</p>;

  const tierData = [
    { name: 'Tier A - ' + TIER_LABELS.A, value: gameplay.tierDistribution.A, fill: TIER_COLORS.A },
    { name: 'Tier B - ' + TIER_LABELS.B, value: gameplay.tierDistribution.B, fill: TIER_COLORS.B },
    { name: 'Tier C - ' + TIER_LABELS.C, value: gameplay.tierDistribution.C, fill: TIER_COLORS.C },
    { name: 'Tier D - ' + TIER_LABELS.D, value: gameplay.tierDistribution.D, fill: TIER_COLORS.D },
  ];

  const gameplayBars = [
    { name: 'Uso de IA', value: gameplay.aiUsageRate, fill: '#8B5CF6' },
    { name: 'Win Rate', value: gameplay.winRate, fill: '#10B981' },
    { name: 'Plot Twist', value: gameplay.plotTwistRate, fill: '#EC4899' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="Uso de IA" value={gameplay.aiUsageRate.toFixed(1) + '%'} color="text-purple-400" />
        <MetricCard label="Win Rate" value={gameplay.winRate.toFixed(1) + '%'} color="text-green-400" />
        <MetricCard label="Plot Twist" value={gameplay.plotTwistRate.toFixed(1) + '%'} color="text-pink-400" />
        <MetricCard label="Raspadinha %" value={gameplay.scratchCompletionRate.toFixed(1) + '%'} />
        <MetricCard label="Tempo Rasp." value={gameplay.avgTimeToRevealSec + 's'} />
        <MetricCard
          label="Tiers Total"
          value={gameplay.tierDistribution.A + gameplay.tierDistribution.B + gameplay.tierDistribution.C + gameplay.tierDistribution.D}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier pie */}
        <Card title="DISTRIBUICAO DE TIERS">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tierData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value">
                  {tierData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {tierData.map((t) => (
              <div key={t.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.fill }} />
                <span className="text-xs text-gray-400">{t.name}</span>
                <span className="text-xs font-mono text-white">{t.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Gameplay bars */}
        <Card title="METRICAS DE GAMEPLAY">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gameplayBars} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis type="number" domain={[0, 100]} stroke="#4B5563" tick={{ fontSize: 10 }} tickFormatter={(v) => v + '%'} />
                <YAxis type="category" dataKey="name" stroke="#4B5563" width={80} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: 12 }} formatter={(v) => (typeof v === 'number' ? v.toFixed(1) + '%' : v)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {gameplayBars.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Scratch card */}
      <Card title="RASPADINHA">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
            <p className="text-4xl font-bold text-white">{gameplay.scratchCompletionRate.toFixed(1)}%</p>
            <p className="text-gray-400 mt-2">Taxa de Conclusao</p>
            <p className="text-xs text-gray-500 mt-1">Meta: 95%+</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
            <p className="text-4xl font-bold text-white">{gameplay.avgTimeToRevealSec}s</p>
            <p className="text-gray-400 mt-2">Tempo Medio Revelacao</p>
            <p className="text-xs text-gray-500 mt-1">Meta: 15-35s</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
