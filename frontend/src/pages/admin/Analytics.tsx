import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, Rocket, TrendingUp, UserMinus, RefreshCw } from 'lucide-react';
import apiClient from '../../api/axios';
import Button from '../../components/ui/Button';
import { AdminCard, AdminPageHeader, EmptyState, ErrorState, Field, LoadingState, StatCard, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage } from '../../components/admin/utils';
import { useSEO } from '../../utils/seo';

/** Shape of GET /admin/analytics/dashboard (AppAnalyticsService::getDashboardData). Every field is optional on purpose. */
interface AnalyticsData {
  summary?: {
    total_installs?: number;
    total_uninstalls?: number;
    total_launches?: number;
    net_installs?: number;
    platforms?: unknown;
    countries?: unknown;
    device_types?: unknown;
  };
  daily_installs?: unknown;
  daily_uninstalls?: unknown;
  top_countries?: unknown;
  platform_distribution?: unknown;
  device_type_distribution?: unknown;
}

// The backend treats `days` as "now minus N days", so 0 would be an empty window.
// "All time" therefore asks for a ten-year window.
const ALL_TIME_DAYS = 3650;
const RANGE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last year' },
  { value: ALL_TIME_DAYS, label: 'All time' },
];

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);
const fmt = (v: unknown) => {
  const n = num(v);
  return n === undefined ? '—' : new Intl.NumberFormat().format(n);
};

/** Turns `{key: count}` (Laravel pluck) into sorted entries; arrays/nulls/garbage become []. */
function toEntries(value: unknown): Array<[string, number]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .map(([k, v]) => [k || 'Unknown', num(v)] as [string, number | undefined])
    .filter((e): e is [string, number] => e[1] !== undefined);
}

function Distribution({ title, entries, capitalize = false }: { title: string; entries: Array<[string, number]>; capitalize?: boolean }) {
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...sorted.map((e) => e[1]));
  return (
    <AdminCard title={title}>
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-500">No data for this period.</p>
      ) : (
        <ul className="space-y-3" aria-label={title}>
          {sorted.map(([label, count]) => (
            <li key={label} title={`${label}: ${fmt(count)}`}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className={`truncate text-slate-700 ${capitalize ? 'capitalize' : ''}`}>{label}</span>
                <span className="font-medium tabular-nums text-slate-900">{fmt(count)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100" aria-hidden="true">
                <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${Math.max(2, (count / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}

export default function Analytics() {
  useSEO({ title: 'App Analytics | Admin', robots: 'noindex, nofollow' });
  const [days, setDays] = useState(30);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const customRange = !!(startDate && endDate);
  const invalidRange = customRange && startDate > endDate;

  const query = useQuery({
    queryKey: ['admin-app-analytics', days, customRange ? startDate : '', customRange ? endDate : ''],
    queryFn: async () => {
      let url = `/admin/analytics/dashboard?days=${days}`;
      if (customRange) url += `&start_date=${startDate}&end_date=${endDate}`;
      const response = await apiClient.get(url);
      const data = response.data;
      return (data && typeof data === 'object' && !Array.isArray(data) ? data : {}) as AnalyticsData;
    },
    enabled: !invalidRange,
  });

  const data = query.data;
  const summary = data?.summary && typeof data.summary === 'object' ? data.summary : {};
  const installs = num(summary.total_installs);
  const uninstalls = num(summary.total_uninstalls);
  const net = num(summary.net_installs) ?? (installs !== undefined && uninstalls !== undefined ? installs - uninstalls : undefined);

  const platforms = toEntries(summary.platforms).length ? toEntries(summary.platforms) : toEntries(data?.platform_distribution);
  const deviceTypes = toEntries(summary.device_types).length ? toEntries(summary.device_types) : toEntries(data?.device_type_distribution);
  const countries = toEntries(summary.countries).length ? toEntries(summary.countries) : toEntries(data?.top_countries);

  const dailyInstalls = new Map(toEntries(data?.daily_installs));
  const dailyUninstalls = new Map(toEntries(data?.daily_uninstalls));
  const dailyRows = [...new Set([...dailyInstalls.keys(), ...dailyUninstalls.keys()])].sort().reverse();

  const hasAnyData = installs || uninstalls || num(summary.total_launches) || platforms.length || deviceTypes.length || countries.length || dailyRows.length;

  const resetRange = () => {
    setStartDate('');
    setEndDate('');
    setDays(30);
  };

  let body;
  if (invalidRange) body = null;
  else if (query.isLoading) body = <LoadingState label="Loading analytics…" />;
  else if (query.isError)
    body = (
      <AdminCard>
        <ErrorState title="Could not load analytics" message={apiErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </AdminCard>
    );
  else if (!hasAnyData)
    body = (
      <AdminCard>
        <EmptyState
          icon={BarChart3}
          title="No app analytics for this period"
          description="Installs, launches and uninstalls tracked by the PWA will appear here."
          action={
            <Button variant="outline" size="sm" onClick={resetRange}>
              Reset date range
            </Button>
          }
        />
      </AdminCard>
    );
  else
    body = (
      <>
        <div className="grid gap-6 lg:grid-cols-3">
          <Distribution title="Platforms" entries={platforms} capitalize />
          <Distribution title="Device types" entries={deviceTypes} capitalize />
          <Distribution title="Top countries" entries={countries} />
        </div>
        <AdminCard title="Daily installs and uninstalls" padded={false}>
          {dailyRows.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No daily activity in this period.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <TableShell caption="Daily installs and uninstalls">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-right">Installs</th>
                    <th className="text-right">Uninstalls</th>
                    <th className="text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyRows.map((date) => {
                    const i = dailyInstalls.get(date) ?? 0;
                    const u = dailyUninstalls.get(date) ?? 0;
                    return (
                      <tr key={date}>
                        <td className="whitespace-nowrap">{date}</td>
                        <td className="text-right tabular-nums">{fmt(i)}</td>
                        <td className="text-right tabular-nums">{fmt(u)}</td>
                        <td className="text-right tabular-nums">{fmt(i - u)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableShell>
            </div>
          )}
        </AdminCard>
      </>
    );

  const loadingValue = query.isLoading && !invalidRange ? '…' : undefined;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="App Analytics"
        description="Installs, launches and uninstalls of the installable web app."
        actions={
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching || invalidRange} leftIcon={<RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />}>
            Refresh
          </Button>
        }
      />

      <AdminCard title="Date range">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <Field label="Quick select" hint={customRange ? 'Custom dates are active.' : undefined}>
            {(p) => (
              <select
                {...p}
                className={inputClass}
                value={days}
                onChange={(e) => {
                  setDays(Number(e.target.value));
                  setStartDate('');
                  setEndDate('');
                }}
              >
                {RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Start date">
            {(p) => <input {...p} type="date" className={inputClass} value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} />}
          </Field>
          <Field label="End date" error={invalidRange ? 'End date must be on or after the start date.' : undefined}>
            {(p) => <input {...p} type="date" className={inputClass} value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />}
          </Field>
          <Button variant="ghost" size="sm" onClick={resetRange}>
            Reset
          </Button>
        </div>
        {(startDate || endDate) && !customRange && <p className="mt-3 text-sm text-slate-500">Pick both a start and an end date to use a custom range.</p>}
      </AdminCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="analytics-stats">
        <StatCard label="Total installs" icon={Download} value={loadingValue ?? fmt(installs)} />
        <StatCard label="Total uninstalls" icon={UserMinus} value={loadingValue ?? fmt(uninstalls)} />
        <StatCard label="Net installs" icon={TrendingUp} value={loadingValue ?? fmt(net)} />
        <StatCard label="Total launches" icon={Rocket} value={loadingValue ?? fmt(summary.total_launches)} />
      </div>

      {body}
    </div>
  );
}
