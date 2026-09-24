import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { services } from '../../data/services';
import { ServiceIcon } from './ui';

interface HeaderUser {
  name: string;
  email: string;
  role: string;
}

interface SiteHeaderProps {
  user: HeaderUser | null;
  onLogout: () => void;
  canInstall: boolean;
  onInstall: (source: string) => void;
  onBook: () => void;
}

const moreLinks = [
  { to: '/projects', label: 'All Projects' },
  { to: '/workflows', label: 'Workflow Templates' },
  { to: '/resources', label: 'Tools & Resources' },
  { to: '/community/issues', label: 'Community' },
];

type Menu = 'services' | 'more' | 'user' | 'search' | null;

const navItem = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'text-blue-700' : 'text-slate-700 hover:text-slate-950'
  }`;

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function SiteHeader({ user, onLogout, canInstall, onInstall, onBook }: SiteHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<Menu>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const headerRef = useRef<HTMLElement>(null);

  const toggle = (menu: Exclude<Menu, null>) => setOpenMenu((current) => (current === menu ? null : menu));

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
        setMobileOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpenMenu((current) => (current === 'search' ? null : 'search'));
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setOpenMenu(null);
    setMobileOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const servicesActive = location.pathname.startsWith('/services');
  const moreActive = moreLinks.some((l) => location.pathname.startsWith(l.to));

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-6 lg:h-[72px] lg:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="Naqash Thaheem, home">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 font-mono text-sm font-semibold text-white">NT</span>
          <span className="flex flex-col leading-tight">
            <span className="whitespace-nowrap text-[15px] font-semibold text-slate-950">Naqash Thaheem</span>
            <span className="hidden whitespace-nowrap text-xs text-slate-500 sm:block lg:hidden xl:block">Technical Project Manager · AI Automation</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex xl:gap-1">
          <div className="relative">
            <button
              type="button"
              aria-expanded={openMenu === 'services'}
              aria-controls="services-menu"
              onClick={() => toggle('services')}
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${servicesActive ? 'text-blue-700' : 'text-slate-700 hover:text-slate-950'}`}
            >
              Services <Chevron open={openMenu === 'services'} />
            </button>
            {openMenu === 'services' && (
              <div id="services-menu" className="absolute left-1/2 top-full mt-2 w-[560px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                <ul className="grid grid-cols-2 gap-1">
                  {services.map((s) => (
                    <li key={s.slug}>
                      <Link to={`/services/${s.slug}`} className="flex gap-3 rounded-xl p-3 hover:bg-slate-50">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                          <ServiceIcon icon={s.icon} className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">{s.name}</span>
                          <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{s.summary}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to="/services" className="mt-2 block rounded-xl bg-slate-50 px-4 py-2.5 text-center text-sm font-semibold text-blue-700 hover:bg-slate-100">
                  View all services
                </Link>
              </div>
            )}
          </div>
          <NavLink to="/case-studies" className={navItem}>
            Case Studies
          </NavLink>
          <NavLink to="/about" className={navItem}>
            About
          </NavLink>
          <NavLink to="/blog" className={navItem}>
            Blog
          </NavLink>
          <div className="relative">
            <button
              type="button"
              aria-expanded={openMenu === 'more'}
              aria-controls="more-menu"
              onClick={() => toggle('more')}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium ${moreActive ? 'text-blue-700' : 'text-slate-700 hover:text-slate-950'}`}
            >
              More <Chevron open={openMenu === 'more'} />
            </button>
            {openMenu === 'more' && (
              <ul id="more-menu" className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                {moreLinks.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <NavLink to="/contact" className={navItem}>
            Contact
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative hidden lg:block">
            <button
              type="button"
              aria-label="Search the site"
              aria-expanded={openMenu === 'search'}
              onClick={() => toggle('search')}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {openMenu === 'search' && (
              <form onSubmit={submitSearch} role="search" className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                <label htmlFor="site-search" className="sr-only">
                  Search
                </label>
                <input
                  id="site-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search blog, workflows, projects…"
                  autoFocus
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                <p className="mt-2 text-xs text-slate-500">Press Enter to search · Esc to close</p>
              </form>
            )}
          </div>

          {canInstall && (
            <button type="button" onClick={() => onInstall('header_button')} className="hidden rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 xl:block">
              Install app
            </button>
          )}

          {user ? (
            <div className="relative hidden lg:block">
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={openMenu === 'user'}
                onClick={() => toggle('user')}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
              {openMenu === 'user' && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                  <div className="border-b border-slate-100 px-4 pb-2">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  {user.role === 'admin' && (
                    <>
                      <Link to="/admin" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        Admin dashboard
                      </Link>
                      <Link to="/admin/projects" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        Manage projects
                      </Link>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      window.dispatchEvent(new CustomEvent('openNotificationSettings'));
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Notification settings
                  </button>
                  <button type="button" onClick={onLogout} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="hidden whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-950 xl:block">
              Log in
            </Link>
          )}

          <button
            type="button"
            onClick={onBook}
            className="hidden whitespace-nowrap rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:block"
          >
            <span className="lg:hidden xl:inline">Book a consultation</span>
            <span className="hidden lg:inline xl:hidden">Book a call</span>
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-menu" aria-label="Mobile" className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white lg:hidden">
          <div className="mx-auto w-full max-w-[1200px] space-y-6 px-5 py-6 sm:px-6">
            <form onSubmit={submitSearch} role="search">
              <label htmlFor="mobile-search" className="sr-only">
                Search
              </label>
              <input
                id="mobile-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
              />
            </form>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Services</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {services.map((s) => (
                  <li key={s.slug}>
                    <Link to={`/services/${s.slug}`} className="flex items-center gap-3 rounded-lg px-2 py-2 text-slate-800 hover:bg-slate-50">
                      <ServiceIcon icon={s.icon} className="h-5 w-5 text-blue-700" />
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <ul className="grid grid-cols-2 gap-1 border-t border-slate-100 pt-4">
              {[
                { to: '/', label: 'Home' },
                { to: '/case-studies', label: 'Case Studies' },
                { to: '/about', label: 'About' },
                { to: '/blog', label: 'Blog' },
                ...moreLinks,
                { to: '/contact', label: 'Contact' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="block rounded-lg px-2 py-2 font-medium text-slate-800 hover:bg-slate-50">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onBook();
                }}
                className="w-full rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white"
              >
                Book a consultation
              </button>
              {canInstall && (
                <button type="button" onClick={() => onInstall('mobile_menu')} className="w-full rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700">
                  Install app
                </button>
              )}
              {user ? (
                <div className="flex items-center justify-between gap-3 pt-2 text-sm">
                  <span className="text-slate-500">Signed in as {user.name}</span>
                  <div className="flex gap-3">
                    {user.role === 'admin' && (
                      <Link to="/admin" className="font-medium text-blue-700">
                        Admin
                      </Link>
                    )}
                    <button type="button" onClick={onLogout} className="font-medium text-red-600">
                      Log out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" className="rounded-lg border border-slate-300 px-4 py-2.5 text-center font-medium text-slate-700">
                    Log in
                  </Link>
                  <Link to="/register" className="rounded-lg border border-slate-300 px-4 py-2.5 text-center font-medium text-slate-700">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
