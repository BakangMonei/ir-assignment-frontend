import { NavLink } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Beaker,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  Search,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import { Input, Pill } from './UiPrimitives';
import { usePlatformReadiness } from '../hooks/usePlatformReadiness';
import { useState } from 'react';

const links = [
  { to: '/data-source', label: 'Data Source', icon: Database },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/queries', label: 'Queries', icon: SlidersHorizontal },
  { to: '/results', label: 'Results', icon: Database },
  { to: '/indexing', label: 'Indexing', icon: Activity },
  { to: '/evaluation', label: 'Evaluation', icon: BarChart3 },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/experiments', label: 'Experiments', icon: Beaker },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout({ children }) {
  const readiness = usePlatformReadiness();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
      <aside
        className={`w-full border-b border-cyan-500/20 bg-slate-950/90 p-4 transition-all md:border-b-0 md:border-r ${collapsed ? 'md:w-20' : 'md:w-72'}`}
      >
        <div className="mb-4 flex items-center justify-between">
          {!collapsed && (
            <h1 className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-xl font-bold text-transparent">
              IR Platform
            </h1>
          )}
          <button
            className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200"
            onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center rounded-md border px-3 py-2 text-sm transition ${collapsed ? 'justify-center' : 'gap-2'} ${
                  isActive
                    ? 'border-cyan-300/40 bg-cyan-500/20 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.15)]'
                    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200'
                }`
              }
              title={label}
            >
              <Icon size={16} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-6">
        <header className="mb-4 flex flex-col gap-3 rounded-xl border border-cyan-500/20 bg-slate-900/70 p-3 shadow-[0_0_20px_rgba(59,130,246,0.12)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <Input
            aria-label="Global search"
            placeholder="Global quick search"
            className="md:max-w-sm"
          />
          <div className="flex items-center gap-2">
            <Pill>{`Dataset: ${readiness.dataset}`}</Pill>
            <Pill tone={readiness.backendConnected ? 'success' : 'danger'}>
              {readiness.backendConnected ? 'Backend connected' : 'Backend disconnected'}
            </Pill>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
