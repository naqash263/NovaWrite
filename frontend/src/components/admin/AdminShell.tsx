import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ExternalLink, LogOut, Menu, Search, X } from 'lucide-react';
import { adminNav, adminNavItems, findAdminNavItem } from './adminNav';

interface AdminShellProps {
  user: { name: string; email: string };
  onLogout: () => void;
  children: ReactNode;
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return adminNavItems;
    return adminNavItems.filter((item) => `${item.label} ${item.section} ${item.keywords ?? ''}`.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/50 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Go to admin page"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter' && results[active]) {
                e.preventDefault();
                go(results[active].path);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Jump to an admin page…"
            aria-label="Search admin pages"
            aria-controls="admin-palette-results"
            aria-activedescendant={results[active] ? `admin-palette-${active}` : undefined}
            className="h-12 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="rounded border border-slate-200 px-1.5 text-[10px] text-slate-500">Esc</kbd>
        </div>
        <ul id="admin-palette-results" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {results.map((item, i) => {
            const Icon = item.icon;
            return (
              <li
                key={item.path}
                id={`admin-palette-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item.path)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${i === active ? 'bg-blue-50 text-blue-800' : 'text-slate-700'}`}
              >
                <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                <span className="text-xs text-slate-400">{item.section}</span>
              </li>
            );
          })}
          {!results.length && <li className="px-3 py-6 text-center text-sm text-slate-500">No admin page matches &ldquo;{query}&rdquo;.</li>}
        </ul>
      </div>
    </div>
  );
}

export default function AdminShell({ user, onLogout, children }: AdminShellProps) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const current = findAdminNavItem(location.pathname);

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      } else if (e.key === 'Escape') {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      <div className="flex h-16 items-center justify-between gap-3 border-b border-white/10 px-5">
        <Link to="/admin" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-mono text-xs font-semibold text-slate-950">NT</span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-white">Naqash Thaheem</span>
            <span className="block text-xs text-slate-400">Admin</span>
          </span>
        </Link>
        <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Close navigation">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-3 pt-4">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 hover:border-white/20 hover:text-slate-200"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded border border-white/15 px-1.5 text-[10px]">Ctrl K</kbd>
        </button>
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {adminNav.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = current?.path === item.path;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active ? 'bg-white/10 font-medium text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                      }`}
                    >
                      <Icon className={`h-4 w-4 flex-none ${active ? 'text-sky-300' : ''}`} aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{user.name}</span>
            <span className="block truncate text-xs text-slate-400">{user.email}</span>
          </span>
          <button type="button" onClick={onLogout} className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-red-300" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <div className="absolute inset-0 bg-slate-950/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 text-sm">
              <li>
                <Link to="/admin" className="text-slate-500 hover:text-slate-900">
                  Admin
                </Link>
              </li>
              {current && current.path !== '/admin' && (
                <>
                  <li aria-hidden="true" className="text-slate-300">
                    <ChevronRight className="h-4 w-4" />
                  </li>
                  <li className="hidden text-slate-500 sm:block">{current.section}</li>
                  <li aria-hidden="true" className="hidden text-slate-300 sm:block">
                    <ChevronRight className="h-4 w-4" />
                  </li>
                  <li className="truncate font-medium text-slate-900" aria-current="page">
                    {current.label}
                  </li>
                </>
              )}
            </ol>
          </nav>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:border-slate-300 hover:text-slate-900 md:flex"
          >
            <Search className="h-4 w-4" aria-hidden="true" /> Jump to…
            <kbd className="rounded border border-slate-200 px-1 text-[10px]">Ctrl K</kbd>
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <span className="hidden sm:inline">View site</span>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </header>

        <main id="admin-main" className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
