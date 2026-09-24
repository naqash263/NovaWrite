import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FileText, FolderTree, Files, PenSquare, Plus, Users, UsersRound, Workflow } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useAuthContext } from '../../contexts/AuthContext';
import { AdminCard, AdminPageHeader, Badge, StatCard } from '../../components/admin/ui';
import { asList } from '../../components/admin/utils';
import { adminNav } from '../../components/admin/adminNav';

interface PopularGroup {
  id: number;
  name: string;
  color?: string;
  members_count: number;
}

interface DashboardStats {
  posts?: { total?: number; published?: number; drafts?: number };
  workflows?: { total?: number; featured?: number; premium?: number };
  categories?: number;
  users?: { total?: number; admins?: number; recent?: number };
  files?: number;
  groups?: { total?: number; active?: number; popular_groups?: PopularGroup[] };
  failed: string[];
}

const countOf = (payload: unknown) => {
  const total = (payload as { total?: number; meta?: { total?: number } })?.total ?? (payload as { meta?: { total?: number } })?.meta?.total;
  return typeof total === 'number' ? total : asList(payload).length;
};

async function loadStats(): Promise<DashboardStats> {
  const requests = {
    posts: apiClient.get('/admin/posts/stats'),
    workflows: apiClient.get('/admin/workflows/stats'),
    categories: apiClient.get('/categories'),
    users: apiClient.get('/admin/users/stats'),
    files: apiClient.get('/files'),
    groups: apiClient.get('/admin/user-groups/stats'),
  };
  const keys = Object.keys(requests) as (keyof typeof requests)[];
  // One failing endpoint must not blank the whole dashboard.
  const settled = await Promise.allSettled(Object.values(requests));
  const stats: DashboardStats = { failed: [] };
  settled.forEach((result, i) => {
    const key = keys[i];
    if (result.status === 'rejected') {
      stats.failed.push(key);
      return;
    }
    const data = result.value.data;
    if (key === 'categories') stats.categories = countOf(data);
    else if (key === 'files') stats.files = countOf(data);
    else if (key === 'groups') stats.groups = data?.stats ?? data;
    else stats[key] = data?.data ?? data;
  });
  return stats;
}

const fmt = (n: number | undefined) => (typeof n === 'number' ? n.toLocaleString() : '—');

const quickActions = [
  { to: '/admin/posts', label: 'Write a post', description: 'Create or edit blog articles', icon: PenSquare },
  { to: '/admin/workflows', label: 'Add a workflow', description: 'Publish an automation template', icon: Plus },
  { to: '/admin/projects', label: 'Update projects', description: 'Manage portfolio projects', icon: FolderTree },
  { to: '/admin/user-management', label: 'Manage users', description: 'Roles, access and accounts', icon: Users },
];

export default function Dashboard() {
  useSEO({ title: 'Admin Dashboard | Naqash Thaheem', robots: 'noindex, nofollow' });
  const { user } = useAuthContext();

  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: loadStats,
    staleTime: 5 * 60 * 1000,
  });

  const loading = isLoading ? '…' : undefined;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description={`${greeting}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Here is an overview of your site content and users.`}
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      {stats && stats.failed.length > 0 && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Some statistics could not be loaded ({stats.failed.join(', ')}). Other figures are up to date.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="dashboard-stats">
        <StatCard
          label="Posts"
          icon={FileText}
          value={loading ?? fmt(stats?.posts?.total)}
          hint={stats?.posts ? `${fmt(stats.posts.published)} published · ${fmt(stats.posts.drafts)} drafts` : undefined}
        />
        <StatCard
          label="Workflows"
          icon={Workflow}
          value={loading ?? fmt(stats?.workflows?.total)}
          hint={stats?.workflows ? `${fmt(stats.workflows.featured)} featured · ${fmt(stats.workflows.premium)} premium` : undefined}
        />
        <StatCard
          label="Users"
          icon={Users}
          value={loading ?? fmt(stats?.users?.total)}
          hint={stats?.users ? `${fmt(stats.users.admins)} admins · ${fmt(stats.users.recent)} new this month` : undefined}
        />
        <StatCard label="Files" icon={Files} value={loading ?? fmt(stats?.files)} hint={`${fmt(stats?.categories)} blog categories`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard title="Quick actions" className="lg:col-span-2">
          <ul className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.to}>
                  <Link to={action.to} className="group flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{action.label}</span>
                      <span className="block text-xs text-slate-500">{action.description}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </AdminCard>

        <AdminCard title="User groups" description={typeof stats?.groups?.total === 'number' ? `${fmt(stats.groups.active)} of ${fmt(stats.groups.total)} active` : undefined}>
          {stats?.groups?.popular_groups?.length ? (
            <ul className="space-y-3">
              {stats.groups.popular_groups.slice(0, 5).map((group) => (
                <li key={group.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: group.color || '#64748b' }} aria-hidden="true" />
                    <span className="truncate text-slate-700">{group.name}</span>
                  </span>
                  <Badge>{group.members_count} members</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <UsersRound className="h-4 w-4" aria-hidden="true" /> No group activity yet.
            </p>
          )}
          <Link to="/admin/user-groups" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800">
            Manage groups <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </AdminCard>
      </div>

      <AdminCard title="All admin areas">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {adminNav
            .filter((section) => section.title !== 'Overview')
            .map((section) => (
              <div key={section.title}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{section.title}</p>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.path}>
                        <Link to={item.path} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950">
                          <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </div>
      </AdminCard>
    </div>
  );
}
