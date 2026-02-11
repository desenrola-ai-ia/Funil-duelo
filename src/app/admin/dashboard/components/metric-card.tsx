'use client';

export function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className={'text-2xl font-bold mt-1 ' + (color || 'text-white')}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={'bg-gray-900 border border-gray-800 rounded-xl p-6 ' + className}>
      <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}
