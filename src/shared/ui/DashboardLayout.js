import { NavLink } from 'react-router-dom';
import { Activity, BarChart3, Database, FileText, Search, Settings, SlidersHorizontal } from 'lucide-react';

const links = [
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/queries', label: 'Queries', icon: SlidersHorizontal },
  { to: '/results', label: 'Results', icon: Database },
  { to: '/indexing', label: 'Indexing', icon: Activity },
  { to: '/evaluation', label: 'Evaluation', icon: BarChart3 },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen md:flex">
      <aside className="w-full border-b border-gray-200 bg-white p-4 md:w-64 md:border-b-0 md:border-r">
        <h1 className="mb-4 text-xl font-semibold">IR Platform</h1>
        <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-6">
        <header className="mb-4 rounded-md bg-white p-3 shadow-sm">
          <p className="text-sm text-gray-500">System status: Connected to backend</p>
        </header>
        {children}
      </main>
    </div>
  );
}
