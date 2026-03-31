import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, Calculator, FileSpreadsheet, FileText, HardHat, Settings, ShieldAlert, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  color: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'from-violet-500 to-purple-500' },
  { to: '/projects', label: 'Projects', icon: FolderKanban, color: 'from-blue-500 to-cyan-500' },
  { to: '/clients', label: 'Clients', icon: Users, color: 'from-emerald-500 to-teal-500' },
  { to: '/quotations', label: 'Quotations', icon: FileSpreadsheet, color: 'from-orange-500 to-amber-500' },
  { to: '/rate-card', label: 'Rate Card', icon: Calculator, color: 'from-pink-500 to-rose-500', adminOnly: true },
  { to: '/labour', label: 'Labour', icon: HardHat, color: 'from-yellow-500 to-orange-500', adminOnly: true },
  { to: '/proposals', label: 'Proposals', icon: FileText, color: 'from-indigo-500 to-blue-500' },
  { to: '/admin', label: 'Admin Panel', icon: ShieldAlert, color: 'from-red-500 to-pink-500', adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings, color: 'from-gray-500 to-slate-500' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[260px] transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-white font-bold text-sm">DB</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-tight">DesignBid</span>
              <span className="text-[10px] text-slate-400 -mt-0.5">Interior Design Studio</span>
            </div>
          </div>
          <button className="lg:hidden p-1 text-slate-400 hover:text-white rounded" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

        {/* Navigation */}
        <nav className="p-3 mt-2 space-y-0.5 flex-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                    isActive
                      ? `bg-gradient-to-br ${item.color} shadow-lg`
                      : 'bg-slate-700/50'
                  )}>
                    <item.icon size={16} className="text-white" />
                  </div>
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="mx-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-3" />
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-bold">{user?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name || 'User'}</p>
              <p className="text-[11px] text-slate-400 truncate">{isAdmin ? 'Admin' : 'Designer'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
