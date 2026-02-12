'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MetricCard, Card } from './metric-card';
import type { OverviewMetrics, FunnelDetailedMetrics, TimelineMetrics, ApiCostsMetrics } from '@/lib/metrics-calculator';

function formatMs(ms: number): string {
  if (ms <= 0) return '—';
  const sec = Math.round(ms / 1000);
  if (sec < 60) return sec + 's';
  const min = Math.floor(sec / 60);
  const remaining = sec % 60;
  return min + 'm ' + remaining + 's';
}

function funnelStepColor(pct: number): string {
  if (pct >= 80) return 'text-green-400';
  if (pct >= 50) return 'text-emerald-400';
  if (pct >= 30) return 'text-yellow-400';
  if (pct >= 15) return 'text-orange-400';
  return 'text-red-400';
}

function formatUSD(value: number): string {
  if (value >= 1) return '$' + value.toFixed(2);
  if (value >= 0.01) return '$' + value.toFixed(3);
  if (value === 0) return '$0.00';
  return '$' + value.toFixed(4);
}

export function OverviewTab({
  overview,
  funnel,
  timeline,
  apiCosts,
}: {
  overview?: OverviewMetrics;
  funnel?: FunnelDetailedMetrics;
  timeline?: TimelineMetrics;
  apiCosts?: ApiCostsMetrics;
}) {
  if (!overview) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label="Usuarios (24h)" value={overview.uniqueUsers24h} />
        <MetricCard label="Usuarios (7d)" value={overview.uniqueUsers7d} />
        <MetricCard label="Total Usuarios" value={overview.uniqueUsersTotal} />
        <MetricCard label="Games Iniciados" value={overview.gamesStarted} />
        <MetricCard label="Games Finalizados" value={overview.gamesFinished} />
        <MetricCard label="Checkout Views" value={overview.checkoutsViewed} />
        <MetricCard label="Conversoes" value={overview.checkoutsCompleted} color="text-green-400" />
        <MetricCard label="Conversao %" value={overview.conversionRate.toFixed(1) + '%'} color="text-purple-400" />
        <MetricCard label="Sessao Media" value={formatMs(overview.avgSessionMs)} />
      </div>

      {/* API Costs */}
      {apiCosts && (
        <Card title="CUSTO OPENAI API">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-gray-400 text-[10px] uppercase">Custo Total</p>
              <p className="text-xl font-bold text-orange-400 mt-1">{formatUSD(apiCosts.totalCostUSD)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-gray-400 text-[10px] uppercase">Hoje</p>
              <p className="text-xl font-bold text-yellow-400 mt-1">{formatUSD(apiCosts.costToday)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-gray-400 text-[10px] uppercase">7 Dias</p>
              <p className="text-xl font-bold text-white mt-1">{formatUSD(apiCosts.cost7d)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-gray-400 text-[10px] uppercase">30 Dias</p>
              <p className="text-xl font-bold text-white mt-1">{formatUSD(apiCosts.cost30d)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-gray-400 text-[10px] uppercase">Custo/Usuario</p>
              <p className="text-xl font-bold text-purple-400 mt-1">{formatUSD(apiCosts.avgCostPerUser)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-gray-400 text-[10px] uppercase">Total Calls</p>
              <p className="text-xl font-bold text-white mt-1">{apiCosts.totalCalls.toLocaleString()}</p>
            </div>
          </div>

          {/* Breakdown analyze vs suggest */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] uppercase">Analyze</p>
                <p className="text-sm font-mono mt-1">{apiCosts.analyzeCalls} calls</p>
              </div>
              <p className="text-sm font-bold text-orange-400">{formatUSD(apiCosts.analyzeCostUSD)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] uppercase">Suggest</p>
                <p className="text-sm font-mono mt-1">{apiCosts.suggestCalls} calls</p>
              </div>
              <p className="text-sm font-bold text-orange-400">{formatUSD(apiCosts.suggestCostUSD)}</p>
            </div>
          </div>

          {/* Daily cost chart */}
          {apiCosts.daily.length > 0 && (
            <div>
              <h4 className="text-gray-500 text-xs uppercase mb-3">Custo Diario (30D)</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={apiCosts.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis
                      dataKey="date"
                      stroke="#4B5563"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis
                      stroke="#4B5563"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => '$' + v.toFixed(3)}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: 12 }}
                      formatter={(value) => [formatUSD(value as number), 'Custo']}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="costUSD" fill="#F97316" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tokens info */}
          <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-4 text-xs text-gray-500">
            <span>Tokens totais: {apiCosts.totalTokens.toLocaleString()}</span>
            <span>Modelo: gpt-4o-mini</span>
            <span>Input: $0.15/1M | Output: $0.60/1M</span>
          </div>
        </Card>
      )}

      {/* Funnel */}
      {funnel && (
        <Card title="FUNIL DETALHADO">
          <div className="space-y-2">
            {funnel.steps.map((step, i) => {
              const barWidth = step.pctOfTotal;
              return (
                <div key={step.name} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-gray-400 text-right shrink-0">{step.label}</div>
                  <div className="flex-1 relative">
                    <div className="h-7 bg-gray-800 rounded overflow-hidden">
                      <div
                        className="h-full bg-purple-600/60 rounded transition-all"
                        style={{ width: Math.max(barWidth, 1) + '%' }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-sm font-mono text-right">{step.users}</div>
                  <div className={'w-14 text-xs font-mono text-right ' + funnelStepColor(step.pctOfTotal)}>
                    {step.pctOfTotal.toFixed(1)}%
                  </div>
                  <div className="w-16 text-xs font-mono text-right text-red-400/70">
                    {i > 0 && step.dropOffPct > 0 ? '-' + step.dropOffPct.toFixed(0) + '%' : '—'}
                  </div>
                  <div className="w-16 text-xs font-mono text-right text-gray-500">
                    {step.avgTimeToNextMs > 0 ? formatMs(step.avgTimeToNextMs) : '—'}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-3 text-[10px] text-gray-600 mt-1">
              <div className="w-24 text-right">Etapa</div>
              <div className="flex-1" />
              <div className="w-12 text-right">Users</div>
              <div className="w-14 text-right">% Total</div>
              <div className="w-16 text-right">Drop-off</div>
              <div className="w-16 text-right">Tempo</div>
            </div>
          </div>

          {/* By Channel */}
          {Object.keys(funnel.byChannel).length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <h4 className="text-gray-500 text-xs uppercase mb-3">Funil por Canal</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(funnel.byChannel)
                  .sort((a, b) => b[1].landing - a[1].landing)
                  .map(([channel, data]) => (
                    <div key={channel} className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 capitalize">{channel}</p>
                      <p className="text-sm font-mono mt-1">{data.landing} <span className="text-gray-600">→</span> {data.checkout}</p>
                      <p className="text-xs text-purple-400 font-mono">{data.conversionPct.toFixed(1)}%</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* By Device */}
          {Object.keys(funnel.byDevice).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <h4 className="text-gray-500 text-xs uppercase mb-3">Funil por Dispositivo</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(funnel.byDevice)
                  .sort((a, b) => b[1].landing - a[1].landing)
                  .map(([device, data]) => (
                    <div key={device} className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 capitalize">{device}</p>
                      <p className="text-sm font-mono mt-1">{data.landing} <span className="text-gray-600">→</span> {data.checkout}</p>
                      <p className="text-xs text-purple-400 font-mono">{data.conversionPct.toFixed(1)}%</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Timeline */}
      {timeline && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="USUARIOS POR DIA (30D)">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis
                    dataKey="date"
                    stroke="#4B5563"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis stroke="#4B5563" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="sessions" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="DISTRIBUICAO HORARIA">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline.hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="hour" stroke="#4B5563" tick={{ fontSize: 10 }} tickFormatter={(v) => v + 'h'} />
                  <YAxis stroke="#4B5563" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: 12 }}
                  />
                  <Bar dataKey="events" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
