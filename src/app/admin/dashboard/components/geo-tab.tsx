'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from './metric-card';
import { DataTable } from './data-table';
import type { GeoMetrics } from '@/lib/metrics-calculator';

export function GeoTab({ geo }: { geo?: GeoMetrics }) {
  if (!geo) return <p className="text-gray-500 text-center py-12">Sem dados de geolocalizacao</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Countries */}
        <Card title="PAISES">
          {geo.countries.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Sem dados de pais (eventos antigos)</p>
          ) : (
            <DataTable
              columns={[
                { key: 'code', label: 'Codigo' },
                { key: 'name', label: 'Pais' },
                { key: 'users', label: 'Usuarios', align: 'right' },
              ]}
              data={geo.countries}
            />
          )}
        </Card>

        {/* BR Regions */}
        <Card title="REGIOES DO BRASIL">
          {geo.brRegions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Sem dados de regiao</p>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geo.brRegions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis type="number" stroke="#4B5563" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="region" stroke="#4B5563" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: 12 }} />
                  <Bar dataKey="users" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* BR States */}
      <Card title="ESTADOS DO BRASIL">
        {geo.brStates.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">Sem dados de estado</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {geo.brStates.map((s) => (
              <div key={s.state} className="bg-gray-800/50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">{s.state}</p>
                <p className="text-xs text-gray-500">{s.region}</p>
                <p className="text-sm font-mono text-purple-400 mt-1">{s.users}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
