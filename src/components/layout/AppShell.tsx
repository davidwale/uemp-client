import { GraduationCap, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';
import { cn, ROLE_LABELS } from '@/lib/utils';
import { NAVIGATION } from './navigation';

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="rounded-lg bg-white/10 p-1.5">
        <GraduationCap className="h-5 w-5 text-white" aria-hidden />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-white">UEMP</p>
        <p className="text-[11px] text-brand-200">Education Management Portal</p>
      </div>
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const user = useCurrentUser();
  return (
    <nav className="flex h-full flex-col bg-brand-900" aria-label="Main navigation">
      <Brand />
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {NAVIGATION[user.role].map((section, i) => (
          <div key={section.title ?? i}>
            {section.title && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-brand-300/80 uppercase">{section.title}</p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive ? 'bg-white/12 text-white' : 'text-brand-100/80 hover:bg-white/6 hover:text-white',
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

export function AppShell() {
  const user = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const signOut = () => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) });
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`;

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <button
              className="absolute top-4 right-3 rounded-md p-1 text-brand-100 hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            {user.currentSemester && (
              <p className="truncate text-sm text-slate-500">
                <span className="hidden sm:inline">Current semester: </span>
                <span className="font-medium text-slate-700">{user.currentSemester.label}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
              <p className="text-xs text-slate-500">
                {ROLE_LABELS[user.role]}
                {user.department ? ` · ${user.department.code}` : ''}
              </p>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800"
              aria-hidden
            >
              {initials}
            </div>
            <button
              onClick={signOut}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
