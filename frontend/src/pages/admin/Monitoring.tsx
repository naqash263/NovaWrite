import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle2, Database, ExternalLink, HardDrive, HelpCircle, ListChecks, MemoryStick, RefreshCw, Server, XCircle } from 'lucide-react';
import apiClient from '../../api/axios';
import { API_CONFIG } from '../../config/api';
import Button from '../../components/ui/Button';
import { AdminCard, AdminPageHeader, Badge, ErrorState, LoadingState, StatCard } from '../../components/admin/ui';
import { useSEO } from '../../utils/seo';

type Check = { status?: string; response_time_ms?: number; error?: string; [key: string]: unknown };

interface HealthCheck {
  status?: string;
  timestamp?: string;
  service?: string;
  version?: string;
  critical_issues?: number;
  checks?: Record<string, Check>;
  message?: string;
}

interface QueueHealthData {
  status?: string;
  queue_worker?: { running?: boolean; process?: string | null };
  scheduler?: { running?: boolean; process?: string | null };
  pending_emails?: number;
  jobs_in_queue?: number;
  n8n_config_active?: boolean;
  issues?: unknown;
  instructions?: unknown;
}

interface MonitoringData {
  basic: HealthCheck | null;
  comprehensive: HealthCheck | null;
  database: HealthCheck | null;
  storage: HealthCheck | null;
  queue: QueueHealthData | null;
  failed: string[];
  lastChecked: string;
}

const ENDPOINTS = [
  { key: 'basic', path: '/health', label: 'Basic health', hint: 'Quick API status' },
  { key: 'comprehensive', path: '/health/comprehensive', label: 'Comprehensive', hint: 'Detailed system report' },
  { key: 'database', path: '/health/database', label: 'Database', hint: 'Connectivity & records' },
  { key: 'storage', path: '/health/storage', label: 'Storage', hint: 'File system health' },
  { key: 'queue', path: '/health/queue', label: 'Queue', hint: 'Workers & email queue' },
] as const;

const asObject = <T,>(v: unknown): T | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : null);

async function loadMonitoring(): Promise<MonitoringData> {
  // Health endpoints answer 503 with a JSON body when something is unhealthy, so a rejected
  // request still carries useful data. Only a request with no body at all counts as failed.
  const settled = await Promise.allSettled(ENDPOINTS.map((e) => apiClient.get(e.path)));
  const result: MonitoringData = { basic: null, comprehensive: null, database: null, storage: null, queue: null, failed: [], lastChecked: new Date().toISOString() };
  settled.forEach((outcome, i) => {
    const key = ENDPOINTS[i].key;
    const body = outcome.status === 'fulfilled' ? outcome.value.data : (outcome.reason as { response?: { data?: unknown } })?.response?.data;
    const obj = asObject<HealthCheck & QueueHealthData>(body);
    if (!obj) result.failed.push(ENDPOINTS[i].label);
    (result as unknown as Record<string, unknown>)[key] = obj;
  });
  return result;
}

const statusTone = (status?: string) => {
  switch (status) {
    case 'healthy':
    case 'ok':
      return 'success' as const;
    case 'warning':
      return 'warning' as const;
    case 'critical':
    case 'unhealthy':
    case 'error':
      return 'danger' as const;
    default:
      return 'neutral' as const;
  }
};

function StatusBadge({ status }: { status?: string }) {
  const tone = statusTone(status);
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'warning' ? AlertTriangle : tone === 'danger' ? XCircle : HelpCircle;
  return (
    <Badge tone={tone}>
      <Icon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
      {status || 'unknown'}
    </Badge>
  );
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const fmtMs = (v: unknown) => {
  const ms = num(v);
  if (ms === undefined) return '—';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
};
const fmtNum = (v: unknown, suffix = '') => {
  const n = num(v);
  return n === undefined ? '—' : `${n.toLocaleString()}${suffix}`;
};
const text = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '—');

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

function CheckCard({ title, icon: Icon, check, children }: { title: string; icon: typeof Database; check?: Check; children?: ReactNode }) {
  return (
    <AdminCard
      title={
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
          {title}
        </span>
      }
    >
      <dl className="divide-y divide-slate-100">
        <Row label="Status">
          <StatusBadge status={check?.status} />
        </Row>
        {children}
        {typeof check?.error === 'string' && check.error && <p className="pt-2 text-xs text-red-700">{check.error}</p>}
      </dl>
    </AdminCard>
  );
}

export default function Monitoring() {
  useSEO({ title: 'System Monitoring | Admin', robots: 'noindex, nofollow' });
  const [autoRefresh, setAutoRefresh] = useState(false);

  const query = useQuery({
    queryKey: ['admin-monitoring'],
    queryFn: loadMonitoring,
    refetchInterval: autoRefresh ? 30_000 : false,
  });
  const data = query.data;
  const checks = asObject<Record<string, Check>>(data?.comprehensive?.checks) ?? {};
  const records = asObject<Record<string, unknown>>(checks.database_performance?.records) ?? asObject<Record<string, unknown>>((data?.database as Record<string, unknown> | null)?.records);
  const queue = data?.queue;
  const queueIssues = Array.isArray(queue?.issues) ? (queue.issues as unknown[]).filter((i): i is string => typeof i === 'string') : [];
  const queueInstructions = Array.isArray(queue?.instructions)
    ? (queue.instructions as unknown[]).filter((i): i is { service?: string; command?: string } => !!asObject(i))
    : [];
  const criticalIssues = num(data?.comprehensive?.critical_issues) ?? 0;
  const apiBase = API_CONFIG.BASE_URL.replace(/\/$/, '');
  const allFailed = !!data && data.failed.length === ENDPOINTS.length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System Monitoring"
        description={data ? `Health of the API, database, storage and queue. Last checked ${new Date(data.lastChecked).toLocaleTimeString()}.` : 'Health of the API, database, storage and queue.'}
        actions={
          <>
            <Button
              variant={autoRefresh ? 'primary' : 'outline'}
              size="sm"
              aria-pressed={autoRefresh}
              onClick={() => setAutoRefresh((v) => !v)}
            >
              Auto refresh {autoRefresh ? 'on' : 'off'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching} leftIcon={<RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />}>
              {query.isFetching ? 'Refreshing…' : 'Refresh now'}
            </Button>
          </>
        }
      />

      {query.isLoading ? (
        <LoadingState label="Running health checks…" />
      ) : query.isError || allFailed ? (
        <AdminCard>
          <ErrorState title="Could not reach the health endpoints" message="The API did not respond. Check that the backend is running." onRetry={() => query.refetch()} />
        </AdminCard>
      ) : (
        data && (
          <>
            {data.failed.length > 0 && (
              <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Some checks did not respond ({data.failed.join(', ')}). Other results are current.
              </div>
            )}
            {criticalIssues > 0 && (
              <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {criticalIssues} critical issue{criticalIssues === 1 ? '' : 's'} detected
              </div>
            )}

            <AdminCard title="Overall status">
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="overall-status">
                {ENDPOINTS.map((e) => {
                  const entry = data[e.key] as { status?: string } | null;
                  return (
                    <li key={e.key} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      <span className="text-sm text-slate-700">{e.label}</span>
                      <StatusBadge status={entry ? entry.status : 'unreachable'} />
                    </li>
                  );
                })}
              </ul>
            </AdminCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <CheckCard title="Database" icon={Database} check={checks.database ?? (data.database as Check | null) ?? undefined}>
                <Row label="Response time">{fmtMs(checks.database?.response_time_ms ?? (data.database as Check | null)?.response_time_ms)}</Row>
                <Row label="Connection">{text(checks.database?.connection ?? (data.database as Check | null)?.connection)}</Row>
              </CheckCard>
              <CheckCard title="Storage" icon={HardDrive} check={checks.storage ?? (data.storage as Check | null) ?? undefined}>
                <Row label="Response time">{fmtMs(checks.storage?.response_time_ms ?? (data.storage as Check | null)?.response_time_ms)}</Row>
                <Row label="Writable">
                  {(checks.storage?.writable ?? (data.storage as Check | null)?.writable) === true ? <Badge tone="success">Yes</Badge> : (checks.storage?.writable ?? (data.storage as Check | null)?.writable) === false ? <Badge tone="danger">No</Badge> : '—'}
                </Row>
              </CheckCard>
              <CheckCard title="Memory" icon={MemoryStick} check={checks.memory}>
                <Row label="Current usage">{fmtNum(checks.memory?.current_usage_mb, ' MB')}</Row>
                <Row label="Peak usage">{fmtNum(checks.memory?.peak_usage_mb, ' MB')}</Row>
                <Row label="Limit">{text(checks.memory?.limit)}</Row>
              </CheckCard>
              <CheckCard title="Disk space" icon={Server} check={checks.disk_space}>
                <Row label="Usage">{fmtNum(checks.disk_space?.usage_percent, '%')}</Row>
                <Row label="Free space">{fmtNum(checks.disk_space?.free_space_gb, ' GB')}</Row>
                <Row label="Total space">{fmtNum(checks.disk_space?.total_space_gb, ' GB')}</Row>
              </CheckCard>
            </div>

            {records && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="db-records">
                <StatCard label="Users" value={fmtNum(records.users)} />
                <StatCard label="Courses" value={fmtNum(records.courses)} />
                <StatCard label="Posts" value={fmtNum(records.posts)} />
                <StatCard label="Workflows" value={fmtNum(records.workflows)} />
              </div>
            )}

            {queue && (
              <AdminCard
                title={
                  <span className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    Queue &amp; email system
                  </span>
                }
              >
                <div className="grid gap-6 lg:grid-cols-2">
                  <dl className="divide-y divide-slate-100">
                    <Row label="Queue worker">{queue.queue_worker?.running ? <Badge tone="success">Running</Badge> : <Badge tone="danger">Not running</Badge>}</Row>
                    <Row label="Scheduler">{queue.scheduler?.running ? <Badge tone="success">Running</Badge> : <Badge tone="danger">Not running</Badge>}</Row>
                    <Row label="n8n configuration">{queue.n8n_config_active ? <Badge tone="success">Active</Badge> : <Badge tone="warning">Inactive</Badge>}</Row>
                  </dl>
                  <dl className="divide-y divide-slate-100">
                    <Row label="Pending emails">{fmtNum(queue.pending_emails)}</Row>
                    <Row label="Jobs in queue">{fmtNum(queue.jobs_in_queue)}</Row>
                  </dl>
                </div>
                {queueIssues.length > 0 && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Issues detected
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
                      {queueIssues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {queueInstructions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-slate-900">How to fix</p>
                    {queueInstructions.map((ins, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-3">
                        <p className="text-sm font-medium text-slate-900">{ins.service ?? 'Service'}</p>
                        <code className="mt-1 block break-all rounded bg-slate-100 p-2 text-xs text-slate-800">{ins.command ?? ''}</code>
                      </div>
                    ))}
                  </div>
                )}
              </AdminCard>
            )}

            {checks.recent_errors && (
              <AdminCard
                title={
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    Recent errors
                  </span>
                }
              >
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <StatusBadge status={checks.recent_errors.status} />
                  <span className="text-slate-600">{fmtNum(checks.recent_errors.error_count_last_hour ?? 0)} errors in the last hour</span>
                </div>
              </AdminCard>
            )}
          </>
        )
      )}

      <AdminCard title="Raw health endpoints" description="Open the JSON reports directly.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ENDPOINTS.map((e) => (
            <li key={e.key}>
              <a
                href={`${apiBase}${e.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-slate-900">{e.label}</span>
                  <span className="block text-xs text-slate-500">{e.hint}</span>
                </span>
                <ExternalLink className="h-4 w-4 flex-none text-slate-400" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
