import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Calendar, Eraser, Filter, RefreshCw, TrendingUp, Users } from 'lucide-react';
import apiClient from '../../api/axios';
import Button from '../../components/ui/Button';
import {
  AdminCard,
  AdminPageHeader,
  Badge,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Modal,
  SearchInput,
  StatCard,
  TableShell,
  inputClass,
} from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';
import { useToast } from '../../hooks/use-toast';
import { useSEO } from '../../utils/seo';

interface UserActivity {
  id: number;
  user_id?: number;
  activity_type?: string;
  description?: string;
  metadata?: unknown;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
  user?: { id: number; name?: string; email?: string } | null;
}

interface Statistics {
  total_activities?: number;
  activities_by_type?: Array<{ activity_type: string; count: number }>;
  most_active_users?: Array<{ user_id: number; activity_count: number; user?: { name?: string; email?: string } | null }>;
  timeline?: Array<{ date: string; count: number }>;
}

type Filters = { activity_type: string; user_id: string; start_date: string; end_date: string; search: string };
const emptyFilters: Filters = { activity_type: '', user_id: '', start_date: '', end_date: '', search: '' };

const fmt = (n: unknown) => (typeof n === 'number' ? n.toLocaleString() : '—');
const humanize = (type?: string) => (type ? type.replace(/_/g, ' ') : 'unknown');
const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};
const toneFor = (type?: string): 'success' | 'info' | 'warning' | 'danger' | 'neutral' => {
  if (!type) return 'neutral';
  if (type === 'login' || type.endsWith('_completed')) return 'success';
  if (type === 'register' || type.endsWith('_created') || type.endsWith('_enrolled')) return 'info';
  if (type.includes('failed') || type.includes('deleted')) return 'danger';
  if (type.includes('uploaded')) return 'warning';
  return 'neutral';
};
const localDateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function UserActivities() {
  useSEO({ title: 'User Activities | Admin', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupDays, setCleanupDays] = useState('90');
  const [cleanupError, setCleanupError] = useState<string | undefined>();

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => (prev.search === searchInput.trim() ? prev : { ...prev, search: searchInput.trim() }));
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const activitiesQuery = useQuery({
    queryKey: ['admin-user-activities', currentPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
      });
      const response = await apiClient.get(`/admin/user-activities?${params}`);
      const paginator = (response.data?.data ?? {}) as { last_page?: number; total?: number };
      return {
        activities: asList<UserActivity>(response.data).filter((a) => a && typeof a === 'object'),
        lastPage: typeof paginator.last_page === 'number' && paginator.last_page > 0 ? paginator.last_page : 1,
        total: typeof paginator.total === 'number' ? paginator.total : undefined,
      };
    },
    placeholderData: (prev) => prev,
  });

  const statsQuery = useQuery({
    queryKey: ['admin-user-activities-stats', filters.start_date, filters.end_date],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      const response = await apiClient.get(`/admin/user-activities/statistics?${params}`);
      const data = response.data?.data;
      return (data && typeof data === 'object' && !Array.isArray(data) ? data : {}) as Statistics;
    },
  });

  const typesQuery = useQuery({
    queryKey: ['admin-user-activity-types'],
    queryFn: async () => asList<string>((await apiClient.get('/admin/user-activities/types')).data).filter((t) => typeof t === 'string'),
    staleTime: 5 * 60 * 1000,
  });

  const cleanupMutation = useMutation({
    mutationFn: async (days: number) => {
      const response = await apiClient.delete('/admin/user-activities/cleanup', { params: { days } });
      return response.data as { message?: string; deleted_count?: number };
    },
    onSuccess: (data) => {
      addToast({ type: 'success', title: 'Old activities removed', description: data?.message || 'Cleanup completed.' });
      setCleanupOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-user-activities'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-activities-stats'] });
    },
    onError: (error) => {
      setCleanupError(apiErrorMessage(error));
      addToast({ type: 'error', title: 'Cleanup failed', description: apiErrorMessage(error) });
    },
  });

  const activities = activitiesQuery.data?.activities ?? [];
  const totalPages = activitiesQuery.data?.lastPage ?? 1;
  const stats = statsQuery.data;
  const byType = Array.isArray(stats?.activities_by_type) ? stats.activities_by_type : [];
  const topUsers = Array.isArray(stats?.most_active_users) ? stats.most_active_users : [];
  const timeline = Array.isArray(stats?.timeline) ? stats.timeline : [];
  const today = localDateKey();
  const todayCount = timeline.find((t) => typeof t?.date === 'string' && t.date.slice(0, 10) === today)?.count ?? 0;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setSearchInput('');
    setCurrentPage(1);
  };

  const refresh = () => {
    activitiesQuery.refetch();
    statsQuery.refetch();
  };

  const submitCleanup = (e: FormEvent) => {
    e.preventDefault();
    const days = Number(cleanupDays);
    if (!cleanupDays.trim() || !Number.isInteger(days)) return setCleanupError('Enter a whole number of days.');
    if (days < 30) return setCleanupError('Activities newer than 30 days cannot be removed.');
    setCleanupError(undefined);
    cleanupMutation.mutate(days);
  };

  let tableContent;
  if (activitiesQuery.isLoading) tableContent = <LoadingState label="Loading activities…" />;
  else if (activitiesQuery.isError)
    tableContent = <ErrorState title="Could not load activities" message={apiErrorMessage(activitiesQuery.error)} onRetry={() => activitiesQuery.refetch()} />;
  else if (activities.length === 0)
    tableContent = (
      <EmptyState
        icon={Activity}
        title={activeFilterCount ? 'No activities match your filters' : 'No activity recorded yet'}
        description={activeFilterCount ? 'Try widening the date range or clearing filters.' : 'User logins, registrations and other actions will appear here.'}
        action={
          activeFilterCount ? (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={refresh} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
          )
        }
      />
    );
  else
    tableContent = (
      <TableShell caption="User activities">
        <thead>
          <tr>
            <th>User</th>
            <th>Activity</th>
            <th>Description</th>
            <th>IP address</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {activities.map((activity) => (
            <tr key={activity.id}>
              <td>
                <p className="whitespace-nowrap font-medium text-slate-900">{activity.user?.name ?? `User #${activity.user_id ?? '?'}`}</p>
                <p className="text-xs text-slate-500">{activity.user?.email ?? 'Deleted user'}</p>
              </td>
              <td className="whitespace-nowrap">
                <Badge tone={toneFor(activity.activity_type)}>{humanize(activity.activity_type)}</Badge>
              </td>
              <td className="min-w-[16rem]">{activity.description || '—'}</td>
              <td className="whitespace-nowrap font-mono text-xs text-slate-500">{activity.ip_address || 'N/A'}</td>
              <td className="whitespace-nowrap text-slate-500">{formatDateTime(activity.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Activities"
        description="Track and analyse user behaviour across the platform."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              aria-expanded={showFilters}
              aria-controls="activity-filters"
              onClick={() => setShowFilters((v) => !v)}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Button>
            <Button variant="outline" size="sm" onClick={refresh} disabled={activitiesQuery.isFetching} leftIcon={<RefreshCw className={`h-4 w-4 ${activitiesQuery.isFetching ? 'animate-spin' : ''}`} />}>
              Refresh
            </Button>
            <Button variant="danger" size="sm" onClick={() => { setCleanupError(undefined); setCleanupOpen(true); }} leftIcon={<Eraser className="h-4 w-4" />}>
              Clean up
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="activity-stats">
        <StatCard label="Total activities" icon={Activity} value={statsQuery.isLoading ? '…' : fmt(stats?.total_activities)} hint={filters.start_date || filters.end_date ? 'In selected range' : 'Last 30 days'} />
        <StatCard label="Most active users" icon={Users} value={statsQuery.isLoading ? '…' : fmt(topUsers.length)} hint="Top 10 by activity count" />
        <StatCard label="Activity types" icon={TrendingUp} value={statsQuery.isLoading ? '…' : fmt(byType.length)} />
        <StatCard label="Today" icon={Calendar} value={statsQuery.isLoading ? '…' : fmt(todayCount)} />
      </div>
      {statsQuery.isError && (
        <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Activity statistics could not be loaded. The activity list below is still available.
        </p>
      )}

      {showFilters && (
        <AdminCard title="Filters" actions={<Button variant="ghost" size="sm" onClick={clearFilters} disabled={!activeFilterCount}>Clear filters</Button>}>
          <div id="activity-filters" className="grid gap-4 md:grid-cols-3">
            <Field label="Activity type">
              {(p) => (
                <select {...p} className={inputClass} value={filters.activity_type} onChange={(e) => setFilter('activity_type', e.target.value)}>
                  <option value="">All types</option>
                  {(typesQuery.data ?? []).map((type) => (
                    <option key={type} value={type}>
                      {humanize(type)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Start date">
              {(p) => <input {...p} type="date" className={inputClass} value={filters.start_date} max={filters.end_date || undefined} onChange={(e) => setFilter('start_date', e.target.value)} />}
            </Field>
            <Field label="End date">
              {(p) => <input {...p} type="date" className={inputClass} value={filters.end_date} min={filters.start_date || undefined} onChange={(e) => setFilter('end_date', e.target.value)} />}
            </Field>
          </div>
        </AdminCard>
      )}

      {(byType.length > 0 || topUsers.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <AdminCard title="Activity by type">
            {byType.length ? (
              <ul className="space-y-2 text-sm">
                {[...byType].sort((a, b) => (b?.count ?? 0) - (a?.count ?? 0)).slice(0, 8).map((row) => (
                  <li key={row.activity_type} className="flex items-center justify-between gap-3">
                    <Badge tone={toneFor(row.activity_type)}>{humanize(row.activity_type)}</Badge>
                    <span className="tabular-nums text-slate-700">{fmt(row.count)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No activity in this period.</p>
            )}
          </AdminCard>
          <AdminCard title="Most active users">
            {topUsers.length ? (
              <ol className="space-y-2 text-sm">
                {topUsers.slice(0, 8).map((row) => (
                  <li key={row.user_id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-slate-700">{row.user?.name ?? `User #${row.user_id}`}</span>
                    <span className="tabular-nums text-slate-700">{fmt(row.activity_count)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500">No activity in this period.</p>
            )}
          </AdminCard>
        </div>
      )}

      <AdminCard padded={false}>
        <div className="border-b border-slate-200 p-4">
          <SearchInput label="Search activity descriptions" placeholder="Search in descriptions…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        {tableContent}
        {totalPages > 1 && !activitiesQuery.isError && (
          <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm">
            <p className="text-slate-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </nav>
        )}
      </AdminCard>

      <Modal
        open={cleanupOpen}
        size="sm"
        title="Clean up old activities"
        description="Permanently delete activity records older than the given number of days."
        onClose={() => setCleanupOpen(false)}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCleanupOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="activity-cleanup-form" variant="danger" size="sm" loading={cleanupMutation.isPending}>
              Delete old activities
            </Button>
          </>
        }
      >
        <form id="activity-cleanup-form" noValidate onSubmit={submitCleanup}>
          <Field label="Delete activities older than (days)" required error={cleanupError} hint="Minimum 30 days. This cannot be undone.">
            {(p) => <input {...p} type="number" min={30} step={1} inputMode="numeric" className={inputClass} value={cleanupDays} onChange={(e) => setCleanupDays(e.target.value)} />}
          </Field>
        </form>
      </Modal>
    </div>
  );
}
