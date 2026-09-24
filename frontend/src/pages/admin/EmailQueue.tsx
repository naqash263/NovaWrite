import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Inbox, Lightbulb, RefreshCw, RotateCcw, TrendingUp, XCircle } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, SearchInput, StatCard, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface EmailQueueItem {
  id: number;
  action: string;
  recipient_email: string;
  recipient_name: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | string;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
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

interface QueueStats {
  total?: number;
  pending?: number;
  processing?: number;
  completed?: number;
  failed?: number;
  success_rate?: number;
  recent_24h?: number;
  common_actions?: Array<{ action: string; count: number }>;
  failure_categories?: FailureCategory[];
  failure_by_provider?: Array<{ provider_name: string; count: number }>;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

const STATUS_TONE: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = { pending: 'warning', processing: 'info', completed: 'success', failed: 'danger' };

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60';

const num = (v: unknown) => (typeof v === 'number' ? v.toLocaleString() : '—');
const canRetry = (item: EmailQueueItem) => item.status === 'failed' || (item.status === 'pending' && item.attempts >= item.max_attempts);

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function EmailQueue() {
  useSEO({ title: 'Email Queue | Admin', robots: 'noindex, nofollow' });
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState('all');
  const [action, setAction] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);

  const listQuery = useQuery({
    queryKey: ['email-queue', status, action, debouncedSearch, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params: Record<string, string | number> = { page };
      if (status !== 'all') params.status = status;
      if (action !== 'all') params.action = action;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const payload = (await apiClient.get('/admin/email-queue', { params })).data;
      const items = asList<EmailQueueItem>(payload);
      const p = payload?.data;
      const meta: Meta = { current_page: p?.current_page ?? 1, last_page: p?.last_page ?? 1, total: p?.total ?? items.length };
      return { items, meta };
    },
  });

  const statsQuery = useQuery({
    queryKey: ['email-queue-stats'],
    queryFn: async () => {
      const data = (await apiClient.get('/admin/email-queue/stats')).data?.data;
      return (data && typeof data === 'object' && !Array.isArray(data) ? data : {}) as QueueStats;
    },
  });

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  const meta = listQuery.data?.meta;
  const stats = statsQuery.data;
  const retryable = useMemo(() => items.filter(canRetry).map((i) => i.id), [items]);
  const allSelected = retryable.length > 0 && retryable.every((id) => selected.includes(id));
  const filtered = status !== 'all' || action !== 'all' || !!debouncedSearch.trim();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['email-queue'] });
    queryClient.invalidateQueries({ queryKey: ['email-queue-stats'] });
  };

  const changeFilter = (fn: () => void) => {
    fn();
    setPage(1);
    setSelected([]);
  };

  const retryOne = useMutation({
    mutationFn: async (id: number) => (await apiClient.post(`/admin/email-queue/${id}/retry`)).data as { message?: string },
    onSuccess: (data) => {
      addToast({ type: 'success', title: 'Email re-sent', description: data?.message });
      refresh();
    },
    onError: (error) => {
      addToast({ type: 'error', title: 'Retry failed', description: apiErrorMessage(error) });
      refresh();
    },
  });

  const retryAll = useMutation({
    mutationFn: async () => (await apiClient.post('/admin/email-queue/retry-all')).data as { retry_count?: number; message?: string },
    onSuccess: (data) => {
      addToast({ type: 'success', title: 'Failed emails re-queued', description: data?.message ?? `Retried ${data?.retry_count ?? 0} failed emails.` });
      refresh();
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not retry emails', description: apiErrorMessage(error) }),
  });

  const retrySelected = useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.allSettled(ids.map((id) => apiClient.post(`/admin/email-queue/${id}/retry`)));
      return { ok: results.filter((r) => r.status === 'fulfilled').length, total: ids.length };
    },
    onSuccess: ({ ok, total }) => {
      addToast({ type: ok === total ? 'success' : 'warning', title: `Retried ${ok} of ${total} emails` });
      setSelected([]);
      refresh();
    },
  });

  const handleRetryAll = async () => {
    const ok = await confirm({ title: 'Retry all failed emails', message: 'Every failed email will be reset and queued again. Continue?', confirmText: 'Retry all', type: 'warning' });
    if (ok) retryAll.mutate();
  };

  const handleRetrySelected = async () => {
    const ok = await confirm({ title: 'Retry selected emails', message: `Retry ${selected.length} selected email(s) now?`, confirmText: 'Retry selected', type: 'warning' });
    if (ok) retrySelected.mutate(selected);
  };

  const categories = Array.isArray(stats?.failure_categories) ? stats.failure_categories : [];
  const providers = Array.isArray(stats?.failure_by_provider) ? stats.failure_by_provider : [];
  const actions = Array.isArray(stats?.common_actions) ? stats.common_actions : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Email Queue"
        description="Emails waiting to be delivered through n8n. Retry failures once the cause is fixed."
        actions={
          <>
            <button type="button" className={btnSecondary} onClick={refresh} disabled={listQuery.isFetching}>
              <RefreshCw className={`h-4 w-4 ${listQuery.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
            {selected.length > 0 && (
              <button type="button" className={btnSecondary} onClick={handleRetrySelected} disabled={retrySelected.isPending}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Retry selected ({selected.length})
              </button>
            )}
            <button type="button" className={btnPrimary} onClick={handleRetryAll} disabled={retryAll.isPending}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {retryAll.isPending ? 'Retrying…' : 'Retry all failed'}
            </button>
          </>
        }
      />

      {stats && !statsQuery.isError && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="queue-stats">
          <StatCard label="Pending" icon={Clock} value={num(stats.pending)} hint={typeof stats.processing === 'number' ? `${num(stats.processing)} processing` : undefined} />
          <StatCard label="Completed" icon={CheckCircle2} value={num(stats.completed)} />
          <StatCard label="Failed" icon={XCircle} value={num(stats.failed)} />
          <StatCard label="Success rate" icon={TrendingUp} value={typeof stats.success_rate === 'number' ? `${stats.success_rate}%` : '—'} hint={typeof stats.recent_24h === 'number' ? `${num(stats.recent_24h)} in the last 24 h` : undefined} />
        </div>
      )}

      {categories.length > 0 && (
        <AdminCard title="Failure analysis">
          <div className="grid gap-3 md:grid-cols-2">
            {categories.map((c) => (
              <div key={c.category} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium capitalize text-slate-900">{c.category}</span>
                  <Badge tone="danger">{c.count}</Badge>
                </div>
                {c.description && <p className="mt-1 text-xs text-slate-600">{c.description}</p>}
                {c.suggested_action && (
                  <p className="mt-2 flex gap-1.5 text-xs text-blue-800">
                    <Lightbulb className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                    {c.suggested_action}
                  </p>
                )}
              </div>
            ))}
          </div>
          {providers.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <span className="font-medium text-slate-700">Failures by provider:</span>
              {providers.map((p) => (
                <Badge key={p.provider_name}>
                  {p.provider_name}: {p.count}
                </Badge>
              ))}
            </div>
          )}
        </AdminCard>
      )}

      <AdminCard padded={false}>
        <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-3">
          <Field label="Status">
            {(props) => (
              <select {...props} className={inputClass} value={status} onChange={(e) => changeFilter(() => setStatus(e.target.value))}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            )}
          </Field>
          <Field label="Action">
            {(props) => (
              <select {...props} className={inputClass} value={action} onChange={(e) => changeFilter(() => setAction(e.target.value))}>
                <option value="all">All actions</option>
                {actions.map((a) => (
                  <option key={a.action} value={a.action}>
                    {a.action} ({a.count})
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Recipient">{(props) => <SearchInput {...props} label="Search by recipient email" placeholder="Search email" value={search} onChange={(e) => changeFilter(() => setSearch(e.target.value))} />}</Field>
        </div>

        {listQuery.isLoading ? (
          <LoadingState label="Loading queue…" />
        ) : listQuery.isError ? (
          <ErrorState message={apiErrorMessage(listQuery.error)} onRetry={() => listQuery.refetch()} />
        ) : items.length === 0 ? (
          filtered ? (
            <EmptyState title="No emails match these filters" description="Try another status, action or search." />
          ) : (
            <EmptyState icon={Inbox} title="The queue is empty" description="Emails appear here while they wait to be delivered." action={<button type="button" className={btnSecondary} onClick={refresh}>Refresh</button>} />
          )
        ) : (
          <>
            <TableShell caption="Email queue">
              <thead>
                <tr>
                  <th scope="col" className="w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all retryable emails"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      checked={allSelected}
                      disabled={retryable.length === 0}
                      onChange={() => setSelected(allSelected ? [] : retryable)}
                    />
                  </th>
                  <th scope="col">Action</th>
                  <th scope="col">Recipient</th>
                  <th scope="col">Status</th>
                  <th scope="col">Attempts</th>
                  <th scope="col">Created</th>
                  <th scope="col" className="relative">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className={selected.includes(item.id) ? 'bg-blue-50/60' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select email to ${item.recipient_email}`}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 disabled:opacity-40"
                        checked={selected.includes(item.id)}
                        disabled={!canRetry(item)}
                        onChange={() => setSelected((prev) => (prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]))}
                      />
                    </td>
                    <td className="font-mono text-xs text-slate-900">{item.action}</td>
                    <td>
                      <div className="font-medium text-slate-900">{item.recipient_email}</div>
                      {item.recipient_name && <div className="text-xs text-slate-500">{item.recipient_name}</div>}
                    </td>
                    <td>
                      <Badge tone={STATUS_TONE[item.status] ?? 'neutral'}>{item.status}</Badge>
                      {item.failure_category && (
                        <div className="mt-1 text-xs text-slate-500" title={item.last_error ?? item.failure_reason_code ?? undefined}>
                          {item.failure_category}
                          {item.http_status_code ? ` (HTTP ${item.http_status_code})` : ''}
                        </div>
                      )}
                    </td>
                    <td className="tabular-nums">
                      {item.attempts}/{item.max_attempts}
                    </td>
                    <td className="whitespace-nowrap text-xs">{item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</td>
                    <td className="text-right">
                      {canRetry(item) && (
                        <IconButton
                          label={`Retry email to ${item.recipient_email}`}
                          icon={RotateCcw}
                          disabled={retryOne.isPending && retryOne.variables === item.id}
                          onClick={() => retryOne.mutate(item.id)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
            {meta && meta.last_page > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
                <span>
                  Page {meta.current_page} of {meta.last_page} · {meta.total} emails
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
