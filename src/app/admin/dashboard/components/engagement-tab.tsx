'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricCard, Card } from './metric-card';
import type { EngagementMetrics } from '@/lib/metrics-calculator';

function formatMs(ms: number): string {
  if (ms <= 0) return '—';
  const sec = Math.round(ms / 1000);
  if (sec < 60) return sec + 's';
  const min = Math.floor(sec / 60);
  const remaining = sec % 60;
  return min + 'm ' + remaining + 's';
}

export function EngagementTab({ engagement }: { engagement?: EngagementMetrics }) {
  if (!engagement) return <p className="text-gray-500 text-center py-12">Sem dados de engajamento</p>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Sessao Media" value={formatMs(engagement.avgSessionMs)} />
        <MetricCard label="Sessao Mediana" value={formatMs(engagement.medianSessionMs)} />
        <MetricCard label="Bounce Rate" value={engagement.bounceRate.toFixed(1) + '%'} color={engagement.bounceRate > 50 ? 'text-red-400' : 'text-green-400'} />
        <MetricCard label="Paginas/Sessao" value={engagement.avgPagesPerSession.toFixed(1)} />
        <MetricCard label="Taxa Retorno" value={engagement.returnRate.toFixed(1) + '%'} color="text-purple-400" />
      </div>

      {/* Session duration distribution */}
      <Card title="DISTRIBUICAO DE DURACAO DA SESSAO">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={engagement.sessionDurationBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="bucket" stroke="#4B5563" tick={{ fontSize: 10 }} />
              <YAxis stroke="#4B5563" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Interpretation */}
      <Card title="ANALISE">
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-gray-300 font-medium">Bounce Rate: {engagement.bounceRate.toFixed(0)}%</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {engagement.bounceRate > 60
                  ? 'Alto. Muitos visitantes saem sem interagir. Melhorar a landing.'
                  : engagement.bounceRate > 40
                    ? 'Moderado. Ha espaco para melhorar o engajamento inicial.'
                    : 'Bom. A maioria dos visitantes interage com o conteudo.'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
            <span className="text-lg">🔄</span>
            <div>
              <p className="text-gray-300 font-medium">Retorno: {engagement.returnRate.toFixed(0)}%</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {engagement.returnRate > 20
                  ? 'Usuarios estao voltando. Sinal de interesse no produto.'
                  : 'Poucos retornos. Funnel funciona como single-session (esperado para sales page).'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
