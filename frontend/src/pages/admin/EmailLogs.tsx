import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, Mail, RefreshCw, TrendingUp, XCircle } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, SearchInput, StatCard, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface EmailLog {
  id: number;
  action: string;
  recipient_email: string;
  status: 'success' | 'failed' | string;
  error_message: string | null;
  attempts: number;
  created_at: string;
  failure_reason_code?: string | null;
  failure_category?: string | null;
  http_status_code?: number | null;
  provider_name?: string | null;
}

interface FailureCategory {
  category: string;
  count: number;
  description?: string;
  suggested_action?: string;
}

interface LogStats {
  total?: number;
  success?: number;
  failed?: number;
  success_rate?: number;
  common_errors?: Array<{ error_message: string; count: number }>;
  failure_categories?: FailureCategory[];
  failure_by_provider?: Array<{ provider_name: string; count: number }>;
}

interface Filters {
  status: string;
  action: string;
  date_from: string;
  date_to: string;
}

const ACTIONS = [
  { value: 'welcome_email', label: 'Welcome email' },
  { value: 'password_reset', label: 'Password reset' },
  { value: 'email_verification', label: 'Email verification' },
  { value: 'course_enrollment', label: 'Course enrollment' },
  { value: 'workflow_notification', label: 'Workflow notification' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'system_maintenance', label: 'System maintenance' },
];

const EMPTY_FILTERS: Filters = { status: 'all', action: 'all', date_from: '', date_to: '' };

const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60';

const num = (v: unknown) => (typeof v === 'number' ? v.toLocaleString() : '—');

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function EmailLogs() {
  useSEO({ title: 'Email Logs | Admin', robots: 'noindex, nofollow' });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [page, setPage] = useState(1);

  const dateError = filters.date_from && filters.date_to && filters.date_from > filters.date_to ? 'The start date must be before the end date.' : undefined;

  const logsQuery = useQuery({
    queryKey: ['email-logs', filters, debouncedSearch, page],
    enabled: !dateError,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params: Record<string, string | number> = { page };
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.action !== 'all') params.action = filters.action;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (filters.date_from) params.date_from = filters.date_from;
      // Include the whole end day.
      if (filters.date_to) params.date_to = `${filters.date_to} 23:59:59`;
      const payload = (await apiClient.get('/admin/email-logs', { params })).data;
      const p = payload?.data;
      return { items: asList<EmailLog>(payload), meta: { current_page: p?.current_page ?? 1, last_page: p?.last_page ?? 1, total: p?.total } };
    },
  });

  const statsQuery = useQuery({
    queryKey: ['email-logs-stats'],
    queryFn: async () => {
      const data = (await apiClient.get('/admin/email-logs/stats')).data?.data;
      return (data && typeof data === 'object' && !Array.isArray(data) ? data : {}) as LogStats;
    },
  });

  const logs = logsQuery.data?.items ?? [];
  const meta = logsQuery.data?.meta;
  const stats = statsQuery.data;
  const categories = Array.isArray(stats?.failure_categories) ? stats.failure_categories : [];
  const providers = Array.isArray(stats?.failure_by_provider) ? stats.failure_by_provider : [];
  const commonErrors = Array.isArray(stats?.common_errors) ? stats.common_errors : [];
  const filtered = filters.status !== 'all' || filters.action !== 'all' || !!filters.date_from || !!filters.date_to || !!debouncedSearch.trim();

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Email Logs"
        description="Every delivery attempt made through n8n, with failure diagnostics."
        actions={
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              logsQuery.refetch();
              statsQuery.refetch();
            }}
            disabled={logsQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${logsQuery.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        }
      />

      {stats && !statsQuery.isError && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="log-stats">
          <StatCard label="Total" icon={Mail} value={num(stats.total)} />
          <StatCard label="Delivered" icon={CheckCircle2} value={num(stats.success)} />
          <StatCard label="Failed" icon={XCircle} value={num(stats.failed)} />
          <StatCard label="Success rate" icon={TrendingUp} value={typeof stats.success_rate === 'number' ? `${stats.success_rate}%` : '—'} />
        </div>
      )}

      {(categories.length > 0 || commonErrors.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {categories.length > 0 && (
            <AdminCard title="Failures by category">
              <ul className="space-y-3">
                {categories.map((c) => (
                  <li key={c.category} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium capitalize text-slate-900">{c.category}</span>
                      <Badge tone="danger">{c.count}</Badge>
                    </div>
                    {c.description && <p className="mt-1 text-xs text-slate-600">{c.description}</p>}
                    {c.suggested_action && (
                      <p className="mt-1.5 flex gap-1.5 text-xs text-blue-800">
                        <Lightbulb className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                        {c.suggested_action}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              {providers.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs">
                  <span className="font-medium text-slate-700">By provider:</span>
                  {providers.map((p) => (
                    <Badge key={p.provider_name}>
                      {p.provider_name}: {p.count}
                    </Badge>
                  ))}
                </div>
              )}
            </AdminCard>
          )}
          {commonErrors.length > 0 && (
            <AdminCard title="Most common errors">
              <ul className="divide-y divide-slate-100">
                {commonErrors.map((e, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 break-words text-slate-700">{e.error_message}</span>
                    <span className="flex-none text-xs font-medium text-red-700">{e.count}×</span>
                  </li>
                ))}
              </ul>
            </AdminCard>
          )}
        </div>
      )}

      <AdminCard padded={false}>
        <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Status">
            {(props) => (
              <select {...props} className={inputClass} value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
                <option value="all">All statuses</option>
                <option value="success">Delivered</option>
                <option value="failed">Failed</option>
              </select>
            )}
          </Field>
          <Field label="Action">
            {(props) => (
              <select {...props} className={inputClass} value={filters.action} onChange={(e) => setFilter('action', e.target.value)}>
                <option value="all">All actions</option>
                {ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Recipient">
            {(props) => (
              <SearchInput
                {...props}
                label="Search by recipient email"
                placeholder="Search email"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            )}
          </Field>
          <Field label="From">{(props) => <input {...props} type="date" className={inputClass} value={filters.date_from} onChange={(e) => setFilter('date_from', e.target.value)} />}</Field>
          <Field label="To" error={dateError}>
            {(props) => <input {...props} type="date" className={inputClass} value={filters.date_to} onChange={(e) => setFilter('date_to', e.target.value)} />}
          </Field>
        </div>

        {logsQuery.isLoading ? (
          <LoadingState label="Loading logs…" />
        ) : logsQuery.isError ? (
          <ErrorState message={apiErrorMessage(logsQuery.error)} onRetry={() => logsQuery.refetch()} />
        ) : logs.length === 0 ? (
          filtered ? (
            <EmptyState
              title="No logs match these filters"
              action={
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => {
                    setFilters(EMPTY_FILTERS);
                    setSearch('');
                  }}
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState icon={Mail} title="No emails logged yet" description="Delivery attempts appear here as soon as the site sends email." />
          )
        ) : (
          <>
            <TableShell caption="Email logs">
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col">Recipient</th>
                  <th scope="col">Status</th>
                  <th scope="col">Error</th>
                  <th scope="col">Attempts</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-xs text-slate-900">{log.action}</td>
                    <td className="whitespace-nowrap">{log.recipient_email}</td>
                    <td>
                      <Badge tone={log.status === 'success' ? 'success' : log.status === 'failed' ? 'danger' : 'neutral'}>{log.status === 'success' ? 'Delivered' : log.status}</Badge>
                    </td>
                    <td className="max-w-xs">
                      {log.error_message ? (
                        <span className="block truncate text-xs text-slate-700" title={log.error_message}>
                          {log.error_message}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {log.failure_category && (
                        <span className="block text-xs text-slate-500">
                          {log.failure_category}
                          {log.failure_reason_code ? ` (${log.failure_reason_code})` : ''}
                          {log.http_status_code ? ` · HTTP ${log.http_status_code}` : ''}
                          {log.provider_name ? ` · ${log.provider_name}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="tabular-nums">{log.attempts}</td>
                    <td className="whitespace-nowrap text-xs">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
            {meta && meta.last_page > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
                <span>
                  Page {meta.current_page} of {meta.last_page}
                </span>
                <span className="flex gap-1">
                  <IconButton label="Previous page" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} />
                  <IconButton label="Next page" icon={ChevronRight} disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} />
                </span>
              </nav>
            )}
          </>
        )}
      </AdminCard>
    </div>
  );
}
