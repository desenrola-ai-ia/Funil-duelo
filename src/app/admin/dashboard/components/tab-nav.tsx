'use client';

export type TabId = 'overview' | 'traffic' | 'devices' | 'geo' | 'engagement' | 'users' | 'gameplay';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Visao Geral', icon: '📊' },
  { id: 'traffic', label: 'Trafego', icon: '🔗' },
  { id: 'devices', label: 'Dispositivos', icon: '📱' },
  { id: 'geo', label: 'Geo', icon: '🌍' },
  { id: 'engagement', label: 'Engajamento', icon: '⏱' },
  { id: 'users', label: 'Usuarios', icon: '👥' },
  { id: 'gameplay', label: 'Gameplay', icon: '🎮' },
];

export function TabNav({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ' +
            (active === tab.id
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800/60 text-gray-400 hover:bg-gray-800 hover:text-gray-300')
          }
        >
          <span className="text-xs">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
